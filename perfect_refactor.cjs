const fs = require('fs');

let code = fs.readFileSync('server/src/index.ts', 'utf8');

// 1. Fix POST /clients
const postClientsRegex = /const sellerId = \(request as any\)\.user\?\.id;\s*const \[newClient\] = \(await db\.insert\(clients\)\.values\(\{([\s\S]*?)routeId:      body\.routeId \|\| body\.route_id \|\| null,\n\s*\}\)\.returning\(\)\) as any\[\];/;

const postClientsReplacement = `
        let sellerId = null;
        try {
          await request.jwtVerify();
          sellerId = (request as any).user?.userId;
        } catch(e) {}
        
        let finalCollectionId = null;
        if (sellerId && (body.routeId || body.route_id)) {
           const [activeCol] = await db.select({ id: collections.id }).from(collections)
            .where(require('drizzle-orm').and(
              require('drizzle-orm').eq(collections.routeId, body.routeId || body.route_id),
              require('drizzle-orm').eq(collections.sellerId, sellerId),
              require('drizzle-orm').eq(collections.status, 'aberta')
            )).limit(1);
           if (activeCol) finalCollectionId = activeCol.id;
        }

        const [newClient] = (await db.insert(clients).values({$1routeId:      body.routeId || body.route_id || null,
          registeredInCollectionId: finalCollectionId,
        }).returning()) as any[];`;

if (postClientsRegex.test(code)) {
  code = code.replace(postClientsRegex, postClientsReplacement);
  console.log("POST /clients fixed.");
} else {
  console.log("Failed to match POST /clients");
}

// 2. Fix POST /cards
const postCardsRegex = /const \[newFicha\] = await tx\.insert\(cards\)\.values\(\{([\s\S]*?)saleDate: saleDate \? new Date\(saleDate\) : now,\s*notes\s*\}\)\.returning\(\);/;

const postCardsReplacement = `
            let finalCollectionId = collectionId || undefined;
            if (!finalCollectionId) {
              const [activeCol] = await tx.select({ id: collections.id }).from(collections)
                .where(require('drizzle-orm').and(
                  require('drizzle-orm').eq(collections.routeId, routeId),
                  require('drizzle-orm').eq(collections.sellerId, sellerId),
                  require('drizzle-orm').eq(collections.status, 'aberta')
                )).limit(1);
              if (activeCol) {
                finalCollectionId = activeCol.id;
              }
            }
            
            const [newFicha] = await tx.insert(cards).values({$1saleDate: saleDate ? new Date(saleDate) : now,
              collectionId: finalCollectionId,
              discount: discount || 0,
              commissionPercent: commissionPercent || 0,
              itemsLocked: itemsLocked || false,
              notes
            }).returning();`;

if (postCardsRegex.test(code)) {
  code = code.replace(postCardsRegex, postCardsReplacement);
  console.log("POST /cards fixed.");
} else {
  console.log("Failed to match POST /cards");
}

// 3. Re-append the report endpoint
const reportEndpoint = `
    instance.get('/collections/:id/report', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };

      try {
        const [collection] = await db.select().from(collections).where(require('drizzle-orm').eq(collections.id, id)).limit(1);
        if (!collection) return reply.status(404).send({ error: "Cobrança não encontrada" });

        const [prevCollection] = await db.select()
          .from(collections)
          .where(require('drizzle-orm').and(
             require('drizzle-orm').eq(collections.routeId, collection.routeId), 
             require('drizzle-orm').ne(collections.id, collection.id),
             require('drizzle-orm').lte(collections.createdAt, collection.createdAt)
          ))
          .orderBy(require('drizzle-orm').desc(collections.createdAt))
          .limit(1);

        const [{ newClientsCount }] = await db.select({ newClientsCount: require('drizzle-orm').sql\`count(*)\` })
          .from(clients).where(require('drizzle-orm').eq(clients.registeredInCollectionId, id));

        const collectionCards = await db.select().from(cards).where(require('drizzle-orm').eq(cards.collectionId, id));
        let pendingCards = 0;
        let paidCards = 0;

        for (const card of collectionCards) {
          if (card.status === 'pendente') pendingCards++;
          if (card.status === 'paga') paidCards++;
        }

        const methodsResult = await db.select({
           methodName: paymentMethods.name,
           amount: require('drizzle-orm').sql\`sum(\${payments.amount})\`
        })
        .from(payments)
        .innerJoin(paymentMethods, require('drizzle-orm').eq(payments.methodId, paymentMethods.id))
        .where(require('drizzle-orm').eq(payments.collectionId, id))
        .groupBy(paymentMethods.name);
        
        const receivedByMethod = methodsResult.map((r: any) => ({
          method: r.methodName,
          amount: Number(r.amount || 0)
        }));
        
        const totalReceived = receivedByMethod.reduce((acc: number, item: any) => acc + item.amount, 0);

        const servedByCard = await db.selectDistinct({ clientId: cards.clientId })
          .from(cards)
          .where(require('drizzle-orm').eq(cards.collectionId, id));
          
        const servedByPayment = await db.selectDistinct({ clientId: cards.clientId })
          .from(payments)
          .innerJoin(cards, require('drizzle-orm').eq(payments.cardId, cards.id))
          .where(require('drizzle-orm').eq(payments.collectionId, id));
          
        const uniqueServedClients = new Set([
          ...servedByCard.map((r: any) => r.clientId),
          ...servedByPayment.map((r: any) => r.clientId)
        ]);
        const servedClients = uniqueServedClients.size;
        
        const [{ totalRouteClients }] = await db.select({ totalRouteClients: require('drizzle-orm').sql\`count(*)\` })
          .from(clients)
          .where(require('drizzle-orm').and(
             require('drizzle-orm').eq(clients.routeId, collection.routeId),
             require('drizzle-orm').eq(clients.active, true)
          ));
        const unservedClients = Math.max(0, Number(totalRouteClients || 0) - servedClients);

        const snapshots = await db.select({
           id: collectionInventorySnapshots.id,
           productId: collectionInventorySnapshots.productId,
           productName: products.name,
           stockBefore: collectionInventorySnapshots.stockBefore,
           stockAfter: collectionInventorySnapshots.stockAfter,
           snapshotType: collectionInventorySnapshots.snapshotType,
           createdAt: collectionInventorySnapshots.createdAt
        })
        .from(collectionInventorySnapshots)
        .leftJoin(products, require('drizzle-orm').eq(collectionInventorySnapshots.productId, products.id))
        .where(require('drizzle-orm').eq(collectionInventorySnapshots.collectionId, id));

        return {
          collection,
          previousCollection: prevCollection || null,
          metrics: {
            newClients: Number(newClientsCount),
            pendingCards,
            paidCards,
            totalReceived,
            receivedByMethod,
            servedClients,
            unservedClients
          },
          snapshots
        };

      } catch (error) {
        console.error("Report error:", error);
        return reply.status(500).send({ error: "Erro ao gerar relatório" });
      }
    });

  }, { prefix: '/api' });`;

code = code.replace(/  \}, \{ prefix: '\/api' \}\);/, reportEndpoint);

// Finally, fix crypto
code = code.replace(/require\('crypto'\)/g, 'crypto');

fs.writeFileSync('server/src/index.ts', code);
console.log("Done");

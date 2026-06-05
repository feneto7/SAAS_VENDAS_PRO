const fs = require('fs');
let code = fs.readFileSync('server/src/index.ts', 'utf8');

// 1. Fix POST /clients
const oldClients = `    instance.post('/clients', async (request, reply) => {
      const db = (request as any).tenantDb;
      const body = request.body as any;
      try {
        const [newClient] = (await db.insert(clients).values({
          id:           body.id || crypto.randomUUID(),
          name:         body.name,`;

const newClients = `    instance.post('/clients', async (request, reply) => {
      const db = (request as any).tenantDb;
      const body = request.body as any;
      try {
        let sellerId = null;
        try {
          await request.jwtVerify();
          sellerId = (request as any).user?.userId;
        } catch(e) {}
        
        let finalCollectionId = null;
        if (sellerId && (body.routeId || body.route_id)) {
           const [activeCol] = await db.select({ id: collections.id }).from(collections)
            .where(and(
              eq(collections.routeId, body.routeId || body.route_id),
              eq(collections.sellerId, sellerId),
              eq(collections.status, 'aberta')
            )).limit(1);
           if (activeCol) finalCollectionId = activeCol.id;
        }

        const [newClient] = (await db.insert(clients).values({
          id:           body.id || crypto.randomUUID(),
          name:         body.name,`;
code = code.replace(oldClients, newClients);

const oldClientsEnd = `          comment:      body.comment || null,
          routeId:      body.routeId || body.route_id || null,
        }).returning()) as any[];`;
const newClientsEnd = `          comment:      body.comment || null,
          routeId:      body.routeId || body.route_id || null,
          registeredInCollectionId: finalCollectionId,
        }).returning()) as any[];`;
code = code.replace(oldClientsEnd, newClientsEnd);

// 2. Fix POST /cards
const oldCards = `            id: id || undefined,
            clientId,
            sellerId,
            routeId,
            collectionId: collectionId || null,
            total: total || 0,
            status: 'nova',
            code: finalCode,
            saleDate: saleDate ? new Date(saleDate) : now,
            notes
          }).returning();`;
const newCards = `            id: id || undefined,
            clientId,
            sellerId,
            routeId,
            collectionId: collectionId || null,
            total: total || 0,
            status: 'nova',
            code: finalCode,
            saleDate: saleDate ? new Date(saleDate) : now,
            discount: discount || 0,
            commissionPercent: commissionPercent || 0,
            itemsLocked: itemsLocked || false,
            notes
          }).returning();`;
code = code.replace(oldCards, newCards);

// 3. Re-add report endpoint at the end before fastify hook
const endMarker = `  }, { prefix: '/api' });`;
const reportEndpoint = `    instance.get('/collections/:id/report', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };

      try {
        const [collection] = await db.select().from(collections).where(eq(collections.id, id)).limit(1);
        if (!collection) return reply.status(404).send({ error: "Cobrança não encontrada" });

        const [prevCollection] = await db.select()
          .from(collections)
          .where(and(
             eq(collections.routeId, collection.routeId), 
             ne(collections.id, collection.id),
             lte(collections.createdAt, collection.createdAt)
          ))
          .orderBy(desc(collections.createdAt))
          .limit(1);

        const [{ newClientsCount }] = await db.select({ newClientsCount: sql\`count(*)\` })
          .from(clients).where(eq(clients.registeredInCollectionId, id));

        const collectionCards = await db.select().from(cards).where(eq(cards.collectionId, id));
        let pendingCards = 0;
        let paidCards = 0;

        for (const card of collectionCards) {
          if (card.status === 'pendente') pendingCards++;
          if (card.status === 'paga') paidCards++;
        }

        const methodsResult = await db.select({
           methodName: paymentMethods.name,
           amount: sql\`sum(\${payments.amount})\`
        })
        .from(payments)
        .innerJoin(paymentMethods, eq(payments.methodId, paymentMethods.id))
        .where(eq(payments.collectionId, id))
        .groupBy(paymentMethods.name);
        
        const receivedByMethod = methodsResult.map((r: any) => ({
          method: r.methodName,
          amount: Number(r.amount || 0)
        }));
        
        const totalReceived = receivedByMethod.reduce((acc: number, item: any) => acc + item.amount, 0);

        const servedByCard = await db.selectDistinct({ clientId: cards.clientId })
          .from(cards)
          .where(eq(cards.collectionId, id));
          
        const servedByPayment = await db.selectDistinct({ clientId: cards.clientId })
          .from(payments)
          .innerJoin(cards, eq(payments.cardId, cards.id))
          .where(eq(payments.collectionId, id));
          
        const uniqueServedClients = new Set([
          ...servedByCard.map((r: any) => r.clientId),
          ...servedByPayment.map((r: any) => r.clientId)
        ]);
        const servedClients = uniqueServedClients.size;
        
        const [{ totalRouteClients }] = await db.select({ totalRouteClients: sql\`count(*)\` })
          .from(clients)
          .where(and(
             eq(clients.routeId, collection.routeId),
             eq(clients.active, true)
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
        .leftJoin(products, eq(collectionInventorySnapshots.productId, products.id))
        .where(eq(collectionInventorySnapshots.collectionId, id));

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

code = code.replace(endMarker, reportEndpoint);
fs.writeFileSync('server/src/index.ts', code);
console.log("SUCCESS");

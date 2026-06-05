const fs = require('fs');

function refactorReport() {
  let code = fs.readFileSync('server/src/index.ts', 'utf8');

  // I will use regex or string replacement to completely replace the logic inside the report endpoint.
  // The report endpoint starts at: `instance.get('/collections/:id/report', async (request, reply) => {`
  // and ends at `});` around line 2440.

  const startMarker = `instance.get('/collections/:id/report', async (request, reply) => {`;
  const endMarker = `}, { prefix: '/api' });`;

  let startIndex = code.indexOf(startMarker);
  let endIndex = code.indexOf(endMarker, startIndex);

  if (startIndex === -1 || endIndex === -1) {
    console.log("Could not find the endpoint boundaries.");
    return;
  }

  const newEndpoint = `instance.get('/collections/:id/report', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };

      try {
        // 1. Get the current collection
        const [collection] = await db.select().from(collections).where(require('drizzle-orm').eq(collections.id, id)).limit(1);
        if (!collection) return reply.status(404).send({ error: "Cobrança não encontrada" });

        // 2. Get the PREVIOUS collection for this route
        const [prevCollection] = await db.select()
          .from(collections)
          .where(require('drizzle-orm').and(
             require('drizzle-orm').eq(collections.routeId, collection.routeId), 
             require('drizzle-orm').ne(collections.id, collection.id),
             require('drizzle-orm').lte(collections.createdAt, collection.createdAt)
          ))
          .orderBy(require('drizzle-orm').desc(collections.createdAt))
          .limit(1);

        // 3. New clients
        const [{ newClientsCount }] = await db.select({ newClientsCount: require('drizzle-orm').sql\`count(*)\` })
          .from(clients).where(require('drizzle-orm').eq(clients.registeredInCollectionId, id));

        // 4. Cards (Pending vs Paid vs New)
        const collectionCards = await db.select().from(cards).where(require('drizzle-orm').eq(cards.collectionId, id));
        let pendingCards = 0;
        let paidCards = 0;

        for (const card of collectionCards) {
          if (card.status === 'pendente') pendingCards++;
          if (card.status === 'paga') paidCards++;
        }

        // 5. Total Received & Received by Method (from payments)
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

        // 6. Served Clients vs Unserved Clients
        // Served: distinct clientIds from cards in this collection
        const servedByCard = await db.selectDistinct({ clientId: cards.clientId })
          .from(cards)
          .where(require('drizzle-orm').eq(cards.collectionId, id));
          
        // Served: distinct clientIds from payments in this collection
        const servedByPayment = await db.selectDistinct({ clientId: cards.clientId })
          .from(payments)
          .innerJoin(cards, require('drizzle-orm').eq(payments.cardId, cards.id))
          .where(require('drizzle-orm').eq(payments.collectionId, id));
          
        const uniqueServedClients = new Set([
          ...servedByCard.map((r: any) => r.clientId),
          ...servedByPayment.map((r: any) => r.clientId)
        ]);
        const servedClients = uniqueServedClients.size;
        
        // Unserved: Total active clients in this route - served
        const [{ totalRouteClients }] = await db.select({ totalRouteClients: require('drizzle-orm').sql\`count(*)\` })
          .from(clients)
          .where(require('drizzle-orm').and(
             require('drizzle-orm').eq(clients.routeId, collection.routeId),
             require('drizzle-orm').eq(clients.active, true)
          ));
        const unservedClients = Math.max(0, Number(totalRouteClients || 0) - servedClients);

        // 7. Inventory Snapshots
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
    });\n\n  `;

  const newCode = code.substring(0, startIndex) + newEndpoint + code.substring(endIndex);
  
  fs.writeFileSync('server/src/index.ts', newCode);
  console.log("Replaced report endpoint.");
}

refactorReport();

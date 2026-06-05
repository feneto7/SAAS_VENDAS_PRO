const fs = require('fs');

function refactorBackend() {
  let code = fs.readFileSync('server/src/index.ts', 'utf8');
  let lines = code.split('\n');

  // Fix POST /clients (around line 320)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`instance.post('/clients',`)) {
      for (let j = i; j < i + 50; j++) {
        if (lines[j] && lines[j].includes('const [newClient] = (await db.insert(clients).values({')) {
          const insertLogic = `
        const sellerId = (request as any).user?.id;
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
`;
          lines.splice(j, 0, insertLogic);
          break;
        }
      }
      
      for (let j = i; j < i + 60; j++) {
        if (lines[j] && lines[j].includes('routeId:      body.routeId || body.route_id || null,')) {
          lines[j] = `          routeId:      body.routeId || body.route_id || null,\n          registeredInCollectionId: finalCollectionId,`;
          console.log('Fixed clients insert');
          break;
        }
      }
      break;
    }
  }

  // Fix POST /cards (around line 1090)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] && lines[i].includes(`const [insertedFicha] = await tx.insert(cards).values({`)) {
      for (let j = i; j < i + 20; j++) {
        if (lines[j] && lines[j].includes('notes: notes')) {
          lines[j] = `              discount: discount || 0,\n              commissionPercent: commissionPercent || 0,\n              itemsLocked: itemsLocked || false,\n              notes`;
          console.log('Fixed cards insert');
          break;
        } else if (lines[j] && lines[j].trim() === 'notes') {
          lines[j] = `              discount: discount || 0,\n              commissionPercent: commissionPercent || 0,\n              itemsLocked: itemsLocked || false,\n              notes`;
          console.log('Fixed cards insert (shorthand)');
          break;
        }
      }
      break;
    }
  }

  fs.writeFileSync('server/src/index.ts', lines.join('\n'));
}

refactorBackend();

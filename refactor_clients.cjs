const fs = require('fs');
let code = fs.readFileSync('server/src/index.ts', 'utf8');

const regex = /const \[newClient\] = \(await db\.insert\(clients\)\.values\(\{([\s\S]*?)routeId:\s*body\.routeId \|\| body\.route_id \|\| null,\n\s*\}\)\.returning\(\)\) as any\[\];/;

const replacement = `let activeCollectionId = undefined;
        const finalRouteId = body.routeId || body.route_id || null;
        if (finalRouteId && request.user?.id) {
          const [activeCol] = await db.select({ id: collections.id }).from(collections)
            .where(and(
              eq(collections.routeId, finalRouteId),
              eq(collections.sellerId, request.user.id),
              eq(collections.status, 'aberta')
            )).limit(1);
          if (activeCol) activeCollectionId = activeCol.id;
        }

        const [newClient] = (await db.insert(clients).values({$1routeId: finalRouteId,
          registeredInCollectionId: activeCollectionId,
        }).returning()) as any[];`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('server/src/index.ts', code);
  console.log('Success POST clients');
} else {
  console.log('Regex not matched');
}

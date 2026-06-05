const fs = require('fs');
let code = fs.readFileSync('server/src/index.ts', 'utf8');

const regex = /const \[inserted\] = \(await tx\.insert\(payments\)\.values\(\{[\s\S]*?id: bodyId[\s\S]*?methodId,[\s\S]*?\}\)\.returning\(\)\) as any\[\];/;

const replacement = `          let activeCollectionId = undefined;
          if (card.routeId && card.sellerId) {
            const [activeCol] = await tx.select({ id: collections.id }).from(collections)
              .where(and(
                eq(collections.routeId, card.routeId),
                eq(collections.sellerId, card.sellerId),
                eq(collections.status, 'aberta')
              )).limit(1);
            if (activeCol) activeCollectionId = activeCol.id;
          }

          const [inserted] = (await tx.insert(payments).values({
            id: bodyId || require('crypto').randomUUID(),
            cardId: id,
            collectionId: activeCollectionId,
            amount,
            methodId,
          }).returning()) as any[];`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('server/src/index.ts', code);
  console.log('Success');
} else {
  console.log('Regex not matched');
}

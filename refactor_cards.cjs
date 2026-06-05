const fs = require('fs');
let code = fs.readFileSync('server/src/index.ts', 'utf8');

const regex = /const \[insertedFicha\] = await tx\.insert\(cards\)\.values\(\{([\s\S]*?)saleDate: saleDate \? new Date\(saleDate\) : now,[\s\S]*?notes\n\s*\}\)\.returning\(\);/;

const replacement = `const [insertedFicha] = await tx.insert(cards).values({$1saleDate: saleDate ? new Date(saleDate) : now,
              discount: discount || 0,
              commissionPercent: commissionPercent || 0,
              itemsLocked: itemsLocked || false,
              notes
            }).returning();`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('server/src/index.ts', code);
  console.log('Success POST cards');
} else {
  console.log('Regex not matched');
}

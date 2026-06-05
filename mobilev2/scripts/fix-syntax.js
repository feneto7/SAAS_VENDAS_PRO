const fs = require('fs');
const path = require('path');
const glob = require('glob');

const files = [
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CardDetail\\components\\AddPaymentModal.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CardDetail\\components\\EditCommissionModal.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CardDetail\\components\\ProductEditModal.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CardDetail\\components\\SaleInformingModal.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CardDetail\\components\\SettlementTab.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\Customers\\components\\AddCustomerModal.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CustomerDetail\\components\\PendingTab.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CustomerDetail\\components\\PaidTab.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CustomerDetail\\components\\OrdersTab.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CardDetail\\components\\ProductsTab.tsx"
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  // Fix bad syntax: `import React, { useMemo, ,  useState`
  content = content.replace(/,\s*,/g, ','); // replace double commas
  content = content.replace(/\{\s*,/g, '{'); // remove leading comma inside braces
  content = content.replace(/,\s*\}/g, '}'); // remove trailing comma inside braces
  
  fs.writeFileSync(file, content);
}
console.log('Fixed syntax errors');

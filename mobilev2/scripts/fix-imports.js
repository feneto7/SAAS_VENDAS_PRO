const fs = require('fs');
const files = [
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CardDetail\\components\\SettlementTab.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\Customers\\components\\AddCustomerModal.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CardDetail\\components\\SaleInformingModal.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CardDetail\\components\\EditCommissionModal.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CardDetail\\components\\AddPaymentModal.tsx"
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('const { colors, isDark } = useTheme();') && !content.includes('import { useTheme }')) {
    content = "import { useTheme } from '../../../stores/useThemeStore';\n" + content;
    fs.writeFileSync(file, content);
  }
}
console.log('Fixed missing useTheme imports');

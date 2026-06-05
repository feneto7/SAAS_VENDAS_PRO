const fs = require('fs');
const path = require('path');

const filesToFix = [
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\Customers\\components\\AddCustomerModal.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CustomerDetail\\components\\PendingTab.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CustomerDetail\\components\\PaidTab.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CustomerDetail\\components\\OrdersTab.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CardDetail\\components\\SettlementTab.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CardDetail\\components\\SaleInformingModal.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CardDetail\\components\\ProductsTab.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CardDetail\\components\\ProductEditModal.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CardDetail\\components\\EditCommissionModal.tsx",
  "c:\\WORKSPACE\\VENDAS_PRO\\SAAS_VENDAS_PRO\\mobilev2\\src\\Screens\\CardDetail\\components\\AddPaymentModal.tsx"
];

for (const file of filesToFix) {
  let content = fs.readFileSync(file, 'utf8');

  // Skip if already has useTheme
  if (content.includes('useThemeStore')) {
    console.log(`Skipping ${path.basename(file)} (already has useTheme)`);
    continue;
  }

  // 1. Fix imports
  // Find the line that imports Colors
  const themeImportRegex = /import\s+\{\s*([^}]*Colors[^}]*)\s*\}\s+from\s+['"]\.\.\/\.\.\/\.\.\/theme\/theme['"];/;
  const match = content.match(themeImportRegex);
  if (match) {
    let imported = match[1];
    imported = imported.replace(/Colors,?/g, '').trim();
    if (!imported.includes('getUIStyles') && content.includes('UI.')) {
      imported = (imported ? imported + ', ' : '') + 'getUIStyles';
    }
    
    // Replace the import
    if (imported === '' || imported === ',') {
      content = content.replace(themeImportRegex, '');
    } else {
      // Cleanup extra commas
      imported = imported.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '');
      content = content.replace(themeImportRegex, `import { ${imported} } from '../../../theme/theme';`);
    }
    
    // Add useTheme import
    const useThemeImport = `\nimport { useTheme } from '../../../stores/useThemeStore';`;
    content = content.replace(/(import .* from ['"]lucide-react-native['"];?)/, `$1${useThemeImport}`);
  }

  // Ensure useMemo is imported from react
  if (!content.match(/import\s+React.*useMemo.*from\s+['"]react['"]/)) {
    content = content.replace(/import\s+React(,\s*\{[^}]*\})?\s+from\s+['"]react['"];/, (m, p1) => {
      if (p1) {
        return `import React, { useMemo, ${p1.replace(/\{|\}/g, '').trim()} } from 'react';`;
      }
      return `import React, { useMemo } from 'react';`;
    });
  }

  // 2. Add useTheme inside component
  const componentRegex = /(export const \w+ = \([^)]*\)(?:\s*:\s*[^={]+)? =>\s*\{)/;
  const hookInjection = `\n  const { colors, isDark } = useTheme();\n  const UI = useMemo(() => getUIStyles(colors, isDark), [colors, isDark]);\n  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);\n`;
  content = content.replace(componentRegex, `$1${hookInjection}`);

  // 3. Replace Colors. with colors.
  content = content.replace(/Colors\./g, 'colors.');

  // 4. Update StyleSheet
  content = content.replace(/const styles = StyleSheet\.create\(\{/g, 'const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({');
  
  // Shadows fix (some places used Shadows.primary directly without isDark, we can leave it if Shadows was imported, but maybe we need to fix it)
  // For safety, let's leave Shadows as is, but if it complains about isDark, we'll fix it later.

  fs.writeFileSync(file, content);
  console.log(`Refactored ${path.basename(file)}`);
}

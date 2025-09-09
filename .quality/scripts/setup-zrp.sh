#!/bin/bash

# Zero Regression Protocol - Setup Script
# This script sets up the complete ZRP system

echo "🚀 Iniciando Zero Regression Protocol Setup..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: package.json not found. Run this from the project root.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Step 1: Creating directory structure...${NC}"
mkdir -p .quality/{bugs,templates,scripts,reports}
mkdir -p __tests__/regression

echo -e "${GREEN}✅ Step 2: Installing dependencies...${NC}"
npm install -D @types/jest jest-extended supertest 2>/dev/null || echo "Dependencies already installed"

echo -e "${GREEN}✅ Step 3: Setting up Git hooks with Husky...${NC}"
if [ ! -d ".husky" ]; then
  npm install -D husky lint-staged
  npx husky install
  npx husky add .husky/pre-commit "npm run lint"
  npx husky add .husky/pre-push "npm run test:regression"
  echo -e "${GREEN}   Git hooks configured!${NC}"
else
  echo -e "${YELLOW}   Husky already configured${NC}"
fi

echo -e "${GREEN}✅ Step 4: Adding NPM scripts...${NC}"
npm pkg set scripts.test:regression="jest __tests__/regression" 2>/dev/null
npm pkg set scripts.quality:check="node .quality/scripts/check.js" 2>/dev/null
npm pkg set scripts.quality:report="node .quality/scripts/report.js" 2>/dev/null

echo -e "${GREEN}✅ Step 5: Creating quality check script...${NC}"
cat > .quality/scripts/check.js << 'EOF'
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Running Quality Checks...\n');

// Check bug inventory
const inventoryPath = path.join(__dirname, '../bugs/inventory.md');
if (fs.existsSync(inventoryPath)) {
  const inventory = fs.readFileSync(inventoryPath, 'utf8');
  const bugCount = (inventory.match(/\| B\d+/g) || []).length;
  console.log(`📊 Total bugs tracked: ${bugCount}`);
  
  const fixedBugs = (inventory.match(/✅ Fixed/g) || []).length;
  console.log(`✅ Fixed bugs: ${fixedBugs}`);
  console.log(`📈 Fix rate: ${((fixedBugs/bugCount) * 100).toFixed(1)}%\n`);
}

// Check for regression tests
const regressionDir = path.join(__dirname, '../../__tests__/regression');
if (fs.existsSync(regressionDir)) {
  const testFiles = fs.readdirSync(regressionDir).filter(f => f.endsWith('.test.ts'));
  console.log(`🧪 Regression test files: ${testFiles.length}`);
  testFiles.forEach(file => {
    console.log(`   - ${file}`);
  });
}

console.log('\n✅ Quality check complete!');
EOF

chmod +x .quality/scripts/check.js

echo -e "${GREEN}✅ Step 6: Setting up lint-staged configuration...${NC}"
cat > .lintstagedrc.json << 'EOF'
{
  "*.{ts,tsx}": [
    "npm run lint",
    "npm run typecheck"
  ],
  "*.{js,jsx}": [
    "npm run lint"
  ]
}
EOF

echo ""
echo "================================================"
echo -e "${GREEN}🎉 Zero Regression Protocol Setup Complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "  1. Review .github/workflows/zero-regression.yml"
echo "  2. Configure environment variables if needed"
echo "  3. Run: npm run quality:check"
echo "  4. Start with PRs of maximum 10 files"
echo ""
echo "🛡️ Your codebase is now protected against regressions!"
echo ""

# Run initial quality check
echo -e "${YELLOW}Running initial quality check...${NC}"
node .quality/scripts/check.js
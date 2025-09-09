#!/bin/bash

# Fix all button elements without type attribute
echo "Fixing button type attributes..."

# Find all TypeScript/JavaScript files and fix button elements
find . -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./dist/*" \
  -not -path "./build/*" \
  -exec sed -i 's/<button\(\s\)/<button type="button"\1/g' {} \; \
  -exec sed -i 's/<button$/<button type="button"/g' {} \;

# Fix cases where type already exists (to avoid duplicates)
find . -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./dist/*" \
  -not -path "./build/*" \
  -exec sed -i 's/type="button"\s*type="button"/type="button"/g' {} \;

# Fix cases where type="submit" or type="reset" got overwritten
find . -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./dist/*" \
  -not -path "./build/*" \
  -exec sed -i 's/type="button"\s*type="submit"/type="submit"/g' {} \; \
  -exec sed -i 's/type="button"\s*type="reset"/type="reset"/g' {} \;

echo "Button type attributes fixed!"
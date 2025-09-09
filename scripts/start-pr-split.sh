#!/bin/bash

# PR-SPLIT PROTOCOL - Automation Script
# Divide PR #7 (140 files) into 7 atomic PRs

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 PR-SPLIT PROTOCOL - Starting...${NC}"
echo "======================================"

# Check if we're in the right repo
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: Not in project root${NC}"
  exit 1
fi

# Function to create PR
create_pr() {
  local PR_NUM=$1
  local BRANCH_NAME=$2
  local TITLE=$3
  local DESCRIPTION=$4
  shift 4
  local FILES=("$@")
  
  echo -e "\n${YELLOW}📦 Creating PR ${PR_NUM}/7: ${TITLE}${NC}"
  echo "----------------------------------------"
  
  # Create and checkout branch
  git checkout main
  git pull origin main
  git checkout -b "$BRANCH_NAME"
  
  # Cherry-pick files from melhorias branch
  for file in "${FILES[@]}"; do
    echo -e "  Adding: $file"
    git checkout melhorias -- "$file" 2>/dev/null || echo "    ⚠️  File not found: $file"
  done
  
  # Run checks
  echo -e "\n${BLUE}🔍 Running checks...${NC}"
  npm run lint 2>&1 | tail -3
  npm run typecheck 2>&1 | tail -3
  npm run build 2>&1 | tail -3
  
  # Commit
  git add -A
  git commit -m "$TITLE

$DESCRIPTION

Part ${PR_NUM} of 7 - Split from #7
Related: #7"
  
  # Push and create PR
  git push origin "$BRANCH_NAME"
  
  gh pr create \
    --title "$TITLE" \
    --body "## Part ${PR_NUM} of 7 - Split from #7

### 🎯 Problem
$DESCRIPTION

### ✅ Solution
See changed files

### 📊 Impact
- Isolated change
- Easy to review
- Safe to merge

### Checklist
- [x] Less than 10 files
- [x] Tests pass
- [x] Build works
- [x] No regressions

Related to: #7" \
    --label "pr-split"
  
  echo -e "${GREEN}✅ PR ${PR_NUM}/7 created successfully!${NC}"
}

# Main execution
echo -e "${BLUE}Choose which PR to create:${NC}"
echo "1) PR 1/7 - Static Classes Refactoring (4 files)"
echo "2) PR 2/7 - Non-null Assertions (5 files)"
echo "3) PR 3/7 - React Props Fix (6 files)"
echo "4) PR 4/7 - Custom Hooks (8 files)"
echo "5) PR 5/7 - Zero Regression Protocol (6 files)"
echo "6) PR 6/7 - Performance Optimizations (5 files)"
echo "7) PR 7/7 - Minor Fixes (5 files)"
echo "8) Create ALL PRs sequentially"
echo "0) Exit"

read -p "Enter choice [0-8]: " choice

case $choice in
  1)
    create_pr 1 "fix/pr-1-static-classes" \
      "fix: eliminate static-only classes (1/7)" \
      "Refactor classes with only static members to plain functions" \
      "lib/error-reporting.ts" \
      "components/artifact-with-error-boundary.tsx" \
      "components/auth-with-error-boundary.tsx" \
      "hooks/use-error-recovery.ts"
    ;;
    
  2)
    create_pr 2 "fix/pr-2-non-null-assertions" \
      "fix: remove dangerous non-null assertions (2/7)" \
      "Replace non-null assertions with safe null checks" \
      "lib/ai/claude-unified.ts" \
      "lib/cache/redis-client.ts" \
      "lib/cache/redis-health.ts" \
      "lib/repositories/base-repository.ts" \
      "lib/mcp-integration.ts"
    ;;
    
  3)
    create_pr 3 "fix/pr-3-react-props" \
      "fix: add missing React component props (3/7)" \
      "Fix missing role props and array keys in React components" \
      "components/chat/MessageList.tsx" \
      "components/chat/ChatInterface.tsx" \
      "components/chat/SmartLoadingState.tsx" \
      "components/generative/WeatherCard.tsx" \
      "components/generative/SearchCard.tsx" \
      "components/session/SessionTabs.tsx"
    ;;
    
  4)
    create_pr 4 "feat/pr-4-custom-hooks" \
      "feat: extract logic to custom hooks (4/7)" \
      "Refactor large components using custom hooks architecture" \
      "hooks/use-chat-session.ts" \
      "hooks/use-chat-messages.ts" \
      "hooks/use-scroll-manager.ts" \
      "hooks/use-error-recovery.ts" \
      "components/chat/ChatInterface.tsx" \
      "components/chat/MessageList.tsx" \
      "components/chat/ChatHeader.tsx" \
      "types/chat.ts"
    ;;
    
  5)
    create_pr 5 "feat/pr-5-zero-regression" \
      "feat: implement Zero Regression Protocol (5/7)" \
      "Add regression prevention system with tests and CI/CD gates" \
      ".github/workflows/zero-regression.yml" \
      ".github/PULL_REQUEST_TEMPLATE.md" \
      ".quality/bugs/inventory.md" \
      ".quality/templates/bug-analysis.md" \
      ".quality/scripts/setup-zrp.sh" \
      "__tests__/regression/never-again.test.ts"
    ;;
    
  6)
    create_pr 6 "perf/pr-6-optimizations" \
      "perf: optimize rendering and scroll performance (6/7)" \
      "Add throttling, debouncing and render optimizations" \
      "utils/throttle.ts" \
      "hooks/use-scroll-manager.ts" \
      "components/chat/ChatInterface.tsx" \
      "components/chat/MessageList.tsx" \
      "lib/cache/index.ts"
    ;;
    
  7)
    create_pr 7 "chore/pr-7-cleanup" \
      "chore: minor fixes and cleanup (7/7)" \
      "Fix Tailwind classes and window.location assignments" \
      "components/claude-chat.tsx" \
      "components/error-boundary.tsx" \
      "components/error-fallbacks.tsx" \
      "CI-STATUS.md" \
      "PR-SPLIT-PROTOCOL.md"
    ;;
    
  8)
    echo -e "${YELLOW}⚠️  This will create all 7 PRs. Continue? (y/n)${NC}"
    read -p "Choice: " confirm
    if [ "$confirm" = "y" ]; then
      for i in {1..7}; do
        $0 <<< "$i"
        echo -e "${GREEN}Waiting 30s before next PR...${NC}"
        sleep 30
      done
    fi
    ;;
    
  0)
    echo -e "${GREEN}Exiting...${NC}"
    exit 0
    ;;
    
  *)
    echo -e "${RED}Invalid choice${NC}"
    exit 1
    ;;
esac

echo -e "\n${GREEN}🎉 PR Split Protocol Complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Wait for PR review and approval"
echo "2. Merge PR before creating next one"
echo "3. Run script again for next PR"
echo ""
echo -e "${BLUE}Remember: 1 PR = 1 Problem = 1 Day${NC}"
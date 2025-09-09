# 🚀 PR-SPLIT PROTOCOL - Divisão Atômica do PR #7

## 📊 Situação Atual
- **PR #7**: 140 arquivos ❌ (INVIÁVEL)
- **Meta**: 7 PRs com ~10 arquivos cada ✅
- **Princípio**: 1 PR = 1 Problema = 1 Dia

## 🎯 Os 7 PRs Atômicos

### PR 1/7: Critical TypeScript Refactoring
**🗓️ Dia 1 | 🎯 Eliminar Classes Estáticas**
```yaml
Problema: Classes com apenas membros estáticos violam best practices
Arquivos: 4
Impacto: Melhor tree-shaking, -500 linhas de código
```

**Arquivos:**
1. `lib/error-reporting.ts` → Refatorar 3 classes para funções
2. `components/artifact-with-error-boundary.tsx` → Atualizar imports
3. `components/auth-with-error-boundary.tsx` → Atualizar imports
4. `hooks/use-error-recovery.ts` → Atualizar imports

**Comando:**
```bash
git checkout -b fix/pr-1-static-classes
git cherry-pick [commits específicos]
gh pr create --title "fix: eliminate static-only classes (1/7)" \
  --body "Part 1 of #7 - TypeScript best practices"
```

---

### PR 2/7: Non-null Assertion Safety
**🗓️ Dia 2 | 🎯 Eliminar Non-null Assertions**
```yaml
Problema: Non-null assertions (!) causam runtime errors
Arquivos: 5
Impacto: Previne crashes em produção
```

**Arquivos:**
1. `lib/ai/claude-unified.ts` → Safe fallback checks
2. `lib/cache/redis-client.ts` → Client validation
3. `lib/cache/redis-health.ts` → Health check safety
4. `lib/repositories/base-repository.ts` → Where clause safety
5. `lib/mcp-integration.ts` → Type annotations

---

### PR 3/7: React Component Props Fix
**🗓️ Dia 3 | 🎯 Corrigir Props Obrigatórias**
```yaml
Problema: ChatMessage sem role prop = React warnings
Arquivos: 6
Impacto: Zero warnings no console
```

**Arquivos:**
1. `components/chat/MessageList.tsx` → Add role prop
2. `components/chat/ChatInterface.tsx` → Add role prop
3. `components/chat/SmartLoadingState.tsx` → Fix array keys
4. `components/generative/WeatherCard.tsx` → Fix array keys
5. `components/generative/SearchCard.tsx` → Fix array keys
6. `components/session/SessionTabs.tsx` → Button semantics

---

### PR 4/7: Custom Hooks Architecture
**🗓️ Dia 4 | 🎯 Extrair Lógica para Hooks**
```yaml
Problema: Components com 500+ linhas = unmaintainable
Arquivos: 8
Impacto: -60% linhas por componente
```

**Arquivos:**
1. `hooks/use-chat-session.ts` → NEW: Session management
2. `hooks/use-chat-messages.ts` → NEW: Message handling
3. `hooks/use-scroll-manager.ts` → NEW: Scroll logic
4. `hooks/use-error-recovery.ts` → Enhanced error handling
5. `components/chat/ChatInterface.tsx` → Refactored to use hooks
6. `components/chat/MessageList.tsx` → NEW: Extracted component
7. `components/chat/ChatHeader.tsx` → NEW: Extracted component
8. `types/chat.ts` → NEW: Type definitions

---

### PR 5/7: Zero Regression Protocol Core
**🗓️ Dia 5 | 🎯 Sistema Anti-Regressão**
```yaml
Problema: Bugs voltam sem testes de regressão
Arquivos: 6
Impacto: 0% recorrência de bugs
```

**Arquivos:**
1. `.github/workflows/zero-regression.yml` → CI/CD gates
2. `.github/PULL_REQUEST_TEMPLATE.md` → PR template
3. `.quality/bugs/inventory.md` → Bug tracking
4. `.quality/templates/bug-analysis.md` → 5 Whys template
5. `.quality/scripts/setup-zrp.sh` → Automation
6. `__tests__/regression/never-again.test.ts` → Regression tests

---

### PR 6/7: Performance Optimizations
**🗓️ Dia 6 | 🎯 Otimizações de Performance**
```yaml
Problema: Re-renders desnecessários, scroll lag
Arquivos: 5
Impacto: -50% re-renders, scroll suave
```

**Arquivos:**
1. `utils/throttle.ts` → Throttle utility
2. `hooks/use-scroll-manager.ts` → Debounced scroll
3. `components/chat/ChatInterface.tsx` → Memo optimizations
4. `components/chat/MessageList.tsx` → Virtual scrolling prep
5. `lib/cache/index.ts` → Cache optimizations

---

### PR 7/7: Minor Fixes & Cleanup
**🗓️ Dia 7 | 🎯 Limpeza Final**
```yaml
Problema: Warnings menores, código morto
Arquivos: 5
Impacto: 0 warnings, código limpo
```

**Arquivos:**
1. `components/claude-chat.tsx` → Tailwind size-full
2. `components/error-boundary.tsx` → Window.location fix
3. `components/error-fallbacks.tsx` → Window.location fix
4. `CI-STATUS.md` → Documentation
5. `PR-SPLIT-PLAN.md` → This file (meta)

---

## 📋 Checklist de Execução

### Para cada PR:
- [ ] Branch específica (`fix/pr-X-description`)
- [ ] Máximo 10 arquivos
- [ ] Testes passando
- [ ] Build funcionando
- [ ] PR description clara
- [ ] Link para PR #7 original
- [ ] Métricas de antes/depois

## 🔧 Comandos de Execução

```bash
# Setup inicial
git checkout main
git pull origin main

# Para cada PR (exemplo PR 1)
git checkout -b fix/pr-1-static-classes
git checkout melhorias -- lib/error-reporting.ts
git checkout melhorias -- components/artifact-with-error-boundary.tsx
git checkout melhorias -- components/auth-with-error-boundary.tsx
git checkout melhorias -- hooks/use-error-recovery.ts

# Verificar e testar
npm run lint
npm run typecheck
npm run build
npm test

# Criar PR
gh pr create \
  --title "fix: eliminate static-only classes (1/7)" \
  --body "## Part 1 of 7 - Split from #7\n\n### Problem\nStatic-only classes violate best practices\n\n### Solution\nRefactored to plain functions\n\n### Impact\n- Better tree-shaking\n- Cleaner code\n- -500 lines\n\n### Checklist\n- [x] < 10 files\n- [x] Tests pass\n- [x] Build works\n\nRelated: #7"

# Aguardar merge antes do próximo
```

## 📊 Métricas de Sucesso

| Métrica | PR #7 (Antes) | 7 PRs (Depois) |
|---------|---------------|----------------|
| Arquivos por PR | 140 ❌ | ~10 ✅ |
| Tempo de Review | 3+ horas | 15 min cada |
| Risco de Conflito | ALTO | BAIXO |
| Rollback Complexity | IMPOSSÍVEL | TRIVIAL |
| CI/CD Time | 15+ min | 2-3 min |
| Merge Confidence | 30% | 95%+ |

## 🎯 Benefícios do Split

1. **Review Focado**: Revisor entende 100% do contexto
2. **Merge Confidence**: Cada PR é seguro isoladamente
3. **Rollback Granular**: Problema? Reverte 1 PR, não 140 arquivos
4. **CI/CD Rápido**: 2-3 min vs 15+ min
5. **Zero Conflitos**: PRs pequenos = menos conflitos
6. **Documentação Natural**: Cada PR documenta uma mudança

## ⚡ Início Imediato

```bash
# EXECUTAR AGORA:
./scripts/start-pr-split.sh

# Ou manualmente:
git checkout main
git checkout -b fix/pr-1-static-classes
# ... continuar com instruções acima
```

---

**🚨 IMPORTANTE**: 
- Fechar PR #7 após criar o primeiro PR split
- Cada PR deve ser mergeado antes de criar o próximo
- Manter referência ao PR #7 original em todos os novos PRs

**Meta**: 7 dias = 7 PRs = 0 regressões = 100% confiança
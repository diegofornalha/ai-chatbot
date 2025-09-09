sempre responda em pt br

🎯 O Framework Definitivo para PRs Perfeitas: "ATOMIC-PR"
📐 Regra de Ouro: 1 PR = 1 Problema = 1 Dia
A.T.O.M.I.C - Os 6 Pilares
A - Atomicidade (One Thing)
Tamanho Ideal:
yamlArquivos: 3-7 (máximo 10)
Linhas: 50-200 (máximo 400)
Tempo review: 15-30 minutos
Complexidade: 1 problema específico
Exemplo Prático:
bash# ❌ ERRADO: PR "Melhorias gerais no chat"
- Corrige autenticação
- Adiciona dark mode  
- Otimiza performance
- Refatora componentes
= 50 arquivos, 2000 linhas

# ✅ CERTO: 4 PRs separadas
PR #1: "fix: corrige validação de ownership no chat"
= 3 arquivos, 45 linhas

PR #2: "feat: adiciona dark mode ao ChatHeader"
= 5 arquivos, 120 linhas

PR #3: "perf: implementa virtual scrolling no MessageList"
= 4 arquivos, 180 linhas

PR #4: "refactor: extrai lógica do chat para custom hook"
= 6 arquivos, 95 linhas
T - Testável (Provas Concretas)
Structure de Testes Obrigatória:
typescript// Para CADA mudança significativa:

// 1. Teste do problema original (prova que existia)
test('BUG: should fail before fix', () => {
  // Código que reproduz o bug
  expect(() => brokenFunction()).toThrow();
});

// 2. Teste da correção (prova que foi resolvido)
test('FIX: should work after fix', () => {
  expect(fixedFunction()).toBe(expected);
});

// 3. Teste de regressão (prova que não volta)
test('REGRESSION: should never break again', () => {
  // Edge cases
  expect(fixedFunction(null)).toBeNull();
  expect(fixedFunction(undefined)).toBeUndefined();
  expect(fixedFunction([])).toEqual([]);
});

// 4. Teste de performance (se aplicável)
test('PERF: should complete in < 100ms', () => {
  const start = performance.now();
  fixedFunction(largeDataset);
  expect(performance.now() - start).toBeLessThan(100);
});
O - Observável (Métricas Claras)
PR Description Template:
markdown## 📊 Métricas Objetivas

### Performance
- **Antes**: 340ms render time
- **Depois**: 85ms render time  
- **Ganho**: 75% mais rápido

### Bundle Size
- **Antes**: 245KB
- **Depois**: 238KB
- **Impacto**: -7KB (-2.8%)

### Test Coverage
- **Antes**: 72%
- **Depois**: 81%
- **Δ**: +9%

### TypeScript Errors
- **Antes**: 3
- **Depois**: 0
- **Resolvidos**: 100%

## 🎥 Demo
[Loom video 2 min mostrando antes/depois]

## 📸 Screenshots
| Antes | Depois |
|-------|--------|
| ![bug] | ![fixed] |
M - Manutenível (Documentação Viva)
Código Auto-Documentado:
typescript// ❌ RUIM: Comentário desnecessário
// Incrementa o contador em 1
counter++;

// ✅ BOM: Documenta o PORQUÊ, não o QUÊ
// Incrementa após validação para evitar race condition
// identificada no bug #4521 (2024-01-15)
if (isValid) counter++;

// ✅ ÓTIMO: Decisão arquitetural documentada
/**
 * DECISÃO: Usamos debounce de 300ms baseado em análise
 * de user behavior que mostrou 95% dos usuários param
 * de digitar por >= 300ms entre palavras.
 * 
 * Alternativas consideradas:
 * - Throttle: Descartado, perderia keystrokes
 * - No delay: Descartado, 5000 requests/min inviável
 * 
 * @see https://jira.com/PERF-123
 */
const DEBOUNCE_MS = 300;
I - Independente (Zero Dependências)
Checklist de Independência:
bash#!/bin/bash
# Cada PR deve passar TODOS os testes sozinha

# 1. Branch isolation test
git checkout -b test-isolation
git cherry-pick <commit-da-pr>
npm test # DEVE passar

# 2. Deployment isolation
npm run build # DEVE buildar
npm run start # DEVE rodar

# 3. Rollback safety
git revert HEAD
npm test # DEVE continuar passando
C - Completo (Definition of Done)
DoD Checklist Rigoroso:
markdown## ✅ Definition of Done

### Code Quality
- [ ] 0 erros TypeScript
- [ ] 0 warnings ESLint  
- [ ] 0 vulnerabilidades (npm audit)
- [ ] Prettier aplicado

### Testing
- [ ] Unit tests: ✅ (coverage > 80%)
- [ ] Integration tests: ✅
- [ ] E2E test (se UI): ✅
- [ ] Testa em Safari/Firefox/Chrome

### Documentation
- [ ] README atualizado (se necessário)
- [ ] JSDoc em funções públicas
- [ ] CHANGELOG.md atualizado
- [ ] Storybook (se componente): ✅

### Performance
- [ ] Lighthouse score > 90
- [ ] Bundle size não aumentou > 2%
- [ ] Sem memory leaks
- [ ] Profiler mostra < 16ms render

### Security
- [ ] Sem dados sensíveis em logs
- [ ] Inputs sanitizados
- [ ] Auth verificada
- [ ] OWASP checklist aplicada
🚀 O Processo Perfeito: "PR-FLOW"
1. PRE-PR (Antes de Codar)
bash# 1. Crie issue PRIMEIRO
gh issue create --title "Bug: Chat ownership validation fails"

# 2. Discuta solução
- Comente alternativas na issue
- Obtenha consenso da abordagem
- Defina métricas de sucesso

# 3. Branch com nome descritivo
git checkout -b fix/chat-ownership-validation-issue-123
2. DURANTE (Desenvolvimento)
bash# Commits atômicos e descritivos
git commit -m "test: add failing test for ownership bug"
git commit -m "fix: implement ownership validation"  
git commit -m "test: add regression test suite"
git commit -m "docs: update README with security notes"

# Self-review rigoroso
git diff main --stat  # Confere tamanho
git diff main         # Revisa linha por linha
3. PRE-SUBMIT (Validação Local)
bash#!/bin/bash
# pre-pr-check.sh

echo "🔍 Validando PR..."

# Size check
files_changed=$(git diff main --name-only | wc -l)
if [ $files_changed -gt 10 ]; then
  echo "❌ PR muito grande: $files_changed arquivos"
  exit 1
fi

# Quality gates
npm run typecheck || exit 1
npm run lint || exit 1
npm run test || exit 1
npm run test:e2e || exit 1
npm run build || exit 1

echo "✅ PR pronta para review!"
4. SUBMIT (PR Criação)
markdown## Título (50 chars max)
fix: prevent unauthorized chat access via ownership check

## Template
### 🎯 Problema
Users could access chats they don't own by guessing IDs

### 💡 Solução  
Added ownership validation middleware with user ID check

### 🧪 Como Testar
1. Login as userA
2. Try accessing userB's chat via /chat/[userB-chat-id]
3. Should see 403 Forbidden

### 📊 Impacto
- Security: HIGH (fixes critical vulnerability)
- Performance: NONE (< 1ms overhead)
- Breaking: NO

### ✅ Checklist
- [x] Testes passando
- [x] Sem breaking changes
- [x] Documentação atualizada
5. REVIEW (Facilitando para Reviewers)
Adicione Comentários no PR:
typescript// PR Comment: "Ponto de atenção aqui"
if (!chat || chat.userId !== session.user.id) {
  // @reviewer: Considerei usar early return vs único if
  // Optei por único if para melhor readability
  return new ForbiddenError();
}
6. PÓS-MERGE (Monitoramento)
typescript// monitoring.ts
import { datadogRum } from '@datadog/browser-rum';

// Adicione tracking específico
datadogRum.addAction('pr_7_chat_validation', {
  pr_number: 7,
  feature: 'chat_ownership',
  deployed_at: new Date().toISOString()
});

// Monitore por 24h
// Se métrica X piorar > 5%, prepare rollback
📊 Métricas de PR Perfeita
typescriptinterface PerfectPR {
  // Tamanho
  files: number;        // <= 10
  additions: number;    // <= 200
  deletions: number;    // >= additions * 0.3 (cleanup)
  
  // Qualidade
  testsAdded: boolean;  // true
  coverage: number;     // >= 80
  reviewTime: string;   // <= "30 min"
  
  // Clareza
  hasScreenshots: boolean;  // true se UI
  hasMetrics: boolean;      // true sempre
  commitMessages: "atomic"; // granular
  
  // Impacto
  performance: "improved" | "neutral";
  security: "improved" | "neutral";  
  breakingChanges: false;
}
🎁 Bonus: Script "PR Perfeita"
bash#!/bin/bash
# perfect-pr.sh

echo "🎯 Criando PR Perfeita..."

# 1. Análise automática
echo "📊 Analisando mudanças..."
files=$(git diff main --name-only | wc -l)
lines_added=$(git diff main --stat | tail -1 | awk '{print $4}')
lines_removed=$(git diff main --stat | tail -1 | awk '{print $6}')

# 2. Validações
if [ $files -gt 10 ]; then
  echo "❌ PR muito grande. Dividir em:"
  git diff main --name-only | head -5
  echo "--- PR 1: Primeiros 5 arquivos ---"
  git diff main --name-only | tail -$((files-5))
  echo "--- PR 2: Resto ---"
  exit 1
fi

# 3. Gerar relatório
cat > pr-report.md << EOF
# PR Quality Report

## 📏 Size Metrics
- Files: $files/10 ✅
- Lines Added: $lines_added
- Lines Removed: $lines_removed
- Net Change: $((lines_added - lines_removed))

## 🧪 Test Coverage
$(npm test -- --coverage --silent | grep "All files")

## 📦 Bundle Impact
$(npm run build:analyze | grep "Total size")

## ✅ Ready for Review!
EOF

echo "✅ PR Perfeita criada! Veja pr-report.md"
# Bug Analysis Template - Zero Regression Protocol

## 1. SINTOMA
[Descrição do que o usuário vê ou experimenta]

## 2. CINCO PORQUÊS (Root Cause Analysis)
1. **Por que aconteceu?** 
   - [resposta]
2. **Por que [resposta anterior]?** 
   - [nova resposta]
3. **Por que [resposta anterior]?** 
   - [nova resposta]
4. **Por que [resposta anterior]?** 
   - [nova resposta]
5. **Por que [resposta anterior]?** 
   - **[CAUSA RAIZ]**

## 3. CORREÇÃO
```typescript
// Código da correção
```

## 4. PREVENÇÃO
```typescript
// Teste que previne recorrência
test('prevent [bug description]', () => {
  // teste específico que garante que o bug não volta
});
```

## 5. CHECKLIST
- [ ] Teste de regressão criado
- [ ] Documentação atualizada
- [ ] Lint rule adicionada (se aplicável)
- [ ] Monitoring adicionado
- [ ] Code review aprovado
- [ ] Adicionado ao inventory.md
- [ ] PR com menos de 10 arquivos
- [ ] Coverage não diminuiu

## 6. MÉTRICAS
- **Tempo para detecção**: X horas
- **Tempo para correção**: X horas
- **Impacto**: [baixo/médio/alto/crítico]
- **Usuários afetados**: X
- **Recorrências anteriores**: X

## 7. LIÇÕES APRENDIDAS
[O que aprendemos com este bug que pode prevenir bugs similares no futuro]

---

**Bug ID**: #___
**Data**: ___
**Responsável**: ___
**Status**: [open/in-progress/fixed/verified]
# Pré-Análise Antes de Alterar

## 1. Descobrir o estado real

- Leia `docs/estado-atual-e-roadmap.md`.
- Localize o ponto de entrada e os módulos relacionados.
- Leia testes existentes antes de presumir comportamento.
- Verifique se a feature já existe sob outro módulo.

## 2. Classificar a mudança

- UI/layout;
- gameplay/domínio;
- balanceamento;
- persistência/save;
- infraestrutura;
- documentação.

Evite misturar categorias sem necessidade.

## 3. UI

Para tela densa, verifique primeiro `app/components/ui/game-layout.tsx`.

Pergunte ao código:

- qual é o estado dominante?
- qual é a ação principal?
- o que pode virar detalhe recolhido?
- existe componente reutilizável?

A Torre já é referência. Heróis é o próximo alvo planejado.

## 4. Save

Se o estado persistido mudar:

- atualizar estado inicial;
- atualizar normalização;
- decidir se exige nova `schemaVersion`;
- adicionar migration;
- testar importação/regressão.

Estado atual: schema 5.

## 5. Gameplay

- regra deve permanecer em `src/game/`;
- UI chama store, não altera estado persistente de forma paralela;
- dados derivados devem preferir função pura;
- não duplicar moral, afinidade, treino, proficiência ou potencial com nomes novos.

## 6. Torre

Preservar:

- formação/energia;
- milestones/readiness;
- repetição de andares;
- dificuldades;
- eventos;
- resultado/replay;
- layout focado, salvo quando a tarefa for explicitamente alterá-lo.

## 7. Validação

- TypeScript/React: `npm run typecheck`;
- regras/save: `npm test`;
- UI estrutural: `npm run build`;
- grande mudança: `npm run validate`;
- DB: `npm run validate:db` quando aplicável.

## 8. Documentação

Mudou contrato funcional? Sincronize GDD + especificação + estado/roadmap. Mudou fluxo de QA? Atualize o checklist.
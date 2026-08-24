# Guia Canônico de Agentes

## Contexto

Ascensão dos Ecos é um RPG web single-player em Alpha 0.10.0.

Stack:

- Next.js + React + TypeScript;
- Zustand;
- localStorage como save principal;
- Prisma/PostgreSQL opcional para cloud save experimental.

`master` é a referência canônica. A branch `migration/next-postgres` é histórica e não deve ser usada como base de novas features.

## Antes de alterar

1. Leia o arquivo atual e o fluxo relacionado.
2. Consulte `docs/estado-atual-e-roadmap.md` para saber onde o projeto parou.
3. Consulte o GDD/especificação para comportamento e intenção.
4. Classifique a mudança: UI, domínio, save, infraestrutura, balanceamento ou documentação.
5. Faça a menor mudança capaz de resolver o objetivo.

## Arquitetura obrigatória

- `src/game/`: regras puras de gameplay.
- `src/store/gameStore.ts`: ponte de mutações consumida pela UI.
- `app/components/`: apresentação React.
- `src/game/save/`: migration/validação de save.
- `localStorage`: precisa continuar funcionando sem banco.

Não mover regra de domínio para componente para ganhar velocidade momentânea.

## Save

Estado atual:

- `saveVersion: 1`;
- `schemaVersion: 5`.

Campo persistido novo exige avaliar:

- default;
- normalização;
- migration;
- regressão/importação.

Valores derivados devem preferir cálculo a persistência.

## UX/UI atual

A direção é **modo foco + progressive disclosure**.

Reuse `app/components/ui/game-layout.tsx`:

- `GamePage`;
- `GamePageHeader`;
- `CompactStatStrip`;
- `PrimaryActionPanel`;
- `FocusPanel`;
- `SecondaryInfoGrid`;
- `DetailDrawer`.

A Torre já é o piloto concluído. O próximo alvo de rework é **Heróis**. Não crie outro design system paralelo.

## Estado de produto relevante

Já existem: roster único, invocação sem duplicatas, onboarding 5+especial, readiness, Lobby Vivo, treino, proficiências, potencial, promoção 1★→2★ e Rota da Primeira Ascensão.

Não reimplemente esses sistemas sob outro nome.

Conceitos como trabalhos do Lobby, Vice-Mestre, Assistente, síntese e promoções superiores são visão futura, não features prontas.

## Validação

- TS/React: `npm run typecheck`.
- Domínio/save/balance: `npm test`.
- UI estrutural/Next: `npm run build`.
- Mudança grande: `npm run validate`.
- Prisma/PostgreSQL: `npm run validate:db` quando pertinente.

## Documentação

Hierarquia:

1. código/testes;
2. `GDD_Ascensao_dos_Ecos_Alpha_Atualizado.md`;
3. `docs/especificacao-funcional.md`;
4. `docs/estado-atual-e-roadmap.md`;
5. `docs/visao-lobby-vivo.md`.

`gdd_web_tower_gacha_mvp.md` é histórico.

Ao mudar gameplay, economia, save ou UI estrutural, sincronize GDD + especificação + estado/roadmap; atualize QA quando o fluxo testável mudar.

## Commits

- pequenos e por responsabilidade;
- documentação diretamente necessária para explicar a feature pode acompanhar a feature;
- limpeza documental ampla deve usar commit `docs:` separado;
- revise diff/status antes de finalizar.
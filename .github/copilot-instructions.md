# Instruções do Copilot — Ascensão dos Ecos

## Estado atual

- Alpha 0.10.0.
- `master` é canônico.
- Stack: Next.js, React, TypeScript, Zustand.
- localStorage é o save principal.
- Prisma/PostgreSQL é opcional para cloud save experimental.
- schema de save atual: v5.

Leia `docs/estado-atual-e-roadmap.md` antes de iniciar uma feature.

## Arquitetura

- gameplay em `src/game/`;
- mutações persistentes em `src/store/gameStore.ts`;
- UI em `app/components/`;
- migrations/validação em `src/game/save/`;
- jogo deve funcionar sem `DATABASE_URL`.

## Sistemas já existentes

Não reimplementar: roster único, invocação sem duplicatas, onboarding 5+especial, readiness, Lobby Vivo, treino, proficiências, potencial, promoção 1★→2★ e Rota da Primeira Ascensão.

## UX atual

O projeto está migrando telas para **modo foco**.

Reuse `app/components/ui/game-layout.tsx`. A Torre já foi refatorada e serve de referência. O próximo alvo planejado é Heróis.

Prefira:

- um estado dominante;
- uma ação principal;
- métricas essenciais compactas;
- detalhes extensos recolhidos.

## Save

Ao mudar estado persistido:

1. default;
2. normalização;
3. migration quando necessário;
4. teste de regressão/importação.

Não persistir dados derivados sem necessidade.

## Validação

- `npm run typecheck` para TS/React;
- `npm test` para domínio/save;
- `npm run build` para UI/Next estrutural;
- `npm run validate` para mudança grande;
- `npm run validate:db` só quando DB/Prisma for afetado.

## Documentação

- GDD canônico: `GDD_Ascensao_dos_Ecos_Alpha_Atualizado.md`;
- funcional: `docs/especificacao-funcional.md`;
- ponto atual: `docs/estado-atual-e-roadmap.md`;
- visão futura: `docs/visao-lobby-vivo.md`;
- GDD de MVP antigo: histórico.

Sincronize docs quando gameplay, economia, save ou UI estrutural mudar.
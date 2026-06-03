# Contexto do Projeto

## Produto

Ascensao dos Ecos e um jogo web single-player de estrategia, idle RPG, gacha e progressao por torre.

O jogador gerencia uma base, invoca herois, monta uma formacao, equipa personagens e avanca por andares com combates automaticos.

## Deploy

O alvo operacional atual é desenvolvimento local em Next.js, com deploy futuro planejado para Vercel.

Regras importantes:
- a experiência principal roda em `app/` via Next.js;
- `localStorage` continua sendo o save principal;
- PostgreSQL/Prisma é opcional e usado apenas para cloud save experimental;
- o jogo deve funcionar localmente mesmo sem `DATABASE_URL`.

## Estrutura Atual

- `app/`: aplicação Next, rotas e componentes React.
- `app/components/`: painéis da UI do jogo.
- `src/game/`: regras puras, tipos e normalização do estado.
- `src/store/gameStore.ts`: store Zustand usada pela UI.
- `src/lib/`: utilitários de Prisma, playerId e snapshots.
- `prisma/`: schema e migrations do PostgreSQL opcional.
- `tests/`: regressão do core, fixtures e banco.
- `docs/`: especificação funcional e notas da migração.

## Arquitetura do Jogo

O código operacional usa Next.js, React, TypeScript e Zustand.

Fluxos centrais:
- `app/components/layout/GameShell.tsx`: shell, navegação e composição dos painéis.
- `app/globals.css`: tokens visuais, responsividade e estilos globais.
- `src/game/state/`: estado inicial, normalização e persistência.
- `src/game/heroes`, `src/game/tower`, `src/game/battle`: regras principais.
- `src/store/gameStore.ts`: ações persistentes consumidas pela UI.

## Persistencia

O save principal fica em `localStorage`, pela chave configurada em `GAME_CONFIG.saveKey`.

Toda mudança persistente deve passar por ações do `gameStore` ou por regras puras em `src/game/` chamadas pelo store.

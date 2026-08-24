# Contexto Atual do Projeto

## Produto

Ascensão dos Ecos é um RPG web single-player em Alpha 0.10.0. O jogador é o Mestre de um Lobby Vivo e prepara heróis únicos para sobreviver à Torre.

O loop atual combina gestão, idle, descoberta de potencial e combate automático.

## Situação em 24/08/2026

- branch canônica: `master`;
- última fase concluída: **Fase 2 do rework de UX/UI — Torre em modo foco**;
- próxima fase: **Heróis em modo foco**;
- `migration/next-postgres` é histórica.

## Stack

- Next.js 16;
- React 19;
- TypeScript 6;
- Zustand 5;
- localStorage;
- Prisma/PostgreSQL opcional.

## Sistemas importantes já existentes

- roster único + legacy;
- invocação sem duplicatas;
- onboarding com 5 tickets + especial;
- formação/presets;
- equipamento flexível;
- Torre 40 andares/4 capítulos;
- milestones/readiness/dificuldades;
- combate, replay e resultado;
- Lobby Vivo;
- treino;
- proficiências;
- potencial;
- promoção 1★→2★;
- Rota da Primeira Ascensão;
- expedições, moral, ferimentos, especializações, afinidade;
- relíquias, missões, biblioteca e narrativa.

## Estrutura

- `app/`: Next/UI.
- `app/components/ui/game-layout.tsx`: arquitetura de telas focadas.
- `src/game/`: domínio puro.
- `src/store/gameStore.ts`: mutações/persistência.
- `src/game/save/`: validação/migrations.
- `prisma/`: banco opcional.
- `tests/`: regressão.

## Save

- localStorage principal;
- `saveVersion: 1`;
- `schemaVersion: 5`;
- qualquer mudança persistida deve preservar migrations/normalização.

## Direção de produto

Lobby é o coração; Torre é prova de preparo. A prioridade imediata é clareza da interface, não adicionar uma nova pilha de features.
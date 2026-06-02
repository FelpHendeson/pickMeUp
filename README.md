# Ascensao dos Ecos

**Ascensao dos Ecos** e um jogo web single-player de estrategia, idle RPG, gacha e progressao por torre. A branch atual opera a experiencia principal em **Next.js, React, TypeScript e PostgreSQL**, com regras de jogo concentradas em um core TypeScript e persistencia em duas camadas.

## Status

Alpha estavel em fechamento na branch `migration/next-postgres`.

- UI principal em React/Next.
- Core de gameplay em `src/game/`.
- Save local no navegador como fallback imediato.
- Save em nuvem por snapshot JSON explicito no PostgreSQL.
- O runtime antigo em JavaScript puro nao faz mais parte operacional desta branch.

## Stack

- Next.js e React para UI.
- TypeScript para regras, estado e contratos.
- Zustand como ponte unica de mutacoes da UI.
- Prisma e PostgreSQL para snapshots de save.
- Docker Compose para banco local.

## Como Rodar

Instale dependencias:

```bash
npm install
```

Rode a aplicacao:

```bash
npm run dev
```

Abra o endereco informado pelo Next, normalmente:

```text
http://localhost:3000
```

Se a porta 3000 ja estiver ocupada, o Next pode oferecer outra porta.

## Banco Local

O projeto usa PostgreSQL via Docker Compose.

Suba o banco:

```bash
npm run db:up
```

Esse comando cria o volume, sobe o container e aguarda o healthcheck do PostgreSQL.

Aplique migrations:

```bash
npm run db:migrate
```

DSN local padrao:

```text
postgresql://postgres:postgres@localhost:5433/ascensao_dos_ecos?schema=public
```

Configure `.env` a partir de `.env.example`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ascensao_dos_ecos?schema=public"
```

O volume Docker `ecos_postgres_data` preserva os dados locais do banco.

## Validacao

Comandos principais:

```bash
npm run typecheck
npm test
npm run build
npm run validate
npm run validate:db
```

O que cada comando cobre:

- `npm run typecheck`: contratos TypeScript.
- `npm test`: regressao do core e fixtures estaveis.
- `npm run build`: build Next de producao.
- `npm run validate`: Prisma generate, typecheck, testes e build.
- `npm run validate:db`: Docker Compose, migrations e smoke test do PostgreSQL.

## Persistencia

O save local usa `localStorage` pela chave definida em `GAME_CONFIG.saveKey`.

O save em nuvem e explicito pelo jogador e usa:

- `GET /api/saves/[playerId]`
- `PUT /api/saves/[playerId]` com `{ payload: GameState }`

No PostgreSQL, `SaveSnapshot.payload` continua sendo a fonte completa do save. `PlayerProfile` e `Hero` sao tabelas auxiliares sincronizadas para preparar evolucoes futuras sem expandir o schema nesta etapa.

## Sistemas de Jogo

O core TypeScript em `src/game/` cobre:

- herois, classes, tracos, raridade, XP e poder;
- formacao e presets de equipe;
- equipamentos e atributos efetivos;
- consumiveis;
- moral e ferimentos;
- enfermaria;
- especializacoes;
- afinidade entre herois;
- invocacao e historico;
- recrutamento por contratos;
- reliquias permanentes;
- missoes e conquistas;
- expedicoes;
- capitulos, andares, inimigos e recompensas da torre;
- eventos aleatorios da torre;
- eventos semanais locais;
- dificuldades da torre;
- combate automatico, replay e resultado;
- conclusao de capitulos;
- biblioteca/bestiario;
- narrativa;
- preferencias;
- export/import de save.

## UI Principal

Os componentes React ficam em `app/components/` e incluem paineis para:

- recursos e gerenciamento de save;
- torre, combate, eventos e resultados;
- herois, formacao, presets e memorial;
- inventario, consumiveis e equipamentos;
- expedicoes;
- missoes;
- reliquias;
- invocacao;
- recrutamento;
- biblioteca;
- preferencias;
- narrativa.

## Fluxo de Desenvolvimento

Regras praticas:

- trabalhar na branch `migration/next-postgres`;
- manter `master` preservada;
- fazer commits pequenos por responsabilidade;
- chamar mutacoes de UI por `src/store/gameStore.ts`;
- manter regras puras em `src/game/`;
- normalizar saves antigos antes de usar;
- manter textos em PT-BR;
- rodar validacoes antes de commitar.

## Documentacao Interna

- `docs/migracao-next-postgres.md`: status da migracao, banco e comandos.
- `docs/especificacao-funcional.md`: especificacao funcional do jogo.
- `GDD_Ascensao_dos_Ecos_Alpha_Atualizado.md`: referencia de design.
- `agentsRules/`: contexto, pre-analise, padroes de codigo e padrao de commit.

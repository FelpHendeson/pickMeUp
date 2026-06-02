# Stack atual: Next.js + PostgreSQL

Esta branch opera a experiencia principal do jogo em Next.js, React, TypeScript e PostgreSQL.
O codigo JavaScript puro anterior foi removido desta branch; o historico continua disponivel no Git.

## Objetivo

Manter o jogo jogavel pela UI React, com regras puras em TypeScript e persistencia em duas camadas:

- save local no navegador como fallback imediato;
- snapshot de nuvem em PostgreSQL por acao explicita do jogador.

## Status de fechamento

Meta atual: **Alpha estavel**.

Esta etapa considera a migracao concluida quando:

- `npm run validate` passa em ambiente local com dependencias instaladas;
- `npm run validate:db` passa com PostgreSQL local via Docker Compose;
- o fluxo principal React permite jogar, salvar, exportar/importar, resolver eventos, combater, progredir e carregar snapshot da nuvem;
- nenhum caminho operacional depende do codigo JavaScript puro removido desta branch;
- o banco permanece no escopo de snapshot JSON completo, com `PlayerProfile` e `Hero` apenas como tabelas auxiliares sincronizadas.

## Arquitetura

- `app/`: UI React, rotas Next e API de save.
- `src/game/`: core TypeScript com regras de estado, torre, combate, herois, economia e sistemas auxiliares.
- `src/store/gameStore.ts`: ponte unica de mutacoes da UI, sempre chamando o core e persistindo o save local.
- `src/lib/playerSave.ts`: validacao, normalizacao e persistencia de snapshots no PostgreSQL.
- `prisma/`: schema e migrations versionadas.

## Banco

O schema inicial em `prisma/schema.prisma` cria:

- `Player`;
- `PlayerProfile`;
- `Hero`;
- `SaveSnapshot`.

`SaveSnapshot.payload` continua sendo a fonte completa do save. `PlayerProfile` e `Hero` ficam sincronizados como
tabelas preparatorias; inventario, missoes, biblioteca, reliquias e historico seguem dentro do JSON neste ciclo.

## Banco local com Docker

O projeto usa `docker-compose.yml` para subir um PostgreSQL local persistente em volume nomeado:

- servico: `postgres`;
- imagem: `postgres:16`;
- volume: `ecos_postgres_data`;
- banco: `ascensao_dos_ecos`;
- DSN: `postgresql://postgres:postgres@localhost:5432/ascensao_dos_ecos?schema=public`.

Fluxo recomendado:

```bash
npm run db:up
npm run db:migrate
npm run dev
```

`npm run db:up` aguarda o healthcheck do PostgreSQL antes de retornar, para evitar que `prisma migrate dev`
rode enquanto o container ainda esta inicializando.

Use `npm run validate:db` para subir o banco, aplicar migrations e rodar o smoke test de persistencia na nuvem.
O arquivo `.env` deve ficar local e seguir `.env.example`.

Se existir um container manual antigo usando a porta 5432, pare-o antes do Compose:

```bash
docker stop ecos-postgres
```

Nao remova o volume `ecos_postgres_data` se quiser preservar os saves locais do banco.

## Comandos

```bash
npm install
npm run db:up
npm run db:migrate
npm run dev
npm run typecheck
npm test
npm run validate
npm run validate:db
npm run prisma:generate
```

Scripts principais:

- `npm test`: roda regressao do core TypeScript e fixtures estaveis.
- `npm run test:core`: valida fluxo principal e mutacoes do core.
- `npm run test:fixtures`: congela contratos de configuracao, torre, recompensas, inimigos, expedicoes e invocacao.
- `npm run test:db`: valida snapshot, perfil e herois gravados no PostgreSQL.
- `npm run validate`: Prisma generate, typecheck, testes e build.
- `npm run validate:db`: Compose, migrations e smoke DB.

Configure `DATABASE_URL` com base em `.env.example` antes de rodar Prisma.

## Progresso atual

- UI React e dashboard principal disponiveis em `app/page.tsx`.
- Core TypeScript consolidado em `src/game/`.
- Zustand centraliza mutacoes e persiste save local com a chave existente `GAME_CONFIG.saveKey`.
- API `GET`/`PUT /api/saves/[playerId]` valida e normaliza payloads antes de criar snapshots.
- PostgreSQL local versionado com Docker Compose, migrations Prisma e teste de banco.
- Testes de paridade com a implementacao removida foram substituidos por fixtures TypeScript estaveis.
- Acoes criticas de save na UI exigem confirmacao antes de sobrescrever ou resetar progresso local.
- A API de save possui cobertura de smoke test para snapshot valido, payload invalido e jogador sem snapshot.
- O core possui smoke test do fluxo Alpha para invocacao, formacao, equipamento, consumivel, expedicao, combate,
  missao diaria e export/import de save.

## Historico

O codigo anterior em JavaScript puro nao faz mais parte operacional desta branch. Caso seja necessario comparar ou
recuperar alguma implementacao antiga, use o historico do Git ou a branch remota correspondente.

# Persistência Atual — Next.js, localStorage e PostgreSQL Opcional

> Este arquivo nasceu durante a migração para Next/PostgreSQL. A migração estrutural já foi promovida; hoje ele documenta a arquitetura de persistência atual.

**Estado em 24/08/2026:** `master` é canônico. A branch `migration/next-postgres` é histórica e está atrás do `master`; não deve receber novas features.

## Arquitetura

A experiência principal usa:

- Next.js/React/TypeScript;
- Zustand;
- localStorage como save principal;
- Prisma/PostgreSQL opcional para cloud save experimental.

O jogo deve funcionar completamente sem `DATABASE_URL` para o fluxo local.

## Save local

Configuração:

- chave: `ascensao-dos-ecos-save-v1`;
- `saveVersion`: 1;
- `schemaVersion`: 5.

Migrations formais estão em `src/game/save/migrations.ts`.

Schemas atuais incluem evolução para:

1. base/versionamento;
2. onboarding de invocação;
3. treino;
4. proficiências;
5. potencial.

Importação de save passa por migration + `ensureStateShape`.

## Cloud save experimental

API:

- `GET /api/saves/[playerId]`;
- `PUT /api/saves/[playerId]`.

`SaveSnapshot.payload` armazena o estado completo. `Player`, `PlayerProfile` e `Hero` são tabelas auxiliares sincronizadas e não substituem o snapshot como fonte completa nesta etapa.

A feature pode ser escondida/desativada por ambiente. Falha de banco não pode impedir o jogo local.

## PostgreSQL local

Docker Compose:

- imagem: `postgres:16`;
- banco: `ascensao_dos_ecos`;
- porta host: `55432`;
- volume: `ecos_postgres_data`.

DSN:

```text
postgresql://postgres:postgres@localhost:55432/ascensao_dos_ecos?schema=public
```

Fluxo:

```bash
cp .env.example .env
npm run db:up
npm run db:migrate
npm run dev
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

## Validação

Sem banco:

```bash
npm run validate
```

Com banco:

```bash
npm run validate:db
```

Scripts relevantes:

- `test:core` — regressão do domínio;
- `test:fixtures` — contratos de dados/configuração;
- `test:db` — persistência PostgreSQL;
- `validate` — generate + typecheck + testes + build;
- `validate:db` — banco + migration + smoke DB.

## Regras para novas mudanças persistidas

1. adicionar default no estado inicial quando necessário;
2. normalizar saves antigos;
3. criar migration de `schemaVersion` quando o contrato persistido mudar;
4. cobrir regressão/importação;
5. não salvar dados derivados sem necessidade;
6. manter localStorage funcional sem banco;
7. não migrar todo o domínio para tabelas relacionais apenas por existir PostgreSQL.

## Deploy futuro

Antes de transformar cloud save em feature de produção ainda é necessário decidir:

- autenticação/playerId real;
- provedor PostgreSQL gerenciado;
- política local ↔ nuvem;
- conflitos e timestamps;
- backup/retenção;
- segurança e rate limiting das rotas.

Até essa decisão, PostgreSQL continua experimental.
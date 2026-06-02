# Ascensao dos Ecos

**Ascensao dos Ecos** e um jogo web single-player de estrategia, idle RPG, gacha e progressao por torre. A versao atual esta em fase Alpha de desenvolvimento local, com a experiencia principal migrada para Next.js, React e TypeScript.

O jogo deve abrir e funcionar localmente sem banco de dados. O PostgreSQL e opcional nesta etapa e serve para testar o fluxo experimental de save em nuvem por snapshot JSON.

## Status Atual

- Foco atual: desenvolvimento local.
- Deploy futuro planejado: Vercel.
- GitHub Pages nao e mais alvo da versao atual.
- Branch principal de trabalho da migracao: `migration/next-postgres`.
- Runtime legado em JavaScript puro nao e mais o caminho operacional desta branch.

## Stack

- **Next.js**: aplicacao web e rotas de API.
- **React**: interface principal do jogo.
- **TypeScript**: regras, contratos e estado do jogo.
- **Zustand**: store central usada pela UI.
- **Prisma**: acesso ao banco e migrations.
- **PostgreSQL**: opcional, usado para testar cloud save local.
- **Docker Compose**: ambiente local do PostgreSQL.

## Instalacao

Clone o repositorio e instale as dependencias:

```bash
npm install
```

## Rodar Local Sem Banco

Este e o fluxo principal por enquanto. O jogo usa `localStorage` do navegador para salvar o progresso.

Nao e obrigatorio criar `.env` para jogar localmente sem banco.

```bash
npm run dev
```

Abra o endereco informado pelo Next, normalmente:

```text
http://localhost:3000
```

Se a porta 3000 estiver ocupada, rode em outra porta:

```bash
npm run dev -- -p 3002
```

Sem `DATABASE_URL`, a tela principal continua funcionando. Apenas as acoes de cloud save pela API devem retornar erro de banco indisponivel.

## Rodar Local Com PostgreSQL

Use este fluxo quando quiser testar save em nuvem/local via API e PostgreSQL.

Copie o exemplo de ambiente para `.env`:

```bash
cp .env.example .env
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

Suba o banco:

```bash
npm run db:up
```

Aplique as migrations:

```bash
npm run db:migrate
```

Rode a aplicacao:

```bash
npm run dev
```

DSN local padrao:

```text
postgresql://postgres:postgres@localhost:5433/ascensao_dos_ecos?schema=public
```

O Docker Compose usa a porta local `5433` para evitar conflito com PostgreSQL ja instalado na maquina. O volume `ecos_postgres_data` preserva os dados locais.

## Variaveis de Ambiente

O `.env` so e obrigatorio quando voce quiser usar Prisma/PostgreSQL, Prisma Studio, `validate:db` ou cloud save pela API. Para jogar usando apenas `localStorage`, ele pode ficar ausente.

Para criar:

```bash
cp .env.example .env
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

Valores de exemplo:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ascensao_dos_ecos?schema=public"
NEXT_PUBLIC_APP_ENV="local"
NEXT_PUBLIC_ENABLE_CLOUD_SAVE="false"
```

Variaveis:

- `DATABASE_URL`: opcional para jogar localmente; necessaria para `db:migrate`, `db:studio`, `validate:db` e rotas de cloud save.
- `NEXT_PUBLIC_APP_ENV`: flag publica informativa para ambiente local/futuro deploy.
- `NEXT_PUBLIC_ENABLE_CLOUD_SAVE`: controla a interface de Cloud Save Experimental. Use `"false"` para desenvolvimento local sem banco e `"true"` apenas quando `DATABASE_URL` estiver configurada.

Nao commite `.env` real. O repositorio versiona apenas `.env.example`.

## Comandos Uteis

```bash
npm run dev
```

Inicia o Next em modo desenvolvimento.

```bash
npm run build
```

Gera o build de producao.

```bash
npm run typecheck
```

Executa `tsc --noEmit`.

```bash
npm test
```

Roda testes de regressao do core e fixtures.

```bash
npm run validate
```

Roda Prisma generate, typecheck, testes e build.

```bash
npm run db:up
```

Sobe o PostgreSQL local via Docker Compose e aguarda healthcheck.

```bash
npm run db:migrate
```

Aplica/verifica migrations Prisma no PostgreSQL local.

```bash
npm run db:studio
```

Abre o Prisma Studio para inspecionar dados locais.

Comandos adicionais:

```bash
npm run validate:db
npm run db:down
npm run db:logs
```

## Sistema de Save

### Save local

O save principal atual e o `localStorage`, pela chave configurada em `GAME_CONFIG.saveKey`.

Esse caminho e suficiente para:

- iniciar novo jogo;
- salvar progresso automaticamente no navegador;
- exportar/importar JSON;
- resetar o save local;
- jogar sem PostgreSQL.

### Save em nuvem/local experimental

O PostgreSQL e usado como camada opcional para testar cloud save local. O jogador aciona esse fluxo manualmente na tela de Config.

Por padrao, a interface de cloud save fica desativada com:

```bash
NEXT_PUBLIC_ENABLE_CLOUD_SAVE="false"
```

Para testar o recurso experimental, configure `DATABASE_URL`, altere `NEXT_PUBLIC_ENABLE_CLOUD_SAVE` para `"true"` e reinicie o servidor Next.

Rotas atuais:

- `GET /api/saves/[playerId]`
- `PUT /api/saves/[playerId]` com `{ payload: GameState }`

No banco, `SaveSnapshot.payload` e a fonte completa do save. `Player`, `PlayerProfile` e `Hero` sao tabelas auxiliares sincronizadas para preparar evolucoes futuras.

Sem `DATABASE_URL`, a aplicacao continua jogavel; apenas as rotas de cloud save ficam indisponiveis.

## Sistemas de Jogo

O core TypeScript em `src/game/` cobre:

- herois, classes, tracos, raridade, XP e poder;
- formacao e presets de equipe;
- equipamentos e atributos efetivos;
- consumiveis;
- moral, ferimentos e enfermaria;
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

## Estrutura Principal

- `app/`: app Next, rotas e componentes React.
- `app/components/`: paineis da UI do jogo.
- `app/api/saves/[playerId]/route.ts`: API opcional de cloud save.
- `src/game/`: regras puras e contratos do jogo.
- `src/store/gameStore.ts`: ponte entre UI, core e persistencia.
- `src/lib/`: utilitarios de Prisma, playerId e snapshots.
- `prisma/`: schema e migrations.
- `tests/`: regressao do core, fixtures e banco.
- `docs/`: especificacao funcional e notas da migracao.
- `agentsRules/`: convencoes internas para agentes.

## Deploy

### Agora

O alvo atual e rodar bem localmente. GitHub Pages foi descartado para esta fase porque a aplicacao agora usa Next.js, rotas de API e uma stack pensada para Vercel.

### Futuro

O deploy planejado e Vercel.

Antes do deploy, ainda e preciso decidir:

- provedor do PostgreSQL;
- estrategia real de autenticacao/playerId;
- politica de sync entre `localStorage` e cloud save;
- variaveis de ambiente de producao;
- rotinas de backup e migracao de saves.

## Roadmap Tecnico Imediato

1. Manter o fluxo local sem banco sempre funcionando.
2. Endurecer mensagens de erro de cloud save quando `DATABASE_URL` nao existir.
3. Validar manualmente os fluxos principais no React: novo jogo, torre, combate, resultado, save, export/import e reset.
4. Melhorar QA visual em desktop e mobile basico.
5. Documentar melhor a sincronizacao entre save local e snapshot PostgreSQL.
6. Preparar checklist de deploy para Vercel sem antecipar autenticacao real.

## Fluxo de Desenvolvimento

- Trabalhe na branch `migration/next-postgres`.
- Preserve `master` enquanto a migracao nao for promovida.
- Faca commits pequenos por responsabilidade.
- Chame mutacoes de UI por `src/store/gameStore.ts`.
- Mantenha regras de jogo em `src/game/`.
- Normalize saves antigos antes de usar.
- Mantenha textos em PT-BR.
- Rode validacoes antes de commitar quando houver mudanca de codigo.

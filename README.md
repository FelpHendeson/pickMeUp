# Ascensão dos Ecos

**Ascensão dos Ecos** é um RPG web single-player de estratégia, idle/gacha e progressão por torre. O projeto está em **Alpha 0.10.0** e, no estado atual, o foco não é mais provar o loop básico: é consolidar a experiência do **Lobby Vivo**, tornar a preparação dos heróis legível e transformar a interface em uma experiência de jogo mais focada.

> Documentação sincronizada em **24/08/2026** com o `master`, tomando como baseline funcional/UI o commit `fcc5f75`.

## Estado atual

O `master` é a fonte operacional do projeto. A antiga branch `migration/next-postgres` representa uma etapa histórica da migração e está atrás do `master`; não deve ser usada como base de novas features.

O jogo já possui:

- aplicação em Next.js/React/TypeScript;
- store global Zustand;
- save principal em `localStorage`;
- migrations formais do schema de save até `schemaVersion: 5`;
- cloud save experimental via Prisma/PostgreSQL;
- roster de heróis únicos, com compatibilidade para heróis legacy;
- invocação sem duplicatas e onboarding com 5 tickets + invocação especial;
- formação, presets, equipamentos, consumíveis e compatibilidade flexível de itens;
- Torre com 40 andares, 4 capítulos, marcos, chefes, dificuldades e readiness;
- combate automático, replay e resultado detalhado;
- Lobby Vivo derivado do estado do jogo;
- treino idle funcional, proficiências, análise de potencial e promoção 1★→2★;
- Rota da Primeira Ascensão para orientar a primeira sessão;
- expedições, moral, ferimentos, especializações, afinidade, relíquias, missões, conquistas e biblioteca;
- rework visual global em andamento, com a **Torre já migrada para o layout focado**;
- deploy de produção na Vercel com Prisma Postgres conectado.

## Ponto exato de retomada

A última entrega de produto foi a **Fase 2 do rework de UX/UI**, aplicada à Torre.

Foi criada a infraestrutura em `app/components/ui/game-layout.tsx`:

- `GamePage`;
- `GamePageHeader`;
- `CompactStatStrip`;
- `PrimaryActionPanel`;
- `FocusPanel`;
- `SecondaryInfoGrid`;
- `DetailDrawer`.

A Torre agora prioriza andar, preparo, risco, energia e uma única ação principal, movendo mapa completo e detalhes extensos para progressive disclosure.

**Próxima etapa recomendada:** aplicar a mesma arquitetura de foco ao módulo **Heróis**, sem alterar regras de gameplay. Depois, consolidar a Base/Lobby e avançar para os módulos restantes.

Veja `docs/estado-atual-e-roadmap.md`.

## Stack

- **Next.js 16.2.6** — aplicação, rotas e API.
- **React 19.2.6** — interface.
- **TypeScript 6.0.3** — regras e contratos.
- **Zustand 5.0.14** — store central.
- **Prisma 7.8.0 + PostgreSQL 16** — cloud save experimental.
- **Prisma Postgres** — banco gerenciado de produção.
- **Vercel** — hospedagem e deploy de produção.
- **localStorage** — persistência principal da Alpha.
- **Docker Compose** — PostgreSQL local opcional.

## Estrutura

```text
app/                         App Router e UI React
app/components/              Painéis por domínio
app/components/ui/           Design system e layout focado
src/game/                    Regras puras de gameplay
src/store/gameStore.ts       Ponte entre UI, domínio e persistência
src/lib/                     Player ID, Prisma e snapshots
prisma/                      Schema e migrations do PostgreSQL
scripts/                     Automação de build/deploy
tests/                       Regressão do core, fixtures e DB
docs/                        Documentação canônica e operacional
agentsRules/                 Regras reutilizáveis para agentes
AGENTS.md                    Instruções globais para agentes
vercel.json                  Configuração versionada do deploy Vercel
```

## Rodar localmente

```bash
npm install
npm run dev
```

O Next inicia por padrão em:

```text
http://localhost:3333
```

O PostgreSQL **não é obrigatório** para jogar. Sem `DATABASE_URL`, o save local continua funcionando; apenas o cloud save experimental fica indisponível.

## PostgreSQL opcional

Crie `.env` a partir de `.env.example` e rode:

```bash
npm run db:up
npm run db:migrate
npm run dev
```

DSN local padrão:

```text
postgresql://postgres:postgres@localhost:55432/ascensao_dos_ecos?schema=public
```

O snapshot JSON completo continua sendo a fonte do cloud save nesta etapa. `Player`, `PlayerProfile` e `Hero` são tabelas auxiliares.

## Scripts

```bash
npm run typecheck
npm test
npm run build
npm run build:vercel
npm run validate
npm run validate:db
npm run db:up
npm run db:down
npm run db:deploy
npm run db:studio
```

- `npm run validate`: Prisma generate + typecheck + testes + build.
- `npm run validate:db`: sobe o PostgreSQL, aplica migrations e roda smoke de banco.
- `npm run build:vercel`: gera o Prisma Client, aplica `prisma migrate deploy` quando `DATABASE_URL` existe e executa `next build`.
- `npm run db:deploy`: aplica migrations existentes em ambientes de deploy/produção.

## Save

- chave local: `ascensao-dos-ecos-save-v1`;
- `saveVersion`: 1;
- `schemaVersion` atual: 5;
- versões antigas são migradas em `src/game/save/migrations.ts`;
- importação passa por migration + normalização antes de substituir o estado;
- mudanças persistidas novas devem sempre possuir default, normalização e migration quando necessário.

## Documentação

Comece por `docs/README.md`.

Hierarquia prática:

1. código + testes — comportamento executável;
2. `GDD_Ascensao_dos_Ecos_Alpha_Atualizado.md` — design canônico;
3. `docs/especificacao-funcional.md` — contratos e fluxos funcionais;
4. `docs/estado-atual-e-roadmap.md` — situação atual e próximo passo;
5. `docs/visao-lobby-vivo.md` — direção de produto e sistemas ainda futuros;
6. `gdd_web_tower_gacha_mvp.md` — arquivo histórico, não canônico.

## Fluxo de desenvolvimento

- Use `master` como referência canônica e crie branches curtas quando a mudança justificar.
- Preserve regras de jogo em `src/game/`.
- Mutação persistente consumida pela UI passa por `src/store/gameStore.ts`.
- Reuse o design system e `game-layout.tsx` antes de criar novas abstrações.
- Não torne PostgreSQL obrigatório para jogar.
- Não quebre saves antigos.
- Mudanças em gameplay, economia, save ou UI estrutural devem sincronizar GDD + especificação + estado/roadmap.
- Rode as validações proporcionais à mudança antes de finalizar.

## Deploy

O projeto possui deploy de produção na **Vercel**, conectado ao **Prisma Postgres**.

A configuração versionada em `vercel.json` usa:

```bash
npm run build:vercel
```

Esse fluxo:

1. gera o Prisma Client;
2. aplica migrations com `prisma migrate deploy` quando `DATABASE_URL` está disponível;
3. executa o build do Next.js.

Variáveis esperadas em produção:

```text
DATABASE_URL
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_ENABLE_CLOUD_SAVE=true
```

O banco continua opcional fora de produção: sem `DATABASE_URL`, o build ignora migrations e o jogo permanece utilizável com `localStorage`.

Ainda faltam decisões de produto para considerar o cloud save definitivo: autenticação/playerId, política de sincronização entre dispositivos, conflitos e backup/retenção de snapshots.

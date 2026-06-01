# Migracao para Next.js + PostgreSQL

Esta branch preserva a `master` e inicia a migracao escalavel do jogo.

## Objetivo

Separar o jogo em tres camadas:

- UI React/Next;
- regras puras em TypeScript;
- persistencia em PostgreSQL.

## Estrategia

1. Manter `game/` funcionando como legado.
2. Criar a shell Next na raiz.
3. Extrair regras para modulos TypeScript sem dependencia de DOM.
4. Migrar telas uma por uma.
5. Trocar `localStorage` por sincronizacao server-side.
6. Manter export/import como backup.

## Banco

O schema inicial em `prisma/schema.prisma` cria:

- `Player`;
- `PlayerProfile`;
- `Hero`;
- `SaveSnapshot`.

Os sistemas complexos ainda podem ficar em `payload Json` durante a migracao. Depois, inventario, reliquias,
missoes, biblioteca e historico de combate podem ganhar tabelas proprias conforme estabilizarem.

## Comandos

```bash
npm install
npm run dev
npm run typecheck
npm run prisma:generate
```

Configure `DATABASE_URL` com base em `.env.example` antes de rodar Prisma.

## Progresso atual

- Shell Next criada.
- Prisma/PostgreSQL configurados.
- Snapshot legado publicado em `public/game/`.
- Core TypeScript inicial criado em `src/game/`.
- Estado inicial, recursos, presets, normalizacao de shape e validacao de save ja existem fora do legado.
- Dominio inicial de herois migrado para `src/game/heroes/`, incluindo definicoes de classes, tracos, geracao,
  normalizacao, XP e calculo de poder.
- Dominio inicial de equipamentos migrado para `src/game/equipment/`, incluindo definicoes, geracao, normalizacao
  de inventario e limpeza de equipamentos inexistentes nos herois.
- Dominio inicial de consumiveis migrado para `src/game/consumables/`, incluindo definicoes, inventario normalizado,
  ganho/gasto e uso fora de combate para preparacao da torre.
- Dominio inicial de dificuldade da torre migrado para `src/game/difficulty/`, incluindo modos, resumos,
  modificadores, estatisticas e normalizacao do save.
- Dominio inicial de capitulos da torre migrado para `src/game/tower/`, incluindo regioes, recompensas de
  conclusao, eventos por capitulo, modificadores regionais e capitulos concluidos derivados do andar salvo.
- Arquetipos de inimigos e escala basica de unidades migrados para `src/game/tower/enemies.ts`, preparando a
  futura migracao de andares e combate sem depender de DOM.
- Lista dos 40 andares, criacao de inimigos por andar e calculo/descricao de recompensas migrados para
  `src/game/tower/floors.ts`.
- Store Zustand inicial criada em `src/store/gameStore.ts`.
- A home Next ja tenta ler o save legado do `localStorage` e normaliza pelo core TypeScript.
- Primeiro painel React real da campanha da torre criado em `app/components/TowerCampaignPanel.tsx`, lendo o estado
  normalizado e os dados do core.
- Primeiro painel React de herois criado em `app/components/HeroRosterPanel.tsx`, lendo elenco, formacao,
  equipamentos, HP, XP, moral e poder pelo core TypeScript.
- Primeiro painel React de inventario criado em `app/components/InventoryPanel.tsx`, lendo equipamentos e
  consumiveis normalizados pelo core.
- Dashboard React com abas criado em `app/components/MigrationDashboard.tsx`, separando Base, Torre, Herois,
  Inventario e Roadmap.
- Dominio inicial de expedicoes migrado para `src/game/expeditions/`, incluindo definicoes, normalizacao,
  duracao, poder, recompensa, inicio e coleta.

## Legado no Next

A pasta `public/game/` e uma snapshot do jogo atual para manter o fluxo jogavel quando a branch for executada com
Next/Vercel. Durante a migracao, alteracoes de gameplay ainda devem acontecer primeiro em `game/` e depois serem
sincronizadas para `public/game/` enquanto a UI React nao substitui a tela correspondente.

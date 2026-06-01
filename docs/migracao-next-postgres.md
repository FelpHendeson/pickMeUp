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
- Aba React de expedicoes criada em `app/components/ExpeditionsPanel.tsx`, exibindo rotas, status, equipe,
  tempo restante e recompensa prevista a partir do core.
- Dominio inicial de missoes e conquistas migrado para `src/game/missions/`, incluindo definicoes, progresso,
  reset diario local, recompensas, normalizacao e contagem de itens coletaveis.
- Aba React de missoes criada em `app/components/MissionsPanel.tsx`, exibindo diarias e conquistas com progresso,
  estado de coleta e recompensas.
- Dominio inicial de reliquias migrado para `src/game/relics/`, incluindo definicoes, normalizacao, desbloqueio,
  custos, upgrade, textos de efeito e multiplicadores globais.
- Aba React de reliquias criada em `app/components/RelicsPanel.tsx`, exibindo fragmentos de eco, bloqueios,
  niveis, custos e efeitos atuais/proximos.
- Dominio inicial de recrutamento migrado para `src/game/recruitment/`, incluindo contratos, escolha entre 3,
  veteranos por capitulo, normalizacao e selecao do heroi recrutado.
- Aba React de recrutamento criada em `app/components/RecruitmentPanel.tsx`, exibindo contratos, escolha pendente
  e opcoes de heroi quando existirem no save.
- Dominio inicial de ferimentos e moral migrado para `src/game/hero-status/`, incluindo normalizacao por heroi,
  efeitos de atributos, tratamentos, estados de moral e chance de falha por moral baixa.
- Painel React de herois passou a usar os helpers do core para estados de moral e resumo de ferimentos.
- Dominio inicial de especializacoes migrado para `src/game/specializations/`, incluindo definicoes por classe,
  normalizacao, escolha permanente, modificadores de atributos e multiplicadores de combate.
- Painel React de herois passou a mostrar especializacao/passiva quando o heroi ja escolheu um caminho ou quando
  chegou ao nivel minimo para escolher.
- Dominio inicial de eventos semanais migrado para `src/game/weekly-events/`, incluindo calendario local, resumo,
  modificadores de torre/invocacao/XP/drop e helpers para recompensa/inimigos.
- Base React passou a exibir o evento semanal ativo, e a previsao de recompensa da Torre usa os modificadores
  semanais aplicaveis.
- Dominio inicial de afinidade migrado para `src/game/affinity/`, incluindo normalizacao por par de herois, ganho
  por grupo, resumos, bonus de inicio de batalha, XP e protecao leve.
- Painel React de herois passou a listar as principais afinidades de cada heroi a partir do save normalizado.
- Dominio inicial de biblioteca migrado para `src/game/library/`, incluindo normalizacao do save, registros de
  inimigos, chefes, eventos, herois encontrados e views progressivas de bestiario.
- Aba React de biblioteca criada em `app/components/LibraryPanel.tsx`, exibindo bestiario, chefes, eventos,
  reliquias e descobertas de herois a partir do core.
- Dominio inicial de invocacao migrado para `src/game/summon/`, incluindo tabelas de raridade, custos com reliquias
  e evento semanal, historico normalizado e chamada de heroi.
- Aba React de invocacao criada em `app/components/SummonPanel.tsx`, exibindo custos, chances ajustadas e historico
  recente do save.
- Dominio inicial de eventos da torre migrado para `src/game/tower-events/`, incluindo definicoes, chance de evento,
  criacao, validacao de escolha, resolucao de efeitos, historico e integracao com biblioteca, consumiveis,
  recrutamento e afinidade.
- Painel React de eventos da torre criado em `app/components/TowerEventsPanel.tsx`, exibindo evento pendente,
  efeitos ativos na proxima luta e historico recente a partir do save normalizado.
- Dominio inicial de combate migrado para `src/game/battle/`, incluindo configuracao, criacao de equipe,
  combate automatico, eventos, desempenho por heroi e normalizacao do ultimo combate salvo.
- Helpers de stats efetivos migrados para `src/game/equipment/heroEffectiveStats.ts`.
- Painel React de resultado criado em `app/components/BattleResultPanel.tsx`, exibindo ultimo combate,
  desempenho e eventos recentes a partir do save.
- Orquestracao da tentativa na torre migrada para `src/game/tower/towerBattle.ts`, incluindo validacao,
  eventos pre/pos combate, recompensas, ferimentos, moral, afinidade e persistencia de HP.
- Modulo de recompensas da torre migrado para `src/game/rewards/`.
- Helpers de formacao migrados para `src/game/formation/`.
- Painel React de combate criado em `app/components/TowerBattlePanel.tsx`, iniciando tentativas reais
  via core TypeScript e sincronizando com o save legado do navegador.
- Acoes de equipamento migradas para `src/game/equipment/equipmentActions.ts` e acoes de formacao
  para `src/game/formation/`.
- Paineis React de herois e inventario passaram a equipar, desequipar, montar formacao e usar consumiveis
  com persistencia no save legado.

## Legado no Next

A pasta `public/game/` e uma snapshot do jogo atual para manter o fluxo jogavel quando a branch for executada com
Next/Vercel. Durante a migracao, alteracoes de gameplay ainda devem acontecer primeiro em `game/` e depois serem
sincronizadas para `public/game/` enquanto a UI React nao substitui a tela correspondente.

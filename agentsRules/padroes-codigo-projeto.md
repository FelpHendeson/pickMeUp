# Padrões de Código e Projeto

## Stack

- Next.js/React/TypeScript/Zustand.
- localStorage como save principal.
- Prisma/PostgreSQL opcional.
- `master` como baseline canônico.

## Domínio

- regras de gameplay em `src/game/`;
- funções puras sempre que possível;
- objetos/configurações explícitos para balanceamento;
- não criar acoplamento de regra com React;
- reaproveitar sistemas já existentes antes de introduzir conceitos equivalentes.

## Store

- UI consome `useGameStore`;
- mutações persistentes passam por `src/store/gameStore.ts`;
- store orquestra, domínio decide regra;
- persistir após mutações válidas conforme padrão existente.

## Save

- `saveVersion: 1`, `schemaVersion: 5`;
- campo novo persistido exige default/normalização e, quando houver mudança de contrato, migration;
- não salvar valor facilmente derivável;
- não quebrar saves legacy;
- PostgreSQL nunca deve ser requisito para jogar localmente.

## UI

- reutilizar `app/components/ui/`;
- para páginas densas, preferir `game-layout.tsx`;
- uma ação principal por contexto;
- usar progressive disclosure para informação secundária;
- manter estados de loading/empty/error/disabled legíveis;
- botões não-submit devem usar `type="button"`;
- evitar HTML bruto não sanitizado;
- preservar acessibilidade básica (`aria-*`, foco e semântica quando aplicável).

## Layout focado

Componentes atuais:

- `GamePage`;
- `GamePageHeader`;
- `CompactStatStrip`;
- `PrimaryActionPanel`;
- `FocusPanel`;
- `SecondaryInfoGrid`;
- `DetailDrawer`.

A Torre é a implementação de referência. Não criar uma segunda família de componentes para resolver o mesmo problema em Heróis/Base.

## CSS

- reutilizar tokens e classes semânticas;
- evitar inline styles sem motivo;
- reduzir novas regras globais quando um componente pode encapsular a necessidade;
- mobile não pode depender de largura desktop;
- impedir overflow horizontal global.

## Conteúdo

- identificadores/arquivos preferencialmente ASCII;
- textos visíveis em PT-BR;
- tom dark fantasy, gestão e progressão;
- nomes/lore devem permanecer originais.

## Dependências

Não adicionar biblioteca para algo já resolvível pela stack atual sem justificativa técnica clara.
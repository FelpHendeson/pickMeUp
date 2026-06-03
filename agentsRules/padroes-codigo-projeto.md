# Padroes de Codigo e Projeto

## Stack

- Next.js, React, TypeScript e Zustand.
- Prisma/PostgreSQL opcional para cloud save experimental.
- `localStorage` permanece como save principal local.
- Deploy futuro planejado para Vercel.

## TypeScript e React

- Usar componentes funcionais e hooks de React.
- Consumir estado e ações por `useGameStore`.
- Manter regras de gameplay em `src/game/`.
- Usar funcoes pequenas, nomes descritivos e tipos explícitos quando ajudarem a leitura.
- Preferir objetos de configuracao para regras de gameplay.
- Normalizar dados vindos do save antes de usar.

## Estado e Save

- Campos novos devem existir em `createInitialState`.
- Campos novos devem ser saneados em `ensureStateShape`.
- Mutacoes persistentes devem passar pelo `gameStore`.
- Evitar salvar dados derivados que podem ser recalculados, salvo quando forem historico ou estado pendente.

## UI React

- Reutilizar componentes existentes antes de criar novos.
- Componentes chamam o `gameStore`; regras continuam em `src/game/`.
- Botoes devem ter `type="button"` quando nao forem submit.
- Conteudo dinamico renderizado pelo React nao deve usar HTML bruto sem sanitizacao.
- Manter textos claros para escolhas do jogador.
- UI deve continuar responsiva em desktop, tablet e mobile.

## CSS

- Usar classes semanticas e reaproveitar tokens de `:root`.
- Evitar estilos inline.
- Manter cards, paineis e botoes consistentes com o visual existente.
- Nao criar dependencias externas para efeitos simples.

## Conteudo e Encoding

- Preferir ASCII em nomes de arquivos e identificadores.
- Textos do jogo devem seguir o tom dark fantasy/tower progression.
- Manter consistencia com os textos atuais do projeto.

## Next/Vercel

- Manter compatibilidade com Next.js.
- Nao introduzir dependência obrigatória de banco para jogar localmente.
- Cloud save deve falhar de forma segura quando desativado ou sem banco.

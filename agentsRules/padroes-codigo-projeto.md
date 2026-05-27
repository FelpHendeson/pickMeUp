# Padroes de Codigo e Projeto

## Stack

- HTML, CSS e JavaScript puro.
- Sem frameworks no MVP atual.
- Sem build step obrigatorio.
- Compatibilidade com GitHub Pages.

## JavaScript

- Manter o padrao IIFE:

```js
(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  Echoes.minhaFuncao = minhaFuncao;
})(window);
```

- Expor apenas o necessario em `Echoes`.
- Evitar variaveis globais fora de `Echoes`.
- Usar funcoes pequenas e nomes descritivos.
- Preferir objetos de configuracao para regras de gameplay.
- Normalizar dados vindos do save antes de usar.

## Estado e Save

- Campos novos devem existir em `createInitialState`.
- Campos novos devem ser saneados em `ensureStateShape`.
- Mutacoes persistentes devem ser salvas via `saveGameState`.
- Evitar salvar dados derivados que podem ser recalculados, salvo quando forem historico ou estado pendente.

## UI

- Renderizacao atual e feita por strings HTML em `ui.js`.
- Sempre escapar texto dinamico com `escapeHtml`.
- Botoes devem usar `data-action`.
- Handlers de clique ficam em `main.js`.
- Manter textos claros para escolhas do jogador.
- UI deve continuar responsiva em mobile.

## CSS

- Usar classes semanticas e reaproveitar tokens de `:root`.
- Evitar estilos inline.
- Manter cards, paineis e botoes consistentes com o visual existente.
- Nao criar dependencias externas para efeitos simples.

## Conteudo e Encoding

- Preferir ASCII em nomes de arquivos e identificadores.
- Textos do jogo devem seguir o tom dark fantasy/tower progression.
- Manter consistencia com os textos atuais do projeto.

## GitHub Pages

- Usar caminhos relativos.
- Nao depender de servidor local para rodar o jogo.
- Nao colocar assets necessarios no `.gitignore`.

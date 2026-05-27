# Contexto do Projeto

## Produto

Ascensao dos Ecos e um jogo web single-player de estrategia, idle RPG, gacha e progressao por torre.

O jogador gerencia uma base, invoca herois, monta uma formacao, equipa personagens e avanca por andares com combates automaticos.

## Deploy

O projeto deve funcionar em GitHub Pages.

Regras importantes:
- a raiz do repositorio possui a tela inicial em `index.html`;
- o jogo fica em `game/index.html`;
- links entre paginas devem usar caminhos relativos;
- nao depender de backend para o MVP atual.

## Estrutura Atual

- `index.html`: menu inicial/landing do jogo.
- `styles/menu.css`: estilo do menu inicial.
- `src/menu.js`: comportamento simples do menu inicial.
- `game/index.html`: entrada do jogo.
- `game/styles/style.css`: estilos do jogo.
- `game/src/*.js`: logica do jogo em JavaScript simples.
- `gdd_web_tower_gacha_mvp.md`: documento de design do jogo.
- `ArtPickMeUp.png`: arte principal usada no menu inicial.

## Arquitetura do Jogo

O codigo do jogo usa HTML, CSS e JavaScript puro, sem framework.

Os modulos JavaScript usam IIFE e registram funcoes/constantes em `window.Echoes`.

Fluxos centrais:
- `state.js`: estado inicial, recursos e normalizacao de save.
- `storage.js`: load/save/reset via `localStorage`.
- `heroes.js`: criacao, progressao e atributos de herois.
- `formation.js`: equipe ativa.
- `equipment.js`: inventario e equipamentos.
- `tower.js`: andares, inimigos e inicio de batalhas.
- `tower-events.js`: eventos aleatorios da torre.
- `battle.js`: simulacao de combate automatico.
- `rewards.js`: recompensas de vitoria.
- `ui.js`: renderizacao das telas.
- `main.js`: eventos de interface e orquestracao.

## Persistencia

O save fica em `localStorage`, chave definida em `Echoes.CONFIG.saveKey`.

Toda mudanca persistente deve passar por `Echoes.saveGameState(state)` ou por fluxo ja existente que salve depois da mutacao.

# Ascensao dos Ecos

**Ascensao dos Ecos** e um jogo web single-player de estrategia, idle RPG, gacha e progressao por torre. O jogador atua como um comandante que invoca herois, monta uma formacao, equipa personagens e avanca por andares com combates automaticos.

O projeto foi pensado para rodar diretamente no navegador e ser publicado no GitHub Pages, sem backend e sem etapa de build obrigatoria.

## Jogar

- Menu inicial: `index.html`
- Jogo: `game/index.html`
- Caminho do botao principal: `./game/index.html`

Quando publicado no GitHub Pages, a raiz do repositorio abre a tela inicial e o botao **Jogar Agora** leva para o jogo.

## Conceito

A fantasia central e gerenciar uma equipe de herois em uma torre dimensional instavel. O jogador nao controla cada acao em tempo real; a estrategia esta em preparar a equipe antes do combate:

- escolher herois;
- ajustar a formacao;
- equipar personagens;
- administrar recursos;
- lidar com eventos, ferimentos e moral;
- subir andares cada vez mais perigosos.

O tom visual e mecanico segue uma linha dark fantasy, anime, tower progression e gacha tatico.

## Sistemas implementados

### Menu inicial

A raiz do projeto possui uma landing/menu com arte de fundo, apresentacao do jogo, painel "Sobre" e acesso direto ao jogo.

Arquivos principais:

- `index.html`
- `styles/menu.css`
- `src/menu.js`
- `ArtPickMeUp.png`

### Save local

O progresso e salvo no navegador usando `localStorage`.

A chave de save fica em `Echoes.CONFIG.saveKey`, definida em `game/src/state.js`.

### Base e recursos

O estado inicial inclui recursos como:

- ouro;
- cristais;
- essencia;
- fragmentos;
- energia.

A energia regenera com o tempo, e a torre consome energia para iniciar batalhas.

### Herois

Herois possuem:

- nivel e XP;
- raridade;
- classe;
- atributos principais;
- moral;
- ferimentos;
- especializacao;
- equipamentos.

Atributos principais:

- `HP`
- `ATK`
- `DEF`
- `SPD`
- `FOCUS`
- `LUCK`

Classes iniciais:

- Guerreiro
- Arqueiro
- Mago
- Sacerdote
- Ladino
- Guardiao

### Invocacao

O jogo possui invocacao de herois com custos em recursos, historico de invocacao e geracao de personagens por classe e raridade.

Arquivo principal:

- `game/src/summon.js`

### Formacao

A equipe ativa usa ate 5 herois, com linhas de frente e retaguarda. A posicao influencia a escolha de alvos durante o combate.

Arquivo principal:

- `game/src/formation.js`

### Equipamentos

O inventario comporta equipamentos que modificam atributos dos herois. Os atributos efetivos sao calculados considerando equipamento, especializacao, ferimentos e moral.

Arquivo principal:

- `game/src/equipment.js`

### Torre

A torre e o modo principal de progressao. Cada andar define inimigos, recomendacao de nivel, mecanicas e recompensas.

Arquivos principais:

- `game/src/tower.js`
- `game/src/rewards.js`

### Eventos aleatorios da torre

Eventos podem aparecer antes ou depois de combates, sem ocorrer em todo andar. Eles trazem decisoes com efeitos sobre equipe, recursos ou proxima batalha.

Tipos existentes:

- fonte de cura;
- bau misterioso;
- mercador perdido;
- altar sombrio;
- prisioneiro;
- armadilha.

Arquivo principal:

- `game/src/tower-events.js`

### Combate automatico

O combate e simulado em turnos rapidos. Unidades agem conforme seus atributos, escolhem alvos, causam dano, curam, aplicam efeitos e acumulam energia.

Arquivos principais:

- `game/src/battle.js`
- `game/src/battle-view.js`

### Ferimentos

Herois que chegam a 0 HP podem voltar feridos ao final da batalha. Ferimentos duram por combates e podem ser tratados na Enfermaria usando recursos.

Tipos:

- braco machucado;
- costela quebrada;
- trauma arcano;
- exaustao severa.

Arquivo principal:

- `game/src/injuries.js`

### Moral

Cada heroi possui moral de 0 a 100. Vitorias, derrotas, aliados caidos, tempo sem uso e eventos podem alterar esse valor.

Estados exibidos:

- Inspirado;
- Estavel;
- Abalado;
- Em colapso.

A moral influencia levemente o desempenho em combate.

Arquivo principal:

- `game/src/morale.js`

### Especializacoes de classe

Ao atingir nivel 10, cada heroi pode escolher uma especializacao permanente. A especializacao altera levemente atributos e adiciona uma passiva de combate.

Especializacoes atuais:

- Guerreiro: Berserker ou Cavaleiro
- Arqueiro: Atirador ou Cacador
- Mago: Elementalista ou Arcanista
- Sacerdote: Curandeiro ou Exorcista
- Ladino: Assassino ou Duelista
- Guardiao: Sentinela ou Colosso

Arquivo principal:

- `game/src/specializations.js`

### Expedicoes

Herois podem ser enviados para expedicoes automaticas em troca de recompensas.

Arquivo principal:

- `game/src/expeditions.js`

## Estrutura do projeto

```text
.
+-- index.html
+-- ArtPickMeUp.png
+-- gdd_web_tower_gacha_mvp.md
+-- src/
|   +-- menu.js
+-- styles/
|   +-- menu.css
+-- game/
|   +-- index.html
|   +-- styles/
|   |   +-- style.css
|   +-- src/
|       +-- state.js
|       +-- storage.js
|       +-- heroes.js
|       +-- formation.js
|       +-- equipment.js
|       +-- expeditions.js
|       +-- battle.js
|       +-- battle-view.js
|       +-- tower.js
|       +-- tower-events.js
|       +-- summon.js
|       +-- rewards.js
|       +-- injuries.js
|       +-- morale.js
|       +-- specializations.js
|       +-- view-utils.js
|       +-- ui.js
|       +-- main.js
+-- agentsRules/
    +-- contexto.md
    +-- pre-analise.md
    +-- padroes-codigo-projeto.md
    +-- padrao-commit.md
```

## Como rodar localmente

Como o projeto e estatico, basta abrir o `index.html` no navegador.

Opcionalmente, rode um servidor local simples na raiz:

```bash
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000/
```

## Arquitetura tecnica

O jogo usa HTML, CSS e JavaScript puro.

Nao ha framework, bundler ou backend no MVP atual. Os scripts usam IIFE e registram funcoes e constantes em `window.Echoes`.

Padrao usado nos modulos:

```js
(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  Echoes.minhaFuncao = minhaFuncao;
})(window);
```

Responsabilidades principais:

- `state.js`: estado inicial, recursos e normalizacao de save;
- `storage.js`: carregar, salvar e resetar progresso;
- `heroes.js`: criacao, atributos e progressao de herois;
- `formation.js`: equipe ativa;
- `equipment.js`: inventario e atributos efetivos;
- `tower.js`: andares, inimigos e inicio de batalhas;
- `tower-events.js`: eventos aleatorios;
- `battle.js`: simulacao de combate;
- `rewards.js`: recompensas;
- `ui.js`: renderizacao das telas;
- `main.js`: handlers de interface e orquestracao.

## Desenvolvimento

Regras praticas do projeto:

- manter compatibilidade com GitHub Pages;
- usar caminhos relativos;
- nao depender de backend no MVP;
- manter JavaScript em modulos IIFE;
- expor apenas o necessario em `window.Echoes`;
- escapar textos dinamicos na UI;
- salvar mudancas persistentes via fluxo de `saveGameState`;
- normalizar saves antigos ao adicionar campos novos;
- separar commits por feature ou responsabilidade.

Antes de finalizar alteracoes em JavaScript, rode:

```bash
node --check game/src/arquivo-alterado.js
```

## GDD e documentacao interna

O documento de design principal esta em:

- `gdd_web_tower_gacha_mvp.md`

As regras de contexto, pre-analise, padroes de codigo e padrao de commit ficam em:

- `agentsRules/`

## Status

MVP em desenvolvimento ativo.

O foco atual e consolidar o loop principal:

1. invocar herois;
2. montar formacao;
3. equipar personagens;
4. enfrentar andares da torre;
5. lidar com eventos, moral e ferimentos;
6. evoluir herois e desbloquear especializacoes.

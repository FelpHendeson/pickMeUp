# GDD Atualizado - Ascensao dos Ecos

**Documento:** GDD Alpha / Pos-MVP  
**Projeto analisado:** `pickMeUp.zip`  
**Versao tecnica identificada:** `gameVersion: 0.4.0`  
**Plataforma:** Web static / GitHub Pages  
**Entrada publica:** `/index.html`  
**Entrada do jogo:** `/game/index.html`

---

## 1. Resumo executivo

Ascensao dos Ecos deixou de ser apenas um MVP. O projeto atual ja e uma Alpha jogavel de RPG web single-player com progressao por torre, gacha, gestao de herois, equipamentos, expedicoes, eventos, narrativa curta, moral, ferimentos, especializacoes, missoes, conquistas, configuracoes e backup de save.

O foco de design deve mudar de "provar o loop" para "consolidar clareza, balanceamento, progressao permanente e retencao". O jogo ja tem camadas suficientes; agora o risco nao e faltar sistema, e sim o jogador nao entender por que venceu, perdeu ou ficou mais forte.

---

## 2. Identidade do jogo

**Nome:** Ascensao dos Ecos.  
**Genero:** RPG estrategico idle/gacha com progressao por torre.  
**Tom:** dark fantasy, anime, sobrevivencia, gestao, progressao dificil e esperanca contra uma torre hostil.

O jogador assume o papel de comandante. Ele invoca herois, monta formacoes, envia expedicoes, equipa personagens e enfrenta uma torre dimensional viva. O combate e automatico; a estrategia principal acontece antes da batalha.

O projeto se inspira em temas amplos de manhwa/anime de torre, invocacao e sobrevivencia, mas deve permanecer original: sem copiar nomes, personagens, lore, artes ou elementos protegidos de obras existentes.

---

## 3. Status atual do produto

O estado atual deve ser tratado como **Alpha jogavel**, nao mais como MVP.

### Sistemas implementados

- Home/menu inicial na raiz do repositorio.
- Botao de entrada para `./game/index.html`.
- Jogo em HTML/CSS/JavaScript puro.
- Persistencia em `localStorage`.
- Exportacao, importacao e reset de save.
- Configuracoes de preferencias.
- Recursos: ouro, cristais, essencia, fragmentos e energia.
- Regeneracao de energia.
- Invocacao comum e superior.
- Geracao procedural de herois.
- Formacao de ate 5 herois.
- Presets de equipe para torre e expedicoes.
- Equipamentos com raridade e bonus.
- Expedicoes temporizadas.
- Torre com 40 andares.
- 4 capitulos de torre.
- Modificadores regionais e de andar.
- Combate automatico com energia, habilidades e replay/log.
- Eventos aleatorios de torre.
- Eventos semanais locais.
- Moral dos herois.
- Ferimentos e enfermaria.
- Especializacoes de classe.
- Missoes diarias.
- Conquistas permanentes.
- Narrativa curta por gatilho.
- UI polida com abas.

---

## 4. Pilares de design revisados

### 4.1 Preparacao acima de reflexo
O jogador nao controla cada ataque. Ele vence ao preparar melhor a equipe, entender riscos, usar formacao, recursos, equipamentos e eventos.

### 4.2 Herois como investimento emocional
Moral, ferimentos, especializacoes e equipamentos ja criam apego. O proximo salto deve ser memoria: afinidade, historico, titulos e registros de feitos.

### 4.3 Torre como campanha viva
A torre ja possui capitulos, chefes, eventos e narrativa. Ela deve evoluir como campanha, nao como lista infinita de numeros.

### 4.4 Progressao horizontal e vertical
O jogo ja possui progressao vertical: nivel, andar, poder, equipamentos. Agora precisa fortalecer progressao horizontal: biblioteca, bestiario, relíquias, afinidades e escolhas permanentes.

### 4.5 Web first
Manter o jogo estatico e leve e uma vantagem. Backend so deve entrar quando houver necessidade real: cloud save, ranking, contas, multiplayer assíncrono ou telemetria.

---

## 5. Arquitetura tecnica atual

O jogo usa JavaScript puro com modulos IIFE expostos em `window.Echoes`.

```js
(function (global) {
  "use strict";
  const Echoes = (global.Echoes = global.Echoes || {});
  Echoes.minhaFuncao = minhaFuncao;
})(window);
```

### Estrutura principal

```text
/index.html                 Home/menu inicial
/ArtPickMeUp.png            Arte da home
/src/menu.js                Script da home
/styles/menu.css            Estilo da home
/game/index.html            Entrada do jogo
/game/src/*.js              Sistemas do jogo
/game/styles/style.css      Estilo do jogo
/docs/especificacao-funcional.md
/agentsRules/*.md
/gdd_web_tower_gacha_mvp.md GDD antigo, agora desatualizado
```

### Modulos principais

| Arquivo | Responsabilidade |
|---|---|
| `state.js` | Estado inicial, recursos, energia, presets e normalizacao |
| `storage.js` | Carregar, salvar, exportar, importar e resetar save |
| `preferences.js` | Preferencias visuais, combate e audio |
| `heroes.js` | Classes, raridades, XP, atributos e geracao de herois |
| `formation.js` | Formacao, presets e poder de equipe |
| `equipment.js` | Inventario, equipamentos e atributos efetivos |
| `expeditions.js` | Expedicoes temporizadas e recompensas |
| `battle.js` | Simulacao de combate automatico |
| `battle-view.js` | Replay visual e velocidade de combate |
| `tower.js` | Andares, capitulos, inimigos e modificadores |
| `tower-events.js` | Eventos aleatorios e escolhas de torre |
| `weekly-events.js` | Eventos semanais locais |
| `summon.js` | Invocacao comum/superior |
| `rewards.js` | Recompensas da torre |
| `injuries.js` | Ferimentos e tratamento |
| `morale.js` | Moral e efeitos de desempenho |
| `specializations.js` | Especializacoes e passivas |
| `missions.js` | Missoes diarias e conquistas |
| `narrative.js` | Cenas narrativas curtas |
| `ui.js` | Renderizacao geral da interface |
| `main.js` | Orquestracao de handlers, fluxo e render |

---

## 6. Loop principal atual

### Sessao curta

1. Abrir a home.
2. Entrar no jogo.
3. Ver recursos e evento semanal.
4. Invocar ou gerenciar herois.
5. Montar formacao ou aplicar preset.
6. Equipar personagens.
7. Entrar na torre.
8. Resolver evento aleatorio, se houver.
9. Assistir combate automatico.
10. Receber recompensas e XP.
11. Lidar com ferimentos e moral.
12. Avancar andar/capitulo.
13. Coletar missoes ou conquistas.
14. Save automatico.

### Medio prazo

- Evoluir herois ate nivel 10.
- Escolher especializacoes.
- Completar capitulos.
- Derrotar chefes.
- Acumular equipamentos.
- Enviar expedicoes.
- Aproveitar eventos semanais.

### Longo prazo desejado

- Relíquias permanentes de conta.
- Afinidade entre herois.
- Bestiario e biblioteca.
- Recrutamento alternativo.
- Consumiveis.
- Modos de dificuldade.
- Capítulos 5 e 6.

---

## 7. Economia e recursos

| Recurso | Uso atual | Direcao futura |
|---|---|---|
| Ouro | Invocacao comum, compras, tratamento e custos gerais | Controlar inflacao e criar bons sumidouros |
| Cristais | Invocacao superior e recompensas especiais | Manter raro, mas com rotas previsiveis |
| Essencia | Tratamento/progressao e recompensas | Usar em evolucao e relíquias |
| Fragmentos | Equipamentos e recompensas | Usar em craft/desmonte/melhoria |
| Energia | Controla ritmo da torre | Limitar farm, nao bloquear diversao |

A economia deve favorecer sessoes curtas e decisoes frequentes. Energia nao deve impedir o jogador de testar uma composicao recem montada.

---

## 8. Herois

### Atributos

- HP.
- ATK.
- DEF.
- SPD.
- FOCUS.
- LUCK.

### Classes

- Guerreiro.
- Arqueiro.
- Mago.
- Sacerdote.
- Ladino.
- Guardiao.

### Sistemas ligados aos herois

- Nivel e XP.
- Raridade.
- Classe.
- Traço/passiva.
- Moral.
- Ferimentos.
- Especializacao.
- Equipamentos.
- Posicao na formacao.
- Expedicao ativa.

### Diretriz futura
Criar memoria individual: historico de batalhas, chefes vencidos, titulos, relacoes e afinidade.

---

## 9. Invocacao

### Tipos atuais

- Invocacao comum: custa ouro.
- Invocacao superior: custa cristais.

### Taxas atuais

| Invocacao | 1 estrela | 2 estrelas | 3 estrelas | 4 estrelas | 5 estrelas |
|---|---:|---:|---:|---:|---:|
| Comum | 60% | 28% | 10% | 2% | 0% |
| Superior | 0% | 50% | 35% | 12% | 3% |

### Lacunas

- Falta sistema de garantia/pity.
- Falta recrutamento por contrato.
- Falta escolha entre candidatos.
- Falta heroi tematico por capítulo.

---

## 10. Formacao e presets

A formacao atual usa ate 5 herois: 2 na frente e 3 atras. A frente tem maior chance de ser alvo e inicia com energia extra no combate.

O sistema de presets ja existe e deve ser preservado. A evolucao recomendada e melhorar informacao estrategica:

- comparar poder do time com andar;
- avisar herois feridos, abalados ou em expedicao;
- indicar sinergias futuras;
- mostrar risco do andar.

---

## 11. Combate automatico

O combate e automatico por turnos. Unidades vivas agem por SPD, escolhem alvos, causam dano, curam, aplicam status e acumulam energia.

### Configuracoes identificadas

- Maximo de rodadas: 45.
- Chance de mirar linha de frente: 72%.
- Chance de mirar alvo provocando: 86%.
- Energia maxima: 125.
- Custo de habilidade: 100.
- Energia inicial da frente: 15.

### Classes e habilidades

- Guerreiro: Golpe Pesado.
- Arqueiro: Flecha Precisa.
- Mago: dano em area.
- Sacerdote: cura.
- Ladino: Ataque Sombrio.
- Guardiao: provocacao/defesa.

### Proxima necessidade critica
Criar uma tela de resultado de combate. Com tantos modificadores, o jogador precisa entender rapidamente o que aconteceu.

---

## 12. Equipamentos

### Tipos

- Arma.
- Armadura.
- Acessorio.

### Bonus possiveis

- HP.
- ATK.
- DEF.
- SPD.
- LUCK.

### Lacunas futuras

- Comparar item equipado vs item selecionado.
- Favoritar/travar equipamento.
- Desmontar equipamento.
- Melhorar equipamento.
- Sets por capítulo.

---

## 13. Torre e capitulos

A torre atual possui 40 andares divididos em 4 capitulos.

| Capitulo | Nome | Andares | Tema | Chefe |
|---|---|---:|---|---|
| 1 | Ruinas do Despertar | 1-10 | Runas antigas e corredores quebrados | Golem Antigo |
| 2 | Floresta Bestial | 11-20 | Vegetacao escura, feras e emboscadas | Oraculo Estilhacado |
| 3 | Cripta Espectral | 21-30 | Criptas, espectros e marcas sombrias | Avatar do Eclipse |
| 4 | Abismo Infernal | 31-40 | Fogo negro, correntes e abismos vivos | Serpente Abissal |

### Modificadores regionais

- Capitulo 1: DEF inimiga aumentada.
- Capitulo 2: SPD inimiga aumentada.
- Capitulo 3: equipe recebe mais dano.
- Capitulo 4: ATK inimigo aumentado e cura da equipe reduzida.

### Diretriz futura
Expandir para 60 andares apenas depois de consolidar resultado de combate, balanceamento e progressao permanente.

---

## 14. Eventos da torre

Chance base atual: 30% por andar.

Eventos atuais:

- Fonte de cura.
- Bau misterioso.
- Mercador perdido.
- Altar sombrio.
- Prisioneiro.
- Armadilha.

Os eventos funcionam como microdecisoes de risco/recompensa. A proxima evolucao deve ser criar eventos raros encadeados e eventos especificos de capítulo.

---

## 15. Eventos semanais locais

Eventos ativos sao calculados pela semana do ano no navegador.

Eventos atuais:

- Semana da Torre Instavel.
- Festival de Invocacao.
- Cacada aos Fragmentos.
- Treinamento Intensivo.

Esse sistema faz o jogo parecer vivo sem backend. Para um single-player web, manipulacao de calendario local e aceitavel durante a Alpha.

---

## 16. Moral e ferimentos

### Moral

Cada heroi possui moral de 0 a 100.

Estados:

- Inspirado.
- Estavel.
- Abalado.
- Em colapso.

A moral altera levemente desempenho e pode causar falhas quando esta baixa.

### Ferimentos

Herois que chegam a 0 HP podem sofrer ferimentos:

- Braco machucado: reduz ATK.
- Costela quebrada: reduz HP.
- Trauma arcano: reduz FOCUS.
- Exaustao severa: reduz SPD.

A Enfermaria permite tratamento. Futuramente, ferimentos podem gerar titulos, cicatrizes ou eventos narrativos.

---

## 17. Especializacoes

Especializacao e liberada no nivel 10.

| Classe | Especializacao 1 | Especializacao 2 |
|---|---|---|
| Guerreiro | Berserker | Cavaleiro |
| Arqueiro | Atirador | Cacador |
| Mago | Elementalista | Arcanista |
| Sacerdote | Curandeiro | Exorcista |
| Ladino | Assassino | Duelista |
| Guardiao | Sentinela | Colosso |

A proxima evolucao ideal e um segundo marco simples no nivel 20, sem criar arvores gigantes ainda.

---

## 18. Expedicoes

Expedicoes atuais:

| Expedicao | Duracao | Recompensa | Poder recomendado |
|---|---:|---|---:|
| Campo de Treino | 2 min | XP | 180 |
| Mina Antiga | 3 min | Ouro | 220 |
| Ruinas Cristalinas | 5 min | Cristais | 260 |

Regras:

- Ate 3 herois por expedicao.
- Herois ocupados nao devem ser reutilizados.
- Recompensa escala com poder enviado.
- Timestamps mantem progresso apos fechar o navegador.

Futuro: expedicoes raras, eventos de retorno e contratos de heroi.

---

## 19. Missoes e conquistas

### Missoes diarias atuais

- Vencer 3 combates na torre.
- Fazer 1 invocacao.
- Enviar 1 expedicao.
- Equipar 1 item.
- Coletar 1 expedicao.

### Conquistas atuais

- Chegar ao andar 10.
- Chegar ao andar 20.
- Invocar 10 herois.
- Ter um heroi 4 estrelas ou superior.
- Vencer chefe sem baixas.
- Equipar 5 itens.
- Completar 10 expedicoes.

Futuro: conquistas por capítulo, classe, evento raro e chefe.

---

## 20. Narrativa

Cenas curtas aparecem apenas uma vez e ficam registradas como vistas.

Gatilhos atuais:

- Introducao.
- Inicio de capítulo.
- Antes do chefe.
- Depois do chefe.
- Primeiro ferimento severo.
- Primeira moral critica.

A narrativa deve permanecer curta. O jogo nao deve virar visual novel; 2 a 4 frases por momento importante bastam.

---

## 21. UI e experiencia

### Abas atuais

- Base.
- Herois.
- Formacao.
- Inventario.
- Expedicoes.
- Missoes.
- Invocacao.
- Torre.
- Combate.
- Config.

### Proximas melhorias de UX

- Tela de resultado de combate.
- Comparador de equipamentos.
- Filtros de herois.
- Tooltips de atributos.
- Painel de modificadores ativos.
- Guia Como Jogar.
- Melhor responsividade mobile.

---

## 22. Save e configuracoes

### Save atual

- `localStorage`.
- Chave: `ascensao-dos-ecos-save-v1`.
- `saveVersion: 1`.
- Normalizacao ao carregar.
- Exportar save JSON.
- Importar save com validacao.
- Resetar save.

### Preferencias atuais

- Velocidade padrao de combate.
- Reduzir animacoes.
- Modo compacto.
- Mostrar numeros detalhados.
- Volumes de audio preparados.

### Necessidade futura
Criar migracoes formais de save por versao. O projeto vai crescer; sem migracao, qualquer mudanca pode quebrar progresso antigo.

---

## 23. Riscos atuais

| Risco | Impacto | Mitigacao |
|---|---|---|
| Complexidade invisivel | Jogador nao entende derrota/vitoria | Resultado de combate e painel de modificadores |
| Escopo crescendo rapido | Codigo vira bagunca | Ciclos de refatoracao a cada 2 features |
| Save quebrar | Perda de progresso | Migracoes por saveVersion |
| Economia inflacionar | Recursos perdem valor | Balance pass e sumidouros claros |
| Gacha frustrar | Jogador sente falta de controle | Pity, contratos e recrutamento alternativo |
| Torre repetitiva apos 40 | Queda de retencao | Capítulos com mecanicas novas |

---

## 24. Roadmap recomendado

### Alpha 0.5 - Clareza e consolidacao

1. Tela de resultado de combate.
2. Painel de modificadores ativos.
3. Comparador de equipamentos.
4. Filtros/ordenacao de herois.
5. Migracoes formais de save.
6. Balanceamento dos andares 1-40.

### Alpha 0.6 - Progressao permanente

1. Relíquias permanentes de conta.
2. Recurso novo: Fragmentos de Eco.
3. Recompensas especiais de chefes.
4. Melhorias de relíquias.

### Alpha 0.7 - Herois com memoria

1. Afinidade entre herois.
2. Historico individual.
3. Titulos simples.
4. Registro de chefes vencidos por heroi.

### Alpha 0.8 - Colecao e descoberta

1. Bestiario.
2. Biblioteca de eventos.
3. Registro de chefes derrotados.
4. Enciclopedia de relíquias e especializacoes.

### Alpha 0.9 - Risco e modos

1. Modo Normal.
2. Modo Desafio.
3. Modo Hardcore opcional.
4. Recompensas escaladas por risco.
5. Confirmacao extra para risco de morte permanente.

### Beta 0.1 - Preparacao publica

1. QA completo.
2. Guia Como Jogar.
3. Creditos.
4. Checklist mobile.
5. Balanceamento inicial fechado.
6. Build final para GitHub Pages.

---

## 25. Proxima prioridade recomendada

A proxima feature deve ser **Tela de Resultado de Combate**.

Motivo: o jogo ja possui muitos sistemas que afetam batalha. O jogador precisa ver, apos cada combate:

- vitoria ou derrota;
- andar e capítulo;
- inimigos enfrentados;
- recompensas;
- XP ganho;
- level ups;
- equipamentos dropados;
- mudancas de moral;
- ferimentos;
- missoes/conquistas atualizadas;
- modificadores ativos;
- desempenho por heroi, se possivel.

Sem isso, a complexidade do jogo vira magia negra de planilha. Funciona, mas ninguem sabe se foi buff, azar ou a torre cobrando aluguel.

---

## 26. Prompt recomendado para o agente

```md
O projeto atual deixou de ser MVP e agora deve ser tratado como Alpha jogavel.

Leia o GDD atualizado e o codigo atual antes de alterar arquivos.

Proxima prioridade: implementar uma Tela de Resultado de Combate.

Objetivo:
Dar clareza ao jogador sobre o que aconteceu na batalha, quais recompensas recebeu, quais herois se destacaram, quais modificadores estavam ativos e quais consequencias ocorreram.

Requisitos:
1. Criar tela/modal/painel de resultado apos cada combate da torre.
2. Mostrar resultado: vitoria ou derrota.
3. Mostrar andar e capítulo.
4. Mostrar inimigos enfrentados.
5. Mostrar recompensas recebidas.
6. Mostrar XP ganho e level ups.
7. Mostrar equipamentos dropados.
8. Mostrar ferimentos aplicados.
9. Mostrar mudancas de moral.
10. Mostrar missoes/conquistas atualizadas.
11. Mostrar modificadores ativos da batalha.
12. Se possivel, mostrar desempenho por heroi:
    - dano causado;
    - cura realizada;
    - dano recebido;
    - inimigos abatidos.
13. Se esses dados ainda nao existirem agregados, adapte `battle.js` para retornar estatisticas resumidas sem quebrar o replay atual.
14. Nao remover o log de combate existente.
15. Nao quebrar saves atuais.
16. Manter compatibilidade com GitHub Pages.
17. Usar JS puro e o padrao atual `window.Echoes`.

Criterio de aceitacao:
Apos vencer ou perder uma batalha, eu preciso entender rapidamente por que o resultado aconteceu e o que mudou no meu progresso.
```

---

## 27. Conclusao

Ascensao dos Ecos ja tem base suficiente para ser tratado como projeto indie web em Alpha. O foco agora deve ser clareza, progressao permanente, apego aos herois, descoberta e robustez tecnica.

A maior prioridade de design e tornar visivel a complexidade que ja existe. A maior prioridade tecnica e proteger o save e manter a arquitetura modular simples.

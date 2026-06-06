# GDD Atualizado - Ascensao dos Ecos

**Documento:** GDD Alpha / Pos-MVP  
**Projeto analisado:** `pickMeUp.zip`  
**Versao tecnica identificada:** `package.json 0.10.0-migration`  
**Plataforma:** Next.js / React / TypeScript  
**Entrada publica:** `app/page.tsx`  
**Entrada do jogo:** `app/components/layout/GameShell.tsx`

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

- Interface principal em Next.js, React e TypeScript.
- Componentes organizados por dominio em `app/components/`.
- Store global em Zustand via `src/store/gameStore.ts`.
- Persistencia em `localStorage`.
- Cloud save experimental com Prisma/PostgreSQL opcional.
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

Na UI atual, a Torre deve priorizar uma leitura mestre-detalhe com um estado dominante por vez: evento pendente, resultado recente, bloqueio de combate ou preparacao. O jogador escolhe o andar liberado no mapa, mas o painel de desafio deve destacar apenas a decisao principal daquele momento para evitar excesso de informacao persistente na tela.

A infraestrutura de feedback visual usa toast in-app global, modal reutilizavel de UI, eventos pendentes da Torre resolvidos em modal e resultado de combate em modal grande com abas. Ao finalizar combate, o resultado deve abrir automaticamente; ao fechar, a Torre mantém um card compacto de ultimo resultado com CTA para rever o modal ou continuar a subida. Acoes rapidas devem comunicar sucesso/bloqueio sem notificacao real do navegador, eventos importantes nao devem ficar escondidos como texto solto na tela e resultados de ciclo devem separar resumo, recompensas, herois, consequencias e log.

### 4.4 Progressao horizontal e vertical
O jogo ja possui progressao vertical: nivel, andar, poder, equipamentos. Agora precisa fortalecer progressao horizontal: biblioteca, bestiario, relíquias, afinidades e escolhas permanentes.

### 4.5 Web first
Manter o jogo leve e jogavel sem banco e uma vantagem. Backend so deve ser obrigatorio quando houver necessidade real: cloud save, ranking, contas, multiplayer assíncrono ou telemetria.

---

## 5. Arquitetura tecnica atual

O jogo usa Next.js, React, TypeScript e Zustand. O runtime antigo em JavaScript puro nao e o caminho operacional desta versao.

### Estrutura principal

```text
/app                         Aplicacao Next, rotas e componentes React
/app/components              Paineis da UI por dominio
/src/game                    Regras puras, tipos e normalizacao do estado
/src/store/gameStore.ts      Store Zustand consumida pela UI
/src/lib                     Prisma, playerId e snapshots
/prisma                      Schema e migrations do PostgreSQL opcional
/tests                       Testes de regressao do core, fixtures e banco
/docs/especificacao-funcional.md
/agentsRules/*.md
/README.md                   Fonte operacional da stack atual
```

### Modulos principais

| Arquivo | Responsabilidade |
|---|---|
| Modulo | Responsabilidade |
|---|---|
| `src/game/state` | Estado inicial, recursos, energia, presets e normalizacao |
| `src/game/save` | Validacao, exportacao, importacao e normalizacao de save |
| `src/game/heroes` | Classes, raridades, XP, atributos e geracao de herois |
| `src/game/tower` | Andares, capitulos, inimigos e modificadores |
| `src/game/battle` | Simulacao de combate automatico |
| `src/game/*` | Sistemas auxiliares: eventos, relíquias, missoes, biblioteca, recrutamento e expedicoes |
| `src/store/gameStore.ts` | Mutacoes persistentes e ponte entre UI e core |
| `app/components/*` | Renderizacao da interface React por dominio |

---

## 6. Loop principal atual

### Sessao curta

1. Abrir a home.
2. Entrar no jogo.
3. Ler a Base como sala de comando: proxima acao, alertas, recursos, energia, capitulo, equipe e atalhos.
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
- Recrutamento por contrato ja existe como alternativa controlada a invocacao.
- Veteranias tematicas por capitulo podem ser expandidas com novos candidatos e origens.

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

### Necessidade critica atual
Manter o resultado de combate claro e acionavel. Com tantos modificadores, o jogador precisa entender rapidamente o que aconteceu, o que recebeu e o que mudou antes de continuar a subida.

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

## 19. Biblioteca

A Biblioteca funciona como grimorio e arquivo arcano da jornada. Ela registra descobertas sem alterar regras de progressao.

Registros atuais:

- Inimigos comuns, com encontros, vitorias e detalhes revelados por repeticao.
- Chefes de capitulo, tentativas, melhor resultado e recompensas especiais quando houver.
- Capitulos da Torre, com regiao, chefe, modificador, inimigos predominantes e eventos associados.
- Eventos da Torre, com encontros e resultados de escolhas ja vistas.
- Reliquias, com nivel, desbloqueio e efeito atual.
- Memoria da guilda, com classes, raridades e tracos descobertos por herois recrutados.

Estados bloqueados devem parecer misteriosos e oferecer pistas curtas sem revelar conteudo completo.

---

## 20. Missoes e conquistas

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

## 21. Narrativa

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

## 22. UI e experiencia

### Abas atuais

- Base.
- Herois.
- Formacao.
- Inventario.
- Expedicoes.
- Missoes.
- Reliquias.
- Invocacao.
- Recrutamento.
- Biblioteca.
- Torre.
- Combate.
- Config.

### Base / Hub principal

A Base deve responder rapidamente "o que eu faco agora?". Ela resume o estado da conta, destaca a proxima acao recomendada e aponta alertas acionaveis:

- coletar expedicoes;
- tratar herois feridos ou com moral baixa;
- coletar missoes;
- revisar inventario e equipamentos;
- melhorar reliquias;
- invocar/recrutar quando houver recursos ou contratos;
- voltar para a Torre quando a equipe estiver pronta.

### Recrutamento / contratos de guilda

Recrutamento deve se diferenciar da invocacao. A tela representa um quadro de contratos da guilda: o jogador usa contrato para revelar candidatos, compara classe, raridade, poder, atributos principais, custo ja pago e traco/passiva, escolhe apenas um aventureiro e recebe confirmacao com atalhos para Heróis ou Formacao. Sem contrato, o estado deve comunicar custo insuficiente sem parecer erro.

### HUD de recursos

O HUD de recursos deve funcionar como uma vigilia compacta da conta. Ele exibe ouro, cristais, essencia, fragmentos e energia em leitura rapida, com cores/selos consistentes por recurso, estado de energia cheia ou baixa e destaque discreto quando valores mudam. Recursos secundarios e status operacionais ficam recolhidos para reduzir poluicao visual, especialmente no mobile.

### GameShell e navegacao

O `GameShell` organiza a experiencia em cabecalho de contexto, HUD global, navegacao por grupos e area de conteudo. As tabs devem manter a lista logica atual, mas precisam parecer parte da interface da guilda: grupos visuais, estado ativo forte, icones simples sem dependencia externa, scroll horizontal confortavel no mobile e espaco suficiente para o conteudo principal nao ficar esmagado.

### Sobre / informacoes do projeto

A tela Sobre deve funcionar como um arquivo curto da Torre, nao como README colado na UI. Ela apresenta nome, versao real de `GAME_CONFIG.gameVersion`, objetivo do jogador, sistemas atuais, stack operacional, status de save/cloud save e notas de alpha em blocos curtos com visual de grimorio/pergaminho responsivo.

### Responsividade mobile global

Mobile deve ser tratado como fluxo jogavel, nao apenas como encolhimento do desktop. A UI deve impedir overflow horizontal da pagina, empilhar grids complexos, preservar tabs/HUD com rolagem interna controlada, manter botoes com area minima de toque e garantir que modais usem altura da viewport com rolagem interna e acoes visiveis.

### Polimento visual Dark Fantasy

A camada visual global deve manter a identidade coesa de RPG Dark Fantasy: fundos escuros, dourado para recompensa/destaque, vermelho escuro para perigo, roxo/ciano para energia arcana, textos secundarios neutros, cards com bordas metalicas discretas, modais com moldura de grimorio e raridades com brilho moderado. O acabamento nao deve prejudicar legibilidade, responsividade ou clareza dos estados.

### Proximas melhorias de UX

- Painel de modificadores ativos.
- Historico de resultados de combate.
- Comparador de equipamentos.
- Filtros de herois.
- Tooltips de atributos.
- Guia Como Jogar.
- Melhor responsividade mobile.

---

## 23. Save e configuracoes

### Save atual

- `localStorage`.
- Chave: `ascensao-dos-ecos-save-v1`.
- `saveVersion: 1`.
- Normalizacao ao carregar.
- Exportar save JSON.
- Importar save com validacao.
- Resetar save.

### Tela de configuracoes

A tela de Config deve parecer um menu de sistema confiavel dentro do RPG, separando claramente:

- preferencias de combate;
- preferencias de interface;
- audio preparado;
- save local como fonte principal;
- importacao/exportacao JSON;
- cloud save experimental;
- reset local em zona de risco.

Acoes destrutivas ou de sobrescrita precisam usar modal de confirmacao e explicar impacto antes da execucao. Cloud save deve continuar comunicado como experimental e opcional.

### Preferencias atuais

- Velocidade padrao de combate.
- Reduzir animacoes.
- Modo compacto.
- Mostrar numeros detalhados.
- Volumes de audio preparados.

### Necessidade futura
Criar migracoes formais de save por versao. O projeto vai crescer; sem migracao, qualquer mudanca pode quebrar progresso antigo.

---

## 24. Riscos atuais

| Risco | Impacto | Mitigacao |
|---|---|---|
| Complexidade invisivel | Jogador nao entende derrota/vitoria | Resultado de combate e painel de modificadores |
| Escopo crescendo rapido | Codigo vira bagunca | Ciclos de refatoracao a cada 2 features |
| Save quebrar | Perda de progresso | Migracoes por saveVersion |
| Economia inflacionar | Recursos perdem valor | Balance pass e sumidouros claros |
| Gacha frustrar | Jogador sente falta de controle | Pity, contratos e recrutamento alternativo |
| Torre repetitiva apos 40 | Queda de retencao | Capítulos com mecanicas novas |

---

## 25. Roadmap recomendado

### Alpha 0.5 - Clareza e consolidacao

1. Resultado de combate em modal com card compacto de ultimo resultado.
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
6. Build final para deploy na Vercel.

---

## 26. Proxima prioridade recomendada

A proxima feature deve ser **Painel de Modificadores Ativos e Historico de Resultados**.

Motivo: o resultado de combate agora comunica o ciclo imediato, mas o jogador ainda precisa consultar com facilidade quais modificadores estao moldando a Torre e comparar resultados recentes sem depender apenas do ultimo combate.

O painel deve mostrar:

- modificadores do capitulo atual;
- modificadores do andar selecionado;
- efeitos temporarios de eventos da Torre;
- impacto do modo de dificuldade;
- evento semanal ativo;
- historico compacto de resultados recentes;
- atalho para abrir o resultado completo quando houver registro salvo.

---

## 27. Prompt recomendado para o agente

```md
O projeto atual deixou de ser MVP e agora deve ser tratado como Alpha jogavel.

Leia o GDD atualizado e o codigo atual antes de alterar arquivos.

Proxima prioridade: implementar um Painel de Modificadores Ativos e Historico de Resultados na Torre.

Objetivo:
Dar clareza ao jogador sobre quais regras temporarias, regionais e de dificuldade estao afetando a proxima tentativa, alem de permitir revisar resultados recentes sem ocupar a tela principal.

Requisitos:
1. Manter o resultado de combate atual em modal grande e card compacto de ultimo resultado.
2. Criar uma secao recolhivel ou modal para modificadores ativos da Torre.
3. Mostrar modificador regional do capitulo.
4. Mostrar modificadores do andar selecionado.
5. Mostrar efeitos temporarios de eventos da Torre.
6. Mostrar evento semanal ativo e seus efeitos.
7. Mostrar impacto do modo de dificuldade escolhido.
8. Criar historico compacto de resultados recentes usando dados reais ja salvos ou registrar historico pequeno sem quebrar saves antigos.
9. Nao alterar balanceamento, recompensas ou regras de combate.
10. Manter localStorage como fluxo principal.
11. Manter compatibilidade com Next.js e o deploy planejado na Vercel.

Criterio de aceitacao:
Antes de lutar, eu preciso entender quais modificadores estao ativos; depois de lutar, eu preciso conseguir comparar rapidamente os resultados recentes.
```

---

## 28. Conclusao

Ascensao dos Ecos ja tem base suficiente para ser tratado como projeto indie web em Alpha. O foco agora deve ser clareza, progressao permanente, apego aos herois, descoberta e robustez tecnica.

A maior prioridade de design e tornar visivel a complexidade que ja existe. A maior prioridade tecnica e proteger o save e manter a arquitetura modular simples.

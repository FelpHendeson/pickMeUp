# Visao de Produto: Lobby Vivo

## Status e finalidade

Este documento consolida a direcao de design de **Ascensao dos Ecos** a partir da Alpha 0.10.0. Ele orienta as proximas etapas de produto e implementacao, mas nao substitui automaticamente regras, balanceamento ou sistemas que ja estao em producao.

O projeto continua sendo um tower gacha idle RPG single-player em Next.js, React, TypeScript e Zustand. O save principal permanece no `localStorage`, com cloud save experimental e migrations obrigatorias para qualquer alteracao persistida.

A inspiracao conceitual vem da relacao entre jogador, herois e lobbies apresentada em [Pick Me Up!](https://pick-me-up.fandom.com/wiki/Pick_Me_Up%21_Wiki). A referencia serve apenas para extrair ideias abstratas de gestao, sobrevivencia e vinculo com unidades. Ascensao dos Ecos deve manter nomes, personagens, mundo, lore, identidade visual e implementacoes proprias.

## 1. Visao geral do novo conceito

### Lobby Vivo como coracao do jogo

O Lobby Vivo e o centro emocional, operacional e visual de Ascensao dos Ecos. Ele nao deve funcionar apenas como um menu entre combates. E o lugar onde os herois vivem, treinam, trabalham, descansam, criam relacoes, demonstram necessidades e se preparam para sobreviver a Torre.

Cada retorno ao Lobby deve comunicar que algo aconteceu: uma expedicao terminou, um heroi evoluiu, alguem esta cansado, uma instalacao produziu recursos, uma relacao mudou ou uma nova decisao surgiu. Mesmo quando a simulacao for simples, o Lobby deve parecer habitado e reagir ao estado real do jogo.

### Torre como prova de preparo

A Torre continua sendo o principal objetivo de progressao e a prova concreta das decisoes tomadas no Lobby. Ela nao e o jogo inteiro: e o ambiente que testa formacao, equipamento, treinamento, condicao emocional, funcoes, relacoes e uso de recursos.

O ritmo desejado alterna preparo e risco. A cada cinco andares deve existir um salto perceptivel de dificuldade, capaz de interromper avancos automaticos e exigir que o Mestre volte ao Lobby para revisar a equipe. O valor exato desses saltos sera definido posteriormente com testes de balanceamento.

### Jogador como Mestre

O jogador assume oficialmente o papel de **Mestre do Lobby**. Ele define prioridades, distribui funcoes, investe recursos, prepara equipes e decide quando assumir riscos. Os herois obedecem a estrutura do Lobby, mas nao devem parecer objetos sem identidade: possuem personalidade, potencial, limites e reacoes proprias.

O Mestre administra pessoas unicas, nao copias descartaveis. Seu poder vem da capacidade de reconhecer talentos, criar condicoes de crescimento e organizar o coletivo.

## 2. Loop principal desejado

O ciclo central deve ser:

1. Invocar ou recrutar herois ainda ausentes do Lobby.
2. Conhecer identidade, atributos visiveis, tracos e potenciais ainda ocultos.
3. Treinar herois de forma ativa ou idle.
4. Organizar funcoes de trabalho e responsabilidades dentro do Lobby.
5. Enviar grupos para expedicoes fora do Lobby.
6. Coletar materiais, informacoes, equipamentos e oportunidades encontradas.
7. Criar, melhorar e distribuir equipamentos.
8. Preparar a formacao conforme o risco e as exigencias do proximo trecho da Torre.
9. Subir a Torre e enfrentar combates, eventos e saltos de dificuldade.
10. Voltar ao Lobby para recuperar feridos, aliviar estresse, evoluir herois e reorganizar recursos e funcoes.

O retorno ao Lobby nao deve parecer uma falha ou interrupcao. Ele e a segunda metade do loop e a principal fonte de planejamento, apego e progressao idle.

## 3. Conceitos oficiais do projeto

### Lobby Vivo

Base persistente onde herois coexistem e onde os sistemas de gestao se encontram. Instalacoes, atividades, alertas, rotinas e personagens devem refletir o estado atual do save. O Lobby substitui gradualmente a ideia de uma Base composta apenas por paineis estaticos, preservando as funcoes que ja existem.

### Mestre

Papel do jogador. O Mestre define prioridades e estrategia, mas nao controla cada movimento em tempo real. Sua interacao deve ocorrer por ordens, atribuicoes, escolhas, preparacao de equipes e administracao de recursos.

### Assistente ou Fada do Lobby

Personagem original de suporte que apresenta sistemas, resume acontecimentos idle, alerta sobre riscos e traduz estados complexos em recomendacoes curtas. A Assistente nao deve decidir pelo jogador nem servir apenas como tutorial textual. Sua identidade, nome e lore serao definidos dentro do universo de Ascensao dos Ecos.

### Vice-Mestre

Um heroi pode receber a funcao de Vice-Mestre quando cumprir requisitos futuros de lealdade, disciplina ou progressao. Inicialmente, a funcao pode conceder pequenos beneficios de organizacao e destacar esse heroi na narrativa do Lobby. No longo prazo, pode automatizar prioridades autorizadas pelo Mestre.

### Herois unicos e sem duplicatas

Cada heroi deve possuir identidade propria e existir no maximo uma vez no roster do jogador. Invocacoes futuras devem selecionar apenas herois ainda nao obtidos. O valor do gacha migra da repeticao de copias para descoberta, raridade, momento de obtencao e desenvolvimento individual.

Duplicatas nao devem ser requisito para evoluir um heroi. Recursos de promocao devem vir de progresso, desafios, sintese controlada, expedicoes ou recompensas especificas.

### Invocacao inicial

Uma nova jornada deve oferecer recursos ou direitos suficientes para **cinco invocacoes normais e uma invocacao especial**. A invocacao especial deve garantir uma escolha ou faixa de qualidade relevante para formar o nucleo inicial do Lobby. Custos e valores exatos nao serao alterados nesta etapa documental; devem ser definidos quando o sistema sem duplicatas estiver pronto e coberto por testes.

### Torre com saltos a cada cinco andares

Cada bloco de cinco andares forma um ciclo de preparo. O quinto andar funciona como verificacao de equipe, com aumento perceptivel de ameaca, mecanica ou exigencia estrategica. O salto deve ser comunicado antes da tentativa e nao depender apenas de inflar atributos.

### Expedicoes

Expedicoes representam exploracao fora do Lobby. Herois enviados ficam ocupados, enfrentam riscos abstratos e retornam depois de um intervalo com materiais, descobertas, eventos ou consequencias. O sistema atual de expedicoes temporizadas deve ser preservado e evoluido de forma incremental.

### Campo de treino idle

Instalacao onde herois designados acumulam progresso durante o tempo real, inclusive entre sessoes. O treino deve respeitar limites, ocupacao e especialidades, sem substituir completamente combates ou outras fontes de experiencia.

### Emocoes, vontade e comportamento

Herois devem possuir estados capazes de afetar disponibilidade, desempenho e eventos: ambicao, medo, preguica, disciplina, lealdade e estresse. Esses valores complementam moral, ferimentos e afinidade ja existentes. Eles nao devem criar uma simulacao psicologica opaca; causas, mudancas e efeitos precisam ser compreensiveis.

### Funcoes dentro do Lobby

Herois podem assumir trabalhos conforme aptidoes e necessidades, como treinamento, exploracao, enfermaria, oficina, pesquisa, vigilancia ou apoio logistico. Uma funcao ocupa o heroi por um periodo e gera efeitos claros. A classe de combate pode influenciar, mas nao deve determinar sozinha a competencia de trabalho.

### Talentos e proficiencias ocultas

Cada heroi pode ter potenciais para combate, expedicao, treino ou trabalhos do Lobby que nao sao totalmente revelados na obtencao. O jogador descobre essas proficiencias por uso, eventos e observacao. O sistema deve oferecer pistas e progresso de descoberta para evitar escolhas cegas permanentes.

### Promocao de estrela

Promocao aumenta o limite de crescimento ou desbloqueia uma evolucao relevante de um heroi unico. Nao deve exigir copias do mesmo personagem. Materiais, feitos pessoais, treinamento e marcos da Torre podem compor os requisitos.

### Sintese

Sintese e um sistema de transformacao de recursos e progresso excedente. Por causa da regra de herois unicos, sua primeira versao nao deve consumir permanentemente personagens. Ela pode converter materiais, fragmentos, equipamentos ou registros de treino em recursos controlados de evolucao. Qualquer forma futura de sacrificio exige decisao de design explicita, protecoes de UX e compatibilidade com a proposta de apego aos herois.

### Instalacoes do Lobby

Instalacoes organizam os sistemas do jogo em espacos coerentes: Portal de Invocacao, Alojamento, Campo de Treino, Enfermaria, Oficina, Quadro de Expedicoes e outras expansoes originais. Niveis de instalacao podem ampliar capacidade, eficiencia ou opcoes, mas cada instalacao deve ter funcao legivel e valor pratico.

### Interface visual viva

A interface do Lobby deve apresentar herois, ocupacoes e acontecimentos como uma cena operacional, mantendo a estetica dark fantasy. O objetivo inicial nao e movimentacao livre: tokens, retratos, silhuetas, pequenos estados animados e agrupamentos por instalacao podem comunicar vida sem exigir um RTS.

## 4. Adaptacao para viabilidade tecnica

As primeiras versoes devem priorizar estado deterministico, regras puras e representacoes simples que funcionem com a stack atual.

| Conceito | Primeira versao viavel | Evolucao posterior possivel |
|---|---|---|
| Lobby Vivo | Painel central com instalacoes, tokens de herois, atividades e feed de acontecimentos derivados do save | Cenas mais ricas, animacoes contextuais e eventos encadeados |
| Autonomia | Rotina idle simulada por atribuicao, timestamps e resolucao ao carregar/coletar | Preferencias individuais e escolhas condicionais |
| Emocoes | Poucos atributos numericos normalizados, com faixas e efeitos explicitos | Eventos, memoria e interacoes entre tracos |
| Herois unicos | Roster fixo em arquivo de definicao, com `definitionId` estavel e posse registrada no save | Novos rosters por capitulo, evento ou regiao |
| Invocacao sem duplicatas | Filtrar definicoes ja obtidas e encerrar/transformar o pool quando esgotado | Banners tematicos e garantias por categoria |
| Talentos ocultos | Valores predefinidos com nivel de descoberta separado | Pistas narrativas, mentoria e testes de aptidao |
| Vice-Mestre | Uma atribuicao unica com bonus pequeno e requisitos claros | Delegacao configuravel de rotinas |
| Campo de treino | Slots, heroi, inicio, fim e XP calculado por timestamp | Mentores, grupos, proficiencias e eventos de treino |
| Trabalhos | Atribuicoes temporizadas que bloqueiam disponibilidade e produzem um resultado | Cadeias produtivas e sinergias entre herois |
| Expedicoes | Estender o sistema temporizado atual com materiais e eventos simples | Rotas, exploracao progressiva e decisoes durante a jornada |
| Promocao | Receita deterministica sem duplicatas, validada no dominio | Provas pessoais, escolhas de especializacao e visuais evoluidos |
| Sintese | Conversao controlada de materiais e excedentes, com receitas fixas | Receitas descobertas e especializacao de instalacao |
| Torre em blocos | Marcadores a cada cinco andares e configuracao explicita de marco | Mecanicas, objetivos e eventos proprios por bloco |
| Interface viva | CSS/React com tokens posicionados em zonas sem pathfinding | Animacoes leves e transicoes entre atividades |

### Limites de simulacao

- O estado idle deve ser resolvido por timestamps, sem processo permanente no navegador ou servidor.
- Regras de producao, emocao e ocupacao devem permanecer em `src/game/`.
- A UI apenas apresenta o estado e envia intencoes ao `gameStore`.
- Nenhum sistema deve depender obrigatoriamente de PostgreSQL; o cloud save continua opcional.
- Valores derivados devem ser calculados quando possivel, evitando aumentar o save sem necessidade.
- Toda nova estrutura persistida deve possuir default, normalizacao e migration.

## 5. Ordem recomendada de implementacao

### Etapa 1: visao do Lobby Vivo

Consolidar este documento como referencia para decisoes futuras. Nenhum gameplay e alterado nesta etapa.

### Etapa 2: roster de herois unicos e predefinidos

Definir identificadores estaveis, identidade original, classe, traco, raridade inicial e potenciais basicos. Preparar compatibilidade entre herois procedurais atuais e o novo roster.

### Etapa 3: invocacao sem duplicatas

Trocar a selecao procedural por sorteio entre definicoes ainda nao obtidas, com comportamento explicito para pool vazio e migration do save.

### Etapa 4: ajuste da invocacao inicial

Garantir cinco invocacoes normais e uma especial em nova jornada, somente depois de validar custos, fluxo e regressao dos saves existentes.

### Etapa 5: Torre com saltos de dificuldade a cada cinco andares

Estruturar marcos e comunicacao de risco antes de alterar numeros. Balancear os saltos com testes isolados e fixtures.

### Etapa 6: rotina idle dos herois no Lobby

Criar modelo simples de ocupacao, atividade, timestamps e resolucao offline. Integrar sem duplicar o mecanismo das expedicoes.

### Etapa 7: emocoes e comportamento

Introduzir poucos atributos, regras transparentes e eventos controlados. Reaproveitar moral, afinidade e ferimentos onde houver sobreposicao.

### Etapa 8: campo de treino funcional

Adicionar slots de treino idle, progressao por tempo, limites e retorno claro ao jogador.

### Etapa 9: expedicoes e materiais

Expandir recompensas e descobertas do sistema atual, mantendo herois ocupados e timestamps persistentes.

### Etapa 10: funcoes de trabalho no Lobby

Permitir atribuicoes em instalacoes e revelar gradualmente proficiencias relevantes.

### Etapa 11: promocao de estrela

Implementar progressao sem duplicatas, com materiais e requisitos pessoais protegidos por testes e migration.

### Etapa 12: sintese

Comecar por receitas seguras de materiais e excedentes. Nao consumir herois na primeira versao.

### Etapa 13: interface visual viva do Lobby

Transformar os sistemas consolidados em uma representacao visual integrada, responsiva e fiel ao estado real, sem introduzir simulacao 3D ou pathfinding complexo.

Cada etapa deve terminar funcional e verificavel antes da seguinte. A ordem pode receber pequenos ajustes tecnicos, mas dependencias estruturais nao devem ser ignoradas: identidade unica vem antes da invocacao sem duplicatas; rotina vem antes da visualizacao viva; migration vem junto de qualquer novo estado persistido.

## 6. O que nao fazer agora

- Nao criar um RTS completo.
- Nao implementar pathfinding complexo ou simulacao continua de movimento.
- Nao criar ambiente 3D.
- Nao implementar todos os sistemas em uma unica entrega.
- Nao copiar nomes, lore, personagens, artes, dialogos ou sistemas literais de Pick Me Up!.
- Nao remover ou quebrar sistemas atuais para antecipar a visao final.
- Nao fazer balanceamento profundo sem testes, fixtures e dados de referencia.
- Nao adicionar campos persistidos ao save sem migration, default e normalizacao.
- Nao tornar PostgreSQL obrigatorio para jogar.
- Nao transformar emocoes ocultas em penalidades imprevisiveis sem explicacao ao jogador.
- Nao usar duplicatas de heroi como atalho para progressao.

## 7. Regras tecnicas para as proximas etapas

Toda implementacao futura desta visao deve:

1. Manter regras e modelos de dominio em `src/game/` e componentes visuais em `app/components/`.
2. Usar `src/store/gameStore.ts` como ponte de mutacao entre UI, dominio e persistencia.
3. Criar migration sempre que alterar o estado persistido, mantendo `ensureStateShape` e os defaults sincronizados.
4. Preservar saves antigos, o fluxo principal em `localStorage`, export/import e cloud save experimental.
5. Adicionar testes de regressao para regras, migration, casos parciais e referencias invalidas.
6. Reutilizar sistemas atuais antes de criar estruturas paralelas, especialmente moral, afinidade, expedicoes, instalacoes e timestamps.
7. Implementar uma etapa pequena e verificavel por vez.
8. Evitar dependencias externas quando TypeScript, React e CSS existentes forem suficientes.
9. Manter textos em PT-BR e o tom dark fantasy original de Ascensao dos Ecos.
10. Explicar ao final de cada entrega o que foi implementado, quais limitacoes permanecem e qual e o proximo passo seguro.
11. Executar as validacoes proporcionais ao risco, incluindo typecheck, testes e build quando aplicavel.
12. Sincronizar GDD e especificacao funcional quando uma etapa passar de visao para regra efetivamente implementada.

## 8. Criterios para avaliar futuras features

Uma feature pertence ao Lobby Vivo quando pelo menos uma destas afirmacoes for verdadeira:

- torna um heroi mais individual e reconhecivel;
- cria uma decisao relevante de gestao do Mestre;
- conecta tempo idle a uma atividade compreensivel;
- faz uma instalacao responder ao estado do jogo;
- melhora o ciclo de preparo, risco e retorno da Torre;
- transforma progresso numerico em acontecimento perceptivel no Lobby.

Se uma proposta apenas adiciona mais um menu, recurso ou multiplicador sem fortalecer essas relacoes, ela deve ser revisada antes da implementacao.

## 9. Proximo passo recomendado

O proximo passo apos consolidar esta visao deve ser:

> **Implementar roster de herois unicos/predefinidos e preparar a invocacao para nao gerar duplicatas.**

Essa etapa deve primeiro mapear como os herois procedurais atuais serao preservados nos saves existentes. A implementacao precisa definir IDs estaveis, regras de compatibilidade e migration antes de alterar o comportamento da invocacao.

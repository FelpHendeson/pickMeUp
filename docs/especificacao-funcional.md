# Especificação Funcional do Jogo

## Visão geral
Ascensao dos Ecos e uma Alpha jogavel de RPG web single-player com progressao por torre, invocacao, recrutamento alternativo, formacao de herois, equipamentos, expedicoes, eventos, narrativa curta, moral, ferimentos, especializacoes, missoes, conquistas, reliquias permanentes e save local.

## Módulos e responsabilidades

### Estado, persistência e preferências
- `state.js` define o estado inicial, recursos, energia, presets, `saveVersion` e a normalizacao do save.
- `storage.js` carrega, salva, exporta, importa e reseta o progresso local, preservando relíquias permanentes e metadados da conta.
- `preferences.js` guarda preferências visuais, de combate e de interface.

### Heróis, recrutamento e progressão
- `heroes.js` define classes, raridades, atributos, XP, níveis e geracao procedimental de herois.
- `recruitment.js` controla contratos de heroi, selecao entre tres candidatos, veteranos tematicos e recrutamento alternativo.
- `relics.js` gerencia relíquias permanentes da conta, custos em Fragmentos de Eco e bonus globais.
- `specializations.js` disponibiliza especializacoes por classe, requisitos de nivel e bonus permanentes.
- `injuries.js` controla ferimentos, tratamento na enfermaria, estados temporarios e efeitos de desempenho.
- `morale.js` gerencia moral de 0 a 100, estados emocionais e bonus/penalidades em combate.
- `affinity.js` salva vinculos por par de herois, evolui afinidade e aplica bonus leves de equipe.

### Formação e equipamentos
- `formation.js` organiza a equipe ativa, limites de slots, posicoes de frente/retaguarda e presets de time.
- `equipment.js` gera, normaliza, equipa e calcula efeitos de equipamentos, recalculando bonus derivados de raridade e andar.
- `consumables.js` define consumiveis, quantidades, alvos permitidos, validacao de uso e efeitos de preparacao.
- Itens obtidos por eventos, recompensas ou drops raros devem ser normalizados para evitar discrepancia entre raridade, nome e bonus efetivo.

### Progresso principal
- `tower.js` define andares, capitulos, inimigos, modificadores regionais, chefes e progresso da torre.
- `difficulty.js` define modos Normal, Desafio e Hardcore, aplica modificadores de risco/recompensa e registra estatisticas por modo.
- `tower-events.js` controla eventos aleatorios antes e depois de combates, escolhas de risco/recompensa e efeitos aplicado na proxima luta.
- `weekly-events.js` aplica eventos semanais locais conforme o calendario do navegador.
- `rewards.js` concede recompensas de vitória, marcos de capitulo, drops especiais e itens permanentes.
- `library.js` registra bestiario, chefes, eventos, reliquias e herois encontrados.

### Combate
- `battle.js` simula o combate automatico com turnos, energia, alvos, dano, cura, status e efeitos.
- `battle-view.js` renderiza replay, log de combate, barra de energia e painel de resultado para explicar o desenrolar da batalha.

### Sistemas auxiliares
- `summon.js` gerencia invocacao comum e superior, histórico, custos e probabilidades.
- `expeditions.js` administra expedicoes temporizadas, ate 3 herois por expedicao e recompensas escaladas pelo poder enviado.
- `missions.js` valida missoes diarias, conquistas permanentes e recompensas.
- `narrative.js` gerencia cenas curtas por gatilho e marca narrativas ja vistas.
- `view-utils.js` concentra utilitarios visuais e escape de conteudo dinamico.
- `main.js` coordena handlers, renderizacao, fluxo de combate e integracao entre os módulos.

### Interface
- `ui.js` renderiza as abas da base, herois, formacao, inventario, expedicoes, missoes, invocacao, torre, combate e configuracoes.
- A interface deve destacar poder do time, risco do andar, ferimentos, moral e modificadores ativos.

## Fluxo principal do jogador
1. O jogador abre a home e entra no jogo, carregando o save local.
2. Decide entre invocar herois, usar contratos de recrutamento e avaliar relíquias atuais.
3. Organiza a formacao, aplica presets e equipa personagens com base no capitulo ativo.
4. Escolhe a dificuldade da torre, enfrenta eventos aleatorios, luta automaticamente e recebe recompensas proporcionais ao risco.
5. Analisa a tela de resultado 2.0 para entender recompensas, progresso, consequencias, desempenho individual e sistemas que afetaram a luta.
6. Gerencia ferimentos, moral, energia, expedicoes e missoes durante o loop.
6. Avanca pelos capitulos, desbloqueia relíquias, progressao permanente e melhorias de conta.

## Regras de alto nível
- O progresso e salvo localmente no navegador com `localStorage`, `saveVersion` e normalizacao ao carregar.
- A torre e o eixo principal do jogo, com capitulos marcados, chefes, modificadores por regiao e modos de dificuldade por tentativa.
- Descobertas do jogador devem ser persistidas na Biblioteca e evoluir conforme uso real dos sistemas.
- Eventos semanais locais, eventos aleatorios da torre e narrativas curtas mantem o jogo vivo sem backend.
- Recursos principais incluem ouro, cristais, essencia, fragmentos, Fragmentos de Eco e energia.
- Energia regenera com o tempo e deve permitir teste rapido de composicoes sem bloquear o jogador.
- A equipe evolui por XP, equipamento, especializacao, moral, ferimentos, recrutamento e relíquias.
- Relíquias permanentes aumentam a conta de forma global e devem ser persistidas no save.
- Contratos de heroi complementam a invocacao e oferecem recrutamento alternativo com escolhas curtas.
- O sistema de UI deve comunicar risco, modificadores, recompensas, dificuldade escolhida, resultado da batalha e o estado da equipe de forma clara.
- Morte permanente nunca deve ocorrer fora do modo Hardcore.
- A especificacao deve ser sincronizada com o GDD atualizado em `GDD_Ascensao_dos_Ecos_Alpha_Atualizado.md`.

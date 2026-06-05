# Especificação Funcional do Jogo

## Visão geral
Ascensao dos Ecos e uma Alpha jogavel de RPG web single-player com progressao por torre, invocacao, recrutamento alternativo, formacao de herois, equipamentos, expedicoes, eventos, narrativa curta, moral, ferimentos, especializacoes, missoes, conquistas, reliquias permanentes e save local.

## Módulos e responsabilidades

### Estado, persistência e preferências
- `src/game/state/` define o estado inicial, recursos, energia, presets, `saveVersion` e a normalizacao do save.
- `src/game/save/` carrega, valida, exporta, importa e normaliza progresso local.
- `src/game/preferences/` guarda preferências visuais, de combate e de interface.
- `src/store/gameStore.ts` expõe ações persistentes para a UI React.

### Heróis, recrutamento e progressão
- `src/game/heroes/` define classes, raridades, atributos, XP, níveis e geracao procedimental de herois.
- `src/game/recruitment/` controla contratos de heroi, selecao entre tres candidatos, veteranos tematicos e recrutamento alternativo.
- A tela de Recrutamento deve parecer um quadro de contratos da guilda, diferenciando-se da Invocacao por escolha estrategica entre candidatos com classe, raridade, poder, atributos, custo e traco/passiva.
- `src/game/relics/` gerencia relíquias permanentes da conta, custos em Fragmentos de Eco e bonus globais.
- `src/game/specializations/` disponibiliza especializacoes por classe, requisitos de nivel e bonus permanentes.
- `src/game/hero-status/` controla ferimentos, tratamento, moral, estados temporarios e efeitos de desempenho.
- `src/game/affinity/` salva vinculos por par de herois, evolui afinidade e aplica bonus leves de equipe.

### Formação e equipamentos
- `src/game/formation/` organiza a equipe ativa, limites de slots, posicoes de frente/retaguarda e presets de time.
- `src/game/equipment/` gera, normaliza, equipa e calcula efeitos de equipamentos, recalculando bonus derivados de raridade e andar.
- `src/game/consumables/` define consumiveis, quantidades, alvos permitidos, validacao de uso e efeitos de preparacao.
- Itens obtidos por eventos, recompensas ou drops raros devem ser normalizados para evitar discrepancia entre raridade, nome e bonus efetivo.

### Progresso principal
- `src/game/tower/` define andares, capitulos, inimigos, modificadores regionais, chefes e progresso da torre.
- `src/game/difficulty/` define modos Normal, Desafio e Hardcore, aplica modificadores de risco/recompensa e registra estatisticas por modo.
- `src/game/tower-events/` controla eventos aleatorios antes e depois de combates, escolhas de risco/recompensa e efeitos aplicado na proxima luta.
- `src/game/weekly-events/` aplica eventos semanais locais conforme o calendario do navegador.
- `src/game/rewards/` concede recompensas de vitória, marcos de capitulo, drops especiais e itens permanentes.
- `src/game/library/` registra bestiario, chefes, eventos, reliquias e herois encontrados.

### Combate
- `src/game/battle/` simula o combate automatico com turnos, energia, alvos, dano, cura, status e efeitos.
- `app/components/tower/BattleResultPanel.tsx` renderiza replay, log de combate, barra de energia e painel de resultado para explicar o desenrolar da batalha.

### Sistemas auxiliares
- `src/game/summon/` gerencia invocacao comum e superior, histórico, custos e probabilidades.
- `src/game/expeditions/` administra expedicoes temporizadas, ate 3 herois por expedicao e recompensas escaladas pelo poder enviado.
- `src/game/missions/` valida missoes diarias, conquistas permanentes e recompensas.
- `src/game/narrative/` gerencia cenas curtas por gatilho e marca narrativas ja vistas.
- `app/components/` concentra os paineis React por domínio.
- `app/components/layout/GameShell.tsx` coordena a navegação principal e a composição dos painéis.

### Interface
- `app/components/` renderiza as abas da base, herois, formacao, inventario, expedicoes, missoes, invocacao, torre, combate e configuracoes.
- A Base funciona como hub de comando: recomenda proxima acao, resume conta/campanha/equipe/recursos e oferece atalhos para Torre, Formacao, Herois, Expedicoes, Missoes e Inventario.
- O HUD de recursos exibe ouro, cristais, essencia, fragmentos e energia em barra compacta, mantendo recursos secundarios recolhidos e responsivos para nao disputar espaco com navegacao ou acoes.
- O GameShell agrupa a navegacao principal por areas, exibe contexto da aba ativa e usa tabs com estado ativo evidente e scroll horizontal no mobile.
- A interface deve destacar poder do time, risco do andar, ferimentos, moral e modificadores ativos.
- Configuracoes deve separar preferencias, save local, importacao/exportacao, cloud save experimental, reset e informacoes do jogo; acoes destrutivas ou de sobrescrita exigem confirmacao clara.
- A versão atual deve ter identidade Dark Fantasy consistente, design system interno e responsividade real em mobile.
- A tela da Torre usa layout mestre-detalhe: mapa de andares selecionável à esquerda, dados do desafio à direita e resultado/histórico em modal.

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
- A Biblioteca deve apresentar essas descobertas como grimorio/arquivo arcano, separando inimigos, chefes, capitulos, eventos, reliquias e memoria da guilda sem alterar os dados salvos.
- Eventos semanais locais, eventos aleatorios da torre e narrativas curtas mantem o jogo vivo sem backend.
- Recursos principais incluem ouro, cristais, essencia, fragmentos, Fragmentos de Eco e energia.
- Energia regenera com o tempo e deve permitir teste rapido de composicoes sem bloquear o jogador.
- A equipe evolui por XP, equipamento, especializacao, moral, ferimentos, recrutamento e relíquias.
- Relíquias permanentes aumentam a conta de forma global e devem ser persistidas no save.
- Contratos de heroi complementam a invocacao e oferecem recrutamento alternativo com escolhas curtas, confirmacao clara e atalhos para revisar Heróis ou Formacao.
- O sistema de UI deve comunicar risco, modificadores, recompensas, dificuldade escolhida, resultado da batalha e o estado da equipe de forma clara.
- Morte permanente nunca deve ocorrer fora do modo Hardcore.
- A especificacao deve ser sincronizada com o GDD atualizado em `GDD_Ascensao_dos_Ecos_Alpha_Atualizado.md`.

## Migracao Next/PostgreSQL
- A UI React e o fluxo operacional principal desta branch.
- O core TypeScript em `src/game/` deve continuar validado por testes de regressao e fixtures estaveis.
- O save local no navegador permanece como fallback tecnico e deve preservar a chave existente de `localStorage`.
- O PostgreSQL armazena snapshots completos do save normalizado e mantem `PlayerProfile`/`Hero` como tabelas preparatorias.
- O banco local versionado deve subir por Docker Compose com volume persistente e ser validado por `npm run validate:db`.
- O deploy futuro planejado e Vercel; GitHub Pages nao e alvo desta versao.

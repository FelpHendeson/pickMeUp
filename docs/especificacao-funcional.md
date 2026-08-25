# Especificação Funcional — Ascensão dos Ecos

**Versão:** 0.10.0  
**Sincronização:** 25/08/2026
**Baseline de origem:** `master@4cd38eb`

## 1. Objetivo

Este documento descreve o comportamento funcional da Alpha atual. Ideias futuras ficam em `visao-lobby-vivo.md` e não devem ser tratadas como implementadas.

## 2. Arquitetura funcional

### UI

- `app/` usa Next.js App Router.
- `app/components/` organiza painéis por domínio.
- `app/components/layout/GameShell.tsx` coordena navegação, HUD e composição.
- `app/components/ui/` concentra design system, feedback e layout focado.

### Domínio

- `src/game/` contém regras puras e dados de gameplay.
- componentes não devem implementar regra persistente de negócio.

### Estado

- `src/store/gameStore.ts` é a ponte de mutação consumida pela UI.
- mutações persistentes devem passar pelo store e pelas regras do domínio.

### Persistência

- localStorage é o save principal;
- PostgreSQL/Prisma é opcional e usado para snapshots experimentais;
- import/export e cloud snapshots são normalizados antes de uso.

## 3. Save

Configuração atual:

- chave: `ascensao-dos-ecos-save-v1`;
- `saveVersion`: 1;
- `schemaVersion`: 5.

`src/game/save/migrations.ts` migra schemas anteriores até a versão atual.

Fluxo de importação:

1. validar JSON/objeto;
2. identificar versão;
3. aplicar migrations sequenciais;
4. normalizar estado;
5. somente então aceitar o save.

Saves com versão de jogo/schema futura devem ser rejeitados com mensagem segura.

## 4. Estado inicial e economia

Valores relevantes da nova jornada:

- ouro: 250;
- cristais: 100;
- energia: 30/30;
- custo de tentativa da Torre: 5 energia;
- regeneração: 1 a cada 5 minutos;
- invocação comum paga: 100 ouro;
- superior: 100 cristais.

A primeira sessão recebe direitos de invocação adicionais descritos abaixo.

## 5. Heróis

### Identidade

O roster moderno usa definições únicas e estáveis. Heróis do roster possuem `definitionId`. Saves antigos podem conter heróis procedurais sem esse campo; eles continuam válidos como legacy.

Um herói legacy não deve ser automaticamente renomeado/substituído para caber no novo roster.

### Dados principais

- raridade;
- classe;
- nível/XP;
- HP e atributos;
- traço;
- equipamento;
- moral;
- ferimentos;
- especialização;
- estados de treino/proficiência/potencial quando existentes.

## 6. Invocação

### Sem duplicatas do roster

Invocação usa somente definições ainda não obtidas. A raridade rolada prioriza opções da mesma faixa e, quando necessário, a mais próxima disponível. A raridade final do herói segue sua definição.

Pool vazio não deve consumir recurso.

### Onboarding

Nova jornada recebe:

- 5 tickets de invocação comum;
- 1 invocação especial.

A especial oferece até 3 opções persistidas, priorizando heróis de raridade inicial relevante. A escolha encerra a especial.

Rituais pagos permanecem bloqueados até os tickets acabarem e a escolha especial ser concluída.

## 7. Recrutamento

Contratos são uma rota alternativa à invocação. A UI apresenta candidatos e permite decisão estratégica antes da contratação.

O sistema deve preservar a diferença conceitual:

- invocação = descoberta aleatória dentro do pool;
- contrato = escolha controlada entre candidatos.

## 8. Formação

- máximo de 5 heróis;
- 2 posições frontais;
- presets separados para Torre e expedição;
- herói indisponível não deve ser inserido incorretamente.

## 9. Equipamentos e compatibilidade

Equipamentos possuem slot, raridade e bônus efetivos.

A análise de equipamento deve permitir comparação com o item atual e indicar impacto/compatibilidade.

**Regra:** classe pouco afinada não implica bloqueio automático. A UI pode advertir baixa compatibilidade e ainda permitir equipar. Bloqueios são reservados para restrições técnicas reais, como slot incompatível ou conflito de equipamento.

## 10. Lobby Vivo

`src/game/lobby/routines.ts` deriva rotina/ocupação visual em blocos determinísticos de tempo.

`src/game/lobby/lobbyView.ts` produz a visão enriquecida:

- cards por herói;
- local atual;
- atividade/hint;
- marcadores de formação, expedição, ferimento, HP baixo, promoção, proficiência e potencial;
- resumo do Lobby;
- bloco de atenção;
- grupos por local em ordem estável.

Esses relatórios são derivados. Renderizar o Lobby não pode conceder recursos ou progresso automaticamente.

## 11. Treino

`src/game/training/` controla foco e progresso técnico.

Focos incluem especializações de treinamento como linha de frente, dano, defesa, suporte, mobilidade, arcano, disciplina e sobrevivência.

Regras centrais:

- progresso por tempo decorrido;
- persistência do foco/progresso;
- sem ganho direto de atributos brutos de combate nesta etapa;
- heróis indisponíveis/feridos/críticos podem não treinar;
- quando não houver foco explícito, o domínio pode usar recomendação de classe.

O bônus derivado de treino deve permanecer pequeno e explícito; não presumir integração com readiness se o domínio não a aplicar.

## 12. Proficiências

`src/game/proficiencies/` recebe progresso principalmente como desdobramento do treino.

Possui ranks de descoberta e técnicas leves. Exemplos de categorias incluem combate, defesa, arcano, cura, sobrevivência, disciplina, liderança, tática e oficina.

Regras:

- progresso principal + secundário conforme foco de treino;
- descoberta gradual;
- técnicas leves desbloqueadas por rank;
- não expor `hiddenAptitudeTags` crus;
- bônus de readiness de proficiência existe como cálculo isolado e não deve ser somado à Torre sem decisão explícita.

## 13. Potencial

`src/game/potential/` mantém análise por herói em níveis 0–5.

Progresso pode vir de:

- avanço de proficiências;
- rank-up/descoberta;
- ação manual de análise com custo em ouro.

`getHeroPotentialReport` revela insights progressivamente. Aptidões ocultas devem ser traduzidas em sinais/insights, não exibidas como tags internas.

A análise não altera automaticamente stats, classe, raridade ou combate.

## 14. Promoção

`src/game/promotion/` fornece preview e execução.

### 1★→2★

Implementada.

- custo: 150 ouro + 5 fragmentos;
- requisitos hard são validados pelo preview;
- recursos só são consumidos no sucesso;
- `rarity` e `maxLevel` são atualizados;
- preservar level, XP, stats, HP, equipamento, formação, treino, proficiências e potencial.

### 2★+

Ainda bloqueada. Não implementar por atalho sem especificar requisitos, economia e compatibilidade de save.

## 15. Rota da Primeira Ascensão

`src/game/early-game/` deriva uma trilha de objetivos do estado atual.

Estados:

- `locked`;
- `available`;
- `completed`.

Objetivos cobrem onboarding, formação, primeiros andares, fragmentos, treino, proficiência, potencial e primeira promoção.

A trilha não adiciona um quest state persistido pesado e não bloqueia sistemas.

## 16. Torre

### Estrutura

- 40 andares;
- 4 capítulos;
- marcos de bloco em 5/15/25/35;
- chefes em 10/20/30/40.

Marcos podem aplicar salto de dificuldade e recompensa, mas devem comunicar risco antes da tentativa.

### Readiness

`src/game/tower/readiness.ts` deriva:

- score;
- classificação;
- verificações;
- recomendações.

Considera, entre outros fatores:

- formação;
- poder e nível;
- HP;
- ferimentos;
- moral;
- heróis ocupados;
- energia;
- contexto/marco do andar.

Readiness não é hard gate.

### Dificuldade

Normal, Desafio e Hardcore alteram risco/recompensa segundo `src/game/difficulty/`.

Hardcore exige comunicação clara de risco de morte permanente.

### Eventos

Eventos de Torre podem ocorrer antes/depois do combate, exigir escolhas e produzir efeitos/recompensas.

## 17. Combate e resultado

`src/game/battle/` simula o combate automático.

A UI deve preservar:

- replay/log;
- feedback de energia/ações;
- resultado detalhado;
- recompensas;
- consequências;
- progressão do herói.

Após uma batalha, resultado recente pode ser o estado dominante da Torre até o jogador continuar.

## 18. Expedições

- temporizadas;
- até 3 heróis;
- heróis enviados ficam ocupados;
- timestamps preservam progresso após reload;
- recompensa escala segundo regras do domínio.

## 19. Moral, ferimentos, afinidade e especializações

Esses sistemas já existem e devem ser reutilizados antes de criar novas camadas psicológicas/progressivas.

- moral afeta condição/desempenho;
- ferimentos exigem tratamento e afetam disponibilidade/atributos conforme regra;
- afinidade registra vínculos entre pares;
- especializações fornecem evolução por classe.

## 20. Relíquias, missões e biblioteca

- relíquias: progressão permanente com Fragmentos de Eco;
- missões/conquistas: objetivos e recompensas;
- biblioteca: inimigos, chefes, capítulos, eventos, relíquias e memórias descobertas;
- narrativa: cenas curtas por gatilho e registro de cenas vistas.

## 21. UI e feedback

### Infraestrutura transversal

- toast in-app para feedback rápido;
- `UiModal` para conteúdo modal;
- confirmação para ações destrutivas/sobrescrita;
- design system em `app/components/ui/`.

### Layout focado

`game-layout.tsx` fornece a arquitetura preferida para telas densas:

- `GamePage`;
- `GamePageHeader`;
- `CompactStatStrip`;
- `PrimaryActionPanel`;
- `FocusPanel`;
- `SecondaryInfoGrid`;
- `DetailDrawer`.

Regra de UX: uma ação principal e um estado dominante por vez; detalhes extensos ficam sob demanda.

### Torre — estado atual

Já migrada para esse padrão:

- header/contexto;
- métricas essenciais;
- CTA dominante;
- faixa compacta de andares;
- mapa completo e diagnósticos em drawers.

### Heróis — próximo alvo

A próxima refatoração deve aplicar o mesmo padrão sem alterar gameplay/save.

### Navegação mobile

- HUD superior fixa com ouro, cristais, energia, andar atual e acesso contextual a alertas/missões;
- bottom navigation fixa com Base, Heróis, Torre, Expedições e Mais;
- o botão Mais abre as áreas secundárias agrupadas por Equipe, Progressão e Sistema;
- ao trocar de área, o menu é fechado e a nova tela inicia no topo;
- a navegação desktop agrupada continua disponível sem duplicar estado ou regras de domínio.

### Base como hub

A Base é a entrada padrão e apresenta instalações clicáveis de grande porte:

- Portal de Invocação;
- Quartel;
- Arsenal;
- Quadro de Missões;
- Expedições;
- Relíquias;
- Biblioteca.

Cada instalação mostra um resumo derivado do save e leva ao painel existente. Relatórios detalhados, rotina do Lobby, alertas e métricas permanecem acessíveis em uma seção recolhível, reduzindo a competição visual na primeira dobra.

### Placeholders visuais

O componente `GameArtPlaceholder` reserva o espaço das artes futuras sem introduzir assets definitivos. Existem placeholders para:

- banner e módulos da Base;
- header da Torre;
- header da Invocação;
- header de Heróis;
- header/rotas de Expedições.

Substituir o placeholder por arte final não deve alterar navegação, domínio ou save.

## 22. Responsividade

- evitar overflow horizontal;
- no mobile, usar HUD e bottom navigation fixas em vez da lista completa de tabs;
- destinos secundários ficam agrupados em Mais;
- grids densos devem empilhar;
- modais precisam ser roláveis;
- ações primárias devem permanecer acessíveis;
- informação secundária não deve dominar a primeira dobra.

## 23. Critérios de regressão obrigatórios

Uma mudança não pode quebrar:

- save antigo/importação;
- criação/carregamento de nova jornada;
- onboarding de invocação;
- roster único;
- formação;
- treino/proficiência/potencial;
- promoção 1★→2★;
- Torre/readiness/combate/resultado;
- expedições;
- localStorage sem banco;
- build Next.

Consulte `qa-local-checklist.md` para QA manual.

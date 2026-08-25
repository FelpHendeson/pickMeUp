# GDD Canônico — Ascensão dos Ecos

**Versão do jogo:** 0.10.0  
**Estado:** Alpha jogável  
**Stack operacional:** Next.js + React + TypeScript + Zustand  
**Última sincronização documental:** 25/08/2026
**Baseline de origem:** `master@4cd38eb`

---

## 1. Visão do produto

Ascensão dos Ecos é um RPG web single-player de estratégia, gestão e progressão por torre. O jogador assume o papel de **Mestre do Lobby**, responsável por administrar heróis únicos, preparar grupos, distribuir recursos e decidir quando enfrentar riscos.

O combate é automático. A habilidade central do jogador está no **preparo**: formação, equipamento, condição física e emocional, treinamento, proficiências, potencial, progressão e leitura de risco.

A Torre continua sendo o eixo de campanha, mas não é mais tratada como o jogo inteiro. O **Lobby Vivo** é o coração operacional e emocional; a Torre é a prova do que foi construído nele.

### Fantasia central

> “Eu não controlo cada golpe. Eu construo pessoas e equipes capazes de sobreviver ao próximo desafio.”

---

## 2. Pilares de design

### 2.1 Preparação acima de reflexo

O jogador vence antes do combate: escolhendo quem vai, em que condição, com qual função e contra qual risco.

### 2.2 Heróis como indivíduos, não consumíveis

O roster atual é baseado em heróis únicos com `definitionId` estável. Duplicatas não são o eixo de progressão. Heróis legacy sem `definitionId` continuam válidos.

O valor do personagem deve nascer de identidade, história, treino, proficiências, potencial, feitos, relações, ferimentos e evolução.

### 2.3 Lobby Vivo

A Base deve comunicar que os heróis vivem e trabalham nela. O estado do Lobby deriva do save: quem treina, está ferido, está em expedição, precisa de atenção ou está pronto para a Torre.

A representação atual é funcional e baseada em cards/grupos por local. A cena visual mais rica do Lobby é evolução futura, não requisito para o core.

### 2.4 Torre como prova de preparo

A Torre possui 40 andares e 4 capítulos. Marcos intermediários testam a equipe e chefes encerram capítulos.

O readiness informa risco e problemas sem impedir artificialmente a tentativa. O jogador pode assumir riscos conscientemente.

### 2.5 Progressão descoberta, não apenas números

Treino, proficiências e análise de potencial criam uma camada de descoberta sobre os personagens. A promoção deve ser consequência de desenvolvimento e recursos, não de duplicatas.

### 2.6 Clareza de interface

A UI deve ter um estado dominante e uma ação principal por vez. Informações extensas ficam disponíveis sob demanda por progressive disclosure.

A Torre é o piloto concluído desse modelo; Heróis é o próximo módulo a receber a arquitetura focada.

### 2.7 Web first e evolução incremental

O jogo deve continuar rápido, local-first e jogável sem backend. Sistemas novos devem ser incrementais, testáveis e compatíveis com saves existentes.

---

## 3. Loop principal atual

1. Retornar ao Lobby e identificar alertas/próxima ação.
2. Invocar/recrutar heróis disponíveis.
3. Gerenciar formação, equipamento e disponibilidade.
4. Treinar e observar proficiências/potencial.
5. Enviar expedições e coletar retornos.
6. Avaliar readiness e risco do próximo andar.
7. Resolver evento de Torre, quando existir.
8. Enfrentar combate automático.
9. Ler resultado, recompensas e consequências.
10. Tratar ferimentos, moral e progressão.
11. Avançar a campanha ou voltar ao Lobby para novo ciclo.

### Primeira sessão

A nova jornada é guiada pela **Rota da Primeira Ascensão**:

- usar os tickets iniciais;
- escolher a invocação especial;
- montar formação;
- vencer o primeiro andar;
- alcançar marcos iniciais;
- obter fragmentos;
- treinar um 1★;
- revelar proficiência;
- analisar potencial;
- reunir recursos;
- promover um herói 1★ para 2★.

A trilha é orientativa, não um hard gate.

---

## 4. Estado dos sistemas

### 4.1 Heróis

Implementado:

- classes, raridades, atributos, XP, nível e poder;
- roster único/predefinido;
- compatibilidade com heróis procedurais legacy;
- traços, moral, ferimentos e especializações;
- afinidade;
- equipamentos e consumíveis;
- memória/biblioteca em sistemas específicos;
- treino, proficiências, potencial e promoção 1★→2★.

Pendente/evolução:

- promoções acima de 2★;
- histórico pessoal mais rico, títulos e feitos;
- comportamentos adicionais além dos sistemas já existentes;
- trabalhos permanentes do Lobby e Vice-Mestre.

### 4.2 Invocação e recrutamento

A invocação trabalha sobre o roster ainda não obtido. A raridade rolada serve como preferência de seleção; a definição escolhida preserva sua raridade inicial. Pool esgotado não deve consumir recursos.

Nova jornada:

- 5 tickets de invocação comum;
- 1 invocação especial com até 3 opções persistidas;
- rituais pagos ficam bloqueados até concluir o onboarding de invocação.

Recrutamento por contrato existe como rota alternativa e controlada de aquisição.

### 4.3 Formação

- até 5 heróis;
- 2 slots frontais;
- presets de Torre e expedição;
- disponibilidade deve respeitar expedições e demais estados impeditivos.

### 4.4 Equipamentos

Equipamentos possuem tipo, raridade e bônus. A compatibilidade é **flexível**: baixa afinidade deve gerar leitura/aviso, não bloqueio arbitrário por classe. Bloqueios reais ficam para regras técnicas, como slot incompatível ou conflito de item.

### 4.5 Treino

O Campo de Treino possui focos técnicos persistidos. Progresso é calculado por tempo decorrido e não altera diretamente atributos brutos de combate.

Heróis indisponíveis, feridos ou em condição crítica podem deixar de treinar conforme as regras do domínio.

### 4.6 Proficiências

Proficiências evoluem a partir do treino e possuem ranks de descoberta. Técnicas leves podem ser reveladas por rank.

No estado atual, essas técnicas são principalmente descritivas e o bônus derivado de proficiência permanece isolado do readiness principal da Torre.

### 4.7 Análise de potencial

Cada herói possui progresso de análise até nível 5. Insights são liberados gradualmente; aptidões ocultas não são despejadas cruas na UI.

Análise pode avançar por treino/proficiência e por uma ação manual com custo.

### 4.8 Promoção

A promoção real disponível é **1★→2★**.

Custo atual:

- 150 ouro;
- 5 fragmentos.

A promoção valida requisitos do preview, consome recursos apenas no sucesso e preserva progressos existentes do herói. Rotas superiores permanecem bloqueadas até implementação explícita.

### 4.9 Lobby Vivo

`src/game/lobby/` deriva rotinas e uma visão enriquecida do estado do Lobby.

A UI atual mostra:

- resumo da guilda;
- heróis treinando, feridos, em expedição e prontos;
- alertas de atenção;
- agrupamento por locais do Lobby;
- atividade e contexto por herói.

Esses relatórios são derivados e não devem criar recursos/progresso por simples renderização.

### 4.10 Torre

- 40 andares;
- 4 capítulos;
- marcos de bloco: 5, 15, 25 e 35;
- chefes de capítulo: 10, 20, 30 e 40;
- modificadores, inimigos, eventos e recompensas;
- repetição de andares elegíveis;
- dificuldades Normal, Desafio e Hardcore;
- readiness pré-combate.

Readiness considera formação, poder, nível, HP, ferimentos, moral, ocupação, energia e contexto do andar. É diagnóstico, não hard gate.

### 4.11 Combate

Combate automático por turnos, com energia, habilidades, alvos, dano, cura, status, replay/log e estatísticas de resultado.

A tela de resultado existe e deve continuar explicando:

- vitória/derrota;
- recompensas;
- XP e evolução;
- consequências;
- desempenho e log/replay quando disponível.

### 4.12 Progressão paralela

Também implementados:

- expedições temporizadas;
- missões e conquistas;
- relíquias permanentes;
- biblioteca/bestiário;
- eventos semanais;
- narrativa curta;
- memorial em contexto de morte permanente;
- preferências e gestão de save.

---

## 5. Economia inicial

Recursos principais:

- ouro;
- cristais;
- essência;
- fragmentos;
- Fragmentos de Eco;
- energia.

Configuração base atual:

- 250 ouro na nova jornada;
- 100 cristais;
- 30/30 energia;
- custo de Torre: 5 energia;
- regeneração: 1 energia a cada 5 minutos;
- invocação comum paga: 100 ouro;
- invocação superior: 100 cristais.

Fragmentos iniciais relevantes para a primeira promoção são distribuídos de forma controlada nos primeiros marcos da Torre, incluindo andares 5, 7 e 10.

A economia deve evitar dois extremos: impedir experimentação por falta de energia e tornar progressão/roster triviais por excesso de recursos.

---

## 6. Arquitetura técnica de produto

```text
app/
  components/          UI React por domínio
  components/ui/       design system + layout focado
  api/saves/           cloud save experimental
src/
  game/                domínio puro
  store/gameStore.ts   mutações e persistência
  lib/                 serviços locais/Prisma
prisma/                 schema/migrations DB
tests/                  regressão e fixtures
```

### Regras arquiteturais

- componentes não devem concentrar regra de gameplay;
- UI envia intenções ao store;
- store chama domínio e persiste;
- valores derivados devem preferir cálculo a novos campos de save;
- campos persistidos novos exigem defaults, normalização e migration quando necessário;
- PostgreSQL não pode ser requisito para jogar localmente.

---

## 7. Save e compatibilidade

- `saveKey`: `ascensao-dos-ecos-save-v1`;
- `saveVersion`: 1;
- `schemaVersion`: 5;
- migrations formais existem em `src/game/save/migrations.ts`;
- schema atual inclui etapas para onboarding de invocação, treino, proficiências e potencial;
- importação executa migration e normalização;
- saves de versão futura são rejeitados de forma segura.

Cloud save é experimental e armazena snapshot JSON completo no PostgreSQL. O localStorage continua sendo o caminho principal.

---

## 8. Direção de UX/UI

### Princípio: modo foco

Uma tela deve responder primeiro:

1. Onde estou?
2. Qual é o estado mais importante agora?
3. Qual é a ação principal?
4. O que preciso saber para decidir?
5. Onde encontro os detalhes se quiser aprofundar?

### Infraestrutura atual

`app/components/ui/game-layout.tsx` fornece:

- `GamePage`;
- `GamePageHeader`;
- `CompactStatStrip`;
- `PrimaryActionPanel`;
- `FocusPanel`;
- `SecondaryInfoGrid`;
- `DetailDrawer`.

### Status do rework

**Fase 1 — concluída:** design system leve, header/nav mais compactos e Base com progressive disclosure inicial.

**Fase 2 — concluída:** Torre como piloto completo do layout focado. Primeira dobra com andar, preparo, risco, energia e ação principal; mapa completo e diagnósticos detalhados ficam recolhidos.

**Navegação mobile — concluída:** HUD superior fixa com ouro, cristais, energia, andar e alertas; bottom navigation fixa com Base, Heróis, Torre, Expedições e Mais; telas secundárias agrupadas no menu Mais.

**Base como hub — concluída:** instalações principais funcionam como destinos visuais de grande porte. Relatórios extensos do Lobby ficam recolhidos e deixam de competir com a navegação central.

**Placeholders visuais — concluídos:** reservas temáticas foram adicionadas ao banner e módulos da Base e aos headers de Heróis, Torre, Invocação e Expedições para substituição futura por artes finais.

**Fase 3 — próxima:** aprofundar Heróis em modo foco. Reduzir a densidade do `HeroRosterPanel`, criar uma hierarquia clara entre roster, herói selecionado, condição, desenvolvimento e ação principal, reutilizando os componentes existentes.

---

## 9. Roadmap canônico a partir de agora

### P0 — concluir o rework focado

1. Validar a nova navegação mobile e substituir placeholders conforme as artes forem aprovadas.
2. Heróis em modo foco.
3. Revisar Inventário, Expedições, Invocação/Recrutamento e Progressão apenas onde a densidade justificar.
4. QA visual desktop/mobile.

### P1 — aprofundar o Lobby Vivo

1. Funções/trabalhos do Lobby.
2. Estados comportamentais adicionais, integrados sem duplicar moral/afinidade.
3. Expedições com mais descobertas e consequências.
4. Instalações com valor sistêmico claro.
5. Evoluir a representação visual do Lobby sem introduzir pathfinding/RTS.

### P1 — aprofundar heróis

1. Promoções 2★+ em etapas.
2. Feitos, títulos e memória individual.
3. Proficiências com impacto cuidadosamente balanceado.
4. Potencial e treinamento gerando decisões de build mais expressivas.

### P2 — conteúdo e publicação

1. Mais variação de Torre somente depois de consolidar o loop atual.
2. Conteúdo narrativo e biblioteca mais ricos.
3. QA E2E/visual quando o custo justificar.
4. Cloud save real, autenticação e deploy público somente quando virarem objetivo de produto.

---

## 10. Fora de escopo imediato

- multiplayer síncrono;
- clãs/chat;
- 3D/RTS completo;
- pathfinding de heróis no Lobby;
- backend obrigatório;
- monetização real;
- sacrificar heróis únicos como requisito normal de evolução;
- grande reescrita da arquitetura sem necessidade comprovada.

---

## 11. Critério de qualidade da Alpha

A Alpha está no caminho certo quando o jogador:

- entende o que fazer em poucos minutos;
- percebe que o Lobby importa tanto quanto a Torre;
- sabe por que uma tentativa é arriscada;
- consegue identificar o desenvolvimento individual dos heróis;
- sente valor em personagens de baixa raridade;
- consegue acessar profundidade sem enfrentar uma parede de informação;
- mantém o progresso após atualizações graças às migrations.

O próximo ganho de qualidade não vem de adicionar dez sistemas novos. Vem de fazer os sistemas já existentes parecerem uma experiência única, legível e conectada.

# Briefing de Produto Atual — PO

- **Produto:** Ascensão dos Ecos
- **Versão:** 0.10.0
- **Data:** 24/08/2026
- **Baseline:** `master@fcc5f75`
- **Status:** Alpha jogável local; rework de UX/UI em andamento.

## Resumo executivo

Ascensão dos Ecos já possui um loop robusto de Lobby → preparação → Torre → combate → consequência → desenvolvimento. O projeto passou da fase de “quantidade de sistemas” e entrou numa fase em que o valor vem de **clareza, identidade e integração**.

Entre 02 e 03/07 foram entregues readiness da Torre, rotinas do Lobby, treino, proficiências, análise de potencial, promoção 1★→2★, onboarding guiado, visão enriquecida do Lobby e duas fases de rework visual.

A última entrega transformou a Torre no piloto de uma UI em modo foco. O próximo passo correto é aplicar a mesma arquitetura ao módulo de Heróis.

## O jogador já consegue

- iniciar uma jornada com onboarding de invocação;
- obter heróis únicos sem duplicatas do roster;
- recrutar por contratos;
- montar formação e presets;
- equipar itens com compatibilidade flexível;
- treinar heróis ao longo do tempo;
- descobrir proficiências e técnicas leves;
- analisar potencial;
- promover 1★ para 2★;
- observar o Lobby Vivo e seus alertas;
- enviar expedições;
- avançar por 40 andares/4 capítulos;
- consultar readiness antes da luta;
- resolver eventos e escolher dificuldade;
- assistir combate automático/replay;
- consultar resultado, recompensas e consequências;
- gerenciar moral, ferimentos, especializações e afinidade;
- evoluir relíquias e consultar biblioteca;
- salvar localmente, exportar/importar e usar cloud save experimental.

## O que mudou na direção do produto

### Antes

Torre/gacha eram o centro e a Base era principalmente um conjunto de painéis.

### Agora

O **Lobby Vivo** é o coração da gestão. A Torre é a prova do preparo. Heróis devem parecer indivíduos em desenvolvimento, e a interface deve mostrar apenas a informação necessária para a decisão atual.

## Estado da UX

### Fase 1 — concluída

- design system leve;
- header/nav compactos;
- Base com progressive disclosure inicial.

### Fase 2 — concluída

- infraestrutura `game-layout.tsx`;
- Torre refatorada para modo foco;
- primeira dobra reduzida ao essencial;
- detalhes recolhidos sob demanda.

### Fase 3 — recomendação imediata

**Heróis em modo foco.**

`HeroRosterPanel.tsx` concentra muita informação e é o candidato natural para validar a arquitetura fora da Torre.

## Indicadores de saúde do produto

### Pontos fortes

- core modular e testado;
- save local resiliente;
- migrations formais de save já existem até schema 5;
- roster único aumenta identidade;
- progressão inicial agora possui direção clara;
- readiness conecta preparação e Torre;
- treino/proficiência/potencial dão valor ao desenvolvimento individual;
- rework de UI já possui componentes reutilizáveis em vez de CSS/markup isolado.

### Riscos

- excesso de sistemas competindo visualmente;
- arquivos de UI muito grandes;
- algumas camadas ainda têm pouco impacto mecânico direto, como técnicas leves de proficiência;
- promoção acima de 2★ ainda não existe;
- Lobby visual ainda é representação por cards, não uma cena operacional completa;
- cloud save é experimental;
- falta suíte E2E/visual; QA visual ainda é manual.

## Decisões de produto recomendadas

Durante o ciclo atual, não abrir uma nova frente grande de gameplay. Primeiro fechar a linguagem de interface em:

1. Torre — concluída;
2. Heróis — próxima;
3. Base/Lobby — consolidação;
4. módulos secundários — somente onde a densidade justificar.

Depois, escolher **uma** frente de profundidade:

- funções/trabalhos do Lobby;
- promoções superiores;
- memória individual de heróis;
- expansão de expedições;
- conteúdo adicional de Torre.

## Critério de sucesso do próximo ciclo

Um jogador deve conseguir abrir Heróis e, em poucos segundos:

- encontrar o personagem desejado;
- entender sua condição;
- identificar sua linha de desenvolvimento;
- executar a próxima ação relevante;
- aprofundar detalhes somente se quiser.

A próxima Alpha ganha mais valor tornando a profundidade atual legível do que adicionando outro subsistema.
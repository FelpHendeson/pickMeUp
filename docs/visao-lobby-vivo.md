# Visão de Produto — Lobby Vivo

**Versão de referência:** Alpha 0.10.0  
**Revisado:** 25/08/2026

Este documento descreve a direção do produto e separa explicitamente **o que já existe** do que ainda é **visão futura**.

## 1. Princípio central

O Lobby Vivo é o coração de Ascensão dos Ecos. Ele não deve ser apenas um menu entre combates: é o espaço onde os heróis existem, treinam, se recuperam, trabalham, criam vínculos e se preparam.

A Torre é a prova do preparo construído no Lobby.

O jogador é o **Mestre do Lobby**: organiza pessoas únicas, não peças descartáveis.

## 2. Já implementado

### Heróis únicos

O roster moderno possui definições únicas e evita duplicatas. Heróis legacy continuam compatíveis.

### Invocação inicial

Nova jornada recebe 5 tickets comuns + uma especial. A especial permite escolha entre opções e os rituais pagos só liberam após o onboarding.

### Torre por ciclos de preparo

A Torre possui marcos de bloco e readiness. Provas intermediárias aparecem em 5/15/25/35 e chefes em 10/20/30/40.

### Readiness

O jogo já consegue traduzir o estado da equipe em score, classificação, verificações e recomendações antes da tentativa.

### Rotina do Lobby

Existe uma rotina derivada por herói, resolvida de forma determinística e sem simulação contínua em background.

### Visão enriquecida

O Lobby já agrupa personagens por local, atividade e atenção necessária. Essa é a primeira versão funcional do conceito vivo.

### Campo de Treino

Treino funcional por foco e tempo já existe.

### Proficiências

Descoberta gradual e ranks já existem. Técnicas leves são uma camada inicial, ainda com impacto mecânico controlado.

### Potencial

Análise de potencial por níveis já existe e revela insights gradualmente.

### Promoção

A rota 1★→2★ é funcional e não exige duplicata.

### Rota da Primeira Ascensão

A Base guia a primeira jornada até a primeira promoção sem criar um hard gate.

## 3. Parcialmente implementado

### Interface visual viva

Hoje a Base funciona como hub de instalações, com cards visuais de grande porte e placeholders temáticos. Grupos, alertas e rotinas derivados do estado continuam disponíveis em relatórios recolhíveis. Isso já melhora a leitura de espaço, mas ainda não é a cena operacional visual imaginada para o longo prazo.

A evolução pode usar uma composição 2D/semi-isométrica com instalações clicáveis, retratos/tokens e estados visuais, **sem** exigir pathfinding ou RTS.

### Memória individual

Afinidade, ferimentos, especialização, biblioteca e progressão já dão pistas de identidade, mas histórico pessoal, títulos e feitos ainda podem crescer.

### Proficiência como build

O sistema existe, mas seu impacto direto no combate/readiness é deliberadamente limitado. Deve ser ampliado apenas após balanceamento.

## 4. Conceitos futuros — não tratar como implementados

### Assistente/Fada do Lobby

Personagem original para resumir acontecimentos, alertar riscos e apresentar contexto. Não deve tomar decisões pelo jogador.

### Vice-Mestre

Função futura para um herói confiável, inicialmente com bônus simples e, depois, possível automação autorizada.

### Trabalhos do Lobby

Atribuições em oficina, enfermaria, pesquisa, vigilância, logística, treinamento etc. Devem usar aptidões/proficiências e ocupar o herói por um período.

### Emoções e comportamento adicionais

Ambição, medo, disciplina, lealdade, estresse e outros estados são possíveis, mas não devem duplicar moral/afinidade nem virar uma caixa-preta psicológica.

### Síntese

Primeira versão futura deve transformar materiais/equipamentos/excedentes. Sacrificar heróis únicos não é padrão desejado e exigiria decisão explícita.

### Promoções superiores

2★+ deve evoluir em etapas com requisitos claros, materiais, feitos e testes. Não copiar a regra 1★→2★ mecanicamente sem design.

### Instalações evolutivas

Portal, alojamento, treino, enfermaria, oficina, expedições e outras instalações podem ganhar nível/capacidade quando isso tiver impacto prático.

## 5. Loop desejado

1. Retornar ao Lobby.
2. Identificar o que mudou/quem precisa de atenção.
3. Invocar ou recrutar quando houver oportunidade.
4. Treinar e descobrir capacidades.
5. Organizar formação, equipamentos e ocupações.
6. Enviar expedições/trabalhos.
7. Avaliar readiness.
8. Subir a Torre.
9. Sofrer/receber consequências.
10. Voltar ao Lobby para reorganizar e evoluir.

O retorno ao Lobby deve parecer parte do progresso, não punição por falhar na Torre.

## 6. Princípios de implementação

- resolver idle por timestamps, nunca por processo contínuo obrigatório;
- manter regras em `src/game/`;
- UI apenas representa estado e envia intenções;
- preferir dados derivados a novos campos persistidos;
- qualquer estado persistido novo exige migration/normalização;
- não tornar PostgreSQL obrigatório;
- evoluir sistema por sistema;
- preservar heróis e saves existentes.

## 7. Ordem futura revisada

A ordem antiga deste documento já foi parcialmente executada. A partir do estado atual:

### Agora

1. validar HUD, bottom navigation e hub da Base no mobile;
2. substituir os placeholders conforme as artes forem aprovadas;
3. concluir rework de UX/UI focado em Heróis;
4. QA visual e de fluxo.

### Depois

4. escolher uma primeira camada de trabalho/função do Lobby;
5. expandir expedições e consequências;
6. definir promoção 2★→3★;
7. aprofundar memória individual;
8. evoluir a representação visual do Lobby;
9. considerar Vice-Mestre/Assistente quando houver sistemas suficientes para justificar automação/contexto.

## 8. O que evitar

- RTS completo;
- 3D obrigatório;
- pathfinding complexo;
- dezenas de emoções opacas;
- criar sistemas redundantes para números já cobertos por moral/afinidade/proficiência;
- sacrificar personagens únicos sem uma revisão explícita da filosofia do jogo;
- adicionar conteúdo de Torre enquanto a experiência base ainda estiver difícil de ler.

A meta não é simular cada segundo da vida dos heróis. É fazer o jogador **sentir** que eles existem entre uma batalha e outra.

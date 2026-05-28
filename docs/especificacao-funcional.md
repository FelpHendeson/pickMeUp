# Especificação Funcional do Jogo

## Visão geral
O jogo é um RPG estratégico em navegador com progressão por torre, invocação, formação de heróis, equipamentos, eventos e combate automático.

## Módulos e responsabilidades

### Estado e persistência
- `state.js` define a configuração global, o estado inicial e a estrutura de save.
- `storage.js` carrega, salva, valida e exporta o progresso local no navegador.

### Heróis e progressão
- `heroes.js` define classes, atributos, raridades, traços, XP, níveis e geração de heróis.
- `specializations.js` disponibiliza especializações por classe, requisitos de nível e bônus de combate.
- `injuries.js` controla ferimentos, penalidades temporárias e tratamento.
- `morale.js` gerencia moral, estados emocionais e bônus/penalidades de performance.

### Formação e equipamentos
- `formation.js` organiza a equipe ativa, limites de slots e presets de time.
- `equipment.js` gera, normaliza, equipa e calcula efeitos de equipamentos.

### Progresso principal
- `tower.js` define andares, capítulos, inimigos, modificadores e batalha da torre.
- `tower-events.js` controla eventos aleatórios da torre e escolhas do jogador.
- `weekly-events.js` aplica eventos semanais e seus modificadores.
- `rewards.js` concede recompensas de vitória, marcos e capítulos.

### Combate
- `battle.js` simula o combate automático com turnos, dano, cura, status e resultado.
- `battle-view.js` renderiza o replay, barras e log do combate.

### Sistemas auxiliares
- `summon.js` gerencia invocação e histórico de invocação.
- `expeditions.js` administra expedições, tempos e recompensas.
- `missions.js` valida missões diárias, conquistas e recompensas.

### Interface e narrativa
- `ui.js` renderiza interface, recursos, base e painéis do jogo.
- `narrative.js` gerencia cenas, capítulos e gatilhos narrativos.
- `preferences.js` guarda preferências do jogador.
- `view-utils.js` concentra utilitários de UI.
- `main.js` coordena ações do jogador, salvamento, renderização e fluxo de batalha.

## Fluxo principal do jogador
1. O jogador inicia a partida e recebe um estado salvo localmente.
2. Invoca heróis, organiza a formação e equipa itens.
3. Entra na torre, enfrentando andares com modificadores e eventos.
4. Combate automático resolve turnos, aplica danos, ferimentos e moral.
5. Recompensas de ouro, cristais, essência, fragmentos, energia e XP sustentam a progressão.
6. A torre avança, capítulos são completados e novas mecânicas são desbloqueadas.

## Regras de alto nível
- O progresso é salvo localmente no navegador.
- A torre é o eixo principal do jogo.
- Eventos semanais e aleatórios alteram probabilidades, recompensas e dificuldade.
- A equipe se desenvolve por XP, equipamento, especialização e sobrevivência em combate.

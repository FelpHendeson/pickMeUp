# GDD — Projeto Web: **Ascensão dos Ecos**

> **Documento histórico.** Este é o GDD original do MVP e descreve a fase inicial do projeto (incluindo sugestões de JS puro). A fonte de design vigente é `GDD_Ascensao_dos_Ecos_Alpha_Atualizado.md`, e a stack operacional atual é Next.js, React, TypeScript e Zustand. Mantido apenas como referência histórica.

## 1. Visão geral

**Ascensão dos Ecos** é um jogo web simplificado de estratégia, idle RPG e progressão por andares. O jogador assume o papel de um **Comandante**, responsável por invocar, treinar, equipar e enviar heróis para missões automáticas em uma torre dimensional.

A proposta é capturar a sensação de tensão de um jogo de gacha tático: heróis frágeis, recursos limitados, risco real, progressão por fases e decisões difíceis. Porém, o projeto evita copiar nomes, personagens, história, mundo ou estruturas específicas de qualquer obra existente. A inspiração fica no gênero e nas mecânicas gerais: invocação, equipe, torre, combate automático, raridade, evolução e gerenciamento.

## 2. Pilares de design

### 2.1 Estratégia antes do combate
O jogador não controla cada ataque em tempo real. A principal habilidade está em preparar bem a equipe: composição, formação, equipamentos, classes, atributos e escolha da missão.

### 2.2 Heróis importam
Mesmo heróis comuns podem ser úteis. A ideia é evitar que personagens de baixa raridade sejam apenas lixo de inventário. Um herói fraco pode virar especialista, explorador, tanque barato, suporte ou material de promoção.

### 2.3 Risco controlado
O jogo pode ter morte permanente opcional por modo. No MVP, a morte permanente deve existir apenas em missões especiais ou modo hardcore, para não frustrar cedo demais.

### 2.4 Progressão visível
Sempre deve haver algo subindo: nível da conta, andar da torre, poder da equipe, nível dos heróis, domínio de classe, construção da base, produção de recursos e conquistas.

### 2.5 Web first
O jogo deve funcionar bem no navegador, com interface simples, responsiva e sem necessidade inicial de engine pesada.

---

## 3. Público-alvo

Jogadores que gostam de:

- Manhwa/anime de progressão e sobrevivência.
- Jogos idle/incrementais.
- Gacha sem necessariamente gastar dinheiro real.
- RPG tático com formação de equipe.
- Sensação de “gerenciar uma guilda” em vez de controlar um único protagonista.

---

## 4. Plataforma

### Plataforma principal
- Web browser desktop.

### Plataforma secundária
- Mobile browser, após estabilização da UI.

### Stack sugerida
Para MVP simples:

- **Frontend:** HTML, CSS e JavaScript puro ou React/Next.js.
- **Backend:** Node.js com Express.
- **Banco:** SQLite no MVP local; PostgreSQL ou MongoDB em versão online.
- **Autenticação:** opcional no MVP. Pode começar com save local em `localStorage`.
- **Deploy:** Render, Vercel ou Railway.

### Recomendação prática
Começar com **single-player local**, usando `localStorage` para salvar o progresso. Depois migrar para backend.

---

## 5. Fantasia do jogador

O jogador é um comandante preso a um sistema dimensional. Ele não luta diretamente; ele constrói uma base, invoca heróis e tenta conquistar andares de uma torre instável. Cada andar possui monstros, eventos, armadilhas, chefes e recompensas.

A pergunta emocional do jogo é:

> “Você consegue fazer um grupo de heróis improváveis sobreviver, evoluir e vencer desafios cada vez mais injustos?”

---

## 6. Loop principal

### Loop de sessão curta
1. Coletar recursos da base.
2. Invocar ou recrutar heróis.
3. Treinar/equipar equipe.
4. Escolher missão ou andar da torre.
5. Assistir combate automático.
6. Receber recompensas.
7. Melhorar heróis/base.
8. Repetir.

### Loop de longo prazo
1. Subir andares da torre.
2. Desbloquear novas salas da base.
3. Liberar classes avançadas.
4. Promover heróis.
5. Obter equipamentos raros.
6. Enfrentar chefes de marco.
7. Reiniciar parcialmente com bônus permanentes, caso o modo prestígio seja implementado.

---

## 7. Modos de jogo

### 7.1 Torre principal
Modo central. O jogador enfrenta andares sequenciais.

- Cada andar possui 1 a 3 batalhas.
- A cada 5 andares há um mini-chefe.
- A cada 10 andares há um chefe de marco.
- O avanço desbloqueia sistemas novos.

### 7.2 Expedições diárias
Missões automáticas para farm de materiais.

Tipos:

- Mina de Cristais: moeda de invocação básica.
- Ruínas Antigas: materiais de promoção.
- Covil de Feras: equipamentos.
- Campo de Treino: experiência.

### 7.3 Arena simulada
Modo assíncrono contra times gerados pelo sistema.

No MVP, não precisa ter multiplayer real. Pode ser uma simulação contra formações pré-geradas.

### 7.4 Modo Hardcore
Opcional e desbloqueado depois.

- Heróis podem morrer permanentemente.
- Recompensas maiores.
- Ranking local.
- Não deve ser obrigatório para progressão principal.

---

## 8. Heróis

### 8.1 Atributos principais
Cada herói possui:

- **HP:** vida.
- **ATK:** dano físico/mágico base.
- **DEF:** redução de dano.
- **SPD:** frequência de ação.
- **FOCUS:** chance de usar habilidade.
- **LUCK:** chance crítica e drops extras.

### 8.2 Raridades
Raridades sugeridas:

- 1 estrela: comum.
- 2 estrelas: incomum.
- 3 estrelas: raro.
- 4 estrelas: épico.
- 5 estrelas: lendário.

Importante: raridade define teto inicial, não utilidade absoluta. Heróis de baixa raridade podem ter passivas úteis.

### 8.3 Classes iniciais
- Guerreiro: tanque/dano físico.
- Arqueiro: dano constante à distância.
- Mago: dano em área.
- Sacerdote: cura e escudos.
- Ladino: crítico e evasão.
- Guardião: defesa e provocação.

### 8.4 Personalidade
Cada herói pode ter um traço simples:

- Corajoso: ganha ATK quando aliado cai.
- Cauteloso: aumenta DEF quando HP está baixo.
- Ambicioso: ganha mais XP.
- Leal: protege aliados frágeis.
- Instável: maior dano, menor defesa.

No MVP, personalidade pode ser apenas uma passiva numérica.

---

## 9. Sistema de invocação

### 9.1 Tipos de invocação
- **Invocação comum:** usa ouro ou cristais comuns.
- **Invocação superior:** usa cristais raros.
- **Contrato de classe:** aumenta chance de uma classe específica.

### 9.2 Taxas sugeridas para MVP
Invocação comum:

- 1 estrela: 60%
- 2 estrelas: 28%
- 3 estrelas: 10%
- 4 estrelas: 2%
- 5 estrelas: 0%

Invocação superior:

- 2 estrelas: 50%
- 3 estrelas: 35%
- 4 estrelas: 12%
- 5 estrelas: 3%

### 9.3 Sistema anti-frustração
Implementar “garantia” simples:

- A cada 10 invocações superiores, garantir ao menos 3 estrelas.
- A cada 50 invocações superiores, garantir 4 estrelas ou mais.

Para MVP offline, evitar monetização real. Nada de carteira chorando no banho.

---

## 10. Combate

### 10.1 Estrutura
Combate automático em turnos rápidos.

Fluxo:

1. Ordenar unidades por SPD.
2. Unidade escolhe alvo.
3. Executa ataque básico ou habilidade.
4. Aplica dano, cura, escudo ou status.
5. Verifica mortes.
6. Próxima unidade age.
7. Combate acaba quando um lado é derrotado.

### 10.2 Formação
Equipe de até 5 heróis:

- Linha frontal: 2 slots.
- Linha traseira: 3 slots.

Linha frontal recebe mais ataques. Linha traseira é mais segura, mas vulnerável a inimigos específicos.

### 10.3 Energia de habilidade
Cada herói ganha energia ao:

- Atacar.
- Receber dano.
- Derrotar inimigos.

Ao chegar a 100 de energia, usa habilidade automaticamente.

### 10.4 Estados negativos
- Sangramento: dano por turno.
- Atordoamento: perde próxima ação.
- Queimadura: dano e redução de cura.
- Medo: chance de falhar ataque.
- Marca: recebe mais dano.

No MVP, começar com apenas sangramento, atordoamento e marca.

---

## 11. Progressão dos heróis

### 11.1 Nível
Heróis ganham XP em combates e expedições.

Fórmula simples:

`xpParaProximoNivel = 100 * nivelAtual * 1.15`

### 11.2 Promoção
Ao atingir nível máximo da raridade, o herói pode ser promovido.

Exemplo:

- 1 estrela: nível máximo 10.
- 2 estrelas: nível máximo 20.
- 3 estrelas: nível máximo 30.
- 4 estrelas: nível máximo 40.
- 5 estrelas: nível máximo 50.

Promoção aumenta estrela e reseta parcialmente o nível ou aumenta o limite.

### 11.3 Despertar
Sistema avançado para depois do MVP.

Despertar desbloqueia:

- Nova passiva.
- Alteração visual.
- Bônus de classe.

---

## 12. Equipamentos

### 12.1 Slots
- Arma.
- Armadura.
- Acessório.

### 12.2 Raridade dos equipamentos
- Comum.
- Incomum.
- Raro.
- Épico.
- Lendário.

### 12.3 Atributos possíveis
- ATK +x.
- DEF +x.
- HP +x.
- SPD +x.
- Crítico +x%.
- Cura recebida +x%.

No MVP, equipamentos podem ser gerados proceduralmente com nome + raridade + bônus.

---

## 13. Base do jogador

A base é o hub de progressão.

### 13.1 Salas iniciais
- Portal de Invocação: recruta heróis.
- Quartel: gerencia equipe.
- Campo de Treino: gera XP passivo.
- Oficina: cria/melhora equipamentos.
- Conselho de Missões: expedições.

### 13.2 Melhorias
Cada sala pode subir de nível.

Exemplos:

- Portal nível 2: reduz custo de invocação comum.
- Campo de Treino nível 2: aumenta XP passivo.
- Oficina nível 2: permite melhorar equipamentos raros.
- Quartel nível 2: aumenta limite de heróis armazenados.

---

## 14. Recursos

### 14.1 Recursos principais
- Ouro: melhorias comuns.
- Cristais: invocação.
- Essência: promoção de heróis.
- Fragmentos: craft/melhoria de equipamentos.
- Energia: limita tentativas de torre/expedição.

### 14.2 Geração
- Ouro: base + torre.
- Cristais: missões, conquistas e marcos.
- Essência: expedições e descarte de duplicatas.
- Fragmentos: equipamentos desmontados.
- Energia: regenera com o tempo.

---

## 15. Economia inicial

### Valores base sugeridos
- Invocação comum: 100 ouro.
- Invocação superior: 100 cristais.
- Melhorar sala nível 1 > 2: 500 ouro.
- Energia máxima inicial: 30.
- Custo por andar da torre: 5 energia.
- Regeneração: 1 energia a cada 5 minutos.

### Recompensa por andar
`ouro = 50 + andar * 15`

`xp = 30 + andar * 10`

`chanceEquipamento = min(5 + andar * 0.5, 35)%`

---

## 16. Torre

### 16.1 Estrutura dos andares
Cada andar possui:

- Nível recomendado.
- Tipo de inimigo dominante.
- Modificador opcional.
- Recompensa base.

### 16.2 Modificadores
- Névoa: reduz precisão.
- Terreno estreito: reduz vantagem da linha traseira.
- Mana instável: habilidades custam menos energia.
- Maldição: cura reduzida.

No MVP, usar modificadores apenas a partir do andar 6.

### 16.3 Chefes
A cada 10 andares:

- Chefe com mecânica própria.
- Recompensa garantida.
- Desbloqueio de sistema.

Exemplo:

- Andar 10: desbloqueia Oficina.
- Andar 20: desbloqueia Promoção.
- Andar 30: desbloqueia Arena simulada.

---

## 17. Inimigos

### Arquétipos
- Slime de Pedra: tanque simples.
- Morcego Sombrio: rápido e frágil.
- Goblin Saqueador: dano médio.
- Cultista: aplica marca.
- Golem: chefe defensivo.
- Quimera: chefe com múltiplas ações.

### IA simples
- Atacar alvo da frente.
- Se houver aliado ferido, curar.
- Se habilidade disponível, usar.
- Chefe pode focar herói com menor HP.

---

## 18. Interface

### Telas principais
1. **Dashboard/Base**
   - Recursos.
   - Produção passiva.
   - Botões para salas.

2. **Heróis**
   - Lista de heróis.
   - Filtros por classe/raridade.
   - Detalhes, nível, equipamento.

3. **Formação**
   - 5 slots.
   - Drag and drop opcional.
   - Poder total estimado.

4. **Torre**
   - Andar atual.
   - Prévia de inimigos.
   - Recompensas.
   - Botão iniciar.

5. **Combate**
   - Campo simples 2D.
   - Log de ações.
   - Barras de HP.
   - Velocidade 1x/2x.

6. **Invocação**
   - Banner comum.
   - Banner superior.
   - Histórico de pulls.

7. **Expedições**
   - Missões com duração.
   - Recompensa prevista.
   - Equipe enviada.

---

## 19. Direção de arte

### Estilo recomendado
- Pixel art 2D ou chibi anime simples.
- Personagens em 3/4 side view.
- Interface escura com cristais, runas e painéis metálicos.

### Identidade visual original
Evitar símbolos, uniformes, nomes ou designs reconhecíveis da obra de inspiração.

### Paleta inicial
- Fundo: azul escuro/cinza.
- Energia dimensional: ciano/roxo.
- Perigo: vermelho escuro.
- Recompensa: dourado.

---

## 20. Áudio

Para MVP, áudio pode ser opcional.

Sugestões futuras:

- Música calma na base.
- Música tensa na torre.
- SFX de invocação.
- SFX de ataque, cura e crítico.

---

## 21. MVP — Escopo mínimo

### MVP jogável precisa ter
- Tela de base.
- Sistema de recursos.
- Invocação simples.
- Cadastro/geração de heróis.
- Lista de heróis.
- Formação com até 5 personagens.
- Torre com 10 andares.
- Combate automático em turnos.
- Recompensas por vitória.
- Salvamento local.

### Não entra no MVP
- Multiplayer real.
- Monetização.
- Chat.
- Clãs.
- Ranking online.
- Animações complexas.
- História longa.
- Morte permanente obrigatória.
- Sistema de equipamentos muito profundo.

---

## 22. Modelo de dados sugerido

### Hero
```json
{
  "id": "hero_001",
  "name": "Kael",
  "rarity": 2,
  "class": "warrior",
  "level": 1,
  "xp": 0,
  "maxLevel": 20,
  "stats": {
    "hp": 120,
    "atk": 18,
    "def": 10,
    "spd": 8,
    "focus": 5,
    "luck": 3
  },
  "trait": "brave",
  "equipment": {
    "weapon": null,
    "armor": null,
    "accessory": null
  }
}
```

### PlayerSave
```json
{
  "accountLevel": 1,
  "towerFloor": 1,
  "resources": {
    "gold": 500,
    "crystals": 100,
    "essence": 0,
    "fragments": 0,
    "energy": 30
  },
  "heroes": [],
  "formation": [null, null, null, null, null],
  "baseRooms": {
    "summonPortal": 1,
    "trainingGround": 1,
    "workshop": 0,
    "missionBoard": 1
  }
}
```

---

## 23. Regras de combate em pseudocódigo

```js
function runBattle(playerTeam, enemyTeam) {
  const units = [...playerTeam, ...enemyTeam];

  while (teamAlive(playerTeam) && teamAlive(enemyTeam)) {
    const turnOrder = units
      .filter(unit => unit.hp > 0)
      .sort((a, b) => b.stats.spd - a.stats.spd);

    for (const unit of turnOrder) {
      if (unit.hp <= 0) continue;

      const enemies = unit.side === 'player' ? enemyTeam : playerTeam;
      const target = chooseTarget(enemies);

      if (unit.energy >= 100) {
        useSkill(unit, target, enemies);
        unit.energy = 0;
      } else {
        basicAttack(unit, target);
        unit.energy += 25;
      }

      if (!teamAlive(playerTeam) || !teamAlive(enemyTeam)) break;
    }
  }

  return teamAlive(playerTeam) ? 'victory' : 'defeat';
}
```

---

## 24. Balanceamento inicial

### Poder de herói
`power = hp * 0.3 + atk * 4 + def * 3 + spd * 5 + focus * 2 + luck`

### Dificuldade do andar
`floorPower = 80 + floor * 35 + Math.pow(floor, 1.25) * 10`

### Vitória esperada
O jogador deve conseguir vencer quando:

`teamPower >= floorPower * 0.9`

Mas composição e classes devem influenciar para não virar só matemática fria. Senão vira planilha com cosplay.

---

## 25. Progressão dos primeiros 10 andares

| Andar | Inimigos | Mecânica | Recompensa |
|---|---|---|---|
| 1 | Slimes | Tutorial | Ouro |
| 2 | Slimes + Morcego | Velocidade | Ouro + XP |
| 3 | Goblins | Dano físico | Cristais |
| 4 | Morcegos | Alvos frágeis | XP |
| 5 | Elite Goblin | Mini-chefe | Equipamento comum |
| 6 | Cultistas | Marca | Essência |
| 7 | Slime de Pedra | Defesa alta | Fragmentos |
| 8 | Mistos | Formação | Cristais |
| 9 | Cultistas + Goblins | Pressão | Equipamento incomum |
| 10 | Golem Antigo | Chefe | Desbloqueia Oficina |

---

## 26. Monetização

Para o MVP, não monetizar.

Caso vire produto real, priorizar:

- Cosméticos.
- Passe de progresso sem paywall agressivo.
- Compra única de versão premium.
- Sem lootbox paga no início.

Como o jogo usa gacha, é melhor manter a invocação ligada a moedas obtidas jogando. Isso reduz problemas éticos, legais e de balanceamento.

---

## 27. Roadmap

### Fase 1 — Protótipo
- Gerador de heróis.
- Invocação.
- Combate automático.
- 10 andares.
- Save local.

### Fase 2 — MVP completo
- Base com salas.
- Expedições.
- Equipamentos simples.
- Balanceamento básico.
- UI responsiva.

### Fase 3 — Progressão avançada
- Promoção.
- Classes avançadas.
- Chefes com mecânicas.
- Eventos semanais.

### Fase 4 — Online
- Conta de usuário.
- Backend.
- Ranking.
- Arena assíncrona.
- Cloud save.

---

## 28. Critérios de sucesso do MVP

O MVP será considerado bom se:

- O jogador entende o loop em menos de 3 minutos.
- O primeiro combate acontece em menos de 1 minuto.
- Há vontade de “só mais um andar”.
- A invocação gera expectativa sem bloquear progresso.
- O jogador sente que formação e preparo importam.
- O projeto pode ser expandido sem reescrever tudo do zero.

---

## 29. Riscos de design

### Risco 1: gacha virar frustração
Solução: garantir heróis úteis e recompensas previsíveis.

### Risco 2: combate automático parecer sem graça
Solução: log claro, habilidades visíveis, velocidade ajustável e formação relevante.

### Risco 3: progressão lenta demais
Solução: primeiros 10 andares rápidos e cheios de desbloqueios.

### Risco 4: escopo explodir
Solução: nada de multiplayer, lore gigante ou sistema de itens complexo no começo.

---

## 30. Resumo executivo

**Ascensão dos Ecos** é um RPG idle/gacha web de torre, onde o jogador gerencia heróis invocados e tenta avançar por andares cada vez mais difíceis. O MVP deve focar em invocação, formação, combate automático, recursos, progressão e salvamento local. A base do jogo é simples, mas expansível: primeiro nasce como protótipo web, depois pode evoluir para backend, ranking, eventos, arena e progressão profunda.

O coração do jogo é fazer o jogador pensar:

> “Meu time é fraco... mas talvez, se eu ajustar a formação, treinar o arqueiro e sacrificar um pouco de defesa por velocidade, dê para passar esse andar.”

Quando o jogador pensa isso, o jogo começou a funcionar.


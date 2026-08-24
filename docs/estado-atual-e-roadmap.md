# Estado Atual e Roadmap de Retomada

**Data:** 24/08/2026  
**Versão:** 0.10.0  
**Branch canônica:** `master`  
**Último baseline funcional/UI:** `fcc5f75` — `ui: base de layout focado e refatoracao da aba Torre (fase 2)`

## 1. Onde o projeto realmente parou

O projeto não parou em migração, nem no MVP, nem na criação dos primeiros sistemas de herói.

A sequência de desenvolvimento de 02–03/07/2026 avançou por:

1. marcos de Torre e readiness;
2. rotina idle do Lobby;
3. treino funcional;
4. proficiências e técnicas leves;
5. análise de potencial;
6. promoção 1★→2★;
7. balanceamento do início;
8. Rota da Primeira Ascensão;
9. visão enriquecida do Lobby Vivo;
10. Fase 1 do rework global de UX/UI;
11. **Fase 2: layout focado aplicado à Torre.**

Portanto, o ponto de retomada correto é **Fase 3 do rework: Heróis em modo foco**.

## 2. Última entrega concluída

A Fase 2 criou `app/components/ui/game-layout.tsx` e transformou a Torre no piloto da nova linguagem de interface.

Componentes disponíveis:

- `GamePage`;
- `GamePageHeader`;
- `CompactStatStrip`;
- `PrimaryActionPanel`;
- `FocusPanel`;
- `SecondaryInfoGrid`;
- `DetailDrawer`.

Na Torre:

- a primeira dobra mostra contexto, andar, preparo, risco, energia e ação principal;
- o mapa integral de 40 andares deixou de dominar a tela;
- mapa completo, readiness detalhado, inimigos, recompensas, modificadores e dificuldade ficam disponíveis sob demanda;
- nenhum contrato de domínio/save foi alterado nessa fase.

## 3. Matriz atual de sistemas

| Sistema | Estado | Observação |
|---|---|---|
| Next/React/TS/Zustand | Implementado | Stack operacional do `master` |
| localStorage | Implementado | Save principal |
| PostgreSQL/Prisma | Experimental | Snapshot manual/opcional |
| Migrations de save | Implementado | `schemaVersion` 5 |
| Roster único | Implementado | Legacy continua compatível |
| Invocação sem duplicata | Implementado | Pool finito, sem consumir no esgotamento |
| 5 tickets + especial | Implementado | Onboarding de nova jornada |
| Formação/presets | Implementado | 5 heróis, 2 na frente |
| Equipamento flexível | Implementado | Afinidade informa; não bloqueia por classe |
| Torre 1–40 | Implementado | 4 capítulos |
| Marcos/readiness | Implementado | Provas + chefes + diagnóstico |
| Combate/resultado/replay | Implementado | Fluxo jogável |
| Lobby Vivo derivado | Implementado | Cards/grupos/alertas por estado |
| Treino idle | Implementado | Focos técnicos persistidos |
| Proficiências | Implementado | Descoberta/ranks; impacto leve |
| Potencial | Implementado | Análise níveis 0–5 |
| Promoção 1★→2★ | Implementado | 150 ouro + 5 fragmentos |
| Promoções superiores | Pendente | Explicitamente bloqueadas |
| Rota da Primeira Ascensão | Implementado | Trilha derivada e não bloqueante |
| Expedições | Implementado | Temporizadas |
| Moral/ferimentos | Implementado | Consequências de herói |
| Afinidade/especializações | Implementado | Progressão existente |
| Relíquias/biblioteca | Implementado | Progressão/coleção |
| Layout focado — Torre | Concluído | Fase 2 |
| Layout focado — Heróis | Próximo | Fase 3 |
| Cena visual rica do Lobby | Parcial/futuro | Estado atual usa representação por cards |
| Trabalhos do Lobby | Futuro | Ainda não tratar como implementado |
| Emoções adicionais | Futuro | Não duplicar moral/afinidade |
| Síntese | Futuro | Sem sacrificar heróis na primeira versão |
| Vice-Mestre/Assistente | Futuro | Conceitos de produto |

## 4. Próxima entrega — Fase 3: Heróis em modo foco

### Objetivo

Reduzir a densidade de `HeroRosterPanel.tsx` sem remover profundidade.

### Princípios

- reutilizar `game-layout.tsx`;
- manter um herói selecionado como foco principal;
- roster deve ser navegação/seleção, não competir visualmente com todos os detalhes;
- primeira dobra deve priorizar identidade, condição, função/desenvolvimento e uma ação relevante;
- treino, proficiências, potencial, ascensão, equipamentos e histórico devem ser organizados em seções/tabs/drawers coerentes;
- não alterar regras do domínio nesta fase;
- não criar nova migration;
- preservar mobile.

### Critérios de aceite

1. O jogador identifica rapidamente qual herói está selecionado e seu estado.
2. A ação primária é evidente.
3. Informações secundárias não ocupam permanentemente a primeira dobra.
4. Treino/proficiência/potencial/promoção continuam acessíveis.
5. Nenhuma regra de herói/save muda.
6. `typecheck`, testes e build continuam passando.

## 5. Fase seguinte — Base/Lobby

Depois de validar Heróis:

- consolidar a Base dentro da mesma hierarquia visual;
- preservar `Lobby Vivo` e `Rota da Primeira Ascensão`;
- evitar voltar a transformar a Base em dashboard com dezenas de cards concorrentes;
- preparar a interface para uma representação visual mais viva no futuro, sem introduzir RTS/pathfinding.

## 6. Depois do rework

Prioridade de produto recomendada:

1. aprofundar funções do Lobby e heróis sem criar sistemas redundantes;
2. evoluir promoção acima de 2★ por etapas;
3. aumentar variedade de expedições/Lobby;
4. enriquecer memória individual e biblioteca;
5. adicionar conteúdo de Torre somente quando houver necessidade real de retenção;
6. amadurecer cloud save/publicação quando uma demo externa virar objetivo.

## 7. Riscos atuais

- `GameShell.tsx`, `HeroRosterPanel.tsx` e `globals.css` já são grandes; refatorar incrementalmente, não reescrever tudo.
- Muitos sistemas existem; o maior risco de UX é complexidade invisível ou concorrente.
- Não transformar toda ideia do Lobby Vivo em estado persistido; prefira dados derivados.
- Não criar novo recurso/economia para resolver problemas que podem ser solucionados com recursos existentes.
- Cloud save continua experimental; localStorage deve permanecer resiliente.
- Qualquer novo estado persistido precisa de migration/normalização.

## 8. Definição de pronto para o ciclo de UX

O rework estará consolidado quando Torre, Heróis e Base compartilharem uma linguagem consistente de foco, hierarquia e progressive disclosure, com QA desktop/mobile e sem regressão do domínio.

Até lá, **não é prioridade adicionar outra grande camada sistêmica**.
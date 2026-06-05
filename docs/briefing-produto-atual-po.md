# Briefing do Software Atual para PO

- **Produto:** Ascensão dos Ecos
- **Versão técnica atual:** 0.10.0
- **Data do briefing:** 2026-06-05
- **Status:** Alpha jogável local, com UI principal em Next.js/React/TypeScript.

## 1. Resumo executivo

Ascensão dos Ecos é um RPG web single-player de progressão por torre, gestão de heróis, combate automático, gacha, recrutamento por contrato, expedições, missões, relíquias, eventos e save local.

O produto já saiu do estágio de protótipo técnico. A aplicação atual tem loop jogável, sistemas de progressão, interface temática Dark Fantasy e arquitetura modular suficiente para evoluir features sem reconstruir a base.

O próximo desafio de produto não é “fazer funcionar”; é decidir quais sistemas merecem profundidade, qual cadência de progressão será priorizada e quais features aproximam a Alpha de uma Beta validável.

## 2. Estado atual do produto

### O que o jogador já consegue fazer

- Entrar no jogo pela home e abrir a experiência principal em `/jogar`.
- Gerenciar uma base/hub com resumo do estado atual e próxima ação sugerida.
- Ver recursos no HUD global: ouro, cristais, essência, fragmentos, energia e recursos secundários.
- Invocar heróis por ritual comum/superior.
- Recrutar heróis por contratos, escolhendo entre candidatos.
- Gerenciar heróis, atributos, moral, ferimentos, equipamentos e disponibilidade.
- Montar formação para a Torre.
- Subir a Torre por campanha, capítulos, andares, chefes, riscos e modificadores.
- Resolver eventos da Torre.
- Ver resultado de combate com recompensas, progressão e consequências.
- Usar inventário com equipamentos e consumíveis.
- Enviar heróis em expedições temporizadas.
- Coletar missões diárias e conquistas.
- Evoluir relíquias permanentes.
- Consultar Biblioteca/grimório de descobertas.
- Ajustar preferências, exportar/importar save, resetar progresso e testar cloud save experimental.

### Estado de UX/UI

- Visual global padronizado em Dark Fantasy/Fantasia Medieval.
- Navegação principal agrupada por áreas.
- HUD global compacto.
- Polimento mobile aplicado para reduzir overflow, melhorar toque, empilhar grids e tornar modais roláveis.
- Módulos principais reformulados visualmente: Base, Torre, Resultado de Combate, Heróis, Inventário, Expedições, Invocação, Recrutamento, Biblioteca, Configurações/Save e Sobre.

## 3. Stack e arquitetura

### Stack operacional

- **Next.js 16**: aplicação web, rotas e API.
- **React 19**: UI principal.
- **TypeScript 6**: regras e contratos.
- **Zustand**: store central da UI.
- **localStorage**: save principal do jogador.
- **Prisma + PostgreSQL**: cloud save experimental/local opcional.
- **Docker Compose**: banco local para validações de PostgreSQL.

### Separação técnica

- `src/game/`: núcleo de regras puras, economia, combate, torre, heróis, save e sistemas.
- `src/store/gameStore.ts`: ponte entre UI e core, persistindo o save local.
- `app/components/`: painéis React por domínio.
- `app/components/layout/GameShell.tsx`: navegação, HUD e composição das telas.
- `app/globals.css`: design system visual, responsividade e acabamento Dark Fantasy.
- `app/api/saves/[playerId]`: API experimental de snapshot de save em PostgreSQL.

### Diretriz importante

O jogo deve continuar funcionando sem PostgreSQL. O banco é opcional nesta fase e não deve ser requisito para jogar.

## 4. Sistemas implementados

### Core de progressão

- Torre com andares, capítulos, chefes e modificadores.
- Dificuldades Normal, Desafio e Hardcore.
- Eventos semanais locais.
- Eventos aleatórios da Torre.
- Recompensas por vitória, capítulo, drops e eventos.
- Energia como limitador leve de ritmo.

### Heróis e time

- Geração procedural de heróis.
- Classes, raridade, atributos, XP e nível.
- Formação com frente/retaguarda.
- Presets de equipe.
- Moral e ferimentos.
- Especializações.
- Afinidade entre heróis.
- Memorial para heróis mortos.

### Aquisição de heróis

- Invocação comum por ouro.
- Invocação superior por cristais.
- Histórico de invocações.
- Recrutamento alternativo por contratos.
- Escolha entre candidatos.
- Veteranos temáticos da Torre.

### Itens e economia

- Recursos principais: ouro, cristais, essência, fragmentos, fragmentos de eco e energia.
- Equipamentos por tipo, raridade e bônus.
- Consumíveis com efeitos táticos.
- Relíquias permanentes com custo em fragmentos de eco.

### Atividades paralelas

- Expedições temporizadas.
- Recompensas escaladas por poder enviado.
- Heróis ocupados ficam indisponíveis.
- Missões diárias.
- Conquistas permanentes.

### Conteúdo e descoberta

- Biblioteca/grimório para inimigos, chefes, capítulos, eventos, relíquias e memória da guilda.
- Narrativa curta por gatilhos.
- Registro de descobertas persistido no save.

## 5. Qualidade e validação atual

### Scripts disponíveis

- `npm run typecheck`: valida TypeScript.
- `npm test`: roda regressão core e fixtures.
- `npm run build`: build Next.
- `npm run validate`: fluxo completo sem banco.
- `npm run validate:db`: fluxo com PostgreSQL local.

### Cobertura atual

- Regressões do core.
- Fixtures de contratos importantes.
- Smoke/regressão de banco.
- Validação de build Next.

### Limitação atual

A validação visual automatizada ainda não está consolidada. A revisão de UI depende de QA manual no navegador, especialmente em mobile.

## 6. Pontos fortes atuais

- Loop principal já está jogável.
- Arquitetura modular favorece evolução incremental.
- Save local é simples, rápido e resiliente.
- UI já comunica melhor risco, recursos, progresso e consequências.
- Produto tem identidade visual mais consistente.
- Torre é uma boa âncora de progressão.
- Recrutamento por contrato diferencia aquisição controlada de gacha.
- Biblioteca ajuda a transformar conteúdo em descoberta/lore.
- Cloud save pode evoluir sem bloquear o jogo local.

## 7. Riscos e lacunas

### Produto

- A progressão de longo prazo ainda precisa de mais metas claras.
- O conteúdo da Torre pode ficar repetitivo sem novos eventos, chefes e modificadores.
- A economia ainda precisa de balanceamento real após sessões mais longas.
- A Biblioteca existe, mas depende de mais conteúdo/lore para virar motivador forte.
- A diferença entre especializações, afinidades e relíquias pode precisar de tutorialização.

### UX

- Mesmo com polimento mobile, ainda falta QA visual real em dispositivos/tamanhos variados.
- Algumas telas têm muita informação e podem precisar de microcopy/tutorial contextual.
- O jogador novo pode não entender imediatamente quais sistemas impactam combate.

### Técnico

- Não há suíte de teste visual/e2e.
- Cloud save ainda é experimental.
- Migração formal de save por versão ainda é necessidade futura.
- Dados ainda estão majoritariamente no core TypeScript; uma futura expansão de conteúdo pode pedir ferramentas internas ou arquivos de dados mais organizados.

## 8. Decisões que o PO precisa tomar

### Direção de produto

1. A próxima Alpha deve priorizar mais conteúdo jogável ou mais profundidade sistêmica?
2. A Torre deve continuar como eixo absoluto ou Base/Expedições devem ganhar mais peso?
3. A progressão permanente deve focar em relíquias, conta, guilda ou heróis individuais?
4. A experiência deve tender mais para idle/autochess/coleção ou roguelite de risco?
5. A Beta precisa ter conta/cloud save real ou pode continuar single-player local?

### Escopo de conteúdo

1. Quantos capítulos devem existir antes da primeira Beta?
2. Quantos chefes e eventos são necessários para reduzir repetição?
3. A Biblioteca deve virar sistema de coleção com recompensas?
4. Heróis devem ter histórias/memória individual ou continuar procedurais?

### Monetização/produção futura

1. O gacha é apenas mecânica de progressão ou será base de economia futura?
2. O jogo deve ser preparado para login/conta?
3. O deploy deve ir para Vercel como demo pública quando a Alpha estabilizar?

## 9. Roadmap sugerido

### Próximo passo recomendado: Alpha 0.11 — Clareza e retenção inicial

Objetivo: melhorar a primeira sessão e reduzir dúvidas.

Features candidatas:

- Tutorial leve de primeira sessão.
- Checklist guiado na Base.
- Explicação de poder, risco, moral e ferimentos.
- Indicação mais clara de “por que perdi”.
- QA mobile manual formal.
- Ajustes de economia inicial.

Critério de sucesso:

- Jogador entende em até 5 minutos como invocar/recrutar, montar formação e enfrentar Torre.

### Alpha 0.12 — Mais conteúdo para Torre

Objetivo: aumentar variedade do coração do jogo.

Features candidatas:

- Novos eventos de Torre.
- Novos modificadores regionais.
- Mais chefes com mecânicas distintas.
- Recompensas especiais por marcos.
- Mais inimigos com identidade.
- Melhor relação entre capítulo e lore.

Critério de sucesso:

- Subir andares não parece repetir o mesmo padrão de combate e recompensa.

### Alpha 0.13 — Progressão permanente e coleção

Objetivo: reforçar motivação de médio/longo prazo.

Features candidatas:

- Biblioteca com recompensas de coleção.
- Relíquias com árvores ou escolhas.
- Metas de conta/guilda.
- Conquistas com impacto mais visível.
- Memorial/heróis com registros mais relevantes.

Critério de sucesso:

- Jogador tem motivos para voltar além de “subir mais um andar”.

### Alpha 0.14 — Heróis com identidade

Objetivo: aumentar apego aos personagens.

Features candidatas:

- Traits mais expressivos.
- Pequenas histórias por classe/raridade.
- Eventos que citam heróis específicos.
- Afinidade mais visível na UI.
- Evolução de especialização mais estratégica.

Critério de sucesso:

- O jogador reconhece heróis importantes do próprio elenco.

### Alpha 0.15 — Persistência e publicação

Objetivo: preparar demo pública controlada.

Features candidatas:

- Migração formal de save por versão.
- Cloud save mais robusto.
- Tela de changelog.
- QA checklist completo.
- Deploy Vercel.
- Telemetria mínima opcional, se for decisão de produto.

Critério de sucesso:

- Demo pode ser acessada por usuários externos sem risco alto de perda de progresso.

## 10. Priorização sugerida

### P0 — Antes de expandir muito conteúdo

- Tutorial/checklist inicial.
- QA mobile real.
- Migração formal de save.
- Balanceamento inicial de economia/energia.
- Mais clareza de derrota/vitória.

### P1 — Próximas features de maior impacto

- Mais eventos e chefes da Torre.
- Recompensas de coleção na Biblioteca.
- Relíquias com escolhas.
- Afinidade mais visível.
- Conteúdo narrativo curto por capítulo.

### P2 — Após validação do loop

- Cloud save mais maduro.
- Login/conta.
- Ranking ou comparação assíncrona.
- Ferramentas internas de conteúdo.
- Telemetria.

## 11. Recomendação objetiva

Para o próximo ciclo, a recomendação é não começar por mais uma grande reformulação visual. A base visual e mobile já recebeu polimento suficiente para Alpha.

O melhor próximo passo é uma Alpha focada em:

1. onboarding da primeira sessão;
2. clareza de risco/resultado;
3. mais variedade na Torre;
4. proteção futura do save.

Isso dá ao PO material para validar retenção, entendimento do loop e apetite por expansão de conteúdo.

## 12. Checklist para reunião com PO

- Confirmar qual é o objetivo da próxima Alpha.
- Escolher entre foco em conteúdo, retenção ou persistência.
- Definir se a demo pública entra no próximo ciclo ou no seguinte.
- Priorizar 3 a 5 features no máximo.
- Definir critérios de aceite mensuráveis para a próxima entrega.
- Decidir se cloud save continua experimental ou vira prioridade.
- Decidir se Biblioteca ganha recompensas de coleção.
- Decidir se heróis terão mais identidade narrativa.

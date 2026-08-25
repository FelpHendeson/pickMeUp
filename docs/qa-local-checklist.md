# Checklist de QA Local

Use após mudanças de UI, gameplay, save, economia ou infraestrutura.

## Preparação

- [ ] `npm install` se dependências mudaram.
- [ ] `npm run typecheck`.
- [ ] `npm test`.
- [ ] `npm run build` para mudanças de UI/Next.
- [ ] Abrir o jogo com `npm run dev`.
- [ ] Confirmar funcionamento sem `.env`/PostgreSQL.
- [ ] Para DB: `npm run db:up`, `npm run db:migrate` e cloud save habilitado.

## 1. Nova jornada e onboarding

- [ ] Criar novo save.
- [ ] Confirmar 250 ouro, 100 cristais e 30 energia.
- [ ] Confirmar 5 tickets comuns iniciais.
- [ ] Confirmar invocação especial disponível.
- [ ] Verificar que rituais pagos ficam bloqueados durante o onboarding.
- [ ] Consumir os 5 tickets.
- [ ] Abrir especial e conferir até 3 opções.
- [ ] Recarregar a página e confirmar persistência das opções especiais.
- [ ] Escolher o herói especial.
- [ ] Confirmar liberação dos rituais pagos.
- [ ] Confirmar que `Rota da Primeira Ascensão` mostra o próximo objetivo coerente.

## 2. Roster e invocação

- [ ] Confirmar que heróis do roster possuem identidade estável.
- [ ] Invocar e confirmar ausência de duplicata do mesmo `definitionId`.
- [ ] Confirmar que pool esgotado não consome recurso.
- [ ] Importar/usar save legacy, se houver fixture, e confirmar que heróis sem `definitionId` continuam válidos.
- [ ] Usar contrato e escolher 1 entre candidatos.

## 3. Heróis e formação

- [ ] Abrir Heróis e selecionar personagens diferentes.
- [ ] Conferir raridade, classe, traço, nível, moral e condição.
- [ ] Adicionar/remover heróis da formação.
- [ ] Confirmar máximo de 5 e 2 slots frontais.
- [ ] Salvar/aplicar preset.
- [ ] Confirmar que herói indisponível não entra incorretamente.

## 4. Equipamentos

- [ ] Equipar item compatível.
- [ ] Comparar item novo com equipado.
- [ ] Testar item de baixa afinidade de classe e confirmar aviso sem bloqueio arbitrário.
- [ ] Confirmar bloqueio de slot tecnicamente incompatível.
- [ ] Trocar/remover equipamento.
- [ ] Confirmar recálculo coerente de atributos/poder.

## 5. Lobby Vivo

- [ ] Abrir Base.
- [ ] Confirmar banner principal e sete instalações visuais clicáveis.
- [ ] Abrir Portal, Quartel, Arsenal, Missões, Expedições, Relíquias e Biblioteca pelos módulos da Base.
- [ ] Confirmar que os placeholders estão identificados como provisórios.
- [ ] Abrir `Relatórios e atividade do Lobby` sob demanda.
- [ ] Confirmar resumo total/treinando/feridos/expedição/prontos.
- [ ] Conferir grupos por local.
- [ ] Conferir bloco de atenção quando houver herói ferido, HP/moral baixo ou outro alerta.
- [ ] Usar alerta clicável e confirmar navegação correta.
- [ ] Confirmar que simplesmente abrir/renderizar o Lobby não concede recursos/progresso.

## 6. Treino

- [ ] Escolher foco de treino para um herói.
- [ ] Confirmar persistência após reload.
- [ ] Avançar/coletar progresso conforme mecanismo atual.
- [ ] Confirmar que treino não aumenta diretamente ATK/DEF/HP/SPD por si só.
- [ ] Testar herói ferido/em expedição/condição crítica e confirmar bloqueio conforme regra.
- [ ] Conferir progresso exibido na Base e em Heróis.

## 7. Proficiências

- [ ] Gerar progresso de treino suficiente para alimentar proficiência.
- [ ] Confirmar proficiência principal e secundária quando aplicável.
- [ ] Confirmar rank/discovery.
- [ ] Confirmar técnica leve ao atingir rank necessário.
- [ ] Confirmar que tags internas de aptidão oculta não são expostas cruas.
- [ ] Confirmar que bônus isolado de proficiência não altera readiness da Torre sem integração explícita.

## 8. Potencial

- [ ] Abrir relatório de potencial.
- [ ] Confirmar nível/XP de análise.
- [ ] Executar análise manual com ouro suficiente.
- [ ] Tentar sem ouro e conferir bloqueio amigável.
- [ ] Confirmar revelação gradual de insights.
- [ ] Confirmar que análise não altera diretamente stats/raridade/classe.

## 9. Promoção 1★→2★

- [ ] Preparar um 1★ até cumprir requisitos.
- [ ] Conferir preview/readiness.
- [ ] Sem 150 ouro/5 fragmentos, confirmar bloqueio.
- [ ] Com recursos, promover.
- [ ] Confirmar consumo exato apenas no sucesso.
- [ ] Confirmar raridade 2★ e `maxLevel` atualizado.
- [ ] Confirmar preservação de level, XP, stats, HP, equipamento, formação, treino, proficiências e potencial.
- [ ] Confirmar que promoções 2★+ continuam bloqueadas.
- [ ] Confirmar atualização da Rota da Primeira Ascensão.

## 10. Torre — gameplay

- [ ] Abrir Torre.
- [ ] Conferir andar/capítulo selecionado.
- [ ] Conferir readiness, risco e energia.
- [ ] Testar marco 5/15/25/35 quando possível.
- [ ] Testar chefe 10/20/30/40 quando possível.
- [ ] Confirmar que readiness informa risco sem hard gate.
- [ ] Testar Normal.
- [ ] Testar Desafio.
- [ ] Testar Hardcore e aviso de risco.
- [ ] Resolver evento pendente.
- [ ] Vencer combate e conferir progresso/recompensas.
- [ ] Testar derrota.
- [ ] Repetir andar elegível.

## 11. Torre — layout focado

- [ ] Confirmar primeira dobra com andar, preparo, risco, energia e ação principal.
- [ ] Confirmar apenas um CTA dominante no estado normal.
- [ ] Confirmar estado dominante de evento quando houver evento pendente.
- [ ] Confirmar resultado recente como estado dominante após combate quando aplicável.
- [ ] Navegar pela faixa compacta de andares.
- [ ] Abrir `Mapa completo` sob demanda.
- [ ] Abrir readiness detalhado/inimigos/recompensas/modificadores/dificuldade nos drawers.
- [ ] Confirmar que detalhes recolhidos não impedem a ação principal.
- [ ] Testar teclado/`aria-expanded` nos drawers quando pertinente.

## 12. Combate e resultado

- [ ] Assistir combate.
- [ ] Alterar velocidade 1x/2x/instantâneo.
- [ ] Ver resultado automático após combate.
- [ ] Conferir resumo, recompensas, heróis, consequências e log.
- [ ] Abrir replay.
- [ ] Voltar à Torre e confirmar card/estado de último resultado.

## 13. Moral, ferimentos e Hardcore

- [ ] Confirmar alteração de moral após eventos previstos.
- [ ] Gerar ferimento quando possível.
- [ ] Tratar ferimento.
- [ ] Confirmar ausência de morte permanente em modos sem essa regra.
- [ ] Em Hardcore, conferir confirmação e memorial quando a condição ocorrer.

## 14. Expedições

- [ ] Selecionar heróis válidos.
- [ ] Iniciar expedição.
- [ ] Confirmar heróis ocupados.
- [ ] Recarregar e conferir timestamp restante.
- [ ] Coletar conclusão.
- [ ] Confirmar recompensa e liberação dos heróis.

## 15. Missões, relíquias e biblioteca

- [ ] Conferir progresso de missão/conquista.
- [ ] Coletar recompensa.
- [ ] Melhorar relíquia quando houver Fragmentos de Eco.
- [ ] Confirmar registros de inimigos/chefes/eventos/heróis na biblioteca.

## 16. Save e migrations

- [ ] Salvar/recarregar local.
- [ ] Exportar JSON.
- [ ] Importar save atual.
- [ ] Importar save de schema anterior e confirmar migration até v5.
- [ ] Importar JSON inválido e conferir erro.
- [ ] Tentar save de versão/schema futuro e conferir rejeição segura.
- [ ] Resetar com confirmação.
- [ ] Recarregar após reset.
- [ ] Sem DB, confirmar que o jogo não quebra.
- [ ] Com DB, salvar/carregar snapshot experimental.

## 17. Responsividade e acessibilidade básica

- [ ] Desktop largo.
- [ ] Janela média/tablet.
- [ ] Mobile simulado.
- [ ] Sem overflow horizontal global.
- [ ] HUD superior fixa mostra ouro, cristais, energia, andar e alertas sem sobrepor conteúdo.
- [ ] Bottom navigation fixa mostra Base, Heróis, Torre, Expedições e Mais.
- [ ] Abrir e fechar o menu Mais por botão, backdrop e tecla Escape.
- [ ] Acessar Formação, Arsenal, Recrutamento, Invocação, Missões, Relíquias, Biblioteca, Configurações e Sobre pelo menu Mais.
- [ ] Confirmar destaque do destino ativo, inclusive quando uma tela do menu Mais está aberta.
- [ ] Confirmar que o conteúdo não fica oculto atrás da HUD ou da bottom navigation, incluindo safe areas.
- [ ] Modais roláveis.
- [ ] Botões com área de toque adequada.
- [ ] Estado ativo/disabled distinguível.
- [ ] Ação principal continua visível e clara.

## Encerramento

- [ ] Reexecutar validações após correções.
- [ ] Revisar diff/status.
- [ ] Sincronizar GDD/especificação/estado-roadmap se o comportamento mudou.
- [ ] Registrar bugs não corrigidos antes de fechar a entrega.

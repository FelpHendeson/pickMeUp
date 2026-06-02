# Checklist de QA Local

Use este checklist apos mudancas grandes de UI, regras, persistencia ou migracao. Marque cada item testado e registre observacoes quando algo parecer instavel.

## Preparacao

- [ ] Rodar `npm install` quando houver mudanca em dependencias.
- [ ] Rodar `npm run typecheck`.
- [ ] Rodar `npm test`.
- [ ] Rodar `npm run build`.
- [ ] Rodar `npm run dev` e abrir o endereco local informado pelo Next.
- [ ] Confirmar que o jogo abre sem `.env` e sem PostgreSQL, usando save local.
- [ ] Se o teste envolver cloud save, rodar `npm run db:up`, `npm run db:migrate` e reiniciar o Next com `NEXT_PUBLIC_ENABLE_CLOUD_SAVE="true"`.

## 1. Inicializacao

- [ ] Abrir o jogo localmente.
- [ ] Verificar se a tela Base aparece sem erros visuais.
- [ ] Criar novo save quando nao houver progresso.
- [ ] Recarregar a pagina e confirmar que o save existente carrega.
- [ ] Confirmar que a narrativa inicial, quando aparecer, pode ser continuada ou pulada.

## 2. Herois

- [ ] Fazer uma invocacao.
- [ ] Verificar se o heroi aparece na lista.
- [ ] Conferir raridade, classe, traco e atributos principais.
- [ ] Usar um contrato de heroi, quando disponivel.
- [ ] Escolher 1 entre 3 herois no recrutamento por contrato.
- [ ] Confirmar que apenas o heroi escolhido entra na lista.
- [ ] Equipar um item em um heroi.
- [ ] Remover ou trocar equipamento.
- [ ] Evoluir ou preparar um heroi ate nivel 10.
- [ ] Escolher uma especializacao disponivel.
- [ ] Confirmar que a especializacao aparece no detalhe do heroi.

## 3. Formacao

- [ ] Adicionar herois a formacao.
- [ ] Remover heroi da formacao.
- [ ] Confirmar destaque visual de herois na formacao.
- [ ] Salvar preset de equipe.
- [ ] Alterar a equipe e reaplicar preset.
- [ ] Confirmar que preset nao adiciona heroi indisponivel de forma incorreta.

## 4. Torre

- [ ] Abrir a aba Torre.
- [ ] Conferir capitulo atual, andar e modificadores.
- [ ] Escolher dificuldade Normal.
- [ ] Iniciar combate.
- [ ] Vencer um combate e confirmar avanco/recompensas.
- [ ] Testar uma derrota, quando possivel.
- [ ] Trocar para Desafio e conferir riscos/recompensas.
- [ ] Trocar para Hardcore e confirmar aviso claro antes de iniciar.
- [ ] Confirmar que o resultado de combate mostra resumo, recompensas, herois, consequencias e log.
- [ ] Usar "Ver replay" e voltar para Torre.

## 5. Sistemas de Consequencia

- [ ] Confirmar mudanca de moral apos vitoria.
- [ ] Confirmar reducao de moral apos derrota ou queda de aliado.
- [ ] Fazer um heroi cair em combate e verificar chance de ferimento.
- [ ] Confirmar que ferimentos aparecem na tela de herois.
- [ ] Abrir Enfermaria e tratar ferimento com recurso disponivel.
- [ ] Confirmar que morte permanente nao acontece em Normal ou Desafio.
- [ ] Em Hardcore, confirmar aviso de risco antes da luta.
- [ ] Em Hardcore, se houver morte permanente, confirmar memorial/remocao conforme comportamento atual.

## 6. Progressao

- [ ] Confirmar ganho de XP apos combate.
- [ ] Confirmar level up quando XP suficiente for acumulado.
- [ ] Verificar se especializacao fica disponivel no nivel 10.
- [ ] Abrir Reliquias e conferir fragmentos de eco.
- [ ] Melhorar uma reliquia quando houver recurso.
- [ ] Abrir Missoes e conferir progresso atualizado.
- [ ] Coletar missao concluida.
- [ ] Abrir Conquistas e coletar recompensa, se houver.
- [ ] Abrir Biblioteca/Bestiario e conferir inimigos encontrados.
- [ ] Derrotar inimigo repetido e confirmar aumento de dados descobertos, quando aplicavel.

## 7. Inventario

- [ ] Conferir lista de equipamentos.
- [ ] Conferir lista de consumiveis.
- [ ] Usar pocao de cura em heroi com HP abaixo do maximo.
- [ ] Tentar usar cura em heroi com HP cheio e confirmar erro amigavel.
- [ ] Usar pocao de vigor em heroi com moral reduzida.
- [ ] Tentar usar item inexistente ou sem alvo valido, quando possivel.
- [ ] Usar kit medico em heroi ferido.
- [ ] Tentar usar kit medico em heroi sem ferimento e confirmar bloqueio.
- [ ] Confirmar que quantidades nao ficam negativas.

## 8. Expedicoes

- [ ] Abrir Expedicoes.
- [ ] Selecionar herois validos.
- [ ] Iniciar uma expedicao.
- [ ] Confirmar destaque de herois em expedicao.
- [ ] Salvar preset de expedicao, se aplicavel.
- [ ] Recarregar a pagina durante a expedicao.
- [ ] Confirmar que o tempo restante restante permanece correto apos reload.
- [ ] Aguardar a conclusao da expedicao.
- [ ] Coletar recompensa.
- [ ] Confirmar recursos e progresso de missoes/conquistas atualizados.

## 9. Save

- [ ] Abrir Config.
- [ ] Confirmar que "Save Local" informa localStorage como save principal.
- [ ] Salvar local manualmente.
- [ ] Recarregar local.
- [ ] Exportar JSON.
- [ ] Importar JSON valido e confirmar sobrescrita apos confirmacao.
- [ ] Tentar importar JSON invalido e confirmar erro amigavel.
- [ ] Resetar save e confirmar dupla confirmacao.
- [ ] Recarregar pagina apos reset e confirmar novo estado.
- [ ] Sem PostgreSQL, confirmar que Cloud Save Experimental fica desativado ou indisponivel sem quebrar o jogo.
- [ ] Com PostgreSQL habilitado, salvar na nuvem e carregar da nuvem.

## 10. Configuracoes

- [ ] Alterar velocidade de combate para `1x`.
- [ ] Alterar velocidade de combate para `2x`.
- [ ] Alterar velocidade de combate para `Instantaneo`.
- [ ] Ativar modo compacto.
- [ ] Desativar modo compacto.
- [ ] Ativar reduzir animacoes.
- [ ] Desativar reduzir animacoes.
- [ ] Recarregar a pagina e confirmar que preferencias persistem.

## 11. Responsividade Basica

- [ ] Testar em desktop largo.
- [ ] Testar em largura media ou janela menor.
- [ ] Testar mobile simulado no navegador.
- [ ] Confirmar que abas principais continuam acessiveis.
- [ ] Confirmar que cards nao sobrepoem texto importante.
- [ ] Confirmar que modais cabem na tela ou permitem rolagem.
- [ ] Confirmar que botoes principais continuam clicaveis.

## Encerramento

- [ ] Rodar `npm run typecheck` apos correcoes feitas durante QA.
- [ ] Rodar `npm test` apos correcoes de regra.
- [ ] Rodar `npm run build` antes de fechar mudancas de UI/Next.
- [ ] Registrar bugs encontrados em issue, nota local ou proximo commit.
- [ ] Confirmar `git status --short` antes de commitar.

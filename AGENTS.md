# Guia de agentes do projeto

## Objetivo
- Reduzir chamadas redundantes e o consumo de tokens.
- Preservar a arquitetura existente do jogo web puro.
- Priorizar mudanças pequenas, legíveis e verificadas.

## Workflow otimizado
1. Antes de editar, leia o arquivo atual e o contexto relevante (função, módulos relacionados, testes existentes).
2. Sempre que possível, reutilize `agentsRules/` como fonte de convenção.
3. Faça uma alteração mínima para resolver o problema.
4. Execute verificações relevantes (testes, checagens de arquivo e git status).
5. Só então gerar commit/push, se solicitado.

## Regras de código
- Preserve o padrão IIFE e `Echoes` como superfície pública.
- Evite globals novos fora de `Echoes`.
- Normalizar dados do save antes de usar.
- Manter textos em PT-BR e consistentes com o visual dark fantasy.
- Usar `data-action` em botões e `escapeHtml` em conteúdo dinâmico.

## Regras de eficiência
- Leia primeiro, edite depois.
- Busque o menor trecho necessário para entender o problema.
- Evite re-explicar o projeto em cada mensagem; use o contexto já existente.
- Sempre rode o teste ou a validação diretamente relacionada ao problema corrigido.
- Evite criar arquivos extras sem necessidade.

## Referências internas
- `agentsRules/README.md`
- `agentsRules/pre-analise.md`
- `agentsRules/padroes-codigo-projeto.md`
- `agentsRules/padrao-commit.md`
- `GDD_Ascensao_dos_Ecos_Alpha_Atualizado.md` como fonte atualizada de design.
- `docs/especificacao-funcional.md` deve ser mantida sincronizada com o GDD.

## Padrão Codex / GPT
- Este arquivo serve como instrução canônica para o Codex e outros agentes GPT que consultam `AGENTS.md`.
- Mantenha as regras aqui enxutas e reutilizáveis, evitando duplicação em mensagens e prompts locais.
- Quando houver um ajuste estrutural no fluxo de trabalho, atualize este arquivo antes de alterar instruções específicas de ferramenta.
- Sempre que houver mudanças em gameplay, progressão, economia, torre ou save, sincronize primeiro o GDD atualizado e em seguida `docs/especificacao-funcional.md`.

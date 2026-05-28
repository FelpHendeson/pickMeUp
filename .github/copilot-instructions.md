# Instruções do Copilot para o projeto

## Contexto do projeto
- Jogo web puro em HTML/CSS/JS sem build step.
- Estado global centralizado em `window.Echoes`.
- Estrutura baseada em módulos em `game/src/`.
- Regras operacionais e convenções em `agentsRules/`.

## Regras obrigatórias
- Antes de tocar em qualquer arquivo, confira o conteúdo atual daquele arquivo.
- Preserve o padrão de módulos, IIFE e expor apenas o necessário em `Echoes`.
- Não introduzir dependências externas sem necessidade.
- Sempre que possível, validar com testes existentes ou com uma reprodução mínima do problema.
- Use commits curtos e separados por responsabilidade.

## Otimização do fluxo
- Prefira leitura localizada em vez de re-sumar tudo.
- Reaproveite padrões já existentes nos módulos.
- Mantenha alterações mínimas e reversíveis.
- Use `GDD_Ascensao_dos_Ecos_Alpha_Atualizado.md` como referência de design atualizada e sincronize `docs/especificacao-funcional.md` quando o gameplay mudar.
- Documente mudanças funcionais em `docs/` ou em arquivos de regra quando necessário.

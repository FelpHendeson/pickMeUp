# Disciplina de Execução para Agentes

## Objetivo

Evoluir o projeto sem duplicar sistemas, quebrar saves ou transformar uma mudança pequena em refactor global.

## Fluxo

- [ ] Ler `docs/estado-atual-e-roadmap.md`.
- [ ] Localizar arquivos e testes do fluxo.
- [ ] Conferir se o sistema pedido já existe.
- [ ] Identificar impacto em UI/domínio/save.
- [ ] Aplicar a menor mudança coerente.
- [ ] Reusar componentes existentes.
- [ ] Rodar validação proporcional.
- [ ] Revisar diff/status.
- [ ] Sincronizar documentação quando o contrato mudar.

## Estado que não deve ser redescoberto

- `master` é canônico.
- Stack: Next/React/TS/Zustand.
- localStorage é save principal.
- schema de save atual: v5.
- Lobby Vivo/readiness/treino/proficiências/potencial/promoção 1★→2★ já existem.
- Torre já usa o layout focado.
- próximo rework planejado: Heróis.

## Referências

- `AGENTS.md`;
- `GDD_Ascensao_dos_Ecos_Alpha_Atualizado.md`;
- `docs/especificacao-funcional.md`;
- `docs/estado-atual-e-roadmap.md`;
- `agentsRules/pre-analise.md`;
- `agentsRules/padroes-codigo-projeto.md`.
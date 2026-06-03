# Componentes React

Organizacao por dominio da interface principal:

- `layout/`: shell da aplicacao, HUD global e modais transversais.
- `ui/`: primitivas reutilizaveis de painel, botao, badge, progresso, empty state e confirmacao.
- `tower/`: campanha da torre, eventos, combate, resultado e andares repetiveis.
- `heroes/`: elenco, detalhes de heroi, formacao, presets e memorial.
- `inventory/`: equipamentos e consumiveis.
- `progression/`: missoes, reliquias e biblioteca.
- `systems/`: expedicoes, invocacao e recrutamento.
- `settings/`: save, backup e preferencias.

Regra pratica: componentes chamam a `gameStore`; regras de gameplay continuam em `src/game`.

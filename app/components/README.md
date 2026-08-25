# Componentes React

Organização atual da interface:

- `layout/` — shell, menu, HUD e modais transversais;
- `ui/` — primitives, feedback e arquitetura de layout focado;
- `tower/` — campanha, challenge, eventos, combate, resultado e repetição;
- `heroes/` — roster, formação, presets e memorial;
- `inventory/` — equipamentos e consumíveis;
- `progression/` — missões, relíquias e biblioteca;
- `systems/` — expedições, invocação e recrutamento;
- `settings/` — preferências e save.

## Regra de arquitetura

Componentes apresentam estado e disparam ações do `gameStore`. Regras de gameplay permanecem em `src/game/`.

## Layout focado

`ui/game-layout.tsx` é a base preferida para telas com muita informação:

- `GamePage` — contêiner/hierarquia da página;
- `GamePageHeader` — contexto compacto;
- `CompactStatStrip` — 3–5 métricas essenciais;
- `PrimaryActionPanel` — única ação dominante;
- `FocusPanel` — conteúdo principal;
- `SecondaryInfoGrid` — informações secundárias;
- `DetailDrawer` — progressive disclosure.
- `GameArtPlaceholder` — reserva visual tematizada para artes futuras, com variantes `banner`, `header` e `module`.

A Torre já usa esse padrão e deve ser referência para novas refatorações.

## Próximo alvo

O módulo **Heróis** é a próxima tela planejada para modo foco. Ao trabalhar nele:

- não recrie primitives equivalentes;
- preserve treino, proficiências, potencial, ascensão e equipamento;
- organize profundidade por foco/tabs/drawers em vez de remover informação;
- não altere domínio/save apenas para resolver layout.

## Responsividade

- evitar overflow global;
- preservar ações principais no mobile;
- usar a HUD superior e a bottom navigation de cinco entradas no mobile;
- agrupar destinos secundários no menu Mais;
- manter a navegação agrupada completa no desktop;
- empilhar grids densos em larguras menores.

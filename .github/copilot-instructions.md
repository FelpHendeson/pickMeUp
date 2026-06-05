# Instruções do Copilot para o projeto

## Contexto do projeto
- Jogo web single-player de estratégia, idle RPG, gacha e progressão por torre.
- Stack operacional: Next.js, React, TypeScript e Zustand.
- Prisma/PostgreSQL é opcional, apenas para cloud save experimental.
- `localStorage` é o save principal; o jogo funciona localmente sem `DATABASE_URL`.
- Regras de gameplay ficam em `src/game/`; mutações persistentes passam por `src/store/gameStore.ts`.
- UI em `app/` e `app/components/`. Regras e convenções em `agentsRules/`.

## Regras obrigatórias
- Antes de tocar em qualquer arquivo, confira o conteúdo atual daquele arquivo.
- Preserve `src/game/` como núcleo de regras puras e `src/store/gameStore.ts` como ponte da UI.
- Ao adicionar campos no estado, atualizar `createInitialState` e a normalização de save (`ensureStateShape`).
- Não quebrar saves existentes nem tornar o PostgreSQL obrigatório para jogar localmente.
- Não introduzir dependências externas sem necessidade.
- Validar com testes existentes (`npm test`) ou com uma reprodução mínima do problema.
- Use commits curtos e separados por responsabilidade.

## Otimização do fluxo
- Prefira leitura localizada em vez de re-sumar tudo.
- Reaproveite componentes e padrões já existentes.
- Mantenha alterações mínimas e reversíveis.
- Rode `npm run typecheck` para mudanças TypeScript/React e `npm run build` para mudanças estruturais de UI/Next.
- Use `GDD_Ascensao_dos_Ecos_Alpha_Atualizado.md` como referência de design atualizada e sincronize `docs/especificacao-funcional.md` quando o gameplay mudar.
- Documente mudanças funcionais em `docs/` ou em arquivos de regra quando necessário.

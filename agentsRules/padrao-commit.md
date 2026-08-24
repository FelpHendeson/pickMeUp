# Padrão de Commit

## Formato

```text
tipo: resumo objetivo
```

Tipos preferidos:

- `feature` — funcionalidade;
- `fix` — correção;
- `ui` — mudança estrutural de UX/UI;
- `style` — acabamento visual sem regra;
- `refactor` — reorganização sem mudança funcional;
- `balance` — números/economia;
- `docs` — documentação;
- `test` — testes;
- `chore` — configuração/manutenção.

## Responsabilidade

Prefira commits pequenos e coerentes.

Documentação diretamente necessária para registrar o contrato de uma feature **pode acompanhar a feature**. Uma auditoria/reorganização ampla de documentação, como a sincronização de 24/08/2026, deve ficar em commit `docs:` separado.

Evite misturar no mesmo commit mudanças independentes de:

- gameplay e infraestrutura;
- balanceamento e refactor;
- correção e feature não relacionada.

## Antes de commitar

- revisar `git status --short`;
- revisar `git diff`;
- executar validações proporcionais;
- verificar arquivos temporários/segredos;
- confirmar que docs canônicos estão sincronizados quando o contrato mudou.

## Branch

`master` é a referência canônica atual. Para mudanças relevantes, use branch curta e PR quando isso melhorar revisão/segurança; não use `migration/next-postgres` como branch de desenvolvimento.
# Padrao de Commit

## Regra Principal

Commits devem ser separados por feature e responsabilidade.

Nao misturar, no mesmo commit:
- gameplay com documentacao;
- layout com infraestrutura;
- refactor com feature;
- correcao de bug com mudanca de balanceamento.

## Formato

Use mensagens curtas no padrao:

```text
tipo: resumo objetivo
```

Tipos recomendados:
- `feature`: nova funcionalidade.
- `fix`: correcao de bug.
- `docs`: documentacao.
- `style`: mudanca visual/CSS sem alterar regra de negocio.
- `refactor`: reorganizacao sem mudar comportamento.
- `chore`: configuracao, limpeza ou manutencao.
- `balance`: ajustes de numeros de gameplay.

## Exemplos

```text
feature: adiciona eventos aleatorios na torre
docs: adiciona regras para agentes do projeto
chore: adiciona gitignore do projeto web
style: ajusta menu inicial responsivo
fix: corrige consumo de efeito temporario da torre
balance: reduz dano de armadilhas iniciais
```

## Antes de Commitar

- Revisar `git status --short`.
- Revisar `git diff`.
- Rodar verificacoes relevantes.
- Fazer stage somente dos arquivos da responsabilidade do commit.
- Confirmar que o commit nao inclui arquivos temporarios, logs ou configuracoes locais.

## Push

Depois de criar commits separados e verificar o estado local, enviar para o remoto configurado com:

```text
git push origin <branch>
```

# Pre-Analise Antes de Alterar

Use este checklist antes de implementar qualquer feature.

## 1. Entender o Fluxo Existente

- Localizar os arquivos envolvidos com `rg`.
- Ler o fluxo completo antes de editar.
- Identificar onde o estado e mutado e onde ele e salvo.
- Verificar se a mudança afeta apenas UI React, regras em `src/game/`, save local ou cloud save experimental.

## 2. Separar Responsabilidades

Antes de codar, classifique a mudanca:
- UI/layout;
- gameplay/balanceamento;
- persistencia/save;
- documentacao/regras;
- infraestrutura/configuracao.

Nao misture responsabilidades sem necessidade. Se misturar for inevitavel, explicar no commit.

## 3. Checar Risco de Save

Quando adicionar campos no estado:
- incluir defaults em `createInitialState`;
- normalizar saves antigos em `ensureStateShape`;
- evitar quebrar saves existentes;
- manter nomes de campos claros e estaveis.

## 4. Checar Fluxo de Torre e Combate

Para mudancas na torre:
- validar formacao;
- validar energia;
- nao quebrar repeticao de andares;
- preservar chefes e marcos;
- manter log de batalha compreensivel.

## 5. Verificacao Minima

Antes de finalizar:
- rodar `npm run typecheck` quando houver mudança em TypeScript/React;
- rodar `npm test` quando regras ou persistência forem afetadas;
- rodar `npm run build` antes de finalizar mudanças de UI estruturais;
- revisar `git diff`;
- confirmar que arquivos de responsabilidades diferentes estao em commits separados.

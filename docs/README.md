# Documentação — Ascensão dos Ecos

Esta pasta concentra a documentação operacional e funcional do projeto.

**Sincronização:** 24/08/2026  
**Baseline:** `master@fcc5f75`  
**Versão:** 0.10.0

## Fonte de verdade

Use esta ordem quando houver conflito:

1. **Código e testes atuais** — comportamento executável.
2. `../GDD_Ascensao_dos_Ecos_Alpha_Atualizado.md` — design e decisões canônicas.
3. `especificacao-funcional.md` — regras, fluxos, estados e contratos da Alpha.
4. `estado-atual-e-roadmap.md` — ponto atual e próxima entrega.
5. `visao-lobby-vivo.md` — direção de produto e sistemas futuros.
6. `README.md` da raiz — operação, stack, comandos e ambiente.

`../gdd_web_tower_gacha_mvp.md` é histórico e não deve orientar implementação nova.

## Documentos

### `estado-atual-e-roadmap.md`

Leia primeiro ao retomar o projeto. Resume o que já foi entregue, a última fase concluída e o próximo passo.

### `especificacao-funcional.md`

Contrato funcional dos módulos atuais: heróis, Lobby, Torre, treino, proficiências, potencial, promoção, save, UI e demais sistemas.

### `visao-lobby-vivo.md`

Direção de longo prazo. Distingue o que já foi implementado do que ainda é visão, evitando tratar ideia futura como feature pronta.

### `briefing-produto-atual-po.md`

Resumo executivo para discussão de produto, priorização e tomada de decisão.

### `persistência/migração`

`migracao-next-postgres.md` registra a migração já concluída e documenta a arquitetura atual de localStorage + PostgreSQL opcional.

### `qa-local-checklist.md`

Checklist manual para regressão funcional e visual.

## Regra de manutenção

Mudou gameplay, progressão, economia, save ou UI estrutural?

Atualize, no mínimo:

- GDD canônico;
- especificação funcional;
- estado/roadmap;
- QA quando o fluxo testável mudar.

Mudou apenas infraestrutura/comando de desenvolvimento?

Atualize README da raiz e, se necessário, `migracao-next-postgres.md`.

Mudou direção futura ainda não implementada?

Atualize `visao-lobby-vivo.md`, deixando explícito que é visão e não estado atual.
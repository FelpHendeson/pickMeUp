# Migracao para Next.js + PostgreSQL

Esta branch preserva a `master` e inicia a migracao escalavel do jogo.

## Objetivo

Separar o jogo em tres camadas:

- UI React/Next;
- regras puras em TypeScript;
- persistencia em PostgreSQL.

## Estrategia

1. Manter `game/` funcionando como legado.
2. Criar a shell Next na raiz.
3. Extrair regras para modulos TypeScript sem dependencia de DOM.
4. Migrar telas uma por uma.
5. Trocar `localStorage` por sincronizacao server-side.
6. Manter export/import como backup.

## Banco

O schema inicial em `prisma/schema.prisma` cria:

- `Player`;
- `PlayerProfile`;
- `Hero`;
- `SaveSnapshot`.

Os sistemas complexos ainda podem ficar em `payload Json` durante a migracao. Depois, inventario, reliquias,
missoes, biblioteca e historico de combate podem ganhar tabelas proprias conforme estabilizarem.

## Comandos

```bash
npm install
npm run dev
npm run typecheck
npm run prisma:generate
```

Configure `DATABASE_URL` com base em `.env.example` antes de rodar Prisma.

## Legado no Next

A pasta `public/game/` e uma snapshot do jogo atual para manter o fluxo jogavel quando a branch for executada com
Next/Vercel. Durante a migracao, alteracoes de gameplay ainda devem acontecer primeiro em `game/` e depois serem
sincronizadas para `public/game/` enquanto a UI React nao substitui a tela correspondente.

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/ascensao_dos_ecos?schema=public",
  },
});

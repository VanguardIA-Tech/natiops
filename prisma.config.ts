// import { defineConfig } from 'prisma/config';

// export default defineConfig({
//   schema: 'prisma/schema.prisma',

//   datasource: {
//     url: process.env.DATABASE_URL!,
//   },

//   migrations: {
//     path: 'prisma/migrations',
//   },
// });

// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",      // caminho pro seu schema
  migrations: {
    path: "prisma/migrations",         // onde ficam as migrations
  },
  datasource: {
    url: env("DATABASE_URL"),          // ← A URL de conexão fica aqui
  },
});

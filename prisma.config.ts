import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://postgres:1234@localhost:5432/dbnatiops';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
});

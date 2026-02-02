import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';
import path from 'path';

config({
  path: path.resolve(process.cwd(), '.env'),
});

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseUrl = void 0;
require("dotenv/config");
const config_1 = require("prisma/config");
exports.databaseUrl = process.env.DATABASE_URL ?? 'postgresql://postgres:1234@localhost:5432/dbnatiops';
exports.default = (0, config_1.defineConfig)({
    schema: 'prisma/schema.prisma',
    datasource: {
        url: exports.databaseUrl,
    },
});

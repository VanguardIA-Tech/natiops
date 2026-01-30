"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var DapicService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DapicService = void 0;
require("dotenv/config");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let DapicService = DapicService_1 = class DapicService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(DapicService_1.name);
        this.baseUrl =
            this.configService.get('DAPIC_BASE_URL') ??
                process.env.DAPIC_BASE_URL ??
                'https://api.dapic.com.br';
        this.empresa =
            this.configService.get('DAPIC_EMPRESA') ?? process.env.DAPIC_EMPRESA;
        this.loginToken =
            this.configService.get('DAPIC_LOGIN_TOKEN') ??
                process.env.DAPIC_LOGIN_TOKEN;
    }
    async ensureAccessToken() {
        const now = Date.now();
        if (this.accessToken && this.tokenExpiresAt && now < this.tokenExpiresAt - 10000) {
            return this.accessToken;
        }
        if (!this.tokenRequest) {
            this.tokenRequest = this.fetchAccessToken();
        }
        try {
            return await this.tokenRequest;
        }
        finally {
            this.tokenRequest = undefined;
        }
    }
    async fetchAccessToken() {
        this.logger.log('Autenticando sessão DAPIC');
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/autenticacao/v1/login`, {
                Empresa: 'nativauniformes',
                TokenIntegracao: 'fhelf2Gq29Lz1ak5fBmLe1I7pgdSPv',
            }, {
                headers: this.loginToken ? { Authorization: `Bearer ${this.loginToken}` } : undefined,
            });
            const accessToken = response.data?.access_token;
            if (!accessToken) {
                throw new Error('Não foi possível obter o access_token DAPIC');
            }
            const expiresIn = Number(response.data?.expires_in);
            const ttl = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn * 1000 : 3600 * 1000;
            this.accessToken = accessToken;
            this.tokenExpiresAt = Date.now() + ttl;
            this.logger.log('Sessão DAPIC autenticada');
            return accessToken;
        }
        catch (error) {
            this.logger.error('Falha ao autenticar sessão DAPIC', error);
            throw error;
        }
    }
    async fetchProductPage(page, limit = 100) {
        const token = await this.ensureAccessToken();
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/v1/armazenadores/produtos`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    Pagina: page,
                    RegistrosPorPagina: limit,
                },
            });
            const dadosArray = Array.isArray(response.data?.Dados)
                ? response.data.Dados
                : Array.isArray(response.data?.dados)
                    ? response.data.dados
                    : [];
            const itemsLength = dadosArray.length;
            const pagination = {
                page: response.data?.Pagina ??
                    response.data?.pagina ??
                    page,
                perPage: response.data?.RegistrosPorPagina ??
                    response.data?.registrosPorPagina ??
                    limit,
                totalPages: response.data?.TotalPaginas ??
                    response.data?.totalPaginas ??
                    undefined,
            };
            this.logger.log(`fetchProductPage page ${page} retornou ${itemsLength} items`);
            return {
                data: {
                    items: dadosArray,
                    pagination,
                },
            };
        }
        catch (error) {
            this.logger.error(`Falha ao buscar página ${page}`, error);
            throw error;
        }
    }
    async fetchProductDetails(externalId) {
        const token = await this.ensureAccessToken();
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/v1/produtos/${externalId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        }
        catch (error) {
            this.logger.error(`Falha ao buscar detalhes do produto ${externalId}`, error);
            throw error;
        }
    }
};
exports.DapicService = DapicService;
exports.DapicService = DapicService = DapicService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DapicService);

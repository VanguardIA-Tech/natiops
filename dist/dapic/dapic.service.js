"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DapicService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let DapicService = class DapicService {
    constructor() {
        this.baseUrl = process.env.DAPIC_BASE_URL ?? 'https://api.dapic.com.br';
        this.loginToken = process.env.DAPIC_LOGIN_TOKEN;
    }
    async ensureSession() {
        if (this.sessionToken) {
            return;
        }
        if (!this.loginToken) {
            throw new Error('Token de autenticação DAPIC não configurado');
        }
        const response = await axios_1.default.post(`${this.baseUrl}/v1/auth/login`, null, {
            headers: { Authorization: `Bearer ${this.loginToken}` },
        });
        this.sessionToken = response.data?.token;
    }
    async fetchProductPage(page, limit = 100) {
        await this.ensureSession();
        const response = await axios_1.default.get(`${this.baseUrl}/v1/armazenadores/produtos`, {
            headers: { Authorization: `Bearer ${this.sessionToken}` },
            params: {
                page,
                per_page: limit,
            },
        });
        return response.data;
    }
};
exports.DapicService = DapicService;
exports.DapicService = DapicService = __decorate([
    (0, common_1.Injectable)()
], DapicService);

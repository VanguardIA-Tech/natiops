import 'dotenv/config';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

type DapicPageResponse = {
  data: {
    items: Record<string, unknown>[];
    pagination?: {
      page: number;
      perPage: number;
      totalPages: number;
    };
  };
};

@Injectable()
export class DapicService {
  private readonly logger = new Logger(DapicService.name);
  private readonly baseUrl: string;
  private readonly loginToken?: string;
  private readonly empresa?: string;
  private accessToken?: string;
  private tokenExpiresAt?: number;
  private tokenRequest?: Promise<string>;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('DAPIC_BASE_URL') ??
      process.env.DAPIC_BASE_URL ??
      'https://api.dapic.com.br';
    this.empresa =
      this.configService.get<string>('DAPIC_EMPRESA') ?? process.env.DAPIC_EMPRESA;
    this.loginToken =
      this.configService.get<string>('DAPIC_LOGIN_TOKEN') ??
      process.env.DAPIC_LOGIN_TOKEN;
  }

  private async ensureAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && this.tokenExpiresAt && now < this.tokenExpiresAt - 10000) {
      return this.accessToken;
    }
    if (!this.tokenRequest) {
      this.tokenRequest = this.fetchAccessToken();
    }
    try {
      return await this.tokenRequest;
    } finally {
      this.tokenRequest = undefined;
    }
  }

  private async fetchAccessToken(): Promise<string> {
    this.logger.log('Autenticando sessão DAPIC');
    try {
      const response = await axios.post(
        `${this.baseUrl}/autenticacao/v1/login`,
        {
          Empresa: 'nativauniformes',
          TokenIntegracao: 'fhelf2Gq29Lz1ak5fBmLe1I7pgdSPv',
        },
        {
          headers: this.loginToken ? { Authorization: `Bearer ${this.loginToken}` } : undefined,
        },
      );
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
    } catch (error) {
      this.logger.error('Falha ao autenticar sessão DAPIC', error as Error);
      throw error;
    }
  }

  private validateResponse(data: unknown, context: string): void {
    if (typeof data === 'string' && data.includes('<html')) {
      throw new Error(`DAPIC retornou HTML em vez de JSON (${context})`);
    }
  }

  async fetchProductPage(
    page: number,
    limit = 100,
    timeoutMs = 20000,
    dataInicial?: string,
  ): Promise<DapicPageResponse> {
    const token = await this.ensureAccessToken();
    const response = await axios.get(`${this.baseUrl}/v1/armazenadores/produtos`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        Pagina: page,
        RegistrosPorPagina: limit,
        ...(dataInicial && { DataInicial: dataInicial }),
      },
      timeout: timeoutMs,
    });
    this.validateResponse(response.data, `page ${page}`);
    const dadosArray = Array.isArray(response.data?.Dados)
      ? response.data.Dados
      : Array.isArray(response.data?.dados)
      ? response.data.dados
      : [];
    const itemsLength = dadosArray.length;
    const pagination = {
      page:
        response.data?.Pagina ??
        response.data?.pagina ??
        page,
      perPage:
        response.data?.RegistrosPorPagina ??
        response.data?.registrosPorPagina ??
        limit,
      totalPages:
        response.data?.TotalPaginas ??
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

  async fetchProductDetails(externalId: string) {
    const token = await this.ensureAccessToken();
    const response = await axios.get(`${this.baseUrl}/v1/produtos/${externalId}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    });
    this.validateResponse(response.data, `produto ${externalId}`);
    return response.data;
  }
}

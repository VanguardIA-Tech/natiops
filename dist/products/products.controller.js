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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ProductsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const products_service_1 = require("./products.service");
const product_search_response_dto_1 = require("./dto/product-search-response.dto");
const query_products_dto_1 = require("./dto/query-products.dto");
const product_details_response_dto_1 = require("./dto/product-details-response.dto");
let ProductsController = ProductsController_1 = class ProductsController {
    constructor(productsService) {
        this.productsService = productsService;
        this.logger = new common_1.Logger(ProductsController_1.name);
    }
    async list(payload) {
        const query = payload.nome ?? '';
        this.logger.log(`Query: ${query}`);
        this.logger.log(`Chamando método search com payload: ${JSON.stringify(query)}`);
        return this.productsService.search(query);
    }
    async getStock(externalId) {
        const product = await this.productsService.findByExternalId(externalId);
        if (!product) {
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        return product;
    }
    async getDetails(id) {
        const product = await this.productsService.findById(id);
        if (!product) {
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        return product;
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Retorna o produto cujo nome é informado no corpo da requisição',
    }),
    (0, swagger_1.ApiBody)({
        description: 'Payload com o nome do produto que deve ser buscado',
        type: query_products_dto_1.BodyProductsDto,
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Array com no máximo um produto correspondente ao nome informado',
        type: product_search_response_dto_1.ProductSearchResponseDto,
        isArray: true,
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_products_dto_1.BodyProductsDto]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':externalId'),
    (0, swagger_1.ApiOperation)({ summary: 'Retorna os dados completos do produto pelo externalId' }),
    (0, swagger_1.ApiParam)({
        name: 'externalId',
        description: 'Identificador externo único do produto',
        example: 'PROD-123',
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Informações de estoque e dados básicos do produto',
        type: product_details_response_dto_1.ProductDetailsResponseDto,
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Produto não encontrado' }),
    __param(0, (0, common_1.Param)('externalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "getStock", null);
__decorate([
    (0, common_1.Get)('details/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Retorna detalhes completos do produto a partir do id' }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Id interno do produto',
        example: 'b7f1c4f8-1234-4a00-8eee-123456789abc',
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Detalhes completos do produto',
        type: product_details_response_dto_1.ProductDetailsResponseDto,
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Produto não encontrado' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "getDetails", null);
exports.ProductsController = ProductsController = ProductsController_1 = __decorate([
    (0, swagger_1.ApiTags)('Produtos'),
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], ProductsController);

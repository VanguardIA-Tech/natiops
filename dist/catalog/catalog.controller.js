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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const catalog_service_1 = require("./catalog.service");
const catalog_item_details_response_dto_1 = require("./dto/catalog-item-details-response.dto");
let CatalogController = class CatalogController {
    constructor(catalogService) {
        this.catalogService = catalogService;
    }
    async getImages(referencia) {
        const images = await this.catalogService.getImagesByReferencia(referencia);
        if (!images) {
            throw new common_1.NotFoundException('Item de catálogo não encontrado');
        }
        return images;
    }
    async getDetails(referencia) {
        const details = await this.catalogService.getDetailsByReferencia(referencia);
        if (!details) {
            throw new common_1.NotFoundException('Item de catálogo não encontrado');
        }
        return details;
    }
};
exports.CatalogController = CatalogController;
__decorate([
    (0, common_1.Get)(':referencia/images'),
    (0, swagger_1.ApiOperation)({ summary: 'Retorna as URLs das imagens de um item de catálogo' }),
    (0, swagger_1.ApiParam)({
        name: 'referencia',
        description: 'Referência única do item no catálogo',
        example: 'REF-123',
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Lista de URLs de imagens',
        type: String,
        isArray: true,
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Item de catálogo não encontrado' }),
    __param(0, (0, common_1.Param)('referencia')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getImages", null);
__decorate([
    (0, common_1.Get)(':referencia/details'),
    (0, swagger_1.ApiOperation)({ summary: 'Retorna os detalhes de um item de catálogo' }),
    (0, swagger_1.ApiParam)({
        name: 'referencia',
        description: 'Referência única do item no catálogo',
        example: 'REF-123',
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Detalhes principais do item de catálogo',
        type: catalog_item_details_response_dto_1.CatalogItemDetailsResponseDto,
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Item de catálogo não encontrado' }),
    __param(0, (0, common_1.Param)('referencia')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getDetails", null);
exports.CatalogController = CatalogController = __decorate([
    (0, swagger_1.ApiTags)('Catálogo'),
    (0, common_1.Controller)('catalogo'),
    __metadata("design:paramtypes", [catalog_service_1.CatalogService])
], CatalogController);

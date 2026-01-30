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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapacityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const products_service_1 = require("./products.service");
const capacity_response_dto_1 = require("./dto/capacity-response.dto");
let CapacityController = class CapacityController {
    constructor(productsService) {
        this.productsService = productsService;
    }
    async getCapacity() {
        return this.productsService.getCapacityOverview();
    }
};
exports.CapacityController = CapacityController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Resume os totais de estoque e reservas' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Visão geral dos estoques totais, reservados e disponíveis',
        type: capacity_response_dto_1.CapacityResponseDto,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CapacityController.prototype, "getCapacity", null);
exports.CapacityController = CapacityController = __decorate([
    (0, swagger_1.ApiTags)('Produtos'),
    (0, common_1.Controller)('capacity'),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], CapacityController);

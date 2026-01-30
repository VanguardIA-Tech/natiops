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
var HoldsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoldsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const create_hold_dto_1 = require("./dto/create-hold.dto");
const find_holds_by_email_dto_1 = require("./dto/find-holds-by-email.dto");
const find_holds_by_email_response_dto_1 = require("./dto/find-holds-by-email-response.dto");
const hold_response_dto_1 = require("./dto/hold-response.dto");
const renew_hold_dto_1 = require("./dto/renew-hold.dto");
const holds_service_1 = require("./holds.service");
let HoldsController = HoldsController_1 = class HoldsController {
    constructor(holdsService) {
        this.holdsService = holdsService;
        this.logger = new common_1.Logger(HoldsController_1.name);
    }
    create(dto) {
        this.logger.log(`Chamando método createHold com dto: ${JSON.stringify(dto)}`);
        return this.holdsService.createHold(dto);
    }
    cancel(id) {
        return this.holdsService.cancelHold(id);
    }
    renew(id, dto) {
        return this.holdsService.renewHold(id, dto.expiresAt);
    }
    findByEmail(payload) {
        return this.holdsService.findByEmail(payload.email);
    }
};
exports.HoldsController = HoldsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cria uma nova reserva de produto' }),
    (0, swagger_1.ApiCreatedResponse)({
        description: 'Reserva criada com sucesso',
        type: hold_response_dto_1.HoldResponseDto,
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Quantidade inválida ou estoque insuficiente',
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Produto não encontrado' }),
    (0, swagger_1.ApiBody)({ type: create_hold_dto_1.CreateHoldDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_hold_dto_1.CreateHoldDto]),
    __metadata("design:returntype", void 0)
], HoldsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancela uma reserva ativa' }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Identificador da reserva',
        example: 'c1d2e3f4-5678-90ab-cdef-1234567890ab',
    }),
    (0, swagger_1.ApiOkResponse)({ description: 'Reserva cancelada', type: hold_response_dto_1.HoldResponseDto }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'Reserva já foi finalizada ou inválida' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Reserva não encontrada' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HoldsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Patch)(':id/renew'),
    (0, swagger_1.ApiOperation)({ summary: 'Renova a data de expiração de uma reserva' }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Identificador da reserva',
        example: 'c1d2e3f4-5678-90ab-cdef-1234567890ab',
    }),
    (0, swagger_1.ApiOkResponse)({ description: 'Reserva renovada', type: hold_response_dto_1.HoldResponseDto }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'Reserva não está ativa' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Reserva não encontrada' }),
    (0, swagger_1.ApiBody)({ type: renew_hold_dto_1.RenewHoldDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, renew_hold_dto_1.RenewHoldDto]),
    __metadata("design:returntype", void 0)
], HoldsController.prototype, "renew", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lista reservas ativas por email' }),
    (0, swagger_1.ApiBody)({ type: find_holds_by_email_dto_1.FindHoldsByEmailDto }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'Email inválido ou ausente' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Reservas encontradas', type: find_holds_by_email_response_dto_1.FindHoldsByEmailResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_holds_by_email_dto_1.FindHoldsByEmailDto]),
    __metadata("design:returntype", void 0)
], HoldsController.prototype, "findByEmail", null);
exports.HoldsController = HoldsController = HoldsController_1 = __decorate([
    (0, swagger_1.ApiTags)('Reservas'),
    (0, common_1.Controller)('holds'),
    __metadata("design:paramtypes", [holds_service_1.HoldsService])
], HoldsController);

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
exports.HoldsController = void 0;
const common_1 = require("@nestjs/common");
const create_hold_dto_1 = require("./dto/create-hold.dto");
const renew_hold_dto_1 = require("./dto/renew-hold.dto");
const holds_service_1 = require("./holds.service");
let HoldsController = class HoldsController {
    constructor(holdsService) {
        this.holdsService = holdsService;
    }
    create(dto) {
        return this.holdsService.createHold(dto);
    }
    cancel(id) {
        return this.holdsService.cancelHold(id);
    }
    renew(id, dto) {
        return this.holdsService.renewHold(id, dto.expiresAt);
    }
    findByEmail(email) {
        if (!email) {
            throw new common_1.BadRequestException('Email é obrigatório');
        }
        return this.holdsService.findByEmail(email);
    }
};
exports.HoldsController = HoldsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_hold_dto_1.CreateHoldDto]),
    __metadata("design:returntype", void 0)
], HoldsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HoldsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Patch)(':id/renew'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, renew_hold_dto_1.RenewHoldDto]),
    __metadata("design:returntype", void 0)
], HoldsController.prototype, "renew", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HoldsController.prototype, "findByEmail", null);
exports.HoldsController = HoldsController = __decorate([
    (0, common_1.Controller)('holds'),
    __metadata("design:paramtypes", [holds_service_1.HoldsService])
], HoldsController);

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
exports.CreateHoldDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateHoldDto {
}
exports.CreateHoldDto = CreateHoldDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({
        description: 'Identificador externo do produto a ser reservado',
        example: 'PROD-123',
    }),
    __metadata("design:type", String)
], CreateHoldDto.prototype, "externalId", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, swagger_1.ApiProperty)({
        description: 'Email do cliente que está solicitando a reserva',
        example: 'cliente@nativa.com.br',
    }),
    __metadata("design:type", String)
], CreateHoldDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsPositive)(),
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade de itens que devem ser reservados',
        example: 2,
    }),
    __metadata("design:type", Number)
], CreateHoldDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsISO8601)(),
    (0, swagger_1.ApiProperty)({
        description: 'Data de expiração da reserva em ISO 8601',
        example: '2026-02-05T23:59:59Z',
    }),
    __metadata("design:type", String)
], CreateHoldDto.prototype, "expiresAt", void 0);

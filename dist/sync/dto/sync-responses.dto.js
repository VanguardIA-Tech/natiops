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
exports.SyncProcessResponseDto = exports.SyncRunResponseDto = exports.SyncCheckpointDto = exports.SyncAuditEntryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class SyncAuditEntryDto {
}
exports.SyncAuditEntryDto = SyncAuditEntryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SyncAuditEntryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SyncAuditEntryDto.prototype, "externalId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SyncAuditEntryDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: 'object',
        additionalProperties: true,
        description: 'Payload capturado para auditoria',
    }),
    __metadata("design:type", Object)
], SyncAuditEntryDto.prototype, "payload", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SyncAuditEntryDto.prototype, "hash", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: 'string', format: 'date-time' }),
    __metadata("design:type", Date)
], SyncAuditEntryDto.prototype, "createdAt", void 0);
class SyncCheckpointDto {
}
exports.SyncCheckpointDto = SyncCheckpointDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SyncCheckpointDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.SyncType }),
    __metadata("design:type", String)
], SyncCheckpointDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SyncCheckpointDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: 'string', format: 'date-time' }),
    __metadata("design:type", Date)
], SyncCheckpointDto.prototype, "updatedAt", void 0);
class SyncRunResponseDto {
}
exports.SyncRunResponseDto = SyncRunResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SyncRunResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.SyncType }),
    __metadata("design:type", String)
], SyncRunResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.SyncStatus }),
    __metadata("design:type", String)
], SyncRunResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: 'string', format: 'date-time' }),
    __metadata("design:type", Date)
], SyncRunResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: 'string', format: 'date-time', required: false }),
    __metadata("design:type", Date)
], SyncRunResponseDto.prototype, "startedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: 'string', format: 'date-time', required: false }),
    __metadata("design:type", Date)
], SyncRunResponseDto.prototype, "finishedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SyncRunResponseDto.prototype, "currentPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], SyncRunResponseDto.prototype, "currentItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], SyncRunResponseDto.prototype, "errorMessage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: () => SyncAuditEntryDto,
        isArray: true,
        required: false,
    }),
    __metadata("design:type", Array)
], SyncRunResponseDto.prototype, "auditEntries", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: () => SyncCheckpointDto,
        isArray: true,
        required: false,
    }),
    __metadata("design:type", Array)
], SyncRunResponseDto.prototype, "checkpoints", void 0);
class SyncProcessResponseDto {
}
exports.SyncProcessResponseDto = SyncProcessResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Status simples indicando que o processamento foi disparado',
        example: 'processed',
    }),
    __metadata("design:type", String)
], SyncProcessResponseDto.prototype, "status", void 0);

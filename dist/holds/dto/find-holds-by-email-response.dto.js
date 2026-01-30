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
exports.FindHoldsByEmailResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const hold_with_product_response_dto_1 = require("./hold-with-product-response.dto");
class FindHoldsByEmailResponseDto {
}
exports.FindHoldsByEmailResponseDto = FindHoldsByEmailResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: hold_with_product_response_dto_1.HoldWithProductResponseDto, isArray: true }),
    __metadata("design:type", Array)
], FindHoldsByEmailResponseDto.prototype, "holds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], FindHoldsByEmailResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], FindHoldsByEmailResponseDto.prototype, "message", void 0);

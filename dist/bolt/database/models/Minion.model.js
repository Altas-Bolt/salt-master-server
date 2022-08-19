"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const Minion = joi_1.default.object({
    id: joi_1.default.string().required(),
    saltId: joi_1.default.string().required(),
    os: joi_1.default.string().required(),
    ip: joi_1.default.string().required(),
    userId: joi_1.default.string(),
    createdBy: joi_1.default.string().required(),
    installedSoftwares: joi_1.default.array().items(joi_1.default.string()),
});
exports.default = Minion;
//# sourceMappingURL=Minion.model.js.map
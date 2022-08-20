"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const uuidv4_1 = require("uuidv4");
const schema = joi_1.default.object({
    softwareId: joi_1.default.string().default((0, uuidv4_1.uuid)()).required(),
    name: joi_1.default.string().required(),
    version: joi_1.default.string(),
    isBlacklisted: joi_1.default.boolean().default(false),
});
exports.default = schema;
//# sourceMappingURL=Software.model.js.map
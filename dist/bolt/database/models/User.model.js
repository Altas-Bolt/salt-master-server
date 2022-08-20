"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoles = void 0;
const joi_1 = __importDefault(require("joi"));
var UserRoles;
(function (UserRoles) {
    UserRoles["USER"] = "USER";
    UserRoles["ADMIN"] = "ADMIN";
})(UserRoles = exports.UserRoles || (exports.UserRoles = {}));
const User = joi_1.default.object({
    id: joi_1.default.string().required(),
    email: joi_1.default.string().email().trim().required(),
    password: joi_1.default.string().required(),
    accessToken: joi_1.default.string(),
    role: joi_1.default.string()
        .valid(UserRoles.ADMIN, UserRoles.USER)
        .default(UserRoles.USER),
    minionId: joi_1.default.string(),
});
exports.default = User;
//# sourceMappingURL=User.model.js.map
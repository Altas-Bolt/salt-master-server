"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = exports.auth = void 0;
const init_1 = __importDefault(require("./database/init"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const auth = async (req, res, next) => {
    let token = req.headers["authorization"];
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized",
            status: 401,
        });
    }
    if (token) {
        if (!token.startsWith("Bearer ")) {
            return res.status(400).json({
                status: 400,
                message: "Invalid Auth Token Format: must be in format of Bearer [token]",
            });
        }
        token = token.replace("Bearer ", "");
    }
    const { id, eat } = jsonwebtoken_1.default.verify(token, config_1.default.JWT_SECRET);
    if (new Date().getTime() > eat) {
        return res.status(400).json({
            status: 400,
            message: "Auth token has expired",
        });
    }
    const { data, error } = await init_1.default
        .from("user")
        .select("id, email, role, minionId")
        .eq("id", id);
    if (!data || error)
        return res.status(404).json({
            status: 404,
            message: error || `Could not find user`,
        });
    req.user = data[0];
    return next();
};
exports.auth = auth;
const admin = async (req, res, next) => {
    const user = req.user;
    if (!user)
        return res.status(400).json({
            status: 400,
            message: "User not found",
        });
    if (user.role !== "ADMIN")
        return res.status(401).json({
            status: 401,
            message: "Unauthorised to perform this action",
        });
    return next();
};
exports.admin = admin;
//# sourceMappingURL=middlewares.js.map
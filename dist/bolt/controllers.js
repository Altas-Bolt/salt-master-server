"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.getMinionById = exports.getAllMinions = exports.addUserToMinion = exports.getAllAdmins = exports.getAllUsers = exports.getUserById = exports.createMinion = exports.createUser = void 0;
const error_1 = __importStar(require("./utils/error"));
const User_model_1 = __importDefault(require("./database/models/User.model"));
const init_1 = __importDefault(require("./database/init"));
const Minion_model_1 = __importDefault(require("./database/models/Minion.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = __importDefault(require("../config"));
const uuidv4_1 = require("uuidv4");
const createUser = async (req, res) => {
    var _a;
    try {
        const validatedBody = User_model_1.default.validate(Object.assign(Object.assign({}, req.body), { id: (0, uuidv4_1.uuid)() }));
        if (validatedBody.error)
            throw new error_1.default(validatedBody.error.details[0].message, error_1.ErrorCodes.BAD_REQUEST);
        const token = jsonwebtoken_1.default.sign({
            id: validatedBody.value.id,
            iat: new Date().getTime(),
            eat: new Date().getTime() + 10 * 365 * 24 * 60 * 60 * 1000,
        }, config_1.default.JWT_SECRET);
        const hashedPassword = await bcrypt_1.default.hash(validatedBody.value.password, 10);
        const { data, error } = await init_1.default
            .from("user")
            .upsert(Object.assign(Object.assign({}, validatedBody.value), { role: "USER", accessToken: token, password: hashedPassword }), { onConflict: "email" })
            .select("id, email, accessToken, role, minionId");
        if (error || !data)
            throw new error_1.default(error.message ||
                `Could not create user with email ${validatedBody.value.email}`, error_1.ErrorCodes.BAD_REQUEST);
        return res.status(201).json({
            status: 201,
            data: data[0],
        });
    }
    catch (error) {
        if (error instanceof error_1.default) {
            return res.status(error.statusCode).json({
                status: error.statusCode,
                message: error.errorMessage,
            });
        }
        else {
            return res.status(500).json({
                status: 500,
                message: (_a = error.message) !== null && _a !== void 0 ? _a : "Something went wrong",
            });
        }
    }
};
exports.createUser = createUser;
const loginUser = async (req, res) => {
    var _a;
    try {
        if (!req.body.email || !req.body.password)
            throw new error_1.default("Missing Required Fields", error_1.ErrorCodes.BAD_REQUEST);
        const { data, error } = await init_1.default
            .from("user")
            .select("id, email, password")
            .eq("email", req.body.email);
        if (!data || error)
            throw new error_1.default((error === null || error === void 0 ? void 0 : error.message) || `Could not find user with email ${req.body.email}`, error_1.ErrorCodes.BAD_REQUEST);
        const isValidPassword = await bcrypt_1.default.compare(req.body.password, data[0].password);
        if (!isValidPassword)
            throw new error_1.default("Invalid Credentials", error_1.ErrorCodes.UNAUTHORISED);
        const token = jsonwebtoken_1.default.sign({
            id: data[0].id,
            iat: new Date().getTime(),
            eat: new Date().getTime() + 10 * 365 * 24 * 60 * 60 * 1000,
        }, config_1.default.JWT_SECRET);
        const { data: updatedData, error: err } = await init_1.default
            .from("user")
            .update({
            accessToken: token,
        })
            .eq("email", req.body.email)
            .select("id, email, accessToken, role, minionId");
        if (!updatedData || err)
            throw new error_1.default((err === null || err === void 0 ? void 0 : err.message) || `Something went wrong`, error_1.ErrorCodes.INTERNAL_SERVER_ERROR);
        return res.status(200).json({
            status: 200,
            data: updatedData[0],
        });
    }
    catch (error) {
        if (error instanceof error_1.default) {
            return res.status(error.statusCode).json({
                status: error.statusCode,
                message: error.errorMessage,
            });
        }
        else {
            return res.status(500).json({
                status: 500,
                message: (_a = error.message) !== null && _a !== void 0 ? _a : "Something went wrong",
            });
        }
    }
};
exports.loginUser = loginUser;
const getUserById = async (req, res) => {
    var _a;
    try {
        const { data, error } = await init_1.default
            .from("user")
            .select("id, email, accessToken, role, minionId")
            .eq("id", req.params.id);
        if (!data || error)
            throw new error_1.default(error.message || `Could not find user with id ${req.params.id}`, error_1.ErrorCodes.NOT_FOUND);
        return res.status(200).json({
            status: 200,
            data: data[0],
        });
    }
    catch (error) {
        if (error instanceof error_1.default) {
            return res.status(error.statusCode).json({
                status: error.statusCode,
                message: error.errorMessage,
            });
        }
        else {
            return res.status(500).json({
                status: 500,
                message: (_a = error.message) !== null && _a !== void 0 ? _a : "Something went wrong",
            });
        }
    }
};
exports.getUserById = getUserById;
const getAllUsers = async (_req, res) => {
    var _a;
    try {
        const { data, error } = await init_1.default
            .from("user")
            .select("id, email, accessToken, role, minionId")
            .eq("role", "USER");
        if (!data || error)
            throw new error_1.default(error.message || "Could not find users", error_1.ErrorCodes.NOT_FOUND);
        return res.status(200).json({
            status: 200,
            data,
        });
    }
    catch (error) {
        if (error instanceof error_1.default) {
            return res.status(error.statusCode).json({
                status: error.statusCode,
                message: error.errorMessage,
            });
        }
        else {
            return res.status(500).json({
                status: 500,
                message: (_a = error.message) !== null && _a !== void 0 ? _a : "Something went wrong",
            });
        }
    }
};
exports.getAllUsers = getAllUsers;
const getAllAdmins = async (_req, res) => {
    var _a;
    try {
        const { data, error } = await init_1.default
            .from("user")
            .select("id, email, accessToken, role, minionId")
            .eq("role", "Admin");
        if (!data || error)
            throw new error_1.default(error.message || "Could not find users", error_1.ErrorCodes.NOT_FOUND);
        return res.status(200).json({
            status: 200,
            data,
        });
    }
    catch (error) {
        if (error instanceof error_1.default) {
            return res.status(error.statusCode).json({
                status: error.statusCode,
                message: error.errorMessage,
            });
        }
        else {
            return res.status(500).json({
                status: 500,
                message: (_a = error.message) !== null && _a !== void 0 ? _a : "Something went wrong",
            });
        }
    }
};
exports.getAllAdmins = getAllAdmins;
const createMinion = async (req, res) => {
    var _a;
    try {
        const user = req.user;
        const validatedBody = Minion_model_1.default.validate(Object.assign(Object.assign({}, req.body), { id: (0, uuidv4_1.uuid)(), createdBy: user.id }));
        if (validatedBody.error)
            throw new error_1.default(validatedBody.error.details[0].message, error_1.ErrorCodes.BAD_REQUEST);
        const { data, error } = await init_1.default
            .from("minion")
            .upsert(validatedBody.value, { onConflict: "id" });
        if (error || !data)
            throw new error_1.default(error.message ||
                `Could not create minion with id ${validatedBody.value.id}`, error_1.ErrorCodes.BAD_REQUEST);
        return res.status(201).json({
            status: 201,
            data: data[0],
        });
    }
    catch (error) {
        if (error instanceof error_1.default) {
            return res.status(error.statusCode).json({
                status: error.statusCode,
                message: error.errorMessage,
            });
        }
        else {
            return res.status(500).json({
                status: 500,
                message: (_a = error.message) !== null && _a !== void 0 ? _a : "Something went wrong",
            });
        }
    }
};
exports.createMinion = createMinion;
const addUserToMinion = async (req, res) => {
    var _a;
    try {
        const [{ data, error }, { data: userData, error: userError }] = await Promise.all([
            init_1.default
                .from("minion")
                .update({ userId: req.body.userId })
                .eq("id", req.params.minionId),
            init_1.default
                .from("user")
                .update({ minionId: req.params.minionId })
                .eq("id", req.body.userId),
        ]);
        if (error || !data)
            throw new error_1.default((error === null || error === void 0 ? void 0 : error.message) ||
                `Could not add user ${req.body.userId} to minion with id ${req.params.minionId}`, error_1.ErrorCodes.BAD_REQUEST);
        if (userError || !userData)
            throw new error_1.default((userError === null || userError === void 0 ? void 0 : userError.message) ||
                `Could not add user ${req.body.userId} to minion with id ${req.params.minionId}`, error_1.ErrorCodes.BAD_REQUEST);
        return res.status(200).json({
            status: 200,
            data: data[0],
        });
    }
    catch (error) {
        if (error instanceof error_1.default) {
            return res.status(error.statusCode).json({
                status: error.statusCode,
                message: error.errorMessage,
            });
        }
        else {
            return res.status(500).json({
                status: 500,
                message: (_a = error.message) !== null && _a !== void 0 ? _a : "Something went wrong",
            });
        }
    }
};
exports.addUserToMinion = addUserToMinion;
const getAllMinions = async (_req, res) => {
    var _a;
    try {
        const { data, error } = await init_1.default
            .from("minion")
            .select();
        if (error || !data)
            throw new error_1.default(error.message || `Could not find minions`, error_1.ErrorCodes.NOT_FOUND);
        return res.status(200).json({
            status: 200,
            data,
        });
    }
    catch (error) {
        if (error instanceof error_1.default) {
            return res.status(error.statusCode).json({
                status: error.statusCode,
                message: error.errorMessage,
            });
        }
        else {
            return res.status(500).json({
                status: 500,
                message: (_a = error.message) !== null && _a !== void 0 ? _a : "Something went wrong",
            });
        }
    }
};
exports.getAllMinions = getAllMinions;
const getMinionById = async (req, res) => {
    var _a;
    try {
        const { data, error } = await init_1.default
            .from("minion")
            .select()
            .eq("id", req.params.id);
        if (error || !data)
            throw new error_1.default(error.message || `Could not find minion with id ${req.params.id}`, error_1.ErrorCodes.NOT_FOUND);
        return res.status(200).json({
            status: 200,
            data: data[0],
        });
    }
    catch (error) {
        if (error instanceof error_1.default) {
            return res.status(error.statusCode).json({
                status: error.statusCode,
                message: error.errorMessage,
            });
        }
        else {
            return res.status(500).json({
                status: 500,
                message: (_a = error.message) !== null && _a !== void 0 ? _a : "Something went wrong",
            });
        }
    }
};
exports.getMinionById = getMinionById;
//# sourceMappingURL=controllers.js.map
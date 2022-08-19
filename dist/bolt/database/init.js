"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = __importDefault(require("../../config"));
const supabaseClient = (0, supabase_js_1.createClient)(config_1.default.SUPABASE_URL, config_1.default.SUPABASE_KEY);
exports.default = supabaseClient;
//# sourceMappingURL=init.js.map
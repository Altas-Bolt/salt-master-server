"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({
    path: path_1.default.resolve(__dirname, "../", ".env"),
});
const express_1 = __importDefault(require("express"));
require("./bolt/database/init");
const routes_1 = __importDefault(require("./bolt/routes"));
console.log(path_1.default.resolve(__dirname, "../", ".env"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use("/bolt", routes_1.default);
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on ${port}...`));
//# sourceMappingURL=app.js.map
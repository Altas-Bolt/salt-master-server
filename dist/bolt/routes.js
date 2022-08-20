"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("./controllers");
const middlewares_1 = require("./middlewares");
const router = (0, express_1.Router)();
router.post("/users/create", controllers_1.createUser);
router.post("/users/login", controllers_1.loginUser);
router.get("/users/all", [middlewares_1.auth, middlewares_1.admin], controllers_1.getAllUsers);
router.get("/users/:id", [middlewares_1.auth, middlewares_1.admin], controllers_1.getUserById);
router.get("/users/admins", [middlewares_1.auth, middlewares_1.admin], controllers_1.getAllAdmins);
router.post("/minions/create", [middlewares_1.auth, middlewares_1.admin], controllers_1.createMinion);
router.get("/minions/all", [middlewares_1.auth, middlewares_1.admin], controllers_1.getAllMinions);
router.get("/minions/:id", [middlewares_1.auth, middlewares_1.admin], controllers_1.getMinionById);
router.put("/minions/add-user/:minionId", [middlewares_1.auth, middlewares_1.admin], controllers_1.addUserToMinion);
exports.default = router;
//# sourceMappingURL=routes.js.map
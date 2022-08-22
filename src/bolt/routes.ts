import { Router } from "express";
import {
  addUserToMinion,
  changePassword,
  createMinion,
  createUser,
  getAllAdmins,
  getAllMinions,
  getAllUsers,
  getMinionById,
  getUnassignedMinions,
  getUserById,
  loginUser,
} from "./controllers";
import { admin, auth } from "./middlewares";

const router = Router();

// User
router.post("/users/create", createUser);
router.post("/users/login", loginUser);
router.get("/users/all", [auth, admin], getAllUsers);
router.get("/users/:id", [auth, admin], getUserById);
router.get("/users/admins", [auth, admin], getAllAdmins);
router.put("/users/change-password", [auth], changePassword);

// Minions
router.post("/minions/create", [auth, admin], createMinion);
router.get("/minions/all", [auth, admin], getAllMinions);
router.get("/minions/unassigned", [auth, admin], getUnassignedMinions);
router.get("/minions/:id", [auth, admin], getMinionById);
router.put("/minions/add-user/:minionId", [auth, admin], addUserToMinion);

export default router;

import { Router } from "express";
import {
  addUserToMinion,
  changePassword,
  createMinion,
  createUser,
  getAllAdmins,
  getAllMinions,
  getAllScans,
  getAllUsers,
  getMinionById,
  getUnassignedMinions,
  getScanInfo,
  getUserById,
  loginUser,
  getMinionBySaltId,
  getLatestScan,
  getAllSoftwares,
} from "./controllers";
import { admin, auth } from "./middlewares";

const router = Router();

// User
router.post("/users/create", createUser);
router.post("/users/login", loginUser);
router.get("/users/all", [auth, admin], getAllUsers);
router.put("/users/change-password", [auth], changePassword);
router.get("/users/:id", [auth, admin], getUserById);
router.get("/users/admins", [auth, admin], getAllAdmins);

// Minions
router.post("/minions/create", [auth, admin], createMinion);
router.get("/minions/all", [auth, admin], getAllMinions);
router.get("/minions/unassigned", [auth, admin], getUnassignedMinions);
router.get("/minions/:id", [auth, admin], getMinionById);
router.get("/minions/getBySaltId/:saltId", [auth, admin], getMinionBySaltId);
router.put("/minions/add-user/:id", [auth, admin], addUserToMinion);

// Scan
router.get("/scans/all", getAllScans);
router.get("/scans/latest", getLatestScan);
router.post("/scans/info", getScanInfo);

// Softwares
router.post("/softwares/query", getAllSoftwares);

export default router;

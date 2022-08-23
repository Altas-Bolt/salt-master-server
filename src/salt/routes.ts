import { Router } from "express";
import { admin, auth } from "../bolt/middlewares";
import {
  acceptMinionKeysController,
  getSaltMinionKeysController,
  linuxScan,
  rejectMinionKeysController,
  runCommand,
} from "./controllers";

const router = Router();

router.post("/linux-scan", linuxScan);
router.get("/keys", [auth, admin], getSaltMinionKeysController);
router.post("/keys/accept", [auth, admin], acceptMinionKeysController);
router.post("/keys/reject", [auth, admin], rejectMinionKeysController);
router.post("/run-cmd", runCommand);

export default router;

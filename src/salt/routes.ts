import { Router } from "express";
import { linuxScan, runCommand } from "./controllers";

const router = Router();

router.post("/linux-scan", linuxScan);
router.post("/run-cmd", runCommand);

export default router;

import { Router } from "express";
import { linuxScan } from "./controllers";

const router = Router();

router.post("/linux-scan", linuxScan);

export default router;

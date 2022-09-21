import { OSEnum } from "./global.enum";
import { runSaltConfigManagement } from "./salt/utils/saltKeyHelpers";

// import dotenv from ''
import { config } from "dotenv";
config();

runSaltConfigManagement(["linux--oqLSHeU"], OSEnum.LINUX);

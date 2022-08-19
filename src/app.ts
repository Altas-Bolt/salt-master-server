import { config } from "dotenv";
config();

import express from "express";
import saltRouter from "./salt/routes";

const app = express();

app.use("api/salt", saltRouter);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server listening on ${port}...`));

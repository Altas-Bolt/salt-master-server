import path from "path";
import { config } from "dotenv";
config({
  path: path.resolve(__dirname, "../", ".env"),
});

import express from "express";
import "./bolt/database/init";
import router from "./bolt/routes";

console.log(path.resolve(__dirname, "../", ".env"));

const app = express();

app.use(express.json());

app.use("/bolt", router);

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Server listening on ${port}...`));

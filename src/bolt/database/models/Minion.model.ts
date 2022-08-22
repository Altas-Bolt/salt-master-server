import Joi from "joi";
import { IMinionTable } from "../db.interface";

const Minion = Joi.object<IMinionTable>({
  id: Joi.string().required(),
  saltId: Joi.string().required(),
  os: Joi.string().required(),
  ip: Joi.string().required(),
  userId: Joi.string(),
  createdBy: Joi.string().required(),
});

export default Minion;

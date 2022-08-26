import Joi from "joi";
import { customAlphabet } from "nanoid";
import { IMinionTable } from "../db.interface";
const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);

const Minion = Joi.object<IMinionTable>({
  id: Joi.string().required(),
  os: Joi.string().required(),
  saltId: Joi.string().default(
    Joi.ref("os", {
      adjust: (os) => `${os}-${nanoid(5)}`,
    })
  ),
  // saltId:Joi.string().required() ,
  ip: Joi.string().required(),
  userId: Joi.string(),
  createdBy: Joi.string().required(),
});

export default Minion;

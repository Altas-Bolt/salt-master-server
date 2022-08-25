import Joi from "joi";
import { IMinionTable } from "../db.interface";
import shortid from "shortid";

const Minion = Joi.object<IMinionTable>({
  id: Joi.string().required(),
  os: Joi.string().required(),
  saltId: Joi.string().default(
    Joi.ref("os", {
      adjust: (os) => `${os}-${shortid()}`,
    })
  ),
  // saltId:Joi.string().required() ,
  ip: Joi.string().required(),
  userId: Joi.string(),
  createdBy: Joi.string().required(),
});

export default Minion;

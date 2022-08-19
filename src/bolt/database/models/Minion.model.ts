import Joi from "joi";

export interface IMinion {
  id: string;
  saltId: string;
  os: string;
  ip: string;
  userId?: string;
  createdBy: string;
  installedSoftwares?: string[];
}

const Minion = Joi.object<IMinion>({
  id: Joi.string().required(),
  saltId: Joi.string().required(),
  os: Joi.string().required(),
  ip: Joi.string().required(),
  userId: Joi.string(),
  createdBy: Joi.string().required(),
  installedSoftwares: Joi.array().items(Joi.string()),
});

export default Minion;

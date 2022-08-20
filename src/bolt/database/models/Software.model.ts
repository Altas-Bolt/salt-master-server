import Joi from "joi";
import { uuid } from "uuidv4";

const schema = Joi.object({
  softwareId: Joi.string().default(uuid()).required(),
  name: Joi.string().required(),
  version: Joi.string(),
  isBlacklisted: Joi.boolean().default(false),
});

export default schema;

import Joi from "joi";
import { UserRoles } from "../../../global.enum";
import { IUserTable } from "../db.interface";

const User = Joi.object<IUserTable>({
  id: Joi.string().required(),
  email: Joi.string().email().trim().required(),
  password: Joi.string().required(),
  accessToken: Joi.string(),
  role: Joi.string()
    .valid(UserRoles.ADMIN, UserRoles.USER)
    .default(UserRoles.USER),
  minionId: Joi.string(),
});

export default User;

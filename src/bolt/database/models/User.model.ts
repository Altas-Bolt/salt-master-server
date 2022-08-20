import Joi from "joi";

export enum UserRoles {
  USER = "USER",
  ADMIN = "ADMIN",
}

export type UserRolesKeys = keyof typeof UserRoles;

export interface IUser {
  id: string;
  email: string;
  password: string;
  accessToken?: string;
  role: UserRolesKeys;
  minionId?: string;
}

const User = Joi.object<IUser>({
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

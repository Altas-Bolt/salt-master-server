import { Request } from "express";
import { ParamsDictionary, Query } from "express-serve-static-core";

export type TRequestBody<T extends any = any> = Request<
  ParamsDictionary,
  any,
  T,
  Query,
  Record<string, any>
>;

export type TRequestParams<T extends ParamsDictionary = ParamsDictionary> =
  Request<T, any, any, Query, Record<string, any>>;

export type TRequestQuery<T extends Query = Query> = Request<
  ParamsDictionary,
  any,
  any,
  T,
  Record<string, any>
>;

import { NextFunction, Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";

// This allows us to use async handlers and
// makes sure we still follow the middleware
// rules of Express (i.e. triggering the error handler)
// Also makes it a little more intuitive to add body types
export const createHandler =
  <RequestBodyType, ResponseBodyType>(
    handler: (
      req: Request<ParamsDictionary, ResponseBodyType, RequestBodyType>,
      res: Response<ResponseBodyType>,
      next?: NextFunction
    ) => Promise<void>
  ) =>
  (
    req: Request<ParamsDictionary, ResponseBodyType, RequestBodyType>,
    res: Response<ResponseBodyType>,
    next?: NextFunction
  ): void => {
    handler(req, res, next).catch(next);
  };

// ---- Server
import { Request, Response, Router } from "express";

import * as twitterOAuth from "./twitterOauth";

export const router = Router();

export type GenerateTwitterAuthUrlRequestBody = {
  callback: string;
};

export type GenerateBrightidBody = {
  contextIdData: string;
};

router.post("/twitter/generateAuthUrl", (req: Request, res: Response): void => {
  const { callback } = req.body as GenerateTwitterAuthUrlRequestBody;
  if (callback) {
    const state = twitterOAuth.getSessionKey();
    const client = twitterOAuth.initClient(callback, state);

    const data = {
      state,
      authUrl: twitterOAuth.generateAuthURL(client, state),
    };

    res.status(200).send(data);
  } else {
    res.status(400);
  }
});

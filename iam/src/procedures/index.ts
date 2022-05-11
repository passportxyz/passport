// ---- Server
import { Request, Response, Router } from "express";

import { generateAuthURL, getSessionKey, initClient } from "./twitterOauth";

export const router = Router();

export type GenerateTwitterAuthUrlRequestBody = {
  callback: string;
};

router.post("/twitter/generateAuthUrl", (req: Request, res: Response): void => {
  const { callback } = req.body as GenerateTwitterAuthUrlRequestBody;
  if (callback) {
    const state = getSessionKey();
    const client = initClient(callback, state);

    const data = {
      state,
      authUrl: generateAuthURL(client, state),
    };

    res.status(200).send(data);
  } else {
    res.status(400);
  }
});

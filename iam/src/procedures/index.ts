// ---- Server
import { Request, Response, Router } from "express";

import { generateAuthURL, getSessionKey, initClient } from "./twitterOauth";
import { triggerBrightidSponsorship, verifyBrightidContextId } from "./brightid";

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

router.post("/brightid/sponsor", (req: Request, res: Response): void => {
  const { contextIdData } = req.body as GenerateBrightidBody;
  if (contextIdData) {
    return void triggerBrightidSponsorship(contextIdData).then((response) => {
      return res.status(200).send({ response });
    });
  } else {
    res.status(400);
  }
});

router.post("/brightid/verifyContextId", (req: Request, res: Response): void => {
  const { contextIdData } = req.body as GenerateBrightidBody;
  if (contextIdData) {
    return void verifyBrightidContextId(contextIdData).then((response) => {
      return res.status(200).send({ response });
    });
  } else {
    res.status(400);
  }
});

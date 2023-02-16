// ---- Server
import { Request, Response, Router } from "express";

import * as twitterOAuth from "./Twitter/procedures/twitterOauth";
import { triggerBrightidSponsorship, getBrightidInfoForAddress } from "./Brightid/procedures/brightid";
import path from "path";

export const router = Router();

export type GenerateTwitterAuthUrlRequestBody = {
  callback: string;
};

export type BrightidUserInfoBody = {
  address: string;
};

export type SponsorBrightidBody = {
  appUserId: string;
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

router.post("/brightid/sponsor", (req: Request, res: Response): void => {
  const { appUserId } = req.body as SponsorBrightidBody;
  if (appUserId) {
    return void triggerBrightidSponsorship(appUserId).then((response) => {
      return res.status(200).send({ response });
    });
  } else {
    res.status(400);
  }
});

router.post("/brightid/getUserInfo", (req: Request, res: Response): void => {
  const { address } = req.body as BrightidUserInfoBody;
  if (address) {
    return void getBrightidInfoForAddress(address)
      .then((response) => {
        return res.status(200).send({ response });
      })
      .catch((e) => res.status(400).send(e));
  } else {
    res.status(400);
  }
});

router.get("/brightid/information", (req: Request, res: Response): void => {
  const staticPath =
    process.env.CURRENT_ENV === "development"
      ? "src/static/bright-id-template.html"
      : "iam/src/static/bright-id-template.html";
  res.sendFile(path.resolve(process.cwd(), staticPath));
});

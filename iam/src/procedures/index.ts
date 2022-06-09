// ---- Server
import { Request, Response, Router } from "express";

import * as twitterOAuth from "./twitterOauth";
import * as githubOAuth from "./githubOauth";
import { triggerBrightidSponsorship, verifyBrightidContextId } from "./brightid";

export const router = Router();

export type GenerateTwitterAuthUrlRequestBody = {
  callback: string;
};

export type GenerateGithubAuthUrlRequestBody = {
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

router.post("/github/generateAuthUrl", (req: Request, res: Response): void => {
  const { callback } = req.body as GenerateGithubAuthUrlRequestBody;
  if (callback) {
    const state = githubOAuth.getSessionKey();
    const clientId = process.env.GITHUB_CLIENT_ID;

    const data = {
      state,
      authUrl: `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${callback}&state=${state}`,
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

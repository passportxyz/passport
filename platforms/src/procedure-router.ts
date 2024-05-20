// ---- Server
import { Request, Response, Router } from "express";

import * as twitterOAuth from "./Twitter/procedures/twitterOauth";
import { triggerBrightidSponsorship, verifyBrightidContextId } from "./Brightid/procedures/brightid";
import path from "path";
import * as idenaSignIn from "./Idena/procedures/idenaSignIn";
import { outdidRequestVerification } from "./Outdid/procedures/outdidVerification";

export const router = Router();

export type GenerateTwitterAuthUrlRequestBody = {
  callback?: string;
};

export type GenerateBrightidBody = {
  contextIdData: string;
};

export type IdenaStartSessionRequestBody = {
  token: string;
  address: string;
};

export type IdenaAuthenticateRequestBody = {
  token: string;
  signature: string;
};

router.post("/twitter/generateAuthUrl", (req: Request, res: Response): void => {
  const { callback: callbackOverride } = req.body as GenerateTwitterAuthUrlRequestBody;
  twitterOAuth.initClientAndGetAuthUrl(callbackOverride).then((authUrl) => {
    const data = {
      authUrl,
    };

    res.status(200).send(data);
  });
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

router.get("/brightid/information", (req: Request, res: Response): void => {
  const staticPath =
    process.env.CURRENT_ENV === "development"
      ? "src/static/bright-id-template.html"
      : "iam/src/static/bright-id-template.html";
  res.sendFile(path.resolve(process.cwd(), staticPath));
});

router.post("/idena/create-token", (req: Request, res: Response): void => {
  idenaSignIn
    .initSession()
    .then((token) => {
      const data = {
        token: token,
      };
      res.status(200).send(data);
    })
    .catch((error) => {
      res.status(400).send({
        error: `An error was encountered while creating a new token: ${String(error)}`,
      });
    });
});

router.post("/idena/start-session", (req: Request, res: Response): void => {
  const { token, address } = req.body as IdenaStartSessionRequestBody;
  if (!token || !address) {
    res.status(200).send({
      error: "bad request",
    });
    return;
  }
  idenaSignIn
    .loadIdenaSession(token, address)
    .then((nonce) => {
      if (!nonce) {
        res.status(200).send({
          error: "something went wrong while starting new session",
        });
        return;
      }
      const data = {
        success: true,
        data: {
          nonce: nonce,
        },
      };
      res.status(200).send(data);
    })
    .catch((error) => {
      res.status(400).send({
        error: `An error was encountered while starting the session: ${String(error)}`,
      });
    });
});

router.post("/idena/authenticate", (req: Request, res: Response): void => {
  const { token, signature } = req.body as IdenaAuthenticateRequestBody;
  if (!token || !signature) {
    res.status(200).send({
      error: "bad request",
    });
    return;
  }
  return void idenaSignIn
    .authenticate(token, signature)
    .then((authenticated) => {
      if (!authenticated) {
        res.status(200).send({
          success: false,
          error: "authentication failed",
        });
        return;
      }
      const data = {
        success: true,
        data: {
          authenticated: true,
        },
      };
      res.status(200).send(data);
    })
    .catch((error) => {
      if (error) {
        res.status(200).send({
          error: "something went wrong while starting new session",
        });
      }
    });
});

router.post("/outdid/connect", (req: Request, res: Response): void => {
  const body = req.body as { userDid?: string, callback?: string };
  if (body && body.userDid && body.callback) {
    outdidRequestVerification(body.userDid, body.callback).then((response) => {
      res.status(200).send(response);
    }).catch((_) => {
      res.status(400).send();
    });
  } else {
    res.status(400).send();
  }
});
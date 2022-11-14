/* eslint-disable */
import { AccessTokenResult, AppContext, Platform, ProviderPayload } from "../types";

export class GooglePlatform implements Platform {
  getProviderProof?(): Promise<AccessTokenResult> {
    // TODO: remove this method
    // TODO: Shouldn't need all of these ignores, should be just this //@ts-ignore assuming FB.init was already called; see facebookSdkScript in pages/index.tsx once tsconfigs are normalized
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore assuming FB.init was already called; see facebookSdkScript in app/pages/_app.tsx
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call

    // gapi.load("client", () => {
    //   // Enter an API key from the Google API Console:
    //   //   https://console.developers.google.com/apis/credentials
    //   var apiKey = "YOUR_API_KEY";

    //   // Enter the API Discovery Docs that describes the APIs you want to
    //   // access. In this example, we are accessing the People API, so we load
    //   // Discovery Doc found here: https://developers.google.com/people/api/rest/
    //   var discoveryDocs = ["https://people.googleapis.com/$discovery/rest?version=v1"];

    //   // Enter a client ID for a web application from the Google API Console:
    //   //   https://console.developers.google.com/apis/credentials?project=_
    //   // In your API Console project, add a JavaScript origin that corresponds
    //   //   to the domain where you will be running the script.
    //   var clientId = process.env.NEXT_PUBLIC_PASSPORT_GOOGLE_CLIENT_ID;

    //   // Enter one or more authorization scopes. Refer to the documentation for
    //   // the API or https://developers.google.com/people/v1/how-tos/authorizing
    //   // for details.
    //   var scopes = "profile";

    //   // @ts-ignore
    //   gapi.client
    //     .init({
    //       apiKey: apiKey,
    //       discoveryDocs: discoveryDocs,
    //       clientId: clientId,
    //       scope: scopes,
    //     })
    //     .then(function () {
    //       // @ts-ignore
    //       gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    //       // @ts-ignore
    //       updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());

    //       // authorizeButton.onclick = handleAuthClick;
    //       // signoutButton.onclick = handleSignoutClick;
    //     });
    // });

    google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_PASSPORT_GOOGLE_CLIENT_ID,
      callback: () => {
        console.log("show google");
      },
    });
    //@ts-ignore
    google.accounts.id.prompt();

    //@ts-ignore
    console.log("the result ", result);

    const returnThis: AccessTokenResult = {
      authenticated: false,
    };
    //@ts-ignore
    // gapi.load("client", start);
    return Promise.resolve(returnThis);
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    var client: { requestCode: () => void };
    var access_token: { requestCode: () => void };

    //@ts-ignore
    client = google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_PASSPORT_GOOGLE_CLIENT_ID,
      scope:
        "https://www.googleapis.com/auth/calendar.readonly\
              https://www.googleapis.com/auth/contacts.readonly",
      //@ts-ignore
      callback: (tokenResponse) => {
        access_token = tokenResponse.access_token;
      },
    });

    return Promise.resolve({
      client: client,
      access: access_token,
      //@ts-ignore
      accounts: google.accounts,
      clientid: process.env.NEXT_PUBLIC_PASSPORT_GOOGLE_CLIENT_ID,
    });
  }
  getOAuthUrl(state: string): Promise<string> {
    try {
      //@ts-ignore
      google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_PASSPORT_GOOGLE_CLIENT_ID,
        callback: () => {
          console.log("show google");
        },
      });
      //@ts-ignore
      google.accounts.id.prompt();
      return Promise.resolve("success");
    } catch (e) {
      throw new Error("Method not implemented.");
    }
  }
  platformId = "Google";
  path = "Google";
}

import axios from "axios";
import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

const PROCEDURE_URL = process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(/\/*?$/, "");
const SPONSOR_URL = `${PROCEDURE_URL}/brightid/sponsor`;
const GET_USER_INFO_URL = `${PROCEDURE_URL}/brightid/getUserInfo`;
const POPUP_INFO_URL = `${PROCEDURE_URL}/brightid/information`;

export class BrightidPlatform extends Platform {
  platformId = "Brightid";
  path = "brightid";
  clientId: string = null;
  redirectUri: string = null;
  isEVM = true;

  async getBrightidInfoForUserDid(userDid: string): Promise<any> {
    try {
      const res = await axios.post(GET_USER_INFO_URL, { userDid });
      const { data } = res;
      // TODO remove
      console.log("bidinfo", res);
      return data.response;
    } catch (e) {
      return {};
    }
  }

  // If a BrightID is already sponsored, this does nothing
  // If the appUserId is never linked, this does nothing
  // If the appUserId is linked to an unsponsored BrightID, this will sponsor it
  async sponsorAppUserId(appUserId: string): Promise<void> {
    try {
      await axios.post(SPONSOR_URL, { appUserId });
    } catch (e) {}
  }

  async showPopupWindow(appContext: AppContext, appUserId: string): Promise<void> {
    // Pass data to the page via props
    const popupUrl = `${POPUP_INFO_URL}?appUserId=${appUserId}`;
    const width = 600;
    const height = 800;
    const left = appContext.screen.width / 2 - width / 2;
    const top = appContext.screen.height / 2 - height / 2;

    const popup = appContext.window.open(
      popupUrl,
      "_blank",
      `toolbar=no, location=no, directories=no, status=no, menubar=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
    );

    return this.createPromiseToWaitForWindowClose(popup);
  }

  // This lets us return a promise that resolves when the popup closes
  async createPromiseToWaitForWindowClose(wndw: { closed: boolean }): Promise<void> {
    let windowCloseResolve: () => void;
    const interval = setInterval(() => wndw.closed && windowCloseResolve(), 100);
    return new Promise<void>((resolve) => {
      windowCloseResolve = () => {
        clearInterval(interval);
        resolve();
      };
    });
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const { userDid } = appContext;
    let valid;

    if (userDid) {
      const info = await this.getBrightidInfoForUserDid(userDid);
      const { appUserId } = info;
      valid = info.valid;

      if (!valid) {
        await this.sponsorAppUserId(appUserId);
        await this.showPopupWindow(appContext, appUserId);
      }
    }

    return {
      valid,
      did: userDid,
    };
  }
}

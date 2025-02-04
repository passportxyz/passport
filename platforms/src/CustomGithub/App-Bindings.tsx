import { GithubPlatform } from "../Github/App-Bindings.js";

export class CustomGithubPlatform extends GithubPlatform {
  platformId = "DeveloperList";
  path = "DeveloperList";
  isEVM = false;
}

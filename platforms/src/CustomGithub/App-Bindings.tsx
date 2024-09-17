import { GithubPlatform } from "../Github/App-Bindings";

export class CustomGithubPlatform extends GithubPlatform {
  platformId = "DeveloperList";
  path = "DeveloperList";
  isEVM = false;
}

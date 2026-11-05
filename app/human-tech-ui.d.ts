// This app uses "node" module resolution, which ignores package "exports", so TypeScript can't find
// @human.tech/ui's subpath entries on its own. Map them to their type files; Next resolves the code.
declare module "@human.tech/ui/core" {
  export * from "@human.tech/ui/dist/entries/core";
}
declare module "@human.tech/ui/passport" {
  export * from "@human.tech/ui/dist/entries/passport";
}

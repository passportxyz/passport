import "@testing-library/jest-dom/extend-expect";
import { TextEncoder, TextDecoder } from "util";

Object.defineProperty(global.self, "TextEncoder", {
  value: TextEncoder,
});
Object.defineProperty(global.self, "TextDecoder", {
  value: TextDecoder,
});

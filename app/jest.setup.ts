import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";
global.TextDecoder = TextDecoder as any;
global.TextEncoder = TextEncoder as any;
import axios from "axios";

// Mock modules
jest.mock("axios");

import { Buffer } from "buffer";

if (typeof window !== "undefined") {
  //@ts-ignore
  window.Buffer = Buffer;
} else {
  global.Buffer = Buffer;
}
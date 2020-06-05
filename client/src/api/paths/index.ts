import { httpUrl, wsUrl } from "../config";

const base = (rest: string): string => `${httpUrl}/${rest}`;

export default class Paths {
  static WS = wsUrl;
  static Init = base(`init`);
  static Accounts = base(`accounts`);
}

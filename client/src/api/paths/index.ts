import { baseUrl } from "../config";

const base = (rest: string): string => `${baseUrl}/${rest}`;

export default class Paths {
  static Init = base(`init`);
}

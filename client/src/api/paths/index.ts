import { httpUrl, wsUrl } from "../config";

const base = (rest: string): string => `${httpUrl}/${rest}`;

const splitParam = (): string => {
  const split = parseInt(
    new URLSearchParams(window.location.search).get("split") || ""
  );
  if (!isNaN(split)) {
    return "?split=" + split;
  } else {
    return "";
  }
};

export default class Paths {
  static WS = wsUrl;
  static Init = base(`init`) + splitParam();
  static Refresh = base(`refresh`) + splitParam();
}

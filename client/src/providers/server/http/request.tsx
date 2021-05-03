import { configFromInit } from "./config";
import { sleep, reportError } from "utils";
import { Action, Dispatch, ConfigStatus } from "./index";

export async function fetchWithRetry(
  dispatch: Dispatch,
  httpUrlRef: React.MutableRefObject<string>
) {
  dispatch({
    status: ConfigStatus.Fetching,
  });

  const httpUrl = httpUrlRef.current;
  while (httpUrl === httpUrlRef.current) {
    let response: Action | "retry" = await fetchInit(httpUrl);
    if (httpUrl !== httpUrlRef.current) break;
    if (response === "retry") {
      await sleep(2000);
    } else {
      dispatch(response);
      break;
    }
  }
}

async function fetchInit(httpUrl: string): Promise<Action | "retry"> {
  try {
    const body = JSON.stringify({});
    const response = await fetch(
      new Request(httpUrl + "/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      })
    );
    const data = await response.json();
    if (!("clusterUrl" in data) || !("programId" in data)) {
      throw new Error("Received invalid response");
    }

    return {
      status: ConfigStatus.Initialized,
      config: configFromInit(data),
    };
  } catch (err) {
    reportError(err, "/init failed");
    return "retry";
  }
}

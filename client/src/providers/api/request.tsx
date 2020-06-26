import { configFromInit, configFromAccounts } from "./config";
import { sleep, PAYMENT_ACCOUNT } from "utils";
import { Action, Dispatch, ConfigStatus } from "./index";

const SPLIT = ((): number | undefined => {
  const split = parseInt(
    new URLSearchParams(window.location.search).get("split") || ""
  );
  if (!isNaN(split)) {
    return split;
  }
})();

type InitRequest = {
  route: "init";
};

type AccountsRequest = {
  route: "accounts";
  paymentRequired: boolean;
};

type Request = AccountsRequest | InitRequest;

export async function fetchWithRetry(
  dispatch: Dispatch,
  httpUrlRef: React.MutableRefObject<string>,
  request: Request
) {
  dispatch({
    status: ConfigStatus.Fetching,
  });

  const httpUrl = httpUrlRef.current;
  let retries = 3;
  while (retries > 0 && httpUrl === httpUrlRef.current) {
    retries--;

    let response: Action | "retry";
    switch (request.route) {
      case "accounts": {
        response = await fetchAccounts(httpUrl, request.paymentRequired);
        break;
      }
      case "init": {
        response = await fetchInit(httpUrl);
      }
    }

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
    const body = JSON.stringify({ split: SPLIT });
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
    if (!("cluster" in data) || !("programId" in data)) {
      throw new Error("Received invalid response");
    }

    return {
      status: ConfigStatus.Initialized,
      config: configFromInit(data),
    };
  } catch (err) {
    console.error("Failed to initialize", err);
    return { status: ConfigStatus.Failure };
  }
}

async function fetchAccounts(
  httpUrl: string,
  paymentRequired: boolean
): Promise<Action | "retry"> {
  type RefreshData = {
    split?: number;
    paymentKey?: string;
  };

  const postData: RefreshData = {};
  if (SPLIT) {
    postData.split = SPLIT;
  }
  if (paymentRequired) {
    postData.paymentKey = Buffer.from(PAYMENT_ACCOUNT.secretKey).toString(
      "base64"
    );
  }

  try {
    const body = JSON.stringify(postData);
    const response = await fetch(
      new Request(httpUrl + "/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      })
    );

    if (response.status === 400) {
      return { status: ConfigStatus.Failure };
    } else if (response.status === 500) {
      const error = await response.text();
      throw new Error(error);
    } else {
      const data = await response.json();
      if (
        !("programAccounts" in data) ||
        !("feeAccounts" in data) ||
        !("accountCapacity" in data)
      ) {
        throw new Error("Received invalid response");
      }

      return { status: ConfigStatus.Ready, accounts: configFromAccounts(data) };
    }
  } catch (err) {
    console.error("Failed to refresh fee accounts", err);
    return "retry";
  }
}

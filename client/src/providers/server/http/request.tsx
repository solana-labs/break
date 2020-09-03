import { configFromInit, configFromAccounts } from "./config";
import { sleep, reportError } from "utils";
import { Action, Dispatch, ConfigStatus } from "./index";
import { Account } from "@solana/web3.js";

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
  paymentAccount: Account | undefined;
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
  while (httpUrl === httpUrlRef.current) {
    let response: Action | "retry";
    switch (request.route) {
      case "accounts": {
        response = await fetchAccounts(httpUrl, request.paymentAccount);
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

async function fetchAccounts(
  httpUrl: string,
  paymentAccount: Account | undefined
): Promise<Action | "retry"> {
  type RefreshData = {
    split?: number;
    paymentKey?: string;
  };

  const postData: RefreshData = {};
  if (SPLIT) {
    postData.split = SPLIT;
  }
  if (paymentAccount) {
    postData.paymentKey = Buffer.from(paymentAccount.secretKey).toString(
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
      return { status: ConfigStatus.Failure, accounts: undefined };
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
    reportError(err, "/accounts failed");
    return "retry";
  }
}

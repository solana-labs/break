import React from "react";

import { useWalletState } from "providers/wallet";
import { Redirect, useLocation } from "react-router-dom";
import { PaymentCard } from "components/PaymentCard";

export function StartPage() {
  const payer = useWalletState().wallet;
  const location = useLocation();

  if (!payer) {
    return <Redirect to={{ ...location, pathname: "/wallet" }} />;
  }

  return (
    <div className="container d-flex flex-grow-1 flex-column">
      <div className="row flex-grow-1 mb-5">
        <div className="col">
          <PaymentCard account={payer} />
        </div>
      </div>
    </div>
  );
}

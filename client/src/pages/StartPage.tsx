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
    <div className="container-fluid d-flex flex-column">
      <div className="row flex-grow-1 my-4">
        <div className="col">
          <PaymentCard keypair={payer} />
        </div>
      </div>
    </div>
  );
}

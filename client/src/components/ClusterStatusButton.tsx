import React from "react";
import { useServer, useClusterModal } from "../providers/server";

function ClusterStatusButton() {
  const [, setShow] = useClusterModal();
  const { name } = useServer();
  return (
    <span
      className="btn lift d-block btn-info text-white"
      onClick={() => setShow(true)}
    >
      {name}
    </span>
  );
}

export default ClusterStatusButton;

import React from "react";
import { Link } from "react-router-dom";
import { Location } from "history";
import {
  useServer,
  serverName,
  useClusterModal,
  SERVERS,
  DEFAULT_SERVER,
  serverInfo,
} from "../providers/server";

function ClusterModal() {
  const [show, setShow] = useClusterModal();
  const onClose = () => setShow(false);
  return (
    <>
      <div
        className={`modal fade fixed-right${show ? " show" : ""}`}
        onClick={onClose}
      >
        <div className="modal-dialog modal-dialog-vertical">
          <div className="modal-content">
            <div className="modal-body" onClick={(e) => e.stopPropagation()}>
              <span className="c-pointer" onClick={onClose}>
                &times;
              </span>

              <h2 className="text-center mb-4 mt-4">Choose a Cluster</h2>

              <ClusterToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ClusterToggle() {
  const { server } = useServer();

  return (
    <div className="btn-group-toggle d-flex flex-wrap mb-4">
      {SERVERS.map((next, index) => {
        const active = next === server;
        const btnClass = active
          ? `active btn-dark border-info text-white`
          : "btn-dark";

        const clusterLocation = (location: Location) => {
          const params = new URLSearchParams(location.search);
          if (next !== DEFAULT_SERVER) {
            params.set("cluster", next);
          } else {
            params.delete("cluster");
          }
          return {
            ...location,
            search: params.toString(),
          };
        };

        return (
          <Link
            key={index}
            className={`btn text-left col-12 mb-3 ${btnClass}`}
            to={clusterLocation}
          >
            {`${serverName(next)}: `}
            <span className="text-muted d-inline-block">
              {serverInfo(next)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default ClusterModal;

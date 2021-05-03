import React from "react";
import { Link } from "react-router-dom";
import { useDebounceCallback } from "@react-hook/debounce";
import { Location } from "history";
import {
  useServer,
  serverName,
  useClusterModal,
  SERVERS,
  DEFAULT_SERVER,
  useCustomUrl,
} from "../providers/server";
import { useRpcUrlState } from "providers/rpc";
import { useConfig } from "providers/server/http";

export function ClusterModal() {
  const [show, setShow] = useClusterModal();
  const onClose = () => setShow(false);
  const { server } = useServer();
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

              <h2 className="text-center mb-4 mt-5">
                Override {serverName(server)} RPC
              </h2>

              <CustomRpcInput />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CustomRpcInput() {
  const [rpcUrl, setRpcUrl] = useRpcUrlState();
  const [editing, setEditing] = React.useState(false);
  const configRpcUrl = useConfig()?.rpcUrl;
  const active = configRpcUrl !== rpcUrl;

  const customClass = (prefix: string) => (active ? `${prefix}-info` : "");
  const onUrlInput = useDebounceCallback((url: string) => {
    if (url.length > 0) {
      setRpcUrl(url);
    } else if (configRpcUrl) {
      setRpcUrl(configRpcUrl);
    }
  }, 500);

  const defaultValue = active ? rpcUrl : "";
  const inputTextClass = editing ? "" : "text-muted";
  return (
    <input
      type="text"
      defaultValue={defaultValue}
      placeholder="http://127.0.0.1:8899"
      className={`form-control form-control-prepended b-black ${inputTextClass} ${customClass(
        "border"
      )}`}
      onFocus={() => setEditing(true)}
      onBlur={() => setEditing(false)}
      onInput={(e) => onUrlInput(e.currentTarget.value)}
    />
  );
}

function CustomClusterInput() {
  const [customUrl, setCustomUrl] = useCustomUrl();
  const [editing, setEditing] = React.useState(false);

  const onUrlInput = useDebounceCallback((url: string) => {
    setCustomUrl(url);
  }, 500);

  const inputTextClass = editing ? "" : "text-muted";
  return (
    <input
      type="text"
      defaultValue={customUrl}
      className={`form-control form-control-prepended b-black ${inputTextClass}`}
      onFocus={() => setEditing(true)}
      onBlur={() => setEditing(false)}
      onInput={(e) => onUrlInput(e.currentTarget.value)}
    />
  );
}

function ClusterToggle() {
  const { server } = useServer();

  return (
    <>
      <div className="btn-group-toggle d-flex flex-wrap mb-4">
        {SERVERS.map((next) => {
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
              key={next}
              className={`btn text-center col-12 mb-3 ${btnClass}`}
              to={clusterLocation}
            >
              {serverName(next)}
            </Link>
          );
        })}
      </div>
      {server === "custom" && (
        <>
          <h2 className="text-center mb-4 mt-4">Break Server URL</h2>
          <CustomClusterInput />
        </>
      )}
    </>
  );
}

import React from "react";
import { Link, useLocation, useHistory } from "react-router-dom";
import { useDebounceCallback } from "@react-hook/debounce";
import { Location } from "history";
import {
  useServer,
  serverName,
  useClusterModal,
  SERVERS,
  DEFAULT_SERVER,
  serverInfo,
  useCustomUrl,
} from "../providers/server";

export function useQuery() {
  return new URLSearchParams(useLocation().search);
}

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

type InputProps = { active: boolean };
function CustomClusterInput({ active }: InputProps) {
  const [customUrl, setCustomUrl] = useCustomUrl();
  const [editing, setEditing] = React.useState(false);
  const query = useQuery();
  const history = useHistory();
  const location = useLocation();

  const customClass = (prefix: string) => (active ? `${prefix}-info` : "");

  const clusterLocation = (location: Location) => {
    if (customUrl.length > 0) query.set("cluster", "custom");
    return {
      ...location,
      search: query.toString(),
    };
  };

  const onUrlInput = useDebounceCallback((url: string) => {
    setCustomUrl(url);
    if (url.length > 0) {
      query.set("cluster", "custom");
      history.push({ ...location, search: query.toString() });
    }
  }, 500);

  const inputTextClass = editing ? "" : "text-muted";
  return (
    <>
      <Link
        to={(location) => clusterLocation(location)}
        className="btn input-group input-group-merge p-0"
      >
        <input
          type="text"
          defaultValue={customUrl}
          className={`form-control form-control-prepended b-black ${inputTextClass} ${customClass(
            "border"
          )}`}
          onFocus={() => setEditing(true)}
          onBlur={() => setEditing(false)}
          onInput={(e) => onUrlInput(e.currentTarget.value)}
        />
        <div className="input-group-prepend">
          <div
            className={`input-group-text pr-0 ${customClass("border")} b-black`}
          >
            <span className={customClass("text") || ""}>Custom:</span>
          </div>
        </div>
      </Link>
      <span className="text-muted text-center w-100">
        Note: This must be a break server url
      </span>
    </>
  );
}

function ClusterToggle() {
  const { server } = useServer();

  return (
    <div className="btn-group-toggle d-flex flex-wrap mb-4">
      {SERVERS.map((next) => {
        const active = next === server;

        if (next === "custom") {
          return <CustomClusterInput key={next} active={active} />;
        }

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

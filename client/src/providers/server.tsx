import React from "react";
import { clusterApiUrl, Cluster } from "@solana/web3.js";
import { useLocation } from "react-router-dom";
import { enableCustomCluster } from "utils";

type Server = Cluster | "custom";
export const DEFAULT_SERVER = enableCustomCluster() ? "custom" : "mainnet-beta";
export const SERVERS: Server[] = ["mainnet-beta", "testnet", "devnet"];

if (enableCustomCluster()) {
  SERVERS.push("custom");
}

export function serverName(server: Server): string {
  switch (server) {
    case "mainnet-beta":
      return "Mainnet Beta";
    case "testnet":
      return "Testnet";
    case "devnet":
      return "Devnet";
    case "custom":
      return "Custom";
  }
}

export function serverInfo(server: Server): string {
  return server === "custom" ? "Use custom server" : clusterApiUrl(server);
}

function parseQuery(query: URLSearchParams): Server {
  const clusterParam = query.get("cluster");
  switch (clusterParam) {
    case "devnet":
      return "devnet";
    case "testnet":
      return "testnet";
    case "mainnet-beta":
      return "mainnet-beta";
    default:
      return DEFAULT_SERVER;
  }
}

type SetShowModal = React.Dispatch<React.SetStateAction<boolean>>;
const ModalContext = React.createContext<[boolean, SetShowModal] | undefined>(
  undefined
);
type SetServer = React.Dispatch<React.SetStateAction<Server>>;
const ServerContext = React.createContext<[Server, SetServer] | undefined>(
  undefined
);

type ProviderProps = { children: React.ReactNode };
export function ServerProvider({ children }: ProviderProps) {
  const query = new URLSearchParams(useLocation().search);
  const serverParam = parseQuery(query);
  const [server, setServer] = React.useState<Server>(serverParam);
  const [showModal, setShowModal] = React.useState(false);

  // Update state when query params change
  React.useEffect(() => {
    setServer(serverParam);
  }, [serverParam]);

  return (
    <ServerContext.Provider value={[server, setServer]}>
      <ModalContext.Provider value={[showModal, setShowModal]}>
        {children}
      </ModalContext.Provider>
    </ServerContext.Provider>
  );
}

function getServerUrl(server: Server) {
  switch (server) {
    case "custom": {
      const hostname = window.location.hostname;
      return `http://${hostname}:${process.env.PORT || 8080}`;
    }
    default: {
      const useHttp = enableCustomCluster();
      let slug: string = server;
      if (server === "mainnet-beta") {
        slug = "mainnet";
      }
      return `${
        useHttp ? "http" : "https"
      }://break-solana-${slug}.herokuapp.com`;
    }
  }
}

export function useServer() {
  const context = React.useContext(ServerContext);
  if (!context) {
    throw new Error(`useServer must be used within a ServerProvider`);
  }
  const [server] = context;
  const httpUrl = getServerUrl(server);
  const webSocketUrl = httpUrl.replace("http", "ws");

  return {
    server,
    httpUrl,
    webSocketUrl,
    info: serverInfo(server),
    name: serverName(server),
  };
}

export function useClusterModal() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error(`useClusterModal must be used within a ServerProvider`);
  }
  return context;
}

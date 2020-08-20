import React from "react";
import { clusterApiUrl, Cluster } from "@solana/web3.js";
import { useLocation } from "react-router-dom";
import { isLocalHost } from "../utils";

type Server = Cluster | "custom";
export const DEFAULT_SERVER = isLocalHost() ? "custom" : "mainnet-beta";
export const SERVERS: Server[] = isLocalHost()
  ? ["custom"]
  : ["mainnet-beta", "testnet", "devnet", "custom"];

const DEFAULT_CUSTOM_URL = `http://${window.location.hostname}:${
  process.env.PORT || 8080
}`;

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
    case "custom":
      return "custom";
    default:
      return DEFAULT_SERVER;
  }
}

type SetShowModal = React.Dispatch<React.SetStateAction<boolean>>;
const ModalContext = React.createContext<[boolean, SetShowModal] | undefined>(
  undefined
);
type SetCustomUrl = React.Dispatch<React.SetStateAction<string>>;
type SetServer = React.Dispatch<React.SetStateAction<Server>>;
type ServerState = {
  server: Server;
  setServer: SetServer;
  customUrl: string;
  setCustomUrl: SetCustomUrl;
};
const ServerContext = React.createContext<ServerState | undefined>(undefined);

type ProviderProps = { children: React.ReactNode };
export function ServerProvider({ children }: ProviderProps) {
  const query = new URLSearchParams(useLocation().search);
  const serverParam = parseQuery(query);
  const [server, setServer] = React.useState<Server>(serverParam);
  const [customUrl, setCustomUrl] = React.useState<string>(DEFAULT_CUSTOM_URL);
  const [showModal, setShowModal] = React.useState(false);

  // Update state when query params change
  React.useEffect(() => {
    setServer(serverParam);
  }, [serverParam]);

  return (
    <ServerContext.Provider
      value={{ server, setServer, customUrl, setCustomUrl }}
    >
      <ModalContext.Provider value={[showModal, setShowModal]}>
        {children}
      </ModalContext.Provider>
    </ServerContext.Provider>
  );
}

function getServerUrl(server: Server, customUrl: string) {
  switch (server) {
    case "custom": {
      return customUrl;
    }
    default: {
      const useHttp = isLocalHost();
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
  const { server, customUrl } = context;
  const httpUrl = getServerUrl(server, customUrl);
  const webSocketUrl = httpUrl.replace("http", "ws");

  return {
    server,
    httpUrl,
    webSocketUrl,
    info: serverInfo(server),
    name: serverName(server),
  };
}

export function useCustomUrl(): [string, SetCustomUrl] {
  const context = React.useContext(ServerContext);
  if (!context) {
    throw new Error(`useCustomUrl must be used within a ServerProvider`);
  }
  return [context.customUrl, context.setCustomUrl];
}

export function useClusterModal() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error(`useClusterModal must be used within a ServerProvider`);
  }
  return context;
}

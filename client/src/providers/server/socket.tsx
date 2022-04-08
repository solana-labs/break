import { useClientConfig } from "providers/config";
import * as React from "react";
import { useServer } from ".";

type SetSocket = React.Dispatch<React.SetStateAction<ServerSocket | undefined>>;
const SocketContext = React.createContext<WebSocket | undefined>(undefined);

const FailureCallbackContext = React.createContext<
  React.MutableRefObject<FailureCallback> | undefined
>(undefined);

type SetActiveUsers = React.Dispatch<React.SetStateAction<number>>;
const ActiveUsersContext = React.createContext<number | undefined>(undefined);

const SWITCH_URL_CODE = 4444;

type ServerSocket = {
  socket: WebSocket;
  id: number;
};

let socketCounter = 0;

type FailureCallback = (signature: string, reason: string) => void;

type SocketProviderProps = { children: React.ReactNode };
export function SocketProvider({ children }: SocketProviderProps) {
  let [socket, setSocket] = React.useState<ServerSocket | undefined>(undefined);
  let failureCallbackRef = React.useRef(() => {});
  let [activeUsers, setActiveUsers] = React.useState<number>(1);
  let [{ useTpu, rpcUrl }] = useClientConfig();

  const { webSocketUrl } = useServer();
  React.useEffect(() => {
    newSocket(webSocketUrl, setSocket, setActiveUsers, failureCallbackRef);
  }, [webSocketUrl]);

  React.useEffect(() => {
    if (socket) {
      socket.socket.send(useTpu ? "tpu" : "rpc");
    }
  }, [socket, useTpu]);

  React.useEffect(() => {
    if (socket && rpcUrl) {
      socket.socket.send(rpcUrl);
    }
  }, [socket, rpcUrl]);

  return (
    <SocketContext.Provider value={socket?.socket}>
      <ActiveUsersContext.Provider value={activeUsers}>
        <FailureCallbackContext.Provider value={failureCallbackRef}>
          {children}
        </FailureCallbackContext.Provider>
      </ActiveUsersContext.Provider>
    </SocketContext.Provider>
  );
}

function newSocket(
  webSocketUrl: string,
  setSocket: SetSocket,
  setActiveUsers: SetActiveUsers,
  failureCallbackRef: React.MutableRefObject<FailureCallback>
): WebSocket | undefined {
  socketCounter++;
  const id = socketCounter;

  let socket: WebSocket;
  try {
    socket = new WebSocket(webSocketUrl);
  } catch (err) {
    return;
  }

  socket.onopen = () =>
    setSocket((serverSocket) => {
      if (!serverSocket || serverSocket.id <= id) {
        if (serverSocket && serverSocket.socket.readyState === WebSocket.OPEN) {
          serverSocket.socket.close(SWITCH_URL_CODE);
        }
        return { socket, id };
      } else {
        socket.close(SWITCH_URL_CODE);
        return serverSocket;
      }
    });

  socket.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if ("activeUsers" in data) {
      setActiveUsers(data.activeUsers);
    }

    if (data?.type === "failure") {
      let signature = data?.signature;
      let reason = data?.reason;
      if (typeof signature === "string" && typeof reason === "string") {
        failureCallbackRef.current(signature, reason);
      }
    }
  };

  socket.onclose = async (event) => {
    setSocket((serverSocket) => {
      // Socket may have been updated already
      if (!serverSocket || serverSocket.id === id) {
        // Reconnect if close was not explicit
        if (event.code !== SWITCH_URL_CODE) {
          console.error("Socket closed, reconnecting...");
          // TODO: Re-enable
          // reportError(new Error("Socket was closed"), "Socket closed");
          setTimeout(() => {
            newSocket(
              webSocketUrl,
              setSocket,
              setActiveUsers,
              failureCallbackRef
            );
          }, 5000);
        }
        return undefined;
      }
      return serverSocket;
    });
  };

  socket.onerror = async () => {
    socket.close();
  };

  return socket;
}

export function useSocket() {
  return React.useContext(SocketContext);
}

export function useActiveUsers() {
  const context = React.useContext(ActiveUsersContext);
  if (!context) {
    throw new Error(`useActiveUsers must be used within a SocketProvider`);
  }

  return context;
}

export function useFailureCallback() {
  const context = React.useContext(FailureCallbackContext);
  if (!context) {
    throw new Error(`useFailureCallback must be used within a SocketProvider`);
  }

  return context;
}

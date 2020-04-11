import * as React from "react";
import Path from "api/paths";
import { sleep } from "utils";

type SetSocket = React.Dispatch<React.SetStateAction<WebSocket | undefined>>;
const SocketContext = React.createContext<WebSocket | undefined>(undefined);

type SocketProviderProps = { children: React.ReactNode };
export function SocketProvider({ children }: SocketProviderProps) {
  let [socket, setSocket] = React.useState<WebSocket | undefined>(undefined);

  React.useEffect(() => {
    newSocket(setSocket);
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

function newSocket(setSocket: SetSocket) {
  const socket = new WebSocket(Path.WS);
  const timeoutId = setTimeout(() => {
    if (socket.readyState !== WebSocket.OPEN) {
      socket.close();
    }
  }, 5000);

  socket.onopen = () => setSocket(socket);
  socket.onclose = async () => {
    await sleep(2000);
    clearTimeout(timeoutId);
    setSocket(undefined);
    newSocket(setSocket);
  };
  socket.onerror = async err => {
    console.error(err);
    socket.close();
  };
}

export function useSocket() {
  return React.useContext(SocketContext);
}

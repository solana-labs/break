import * as React from "react";
import { sleep } from "utils";
import { useServer } from "./server";

type SetSocket = React.Dispatch<React.SetStateAction<WebSocket | undefined>>;
const SocketContext = React.createContext<WebSocket | undefined>(undefined);

type SetActiveUsers = React.Dispatch<React.SetStateAction<number>>;
const ActiveUsersContext = React.createContext<number | undefined>(undefined);

type SocketProviderProps = { children: React.ReactNode };
export function SocketProvider({ children }: SocketProviderProps) {
  let [socket, setSocket] = React.useState<WebSocket | undefined>(undefined);
  let [activeUsers, setActiveUsers] = React.useState<number>(1);

  const { webSocketUrl } = useServer();
  React.useEffect(() => {
    newSocket(webSocketUrl, setSocket, setActiveUsers);
  }, [webSocketUrl]);

  return (
    <SocketContext.Provider value={socket}>
      <ActiveUsersContext.Provider value={activeUsers}>
        {children}
      </ActiveUsersContext.Provider>
    </SocketContext.Provider>
  );
}

function newSocket(
  webSocketUrl: string,
  setSocket: SetSocket,
  setActiveUsers: SetActiveUsers
) {
  const socket = new WebSocket(webSocketUrl);
  const timeoutId = setTimeout(() => {
    if (socket.readyState !== WebSocket.OPEN) {
      socket.close();
    }
  }, 5000);

  socket.onopen = () => setSocket(socket);
  socket.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if ("activeUsers" in data) {
      setActiveUsers(data.activeUsers);
    }
  };
  socket.onclose = async () => {
    await sleep(2000);
    clearTimeout(timeoutId);
    setSocket(undefined);
    newSocket(webSocketUrl, setSocket, setActiveUsers);
  };
  socket.onerror = async (err) => {
    console.error(err);
    socket.close();
  };
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

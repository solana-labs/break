import * as React from "react";
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
    const socket = newSocket(webSocketUrl, setSocket, setActiveUsers);
    return () => socket.close();
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
): WebSocket {
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
    clearTimeout(timeoutId);
    setSocket((socket) => {
      if (socket && socket.url === webSocketUrl) return undefined;
      return socket;
    });
  };
  socket.onerror = async (err) => {
    console.error(err);
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

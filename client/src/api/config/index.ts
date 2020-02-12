let origin = window.location.origin;
const hostname = window.location.hostname;
switch (hostname) {
  case "localhost":
  case "127.0.0.1":
  case "0.0.0.0":
    origin = `http://${hostname}:${process.env.PORT || 8080}`;
}

export const wsUrl = origin.replace("http", "ws");
export const httpUrl = origin;

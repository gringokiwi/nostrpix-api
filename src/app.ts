import express from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes";
import { port } from "./config";
import { Server } from "socket.io";
import http from "http";
import { WebSocket, WebSocketServer } from "ws";

// Add global WebSocket for Node.js environment
if (!global.WebSocket) {
  (global as any).WebSocket = WebSocket;
}

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/", routes);

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    res.status(500).json({ error: "Something went wrong!" });
  }
);

// Create an HTTP server from the Express app
const server = http.createServer(app);

// Attach Socket.io to the HTTP server
const io = new Server(server, {
  cors: { origin: "*" }, // adjust CORS settings as needed
});

// Export the io instance for use in other modules (like your scheduled price updater)
export { io };

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

export default app;

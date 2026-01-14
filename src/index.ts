import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./utils/config/passport.js";
import userRouter from "./routes/userRoutes.js";
import postRouter from "./routes/postRoutes.js";
import communityRouter from "./routes/communityRoutes.js";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import type WebSocket from "ws";

// Express app
const app = express();
const port = process.env.PORT;

// Websocket server
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middlewares
app.use(passport.initialize());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL!],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/community", communityRouter);

// Websocket handling
interface User {
  ws: WebSocket;
  roomId: string;
}

let users: User[] = [];

wss.on("connection", (socket) => {
  socket.on("message", (e) => {
    let parsedData = JSON.parse(e.toString());

    // If type is join_room
    if (parsedData.type === "join_room") {
      users.push({
        ws: socket,
        roomId: parsedData.roomId,
      });
    }

    // If type is chat
    if (parsedData.type === "chat") {
      let roomUsers = users.filter((u) => u.roomId === parsedData.roomId);

      roomUsers.forEach((u) =>
        u.ws.send(
          JSON.stringify({
            type: "chat",
            post: {
              id: parsedData.message.id,
              content: parsedData.message.content,
              createdAt: parsedData.message.createdAt,
              likeCount: parsedData.message.likeCount,
              commentCount: parsedData.message.commentCount,
              authorName: parsedData.message.authorName,
              authorAvatar: parsedData.message.authorAvatar,
            },
          })
        )
      );
    }

    // If type is toggle_like
    if (parsedData.type === "toggle_like") {
      let roomUsers = users.filter((u) => u.roomId === parsedData.roomId);

      roomUsers.forEach((u) =>
        u.ws.send(
          JSON.stringify({
            type: "toggle_like",
            index: parsedData.index,
            post: {
              id: parsedData.message.id,
              content: parsedData.message.content,
              createdAt: parsedData.message.createdAt,
              likeCount: parsedData.message.likeCount,
              commentCount: parsedData.message.commentCount,
              authorName: parsedData.message.authorName,
              authorAvatar: parsedData.message.authorAvatar,
            },
          })
        )
      );
    }

    // If type is exit_room
    if (parsedData.type === "exit_room") {
      users = users.filter((u) => u.ws !== socket);
    }
  });

  socket.on("close", () => {
    users = users.filter((u) => u.ws !== socket);
  });
});

// Running server
server.listen(port, () => {
  console.log(`Server is listening on ${port}`);
});

import type { Application } from "express";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./lib/passport.js";
import userRoutes from "./routes/user-routes.js";
import authRoutes from "./routes/auth-routes.js"
import communityRoutes from "./routes/community-routes.js"
import { authenticate } from "./middlewares/auth-middleware.js";
import http from "http";
import { Server } from "socket.io";


dotenv.config();

const app: Application = express();
const server = http.createServer(app);


// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

// Listen for connections
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join_community", (communityId) => {
    socket.join(communityId);
    console.log(`User ${socket.id} joined community ${communityId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});


app.set("io", io);


app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());


app.get("/", (_req, res) => {
  res.send("Circles API is running...")
});


// Proxy google avatars
app.get("/proxy-image", authenticate, async (req: any, res) => {
  const imageUrl = req.query.url as string;

  if (!imageUrl || !imageUrl.startsWith("https://lh3.googleusercontent.com")) {
    return res.status(400).json({ error: "Invalid or missing image URL"});
  }

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', contentType);
    res.send(buffer);

  } catch (error) {
    res.status(500).json({ error: "Failed to load image" });
  }
});


// Mount routes
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/api/communities", communityRoutes);


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
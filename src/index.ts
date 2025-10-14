import type { Application, Request, Response } from "express";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/user-routes.js";
import authRoutes from "./routes/auth-routes.js"
import communityRoutes from "./routes/community-routes.js"
import passport from "./lib/passport.js";
import cookieParser from "cookie-parser";
import { authenticate } from "./middlewares/auth-middleware.js";


dotenv.config();

const app: Application = express();


app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());
app.use(cookieParser());


app.get("/", (req: Request, res: Response) => {
  res.send("Circles API is running...")
});


app.get("/proxy-image", authenticate, async (req, res: any) => {
  const imageUrl = req.query.url as string;

  if (!imageUrl || !imageUrl.startsWith("https://lh3.googleusercontent.com")) {
    return res.status(400).json({ error: "Invalid or missing image URL"});
  }

  try {
    console.log("Fetching image...")
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', contentType);
    res.send(buffer);
    console.log("Image loading confirmed")

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to load image" });
  }
});


// Routes
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/api/communities", communityRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
import type { Application, Request, Response } from "express";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/user-routes.js";
import authRoutes from "./routes/auth-routes.js"
import passport from "./lib/passport.js";
import cookieParser from "cookie-parser";


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


app.use("/users", userRoutes);
app.use("/auth", authRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./utils/config/passport.js";
import userRouter from "./routes/userRoutes.js";
import postRouter from "./routes/postRoutes.js";
import communityRouter from "./routes/communityRoutes.js";

const app = express();
const port = process.env.PORT;

app.use(passport.initialize());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL!],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// routes
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/community", communityRouter);

app.listen(port, () => {
  console.log(`Server is listening on ${port}`);
});

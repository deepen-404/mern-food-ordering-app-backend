import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";
import myUserRoutes from "./routes/myUserRoutes";

mongoose
  .connect(process.env.MONGODB_CONNECTION_STRING as string)
  .then(() => console.log("Conntected to database"));

const app = express();
app.use(express.json());
app.use(cors());

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.get("/health", async (req: Request, res: Response) => {
  res.send({ message: "health ok !!" });
});

app.use("/api/my/user", myUserRoutes);

app.listen(7000, () => console.log("Server started on localhost:7000"));

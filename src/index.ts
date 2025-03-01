import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import myUserRoutes from "./routes/myUserRoutes";
import myRestaurantRoutes from "./routes/myRestaurantRoutes";
import restaurantRoutes from "./routes/restaurantRoutes";
import orderRoutes from "./routes/orderRoutes";
import salesPerformanceRoutes from "./routes/salesPerformanceRoutes"

mongoose
  .connect(process.env.MONGODB_CONNECTION_STRING as string)
  .then(() => console.log("Conntected to database"));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
app.use(cors());

app.use("/api/order/checkout/webhook", express.raw({ type: "*/*" }));

app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.get("/health", async (req: Request, res: Response) => {
  res.send({ message: "health ok !!" });
});

app.use("/api/my/user", myUserRoutes);
app.use("/api/my/restaurant", myRestaurantRoutes);
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/my/restaurant", salesPerformanceRoutes);

app.listen(7000, () => console.log("Server started on localhost:7000"));

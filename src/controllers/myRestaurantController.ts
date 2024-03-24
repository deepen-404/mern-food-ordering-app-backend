import { Request, Response } from "express";
import cloudinary from "cloudinary";
import Restaurant from "../models/restaurant";
import mongoose from "mongoose";
import Order from "../models/order";

const createMyRestaurant = async (req: Request, res: Response) => {
  try {
    const existingRestaurant = await Restaurant.findOne({ user: req.userId });
    if (existingRestaurant) {
      return res.status(409).json({
        message: "User restaurant already exists !",
      });
    }

    // converting the image received from request into darta URI string
    const imageUrl = await uploadImage(req.file as Express.Multer.File);

    const newRestaurant = new Restaurant(req.body);
    newRestaurant.imageUrl = imageUrl;
    newRestaurant.user = new mongoose.Types.ObjectId(req.userId);
    newRestaurant.lastUpdated = new Date();

    await newRestaurant.save();
    return res.status(201).send(newRestaurant);
    // return res.status(201).json(newRestaurant.toObject());
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong !" });
  }
};

const getMyRestaurant = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({
      user: req.userId,
    });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.json(restaurant);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching restaurant" });
  }
};

const updateMyRestaurant = async (req: Request, res: Response) => {
  const {
    restaurantName,
    city,
    country,
    deliveryPrice,
    estimatedDeliveryTime,
    cuisines,
    menuItems,
  } = req.body;
  try {
    const existingRestaurant = await Restaurant.findOne({
      user: req.userId,
    });

    if (!existingRestaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    existingRestaurant.restaurantName = restaurantName;
    existingRestaurant.city = city;
    existingRestaurant.country = country;
    existingRestaurant.deliveryPrice = deliveryPrice;
    existingRestaurant.estimatedDeliveryTime = estimatedDeliveryTime;
    existingRestaurant.cuisines = cuisines;
    existingRestaurant.menuItems = menuItems;
    existingRestaurant.lastUpdated = new Date();

    if (req.file) {
      const imageUrl = await uploadImage(req.file as Express.Multer.File);
      existingRestaurant.imageUrl = imageUrl;
    }

    await existingRestaurant.save();
    res.status(200).send(existingRestaurant);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const uploadImage = async (file: Express.Multer.File) => {
  const image = file;
  const base64Image = Buffer.from(image.buffer).toString("base64");
  const dataURI = `data:${image.mimetype};base64,${base64Image}`;
  const uploadResponse = await cloudinary.v2.uploader.upload(dataURI);
  return uploadResponse.url;
};

const getMyRestaurantOrders = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ user: req.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    const orders = await Order.find({ restaurant: restaurant.id })
      .populate("restaurant")
      .populate("user");

    return res.json(orders);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    const restaurant = await Restaurant.findById(order.restaurant);
    if (restaurant?.user?._id.toString() !== req.userId) {
      return res.status(401).send();
    }

    order.status = status;
    await order.save();

    res.status(200).json(order);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Unable to update order status" });
  }
};

export default {
  getMyRestaurant,
  createMyRestaurant,
  updateMyRestaurant,
  getMyRestaurantOrders,
  updateOrderStatus,
};

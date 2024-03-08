import { Request, Response } from "express";
import User from "../models/myUserModel";

const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const currentUser = await User.findOne({ _id: req.userId });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(currentUser);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const createCurrentUser = async (req: Request, res: Response) => {
  try {
    const { auth0Id } = req.body;

    // checking if the user exists
    const existingUser = await User.findOne({ auth0Id });
    if (existingUser) {
      return res.status(200).json({
        message: "User already exists!!",
      });
    }

    // creating new a new user and returning to the frontend
    const newUser = new User(req.body);
    await newUser.save();
    return res.status(201).json(newUser.toObject());
  } catch (err) {
    console.log("The err is ", err);
    res.status(500).json({
      message: "Error creating user",
    });
  }
};

const updateCurrentUser = async (req: Request, res: Response) => {
  // console.log("updat use ma pugyo ??")
  try {
    const { name, addressLine1, country, city } = req.body;
    // console.log("req body: ",req)
    const user = await User.findById(req.userId);

    // checking if the user exists or not
    if (!user) {
      // console.log("u ser vetiyo");
      return res.status(404).json({ message: "User not found !!" });
    }

    user.name = name;
    user.city = city;
    user.country = country;
    user.addressLine1 = addressLine1;

    await user.save();

    res.send(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error udpating user" });
  }
};

export default {
  getCurrentUser,
  createCurrentUser,
  updateCurrentUser,
};

import mongoose from "mongoose";

const menuItemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  price: {
    type: String,
    required: true,
  },
});

const restarurantSchema = new mongoose.Schema({
  // creating a reference to a user document
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // User( the model name here )
  },

  restaurantName: {
    type: String,
    required: true,
  },

  city: {
    type: String,
    required: true,
  },

  country: {
    type: String,
    required: true,
  },

  deliveryPrice: {
    type: Number,
    required: true,
  },

  estimatedDeliveryTime: {
    type: Number,
    required: true,
  },

  cuisines: [
    {
      type: String,
      required: true,
    },
  ],

  menuItems: [menuItemsSchema],

  imageUrl: {
    type: String,
    required: true,
  },

  lastUpdated: {
    type: Date,
    required: true,
  },
});

const Restaurant = mongoose.model("Restaurant", restarurantSchema);

export default Restaurant;

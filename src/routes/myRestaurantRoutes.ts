import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import myRestaurantController from "../controllers/myRestaurantController";
import { jwtCheck, jwtParse } from "../middleware/auth";
import { validateMyRestarurantRequest } from "../middleware/validation";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5mb
  },
});

// api/my/restarurant

router.post(
  "/",
  upload.single("imageFile"),
  validateMyRestarurantRequest,
  jwtCheck,
  jwtParse,
  myRestaurantController.createMyRestaurant
);
router.get("/", jwtCheck, jwtParse, myRestaurantController.getMyRestaurant);

router.put(
  "/",
  upload.single("imageFile"),
  validateMyRestarurantRequest,
  jwtCheck,
  jwtParse,
  myRestaurantController.updateMyRestaurant
);

export default router;

import express from 'express';
import { signin, signout, signup, updateProfile, checkAuth } from '../controllers/auth.controller.js';
const router = express.Router();
import { protectRoute } from '../middleware/auth.middleware.js';

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", signout);
router.put("/update-profile", protectRoute, updateProfile);
router.get("/check", protectRoute, checkAuth);
export default router;
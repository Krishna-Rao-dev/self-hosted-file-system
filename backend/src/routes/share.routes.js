import { Router } from "express";
import * as controller from "../controllers/share.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = Router();
router.get("/:token", controller.get);
router.delete("/:token", auth, controller.remove);
export default router;console.log("Hello World");

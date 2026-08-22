import { Router } from "express";
import * as controller from "../controllers/folder.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = Router();
router.use(auth);
router.get("/", controller.list);
router.post("/", controller.create);
router.get("/:id", controller.get);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);
export default router;console.log("Hello World");

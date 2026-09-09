import { Router } from "express";
import * as controller from "../controllers/file.controller.js";
import * as shareController from "../controllers/share.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = Router();
router.use(auth);

router.post("/upload-url", controller.uploadUrl);
router.post("/complete", controller.complete);
router.get("/", controller.list);
router.get("/:id/download", controller.download);
router.get("/:id", controller.get);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);
router.post("/:id/share", shareController.create);

export default router;

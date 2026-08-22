import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import fileRoutes from "./routes/file.routes.js";
import folderRoutes from "./routes/folder.routes.js";
import shareRoutes from "./routes/share.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/health", async (request, response) => {
	response.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/share", shareRoutes);
app.use(errorHandler);

export default app;

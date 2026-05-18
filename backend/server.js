import express from "express";
import cors from "cors";
import "dotenv/config";

import authRoutes from "./src/routes/authRoutes.js";
import foodRoutes from "./src/routes/foodRoutes.js";
import claimRoutes from "./src/routes/claimRoutes.js";
import reportRoutes from "./src/routes/reportRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/foods", foodRoutes);
app.use("/claims", claimRoutes);
app.use("/reports", reportRoutes);
app.use("/notifications", notificationRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "Save N Serve API Running 🍱" });
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[Unhandled Error]", err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
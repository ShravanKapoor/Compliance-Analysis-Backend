import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authrouter from "./api/routes/auth.routes.js";
import organizationRouter from "./api/routes/organization.routes.js";
import frameworkRouter from "./api/routes/framework.route.js";
import productRoute from "./api/routes/product.routes.js";
import complianceRouter from "./api/routes/compliance.routes.js";
import cors from "cors";
dotenv.config();
const app = express();

//  middleware:
app.use(express.json());
app.use(cookieParser());

// cors:
// The frontend (Vite) runs on port 5173 by default. `credentials` must be
// true for the browser to send the auth cookie.
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET","POST","PUT","PATCH","DELETE"],
        credentials: true,
    }));

//  routes
app.use("/api/auth", authrouter);
app.use("/api/organization", organizationRouter);
app.use("/api/framework", frameworkRouter);
app.use("/api/product", productRoute)
app.use("/api/compliance", complianceRouter);

export default app;
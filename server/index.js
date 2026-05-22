import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/connectDB.js";
import cors from "cors";
import cookieParser from "cookie-parser";

// Route Imports
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js"; // <-- ADD THIS LINE
import interviewRouter from "./routes/interview.route.js";
import paymentRouter from "./routes/payment.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

// Route Definitions
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter); // <-- This will now work perfectly
app.use("/api/interview", interviewRouter);
app.use("/api/payment", paymentRouter);

app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port ${PORT}`);
});
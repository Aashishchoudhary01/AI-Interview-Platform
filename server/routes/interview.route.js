import express from "express";
import isAuth from "../middlewares/isAuth.js";
import upload from "../middlewares/multer.js";
import { 
    analyzeResume, 
    generateQuestions, 
    submitAnswer, 
    finishInterview,
    getMyInterviews,
    getInterviewReport
} from "../controllers/interview.controller.js";

const interviewRouter = express.Router();

// Ensure these paths match exactly what the frontend is calling
interviewRouter.post("/resume", isAuth, upload.single("resume"), analyzeResume);
interviewRouter.post("/generateQuestions", isAuth, generateQuestions);
interviewRouter.post("/submitAnswer", isAuth, submitAnswer);
interviewRouter.post("/finish", isAuth, finishInterview);

interviewRouter.get("/getInterviews", isAuth, getMyInterviews);
interviewRouter.get("/report/:id", isAuth, getInterviewReport);

export default interviewRouter;
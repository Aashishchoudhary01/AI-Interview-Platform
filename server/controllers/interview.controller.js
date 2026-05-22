import fs from "fs/promises";
import fsSync from "fs";
import { createRequire } from "module"; // <--- This was the missing line!
import { askAI } from "../services/openRouter.service.js";
import Interview from "../models/interviewModel.js";
import User from "../models/userModel.js";

// Setup for CommonJS modules in ES Module environment
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse"); 

// ==========================================
// 1. Analyze Resume
// ==========================================
export const analyzeResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Resume required" });
        }

        const filePath = req.file.path;
        const dataBuffer = await fs.readFile(filePath);
        
        // Use the required function directly
        const pdfData = await pdfParse(dataBuffer);
        const resumeText = pdfData.text.trim();

        const messages = [
            { 
                role: "system", 
                content: "Extract structured data from resume. Return strictly JSON in this format: { \"role\": \"string\", \"experience\": \"string\", \"projects\": [\"string\"], \"skills\": [\"string\"] }" 
            },
            { role: "user", content: resumeText }
        ];

        const aiResponse = await askAI(messages);
        const cleanedResponse = aiResponse.replace(/```json/g, "").replace(/```/g, "");
        const parsedData = JSON.parse(cleanedResponse);

        await fs.unlink(filePath);

        return res.status(200).json({ ...parsedData, resumeText });
    } catch (error) {
        if (req.file && fsSync.existsSync(req.file.path)) {
            await fs.unlink(req.file.path).catch(() => {});
        }
        console.error("Resume Analysis Error:", error);
        return res.status(500).json({ message: "Failed to analyze resume" });
    }
};

// ==========================================
// 2. Generate Questions & Create Interview
// ==========================================
export const generateQuestions = async (req, res) => {
    try {
        let { role, experience, mode, resumeText, projects, skills } = req.body;

        if (!role || !experience || !mode) {
            return res.status(400).json({ message: "Role, experience, and mode are required" });
        }

        role = role.trim();
        experience = experience.trim();
        mode = mode.trim();

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.credits < 50) return res.status(400).json({ message: "Not enough credits. Minimum 50 required." });

        const safeProjects = Array.isArray(projects) && projects.length > 0 ? projects.join(", ") : "None";
        const safeSkills = Array.isArray(skills) && skills.length > 0 ? skills.join(", ") : "None";
        const safeResume = resumeText ? resumeText.trim() : "None";

        const systemPrompt = `You are a professional human interviewer conducting a ${mode} interview.
Generate exactly 5 interview questions.
Rules:
- 15 to 25 words per question.
- Single complete sentence.
- Do not number them.
- No explanations.
- One question per line only.
- Difficulty progression: Q1 (Easy), Q2 (Easy), Q3 (Medium), Q4 (Medium), Q5 (Hard).`;

        const userPrompt = `Role: ${role}\nExperience: ${experience}\nMode: ${mode}\nProjects: ${safeProjects}\nSkills: ${safeSkills}\nResume: ${safeResume}`;

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ];

        const aiResponse = await askAI(messages);
        
        if (!aiResponse || !aiResponse.trim()) {
            return res.status(500).json({ message: "AI returned empty response" });
        }

        const rawQuestions = aiResponse.split("\n").map(q => q.trim()).filter(q => q.length > 0).slice(0, 5);
        
        if (rawQuestions.length === 0) {
            return res.status(500).json({ message: "AI failed to generate questions" });
        }

        user.credits -= 50;
        await user.save();

        const difficulties = ["Easy", "Easy", "Medium", "Medium", "Hard"];
        const timeLimits = [60, 60, 90, 90, 120];

        const formattedQuestions = rawQuestions.map((q, index) => ({
            question: q,
            difficulty: difficulties[index],
            timeLimit: timeLimits[index]
        }));

        const interview = await Interview.create({
            userId: req.userId,
            role,
            experience,
            mode,
            resumeText: safeResume,
            questions: formattedQuestions
        });

        return res.status(200).json({
            interviewId: interview._id,
            creditLeft: user.credits,
            userName: user.name,
            questions: interview.questions
        });
    } catch (error) {
        console.error("Generate Questions Error:", error);
        return res.status(500).json({ message: "Failed to create interview" });
    }
};

// ==========================================
// 3. Submit Answer
// ==========================================
export const submitAnswer = async (req, res) => {
    try {
        const { interviewId, questionIndex, answer, timeTaken } = req.body;
        const interview = await Interview.findById(interviewId);
        
        if (!interview) return res.status(404).json({ message: "Interview not found" });

        const question = interview.questions[questionIndex];

        if (!answer) {
            question.score = 0;
            question.feedback = "You did not submit an answer.";
            question.answer = "";
            await interview.save();
            return res.status(200).json({ feedback: question.feedback });
        }

        if (timeTaken > question.timeLimit) {
            question.score = 0;
            question.feedback = "Time limit exceeded. Answer not evaluated.";
            question.answer = answer;
            await interview.save();
            return res.status(200).json({ feedback: question.feedback });
        }

        const systemPrompt = `You are a professional human interviewer evaluating an answer.
Score the answer from 0 to 10.
Evaluate Confidence, Communication, and Correctness (0-10 each).
Provide a 10-15 word honest feedback.
Return ONLY valid JSON in this format: { "confidence": number, "communication": number, "correctness": number, "finalScore": number, "feedback": "string" }`;

        const userPrompt = `Question: ${question.question}\nAnswer: ${answer}`;

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ];

        const aiResponse = await askAI(messages);
        
        const cleanedResponse = aiResponse.replace(/```json/g, "").replace(/```/g, "");
        const parsed = JSON.parse(cleanedResponse);

        question.answer = answer;
        question.confidence = parsed.confidence;
        question.communication = parsed.communication;
        question.correctness = parsed.correctness;
        question.score = parsed.finalScore;
        question.feedback = parsed.feedback;

        await interview.save();

        return res.status(200).json({ feedback: parsed.feedback });
    } catch (error) {
        console.error("Submit Answer Error:", error);
        return res.status(500).json({ message: "Failed to submit answer" });
    }
};

// ==========================================
// 4. Finish Interview
// ==========================================
export const finishInterview = async (req, res) => {
    try {
        const { interviewId } = req.body;
        const interview = await Interview.findById(interviewId);

        if (!interview) return res.status(400).json({ message: "Failed to find interview" });

        const totalQuestions = interview.questions.length;
        let totalScore = 0, totalConfidence = 0, totalCommunication = 0, totalCorrectness = 0;

        interview.questions.forEach((q) => {
            totalScore += (q.score || 0);
            totalConfidence += (q.confidence || 0);
            totalCommunication += (q.communication || 0);
            totalCorrectness += (q.correctness || 0);
        });

        const finalScore = Number((totalScore / totalQuestions).toFixed(1)) || 0;
        const avgConfidence = Number((totalConfidence / totalQuestions).toFixed(1)) || 0;
        const avgCommunication = Number((totalCommunication / totalQuestions).toFixed(1)) || 0;
        const avgCorrectness = Number((totalCorrectness / totalQuestions).toFixed(1)) || 0;

        interview.finalScore = finalScore;
        interview.status = "Completed";
        await interview.save();

        const questionsData = interview.questions.map(q => ({
            question: q.question,
            score: q.score,
            feedback: q.feedback,
            confidence: q.confidence,
            communication: q.communication,
            correctness: q.correctness
        }));

        return res.status(200).json({
            finalScore,
            confidence: avgConfidence,
            communication: avgCommunication,
            correctness: avgCorrectness,
            questions: questionsData
        });
    } catch (error) {
        console.error("Finish Interview Error:", error);
        return res.status(500).json({ message: "Failed to finish interview" });
    }
};

// ==========================================
// 5. Get User's Interviews (History)
// ==========================================
export const getMyInterviews = async (req, res) => {
    try {
        const interviews = await Interview.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .select("role experience mode finalScore status createdAt");

        return res.status(200).json(interviews);
    } catch (error) {
        console.error("Get History Error:", error);
        return res.status(500).json({ message: `Failed to find interviews: ${error.message}` });
    }
};

// ==========================================
// 6. Get Single Interview Report
// ==========================================
export const getInterviewReport = async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id);
        
        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        let totalConfidence = 0, totalCommunication = 0, totalCorrectness = 0;
        const totalQuestions = interview.questions.length;

        interview.questions.forEach((q) => {
            totalConfidence += (q.confidence || 0);
            totalCommunication += (q.communication || 0);
            totalCorrectness += (q.correctness || 0);
        });

        const avgConfidence = Number((totalConfidence / totalQuestions).toFixed(1)) || 0;
        const avgCommunication = Number((totalCommunication / totalQuestions).toFixed(1)) || 0;
        const avgCorrectness = Number((totalCorrectness / totalQuestions).toFixed(1)) || 0;

        return res.status(200).json({
            finalScore: interview.finalScore,
            confidence: avgConfidence,
            communication: avgCommunication,
            correctness: avgCorrectness,
            questions: interview.questions
        });
    } catch (error) {
        console.error("Get Report Error:", error);
        return res.status(500).json({ message: `Failed to fetch report: ${error.message}` });
    }
};
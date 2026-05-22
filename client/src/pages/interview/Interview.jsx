import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaMicrophone, FaMicrophoneSlash, FaArrowRight } from 'react-icons/fa';
import { serverUrl } from '../../App';
import Timer from '../../components/Timer';

// Note: Replace these with your actual video paths in your assets folder
import femaleVideo from '../../assets/videos/female-ai.mp4';
import maleVideo from '../../assets/videos/male-ai.mp4';

const Interview = ({ interviewData, onFinish }) => {
    const { interviewId, questions, userName } = interviewData;

    // Core State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isIntroPhase, setIsIntroPhase] = useState(true);
    
    // AI & Voice State
    const [isAiPlaying, setIsAiPlaying] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState(null);
    const [voiceGender, setVoiceGender] = useState("female");
    const [subtitle, setSubtitle] = useState("");

    // Timer & Status State
    const [timeLeft, setTimeLeft] = useState(60);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Refs
    const videoRef = useRef(null);
    const recognitionRef = useRef(null);

    const currentQuestion = questions[currentIndex];
    const videoSource = voiceGender === "male" ? maleVideo : femaleVideo;

    // Load AI Voices
    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length === 0) return;

            // Simple heuristic to find a female/male voice
            const female = voices.find(v => v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('female'));
            const male = voices.find(v => v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('mark') || v.name.toLowerCase().includes('male'));

            if (female) {
                setSelectedVoice(female);
                setVoiceGender("female");
            } else if (male) {
                setSelectedVoice(male);
                setVoiceGender("male");
            } else {
                setSelectedVoice(voices[0]);
                setVoiceGender("female");
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    // Speech Synthesis (AI Speaking)
    const speakText = (text) => {
        return new Promise((resolve) => {
            if (!window.speechSynthesis || !selectedVoice) return resolve();

            window.speechSynthesis.cancel();
            
            // Add natural pauses
            const humanText = text.replace(/,/g, ', ...').replace(/\./g, '. ...');
            const utterance = new SpeechSynthesisUtterance(humanText);
            
            utterance.voice = selectedVoice;
            utterance.rate = 0.95; // Slightly slower for natural feel
            utterance.pitch = 1.05;

            utterance.onstart = () => {
                setIsAiPlaying(true);
                setSubtitle(text);
                if (videoRef.current) videoRef.current.play();
                if (isMicOn) toggleMic(false); // Stop mic while AI speaks
            };

            utterance.onend = () => {
                setIsAiPlaying(false);
                setSubtitle("");
                if (videoRef.current) {
                    videoRef.current.pause();
                    videoRef.current.currentTime = 0;
                }
                resolve();
            };

            window.speechSynthesis.speak(utterance);
        });
    };

    // Run Intro and Question
    useEffect(() => {
        const runIntro = async () => {
            if (isIntroPhase && selectedVoice) {
                await speakText(`Hi ${userName}, it's great to meet you today. I hope you are feeling confident and ready. I will ask you a few questions. Just answer naturally and take your time. Let's begin.`);
                setIsIntroPhase(false);
            } else if (!isIntroPhase && currentQuestion) {
                await new Promise(res => setTimeout(res, 800));
                
                if (currentIndex === questions.length - 1) {
                    await speakText("Alright, this one might be a bit more challenging.");
                }
                
                await speakText(currentQuestion.question);
                if (!isMicOn) toggleMic(true); // Auto-start mic after question
            }
        };

        runIntro();

        return () => {
            window.speechSynthesis.cancel();
        };
    }, [isIntroPhase, currentIndex, selectedVoice]);

    // Timer Logic
    useEffect(() => {
        if (isIntroPhase || !currentQuestion || isSubmitting || feedback) return;

        setTimeLeft(currentQuestion.timeLimit || 60);

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Auto submit if time runs out
                    if (!feedback) submitAnswer();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentIndex, isIntroPhase, isSubmitting, feedback]);

    // Speech Recognition (Mic Recording)
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            setAnswer((prev) => prev + (prev ? " " : "") + transcript);
        };

        recognitionRef.current = recognition;

        if (isMicOn && !isAiPlaying) {
            recognition.start();
        } else if (!isMicOn && recognitionRef.current) {
            recognition.stop();
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [isMicOn, isAiPlaying]);

    const toggleMic = (forceState = null) => {
        const newState = forceState !== null ? forceState : !isMicOn;
        setIsMicOn(newState);
        if (newState && recognitionRef.current && !isAiPlaying) {
            try { recognitionRef.current.start(); } catch (e) {}
        } else if (!newState && recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    // Submit Answer
    const submitAnswer = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        toggleMic(false); // Stop mic

        try {
            const timeTaken = (currentQuestion.timeLimit || 60) - timeLeft;
            
            const result = await axios.post(`${serverUrl}/api/interview/submitAnswer`, {
                interviewId,
                questionIndex: currentIndex,
                answer,
                timeTaken
            }, { withCredentials: true });

            setFeedback(result.data.feedback);
            await speakText(result.data.feedback);
            
        } catch (error) {
            console.error("Failed to submit answer", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Next Question or Finish
    const handleNext = async () => {
        setAnswer("");
        setFeedback("");
        
        if (currentIndex + 1 >= questions.length) {
            finishInterview();
        } else {
            await speakText("Alright, let's move to the next question.");
            setCurrentIndex(prev => prev + 1);
        }
    };

    // Finish Interview
    const finishInterview = async () => {
        try {
            const result = await axios.post(`${serverUrl}/api/interview/finish`, {
                interviewId
            }, { withCredentials: true });

            onFinish(result.data); // Move to Step 3 (Report)
        } catch (error) {
            console.error("Failed to finish interview", error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4 md:p-6">
            <div className="w-full max-w-[1400px] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col lg:flex-row overflow-hidden min-h-[80vh]">
                
                {/* Video Section (Left) */}
                <div className="w-full lg:w-[35%] bg-gray-50 flex flex-col items-center p-6 border-r border-gray-200">
                    <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-xl mb-6 relative bg-black">
                        <video 
                            ref={videoRef}
                            src={videoSource}
                            key={videoSource}
                            className="w-full h-auto object-cover"
                            muted 
                            playsInline
                            preload="auto"
                            loop
                        />
                        {subtitle && (
                            <div className="absolute bottom-4 left-0 right-0 px-4 text-center z-50">
                                <p className="bg-black/60 text-white text-sm md:text-base p-2 rounded-lg inline-block">
                                    {subtitle}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Timer Area */}
                    <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm text-gray-500 font-medium">Interview Status</span>
                            <span className={`text-sm font-semibold ${isAiPlaying ? 'text-green-600' : 'text-gray-400'}`}>
                                {isAiPlaying ? "AI Speaking..." : "Listening..."}
                            </span>
                        </div>
                        <Timer timeLeft={timeLeft} totalTime={currentQuestion?.timeLimit || 60} />
                    </div>
                </div>

                {/* Text Section (Right) */}
                <div className="flex-1 flex flex-col p-6 md:p-10 relative">
                    <h2 className="text-2xl md:text-3xl font-bold text-green-700 mb-6">AI Smart Interview</h2>

                    {/* Current Question */}
                    {!isIntroPhase && (
                        <motion.div 
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="mb-6 bg-gray-50 p-6 rounded-2xl border border-gray-200"
                        >
                            <p className="text-sm text-gray-500 font-medium mb-2">
                                Question {currentIndex + 1} of {questions.length}
                            </p>
                            <p className="text-lg text-gray-800 font-semibold leading-relaxed">
                                {currentQuestion?.question}
                            </p>
                        </motion.div>
                    )}

                    {/* Text Area */}
                    <textarea 
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type or speak your answer here..."
                        disabled={isSubmitting || feedback}
                        className="flex-1 w-full bg-gray-50 p-6 rounded-2xl resize-none outline-none border border-gray-200 focus:ring-2 focus:ring-green-500 transition text-gray-800"
                    />

                    {/* Feedback Area */}
                    {feedback && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 bg-green-50 border border-green-200 p-5 rounded-2xl shadow-sm"
                        >
                            <p className="text-green-800 font-medium">{feedback}</p>
                        </motion.div>
                    )}

                    {/* Controls */}
                    <div className="flex items-center gap-4 mt-6">
                        {!feedback ? (
                            <>
                                <motion.button 
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => toggleMic()}
                                    disabled={isSubmitting}
                                    className={`w-14 h-14 flex items-center justify-center rounded-full shadow-lg transition-colors ${isMicOn ? 'bg-red-500 text-white' : 'bg-black text-white'}`}
                                >
                                    {isMicOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
                                </motion.button>

                                <motion.button 
                                    whileTap={{ scale: 0.95 }}
                                    onClick={submitAnswer}
                                    disabled={isSubmitting}
                                    className="flex-1 bg-gradient-to-r from-green-600 to-teal-500 text-white py-4 rounded-xl font-semibold shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Answer"}
                                </motion.button>
                            </>
                        ) : (
                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                onClick={handleNext}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-teal-500 text-white py-4 rounded-xl font-semibold shadow-md"
                            >
                                {currentIndex + 1 >= questions.length ? "Finish Interview" : "Next Question"} <FaArrowRight />
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Interview;
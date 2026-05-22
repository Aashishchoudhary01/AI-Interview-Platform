import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaUserTie, FaBriefcase, FaFileUpload } from 'react-icons/fa';
import { BsRobot } from 'react-icons/bs';
import { serverUrl } from '../../App';
import { useDispatch, useSelector } from 'react-redux';
import { setUserData } from '../../redux/userSlice';

const Setup = ({ onStart }) => {
    const { userData } = useSelector((state) => state.user);
    const dispatch = useDispatch();

    const [role, setRole] = useState("");
    const [experience, setExperience] = useState("");
    const [mode, setMode] = useState("Technical");
    
    const [resumeFile, setResumeFile] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [analyzeDone, setAnalyzeDone] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [projects, setProjects] = useState([]);
    const [skills, setSkills] = useState([]);
    const [resumeText, setResumeText] = useState("");

    const handleUploadResume = async (e) => {
        e.stopPropagation();
        if (!resumeFile || analyzing) return;
        
        setAnalyzing(true);
        try {
            const formData = new FormData();
            formData.append("resume", resumeFile);

            const result = await axios.post(`${serverUrl}/api/interview/resume`, formData, {
                withCredentials: true
            });

            const data = result.data;
            setRole(data.role || role);
            setExperience(data.experience || experience);
            setProjects(data.projects || []);
            setSkills(data.skills || []);
            setResumeText(data.resumeText || "");
            
            setAnalyzeDone(true);
        } catch (error) {
            console.error(error);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleStart = async () => {
        setLoading(true);
        try {
            const result = await axios.post(`${serverUrl}/api/interview/generateQuestions`, {
                role, experience, mode, projects, skills, resumeText
            }, { withCredentials: true });

            if (userData) {
                dispatch(setUserData({ ...userData, credits: result.data.creditLeft }));
            }

            onStart(result.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-4"
        >
            <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl grid grid-cols-1 md:grid-cols-2 overflow-hidden">
                
                {/* Left Side: Info */}
                <motion.div 
                    initial={{ x: -80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    className="relative bg-gradient-to-br from-green-50 to-green-100 p-12 flex flex-col justify-center"
                >
                    <h2 className="text-4xl font-bold text-gray-800 mb-6">Start Your AI Interview</h2>
                    <p className="text-gray-600 mb-10 leading-relaxed">
                        Upload your resume to extract skills automatically, or manually set your role to begin.
                    </p>
                </motion.div>

                {/* Right Side: Setup Form */}
                <motion.div 
                    initial={{ x: 80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    className="p-12 bg-white"
                >
                    <h2 className="text-3xl font-bold text-gray-800 mb-8">Interview Setup</h2>
                    
                    <div className="space-y-6">
                        <div className="relative">
                            <FaUserTie className="absolute top-4 left-4 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Enter Role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
                            />
                        </div>

                        <div className="relative">
                            <FaBriefcase className="absolute top-4 left-4 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Experience"
                                value={experience}
                                onChange={(e) => setExperience(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
                            />
                        </div>

                        <select 
                            value={mode}
                            onChange={(e) => setMode(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition bg-white"
                        >
                            <option value="Technical">Technical</option>
                            <option value="HR">HR</option>
                        </select>

                        {!analyzeDone && (
                            <motion.div 
                                whileHover={{ scale: 1.02 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    document.getElementById("resumeUpload").click();
                                }}
                                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition"
                            >
                                <FaFileUpload className="text-4xl text-green-600 mx-auto mb-3" />
                                <input 
                                    id="resumeUpload"
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={(e) => setResumeFile(e.target.files[0])}
                                />
                                <p className="text-gray-600 font-medium">
                                    {resumeFile ? resumeFile.name : "Click to upload resume (Optional)"}
                                </p>
                            </motion.div>
                        )}

                        {resumeFile && !analyzeDone && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleUploadResume}
                                disabled={analyzing}
                                className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition disabled:bg-gray-600"
                            >
                                {analyzing ? "Analyzing..." : "Analyze Resume"}
                            </motion.button>
                        )}

                        {analyzeDone && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4"
                            >
                                <h3 className="text-lg font-semibold text-gray-800">Resume Analysis Result</h3>
                                {projects.length > 0 && (
                                    <div>
                                        <p className="font-semibold text-gray-700 mb-1">Projects:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {projects.map((p, i) => <span key={i} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">{p}</span>)}
                                        </div>
                                    </div>
                                )}
                                {skills.length > 0 && (
                                    <div>
                                        <p className="font-semibold text-gray-700 mb-1">Skills:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {skills.map((s, i) => <span key={i} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">{s}</span>)}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        <motion.button
                            whileHover={role && experience && !loading ? { scale: 1.02, backgroundColor: "#15803d" } : {}}
                            whileTap={role && experience && !loading ? { scale: 0.98 } : {}}
                            disabled={!role || !experience || loading}
                            onClick={handleStart}
                            className="w-full bg-black text-white py-3 rounded-full text-lg font-semibold shadow-md transition disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
                        >
                            {loading ? "Starting..." : "Start Interview"}
                        </motion.button>

                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Setup;
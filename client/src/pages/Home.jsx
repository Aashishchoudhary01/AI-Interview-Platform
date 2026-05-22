import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BsRobot } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AuthModal from '../components/AuthModal';

const stepsData = [
    {
        icon: <BsRobot size={24} />,
        step: "Step 1",
        title: "Role & Experience Selection",
        description: "AI adjusts difficulty based on selected job role."
    },
    {
        icon: <BsRobot size={24} />, // Replace with Mic Icon if desired
        step: "Step 2",
        title: "Smart Voice Interview",
        description: "Real-time conversation with adaptive questions."
    },
    {
        icon: <BsRobot size={24} />, // Replace with Clock Icon if desired
        step: "Step 3",
        title: "Timer Based Simulation",
        description: "Time-bound answering to simulate real pressure."
    }
];

const Home = () => {
    const navigate = useNavigate();
    const { userData } = useSelector((state) => state.user);
    const [showAuth, setShowAuth] = useState(false);

    const handleProtectedNavigation = (path) => {
        if (!userData) {
            setShowAuth(true);
        } else {
            navigate(path);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

            <div className="flex-1 px-6 py-20">
                {/* Hero Section */}
                <div className="text-center mb-28">
                    <div className="flex justify-center mb-6">
                        <div className="bg-green-50 text-green-600 text-sm px-4 py-2 rounded-full flex items-center gap-2">
                            <BsRobot size={16} /> AI Powered Smart Interview Platform
                        </div>
                    </div>

                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-6xl font-semibold leading-tight max-w-4xl mx-auto"
                    >
                        Practice Interview with <br/>
                        <span className="relative inline-block mt-2">
                            <span className="bg-green-100 text-green-600 px-5 py-1 rounded-full">AI Intelligence</span>
                        </span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="text-gray-500 mt-6 max-w-2xl mx-auto text-lg"
                    >
                        Role-based mock interviews with smart follow-ups, adaptive difficulty, and real-time performance evaluation.
                    </motion.p>

                    <div className="flex flex-wrap justify-center gap-4 mt-10">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleProtectedNavigation("/interview")}
                            className="bg-black text-white px-10 py-3 rounded-full shadow-md font-medium"
                        >
                            Start Interview
                        </motion.button>
                        <motion.button 
                            whileHover={{ scale: 1.05, backgroundColor: "#f3f4f6" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleProtectedNavigation("/history")}
                            className="border border-gray-300 px-10 py-3 rounded-full font-medium"
                        >
                            View History
                        </motion.button>
                    </div>
                </div>

                {/* Steps Section */}
                <div className="max-w-6xl mx-auto mb-32">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {stepsData.map((item, index) => (
                            <motion.div 
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.2 }}
                                whileHover={{ scale: 1.02 }}
                                className="relative bg-white border border-gray-200 rounded-3xl p-10 shadow-sm hover:shadow-xl transition-all"
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white border-2 border-green-500 text-green-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg">
                                    {item.icon}
                                </div>
                                <div className="text-center mt-6">
                                    <p className="text-xs text-green-600 font-semibold mb-2 uppercase tracking-widest">{item.step}</p>
                                    <h3 className="font-semibold text-xl mb-3">{item.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Home;
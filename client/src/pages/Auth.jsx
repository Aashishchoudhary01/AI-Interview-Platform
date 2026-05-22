import React from 'react';
import { BsRobot } from 'react-icons/bs';
import { FcGoogle } from 'react-icons/fc';
import { motion } from 'framer-motion';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../utils/firebase';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';
import { serverUrl } from '../App';

const Auth = ({ isModal = false }) => {
    const dispatch = useDispatch();

    const handleGoogleAuth = async () => {
        try {
            const response = await signInWithPopup(auth, provider);
            const name = response.user.displayName;
            const email = response.user.email;

            const result = await axios.post(`${serverUrl}/api/auth/google`, 
                { name, email },
                { withCredentials: true }
            );

            dispatch(setUserData(result.data.user));
        } catch (error) {
            console.log(error);
            dispatch(setUserData(null));
        }
    };

    return (
        <div className={`w-full bg-white flex items-center justify-center ${isModal ? 'py-4' : 'min-h-screen px-6 py-20'}`}>
            <motion.div 
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.05 }}
                className={`w-full bg-white border border-gray-200 ${isModal ? 'max-w-md p-8 rounded-3xl' : 'max-w-lg p-12 rounded-[32px] shadow-2xl'}`}
            >
                {/* Same internal UI as before */}
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="bg-black text-white p-2 rounded-lg">
                        <BsRobot size={18} />
                    </div>
                    <h2 className="font-semibold text-lg">InterviewIQ.ai</h2>
                </div>

                <h1 className="text-2xl md:text-3xl font-semibold text-center leading-snug mb-4">
                    Continue with <br/>
                    <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full inline-flex items-center gap-2 mt-2 text-xl">
                        <BsRobot size={16} /> AI Smart Interview
                    </span>
                </h1>

                <p className="text-gray-500 text-center text-sm md:text-base leading-relaxed mb-8">
                    Sign in to start AI powered mock interviews, track your progress, and unlock detailed performance insights.
                </p>

                <motion.button 
                    whileHover={{ scale: 1.03, opacity: 0.9 }}
                    whileTap={{ scale: 0.98, opacity: 1 }}
                    onClick={handleGoogleAuth}
                    className="w-full flex items-center justify-center gap-3 py-3 bg-black text-white rounded-full shadow-md"
                >
                    <FcGoogle size={20} />
                    Continue with Google
                </motion.button>
            </motion.div>
        </div>
    );
};

export default Auth;
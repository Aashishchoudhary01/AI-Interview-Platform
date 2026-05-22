import React, { useState } from 'react';
import { BsRobot, BsCoin } from 'react-icons/bs';
import { FaUserAstronaut } from 'react-icons/fa';
import { HiOutlineLogout } from 'react-icons/hi';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { serverUrl } from '../App';
import { setUserData } from '../redux/userSlice';
import AuthModal from './AuthModal';

const Navbar = () => {
    const { userData } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [showCreditPopup, setShowCreditPopup] = useState(false);
    const [showUserPopup, setShowUserPopup] = useState(false);
    const [showAuth, setShowAuth] = useState(false);

    const handleLogout = async () => {
        try {
            await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
            dispatch(setUserData(null));
            setShowCreditPopup(false);
            setShowUserPopup(false);
            navigate("/");
        } catch (error) {
            console.log("Logout Error:", error);
        }
    };

    const requireAuth = (callback) => {
        if (!userData) {
            setShowAuth(true);
            return;
        }
        callback();
    };

    return (
        <>
            {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
            
            <motion.div 
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center px-4 pt-6"
            >
                <div className="w-full max-w-6xl bg-white rounded-[24px] shadow-sm border border-gray-200 px-8 py-4 flex items-center justify-between">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
                        <div className="bg-black text-white p-2 rounded-lg">
                            <BsRobot size={18} />
                        </div>
                        <h1 className="font-semibold hidden md:block text-lg">InterviewIQ.ai</h1>
                    </div>

                    {/* Actions Section */}
                    <div className="flex items-center gap-6 relative">
                        {/* Credits Button */}
                        <div className="relative">
                            <button 
                                onClick={() => requireAuth(() => {
                                    setShowCreditPopup(!showCreditPopup);
                                    setShowUserPopup(false);
                                })}
                                className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition"
                            >
                                <BsCoin size={20} className="text-yellow-500" />
                                {userData ? userData.credits : 0}
                            </button>
                            
                            {/* Credits Popup */}
                            {showCreditPopup && (
                                <div className="absolute right-0 mt-3 w-64 bg-white shadow-xl border border-gray-200 rounded-xl p-5 z-50">
                                    <p className="text-sm text-gray-600 mb-4">Need more credits to continue interviews?</p>
                                    <button onClick={() => navigate("/pricing")} className="w-full bg-black text-white px-2 py-2 rounded-lg text-sm">
                                        Buy More Credits
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* User Profile */}
                        <div className="relative">
                            <button 
                                onClick={() => requireAuth(() => {
                                    setShowUserPopup(!showUserPopup);
                                    setShowCreditPopup(false);
                                })}
                                className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center font-semibold"
                            >
                                {userData ? userData.name.slice(0, 1).toUpperCase() : <FaUserAstronaut size={16} />}
                            </button>

                            {/* User Popup */}
                            {showUserPopup && (
                                <div className="absolute right-0 mt-3 w-48 bg-white shadow-xl border border-gray-200 rounded-xl p-4 z-50">
                                    <p className="text-md text-blue-500 font-medium mt-1 mb-3 truncate">
                                        {userData?.name}
                                    </p>
                                    <button 
                                        onClick={() => { navigate("/history"); setShowUserPopup(false); }}
                                        className="w-full text-left text-sm py-2 hover:text-black text-gray-600 font-medium"
                                    >
                                        Interview History
                                    </button>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full text-left text-sm py-2 flex items-center gap-2 text-red-500"
                                    >
                                        <HiOutlineLogout size={16} /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default Navbar;
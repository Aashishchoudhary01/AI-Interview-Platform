import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import { serverUrl } from '../App';
import { setUserData } from '../redux/userSlice';

const plans = [
    { 
        id: "free", 
        name: "Free", 
        price: 0, 
        credits: 100, 
        default: true, 
        badge: null,
        description: "Perfect for beginners starting interview preparation.",
        features: ["100 AI Interview Credits", "Basic Performance Report", "Voice Interview Access", "Limited History Tracking"]
    },
    { 
        id: "starter", 
        name: "Starter Pack", 
        price: 100, 
        credits: 150, 
        default: false, 
        badge: null,
        description: "Great for focused practice and skill improvement.",
        features: ["150 AI Interview Credits", "Detailed Feedback", "Performance Analytics", "Full Interview History"]
    },
    { 
        id: "pro", 
        name: "Pro Pack", 
        price: 500, 
        credits: 650, 
        default: false, 
        badge: "Best Value",
        description: "Best value for serious job preparation.",
        features: ["650 AI Interview Credits", "Advanced AI Feedback", "Skill Trend Analysis", "Priority AI Processing"]
    }
];

const Pricing = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { userData } = useSelector((state) => state.user);
    
    const [selectedPlan, setSelectedPlan] = useState("free");
    const [loadingPlan, setLoadingPlan] = useState(null);

    const handlePayment = async (plan) => {
        if (plan.price === 0) return;
        setLoadingPlan(plan.id);

        try {
            // 1. Create Order via backend
            const { data: order } = await axios.post(`${serverUrl}/api/payment/order`, {
                planId: plan.id,
                amount: plan.price,
                credits: plan.credits
            }, { withCredentials: true });

            // 2. Open Razorpay Checkout Modal
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "InterviewIQ.ai",
                description: `${plan.name} - ${plan.credits} Credits`,
                order_id: order.id,
                handler: async (response) => {
                    try {
                        // 3. Verify Payment Signature via backend
                        const verifyRes = await axios.post(`${serverUrl}/api/payment/verify`, response, { withCredentials: true });
                        
                        // Update Redux state with new credits
                        dispatch(setUserData(verifyRes.data.user));
                        alert("Payment Successful! Credits Added.");
                        navigate("/");
                    } catch (err) {
                        console.error("Verification failed", err);
                        alert("Payment verification failed.");
                    }
                },
                theme: { color: "#22c55e" }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response){
                console.error("Payment Failed:", response.error);
            });
            rzp.open();

        } catch (error) {
            console.error("Failed to initialize payment", error);
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-10 px-6">
            <div className="max-w-6xl mx-auto mb-12">
                <button 
                    onClick={() => navigate("/")}
                    className="p-3 rounded-full bg-white shadow-sm hover:shadow-md transition mb-6"
                >
                    <FaArrowLeft className="text-gray-600" />
                </button>
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800">Choose Your Plan</h1>
                    <p className="text-gray-500 mt-3 text-lg">Flexible pricing to match your interview preparation goals.</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {plans.map((plan) => {
                    const isSelected = selectedPlan === plan.id;
                    return (
                        <motion.div 
                            key={plan.id}
                            whileHover={!plan.default ? { scale: 1.02 } : {}}
                            onClick={() => !plan.default && setSelectedPlan(plan.id)}
                            className={`relative bg-white rounded-3xl p-8 transition-all duration-300 ${plan.default ? 'cursor-default opacity-90' : 'cursor-pointer'} ${isSelected && !plan.default ? 'border-2 border-green-500 shadow-2xl scale-[1.02]' : 'border border-gray-200 shadow-md'}`}
                        >
                            {plan.badge && (
                                <span className="absolute -top-4 right-6 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                                    {plan.badge}
                                </span>
                            )}
                            
                            <h3 className="text-2xl font-bold text-gray-800">{plan.name}</h3>
                            <div className="mt-4 mb-2">
                                <span className="text-4xl font-bold text-green-600">₹{plan.price}</span>
                            </div>
                            <p className="text-gray-500 font-medium mb-4">{plan.credits} AI Interview Credits</p>
                            <p className="text-sm text-gray-500 mb-6 leading-relaxed">{plan.description}</p>
                            
                            <div className="space-y-3 mb-8">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <FaCheckCircle className="text-green-500 text-sm flex-shrink-0" />
                                        <span className="text-gray-700 text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            {!plan.default ? (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if(!isSelected) setSelectedPlan(plan.id);
                                        else handlePayment(plan);
                                    }}
                                    disabled={loadingPlan === plan.id || !userData}
                                    className={`w-full py-3 rounded-xl font-bold transition-all ${isSelected ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    {loadingPlan === plan.id ? "Processing..." : isSelected ? "Proceed to Pay" : "Select Plan"}
                                </button>
                            ) : (
                                <button className="w-full py-3 rounded-xl font-bold bg-gray-100 text-gray-400 cursor-not-allowed">
                                    Current Plan
                                </button>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default Pricing;
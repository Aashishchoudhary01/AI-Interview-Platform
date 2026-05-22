import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { serverUrl } from '../App';

const History = () => {
    const [interviews, setInterviews] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const getMyInterviews = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/interview/getInterviews`, { withCredentials: true });
                setInterviews(result.data);
            } catch (error) {
                console.log("Error fetching history", error);
            }
        };
        getMyInterviews();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-10">
            <div className="w-[90vw] lg:w-[70vw] mx-auto max-w-[1200px]">
                <div className="mb-10 w-full flex items-center gap-4">
                    <button onClick={() => navigate("/")} className="p-3 rounded-full bg-white shadow-sm hover:shadow-md transition">
                        <FaArrowLeft className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Interview History</h1>
                        <p className="text-gray-500 mt-1">Track your past interviews and performance reports.</p>
                    </div>
                </div>

                {interviews.length === 0 ? (
                    <div className="bg-white p-10 rounded-2xl shadow-sm text-center">
                        <p className="text-gray-500">No interviews found. Start your first interview!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {interviews.map((item, index) => (
                            <div 
                                key={index} 
                                onClick={() => navigate(`/report/${item._id}`)}
                                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer border border-gray-100 flex flex-col justify-between"
                            >
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">{item.role}</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {item.experience} • {item.mode} • {new Date(item.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between mt-6">
                                    <div>
                                        <p className="text-xl font-bold text-green-600">{item.finalScore} / 10</p>
                                        <p className="text-xs text-gray-400">Overall Score</p>
                                    </div>
                                    <span className={`px-4 py-1 rounded-full text-xs font-medium ${item.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {item.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
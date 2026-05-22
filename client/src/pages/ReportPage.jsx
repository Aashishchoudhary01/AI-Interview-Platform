import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { serverUrl } from '../App';

const ReportPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/interview/report/${id}`, { withCredentials: true });
                setReport(result.data);
            } catch (error) {
                console.error("Failed to fetch report", error);
            }
        };
        fetchReport();
    }, [id]);

    if (!report) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading Report...</p>
            </div>
        );
    }

    const { finalScore, confidence, communication, correctness, questions } = report;

    // Format data for Recharts AreaChart
    const questionScoreData = questions.map((q, index) => ({
        name: `Q${index + 1}`,
        score: q.score || 0
    }));

    // Performance text logic
    let performanceText = "Significant improvement required.";
    let tagLine = "Work on clarity and confident delivery.";
    if (finalScore >= 8) {
        performanceText = "Ready for job opportunities.";
        tagLine = "Excellent clarity and structured responses.";
    } else if (finalScore >= 5) {
        performanceText = "Needs minor improvements before interviews.";
        tagLine = "Good foundation, refine articulation.";
    }

    const downloadPDF = () => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let currentY = 25;

        // Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(34, 197, 94);
        doc.text("AI Interview Performance Report", pageWidth / 2, currentY, { align: "center" });
        currentY += 10;

        // Divider
        doc.setDrawColor(34, 197, 94);
        doc.setLineWidth(1);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 15;

        // Final Score Box
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 20, 3, 3, "F");
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`Final Score: ${finalScore} / 10`, pageWidth / 2, currentY + 12, { align: "center" });
        currentY += 30;

        // Skills Box
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 35, 3, 3, "F");
        doc.setFontSize(12);
        doc.text(`Confidence: ${confidence} / 10`, margin + 5, currentY + 10);
        doc.text(`Communication: ${communication} / 10`, margin + 5, currentY + 20);
        doc.text(`Correctness: ${correctness} / 10`, margin + 5, currentY + 30);
        currentY += 45;

        // Professional Advice
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(34, 197, 94);
        doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 35, 3, 3, "FD");
        doc.setFontSize(11);
        doc.text("Professional Advice", margin + 5, currentY + 10);
        const splitAdvice = doc.splitTextToSize(tagLine, pageWidth - 30);
        doc.text(splitAdvice, margin + 5, currentY + 20);
        currentY += 50;

        // Table
        const tableBody = questions.map((q, i) => [
            i + 1,
            q.question,
            `${q.score} / 10`,
            q.feedback || "No feedback available for this question."
        ]);

        doc.autoTable({
            startY: currentY,
            head: [['#', 'Question', 'Score', 'Feedback']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [34, 197, 94], halign: 'center' },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                1: { cellWidth: 55 },
                2: { halign: 'center', cellWidth: 20 },
                3: { cellWidth: 'auto' }
            },
            styles: { fontSize: 9, cellPadding: 4 }
        });

        doc.save("AI_Interview_Report.pdf");
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate("/history")} className="p-3 rounded-full bg-white shadow-sm hover:shadow-md transition">
                            <FaArrowLeft className="text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Interview Analytics Dashboard</h1>
                            <p className="text-gray-500 mt-1 text-sm md:text-base">AI Powered Performance Insights</p>
                        </div>
                    </div>
                    <button 
                        onClick={downloadPDF}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium shadow-md transition whitespace-nowrap"
                    >
                        Download PDF
                    </button>
                </div>

                {/* Top Section: Overview & Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Left: Overall Score & Skills */}
                    <div className="space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 md:p-8 rounded-3xl shadow-sm text-center"
                        >
                            <h3 className="text-gray-500 font-medium mb-4">Overall Performance</h3>
                            <div className="text-6xl font-bold text-green-600 mb-2">{finalScore}</div>
                            <p className="text-gray-400 text-sm">out of 10</p>
                            
                            <div className="mt-6">
                                <p className="text-gray-800 font-semibold text-lg">{performanceText}</p>
                                <p className="text-gray-500 text-sm mt-1">{tagLine}</p>
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="bg-white p-6 md:p-8 rounded-3xl shadow-sm"
                        >
                            <h3 className="text-gray-800 font-bold mb-6">Skill Evaluation</h3>
                            <div className="space-y-5">
                                {[
                                    { label: "Confidence", val: confidence },
                                    { label: "Communication", val: communication },
                                    { label: "Correctness", val: correctness }
                                ].map((s, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-600">{s.label}</span>
                                            <span className="text-green-600 font-semibold">{s.val}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 h-2 rounded-full">
                                            <div className="bg-green-500 h-full rounded-full" style={{ width: `${(s.val / 10) * 100}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Area Chart */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm flex flex-col"
                    >
                        <h3 className="text-gray-800 font-bold mb-6">Performance Trend</h3>
                        <div className="flex-1 min-h-[250px] md:min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={questionScoreData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="score" stroke="#22c55e" fill="#dcfce7" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                {/* Question Breakdown */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-white p-6 md:p-8 rounded-3xl shadow-sm"
                >
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Question Breakdown</h3>
                    <div className="space-y-6">
                        {questions.map((q, index) => (
                            <div key={index} className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Question {index + 1}</p>
                                        <p className="text-gray-800 font-medium text-lg leading-relaxed">{q.question}</p>
                                    </div>
                                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap self-start">
                                        {q.score || 0} / 10
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm mt-4">
                                    <p className="text-xs font-bold text-green-600 mb-1 uppercase">AI Feedback</p>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {q.feedback || "No feedback available for this question."}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default ReportPage;
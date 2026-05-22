// import React, { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { FaArrowLeft } from 'react-icons/fa';
// import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';
// import { serverUrl } from '../App';

// const Report = () => {
//     const { id } = useParams();
//     const navigate = useNavigate();
//     const [report, setReport] = useState(null);

//     useEffect(() => {
//         const fetchReport = async () => {
//             try {
//                 const result = await axios.get(`${serverUrl}/api/interview/report/${id}`, { withCredentials: true });
//                 setReport(result.data);
//             } catch (error) {
//                 console.log(error);
//             }
//         };
//         fetchReport();
//     }, [id]);

//     if (!report) return <div className="min-h-screen flex items-center justify-center">Loading Report...</div>;

//     const chartData = report.questions.map((q, i) => ({
//         name: `Q${i + 1}`,
//         score: q.score || 0
//     }));

//     const downloadPDF = () => {
//         const doc = new jsPDF('p', 'mm', 'a4');
//         const pageWidth = doc.internal.pageSize.getWidth();
//         let currentY = 25;

//         doc.setFont("helvetica", "bold");
//         doc.setFontSize(20);
//         doc.setTextColor(34, 197, 94);
//         doc.text("AI Interview Performance Report", pageWidth / 2, currentY, { align: "center" });
//         currentY += 15;

//         doc.setFontSize(14);
//         doc.setTextColor(0, 0, 0);
//         doc.text(`Final Score: ${report.finalScore} / 10`, pageWidth / 2, currentY, { align: "center" });
//         currentY += 15;

//         const tableBody = report.questions.map((q, i) => [
//             i + 1, q.question, `${q.score}/10`, q.feedback || "No feedback"
//         ]);

//         doc.autoTable({
//             startY: currentY,
//             head: [['#', 'Question', 'Score', 'Feedback']],
//             body: tableBody,
//             headStyles: { fillColor: [34, 197, 94] }
//         });

//         doc.save("Interview_Report.pdf");
//     };

//     return (
//         <div className="min-h-screen bg-gray-50 py-10 px-4 md:px-8">
//             <div className="max-w-6xl mx-auto">
//                 <div className="flex items-center justify-between mb-8">
//                     <div className="flex items-center gap-4">
//                         <button onClick={() => navigate("/history")} className="p-3 bg-white rounded-full shadow-sm">
//                             <FaArrowLeft />
//                         </button>
//                         <h1 className="text-2xl font-bold">Interview Analytics</h1>
//                     </div>
//                     <button onClick={downloadPDF} className="bg-green-600 text-white px-6 py-2 rounded-xl">
//                         Download PDF
//                     </button>
//                 </div>

//                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//                     <div className="bg-white p-8 rounded-3xl shadow-sm text-center">
//                         <h3 className="text-gray-500 font-medium">Overall Performance</h3>
//                         <div className="text-6xl font-bold text-green-600 my-4">{report.finalScore}</div>
//                         <p className="text-sm text-gray-400">out of 10</p>
//                     </div>

//                     <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm">
//                         <h3 className="font-semibold mb-6">Performance Trend</h3>
//                         <div className="h-64">
//                             <ResponsiveContainer width="100%" height="100%">
//                                 <AreaChart data={chartData}>
//                                     <CartesianGrid strokeDasharray="3 3" />
//                                     <XAxis dataKey="name" />
//                                     <YAxis domain={[0, 10]} />
//                                     <Tooltip />
//                                     <Area type="monotone" dataKey="score" stroke="#22c55e" fill="#dcfce7" strokeWidth={3} />
//                                 </AreaChart>
//                             </ResponsiveContainer>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Report;
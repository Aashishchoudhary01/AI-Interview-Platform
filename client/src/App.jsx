import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import Home from './pages/Home';
import Auth from './pages/Auth';
import InterviewPage from './pages/InterviewPage';
import { setUserData } from './redux/userSlice';
import History from './pages/History';
import ReportPage from './pages/ReportPage';

export const serverUrl = "http://localhost:8000";

function App() {
    const dispatch = useDispatch();

    const getUser = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/user/current-user`, { 
                withCredentials: true 
            });
            dispatch(setUserData(result.data));
        } catch (error) {
            dispatch(setUserData(null));
        }
    };

    useEffect(() => {
        getUser();
    }, [dispatch]);

    return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/interview" element={<InterviewPage />} />
      <Route path="/history" element={<History />} />
      <Route path="/report/:id" element={<ReportPage />} />
    </Routes>
  );
}

export default App;
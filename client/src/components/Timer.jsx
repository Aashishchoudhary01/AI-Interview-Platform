import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const Timer = ({ timeLeft, totalTime }) => {
    const percentage = (timeLeft / totalTime) * 100;

    return (
        <div className="w-20 h-20">
            <CircularProgressbar
                value={percentage}
                text={`${timeLeft}`}
                styles={buildStyles({
                    textSize: '28px',
                    pathColor: '#22c55e',
                    textColor: '#6b7280',
                    trailColor: '#f3f4f6',
                })}
            />
        </div>
    );
};

export default Timer;
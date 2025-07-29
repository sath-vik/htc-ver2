import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import './HabitStatsModal.css';

const CustomTick = ({ x, y, payload, data }) => {
    const tickData = data[payload.index];
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="middle" fill="#aaa">
                <tspan x="0" dy="0.7em">{tickData.day}</tspan>
                <tspan x="0" dy="1.5em">{tickData.dateOfMonth}</tspan>
            </text>
        </g>
    );
};

const HabitStatsModal = ({ habit, onClose }) => {
    const [activeIndex, setActiveIndex] = useState(null);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    if (!habit) {
        return null;
    }

    const today = new Date();
    const lastWeek = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        lastWeek.push(date);
    }

    const data = lastWeek.map(date => {
        const dateString = date.toISOString().split('T')[0];
        const count = habit.progress[dateString] || 0;
        return {
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            dateOfMonth: date.getDate(),
            count: count,
        };
    });

    const completedInLastWeek = data.filter(d => d.count >= habit.goal).length;

    const onMouseOver = (data, index) => setActiveIndex(index);
    const onMouseOut = () => setActiveIndex(null);

    return (
        <div className="habit-stats-modal-overlay" onClick={onClose}>
            <div className="habit-stats-modal" onClick={(e) => e.stopPropagation()}>
                <div className="habit-stats-modal-header">
                    <span className="habit-icon">{habit.icon}</span>
                    <h2>{habit.name}</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="habit-stats-modal-body">
                    <p>Completed {completedInLastWeek} times in the last 7 days.</p>
                    <div className="habit-stats-chart">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 20 }}>
                                <XAxis dataKey="day" tick={<CustomTick data={data} />} interval={0} axisLine={{ stroke: '#444' }} tickLine={false} />
                                <YAxis allowDecimals={false} domain={[0, habit.goal]} axisLine={{ stroke: '#444' }} tickLine={false} />
                                <Bar dataKey="count" onMouseOver={onMouseOver} onMouseOut={onMouseOut} >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={activeIndex === index ? '#a03232' : '#c83e3e'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HabitStatsModal;
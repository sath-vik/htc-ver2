import React, { useState } from 'react';
import { FiTrendingUp, FiRefreshCw, FiX, FiMoreHorizontal } from 'react-icons/fi';
import './Habit.css';
import ContextMenu from '../ContextMenu/ContextMenu';
import HabitStatsModal from '../HabitStatsModal/HabitStatsModal';

const Habit = ({ habit, categories, completeHabit, resetHabit, onEdit, onDelete, onMoveToCategory }) => {
    const getTodayString = () => new Date().toISOString().split('T')[0];
    const todaysProgress = habit.progress[getTodayString()] || 0;
    const isCompleted = todaysProgress >= habit.goal;

    const [isAnimating, setIsAnimating] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

    const openStatsModal = () => setIsStatsModalOpen(true);
    const closeStatsModal = () => setIsStatsModalOpen(false);

    const handleActionClick = (e, action) => {
        e.stopPropagation();
        action();
    };

    const handleHabitClick = () => {
        if (!isCompleted) {
            completeHabit(habit.id);
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 300);
        }
    };

    const handleContextMenu = (event) => {
        event.preventDefault();
        event.stopPropagation();
        closeContextMenu();

        if (categories.length > 0) {
            setContextMenu({
                x: event.clientX,
                y: event.clientY,
                options: [{
                    label: 'Move to',
                    submenu: categories.map(cat => ({
                        label: cat,
                        action: () => onMoveToCategory(habit.id, cat)
                    }))
                }],
            });
        }
    };

    const closeContextMenu = () => {
        setContextMenu(null);
    };

    return (
        <>
            <div
                className={`habit-item ${isCompleted ? 'completed' : ''} ${isAnimating ? 'thrust' : ''}`}
                onClick={handleHabitClick}
                onContextMenu={handleContextMenu}
            >
                <div className="habit-content">
                    <span className="habit-icon">{habit.icon}</span>
                    <span className="habit-text">{habit.text}</span>
                </div>

                <div className="habit-progress-container">
                    <span className="habit-coins">💰 {habit.coins}</span>
                    <span className="habit-progress">
                        {todaysProgress}/{habit.goal}
                    </span>
                </div>

                <div className="habit-hover-overlay">
                    <div className="habit-actions">
                        <div className="hover-action delete-action" onClick={(e) => handleActionClick(e, () => onDelete(habit.id))}>
                            <FiX />
                        </div>
                        <div className="hover-action" onClick={(e) => handleActionClick(e, () => onEdit(habit))}>
                            <FiMoreHorizontal />
                        </div>
                        <div className="hover-action" onClick={(e) => handleActionClick(e, openStatsModal)}>
                            <FiTrendingUp />
                        </div>
                        <div className="hover-action" onClick={(e) => handleActionClick(e, () => resetHabit(habit.id))}>
                            <FiRefreshCw />
                        </div>
                    </div>
                </div>
            </div>
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    options={contextMenu.options}
                    onClose={closeContextMenu}
                />
            )}
            {isStatsModalOpen && (
                <HabitStatsModal
                    habit={habit}
                    onClose={closeStatsModal}
                />
            )}
        </>
    );
};

export default Habit;
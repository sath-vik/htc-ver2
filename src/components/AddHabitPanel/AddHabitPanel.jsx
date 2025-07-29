import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker, { Categories, SkinTones } from 'emoji-picker-react';
import './AddHabitPanel.css';

const useContinuousPress = (callback) => {
    const intervalRef = useRef(null);

    const start = () => {
        if (intervalRef.current) return;
        callback();
        intervalRef.current = setInterval(callback, 100);
    };

    const stop = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    useEffect(() => {
        return () => stop();
    }, []);

    return {
        onMouseDown: start,
        onMouseUp: stop,
        onMouseLeave: stop,
    };
};


const AddHabitPanel = ({ onAddHabit, onCancel, habit }) => {
    const [habitName, setHabitName] = useState('');
    const [icon, setIcon] = useState('🏃');
    const [goal, setGoal] = useState(1);
    const [reward, setReward] = useState(0.1);
    const [penalty, setPenalty] = useState(0);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef(null);
    const nameInputRef = useRef(null);

    useEffect(() => {
        if (nameInputRef.current) {
            nameInputRef.current.focus();
        }
    }, []);

    const incrementGoal = () => setGoal(prev => Math.max(1, prev + 1));
    const decrementGoal = () => setGoal(prev => Math.max(1, prev - 1));
    const incrementReward = () => setReward(prev => parseFloat((prev + 0.1).toFixed(1)));
    const decrementReward = () => setReward(prev => Math.max(0, parseFloat((prev - 0.1).toFixed(1))));
    const incrementPenalty = () => setPenalty(prev => parseFloat((prev + 0.1).toFixed(1)));
    const decrementPenalty = () => setPenalty(prev => Math.max(0, parseFloat((prev - 0.1).toFixed(1))));

    const goalUpProps = useContinuousPress(incrementGoal);
    const goalDownProps = useContinuousPress(decrementGoal);
    const rewardUpProps = useContinuousPress(incrementReward);
    const rewardDownProps = useContinuousPress(decrementReward);
    const penaltyUpProps = useContinuousPress(incrementPenalty);
    const penaltyDownProps = useContinuousPress(decrementPenalty);

    const onEmojiClick = (emojiObject) => {
        setIcon(emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    useEffect(() => {
        if (habit) {
            setHabitName(habit.text);
            setIcon(habit.icon);
            setGoal(habit.goal);
            setReward(habit.coins);
            setPenalty(habit.penalty);
        } else {
            setHabitName('');
            setIcon('🏃');
            setGoal(1);
            setReward(0.1);
            setPenalty(0);
        }
    }, [habit]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                if (!event.target.closest('.icon-preview')) {
                    setShowEmojiPicker(false);
                }
            }
        };

        const handleKeyDown = (event) => {
            if (showEmojiPicker && event.key === 'Escape') {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showEmojiPicker]);


    const handleSubmit = (e) => {
        e.preventDefault();
        const newHabit = {
            ...(habit || {}),
            text: habitName,
            icon,
            goal: parseInt(goal, 10),
            coins: parseFloat(reward),
            penalty: parseFloat(penalty),
        };
        onAddHabit(newHabit);
    };

    return (
        <div className="add-habit-panel">
            <form onSubmit={handleSubmit}>
                <h3>{habit ? `Edit "${habit.text}"` : 'Add new habit'}</h3>
                <label>
                    Name:
                    <input ref={nameInputRef} type="text" value={habitName} onChange={(e) => setHabitName(e.target.value)} required />
                </label>
                <div className="icon-picker-container">
                    <label>Choose icon:</label>
                    <div className="icon-preview" onClick={() => setShowEmojiPicker(prev => !prev)}>
                        {icon}
                    </div>
                    {showEmojiPicker && (
                        <div className="emoji-picker-wrapper" ref={emojiPickerRef}>
                            <EmojiPicker
                                onEmojiClick={onEmojiClick}
                                height={320}
                                width={280}
                                theme="dark"
                                searchDisabled={true}
                                skinTonesDisabled={true}
                                defaultSkinTone={SkinTones.NEUTRAL}
                                previewConfig={{ showPreview: false }}
                                categories={[
                                  { category: Categories.SUGGESTED, name: "Recently Used" },
                                  { category: Categories.SMILEYS_PEOPLE, name: "Smileys & People" },
                                  { category: Categories.ANIMALS_NATURE, name: "Animals & Nature" },
                                  { category: Categories.FOOD_DRINK, name: "Food & Drink" },
                                  { category: Categories.TRAVEL_PLACES, name: "Travel & Places" },
                                  { category: Categories.ACTIVITIES, name: "Activities" },
                                  { category: Categories.OBJECTS, name: "Objects" },
                                  { category: Categories.SYMBOLS, name: "Symbols" },
                                  { category: Categories.FLAGS, name: "Flags" },
                                ]}
                            />
                        </div>
                    )}
                </div>

                <div className="points-input-container">
                    <label htmlFor="goal-input">Goal (per day):</label>
                    <div className="points-input-wrapper">
                        <input
                            id="goal-input"
                            type="number"
                            value={goal}
                            onChange={(e) => setGoal(parseInt(e.target.value, 10))}
                            min="1"
                            className="points-input"
                        />
                        <div className="points-buttons">
                            <button type="button" {...goalUpProps}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14" /></svg>
                            </button>
                            <button type="button" {...goalDownProps}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="points-input-container">
                    <label htmlFor="reward-input">Reward:</label>
                    <div className="points-input-wrapper">
                        <input
                            id="reward-input"
                            type="number"
                            value={reward}
                            onChange={(e) => setReward(parseFloat(e.target.value))}
                            step="0.1"
                            min="0"
                            className="points-input"
                        />
                        <div className="points-buttons">
                            <button type="button" {...rewardUpProps}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14" /></svg>
                            </button>
                            <button type="button" {...rewardDownProps}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="points-input-container">
                    <label htmlFor="penalty-input">Penalty (if not completed):</label>
                    <div className="points-input-wrapper">
                        <input
                            id="penalty-input"
                            type="number"
                            value={penalty}
                            onChange={(e) => setPenalty(parseFloat(e.target.value))}
                            step="0.1"
                            min="0"
                            className="points-input"
                        />
                        <div className="points-buttons">
                            <button type="button" {...penaltyUpProps}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14" /></svg>
                            </button>
                            <button type="button" {...penaltyDownProps}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="panel-actions">
                    <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
                    <button type="submit" className="add-btn">{habit ? 'Save Changes' : 'Add Habit'}</button>
                </div>
            </form>
        </div>
    );
};

export default AddHabitPanel;

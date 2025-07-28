import React, { useState, useEffect, useRef } from 'react';
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
        return () => stop(); // Cleanup on unmount
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
  const [completions, setCompletions] = useState(1);
  const [reward, setReward] = useState(0.1);
  const [penalty, setPenalty] = useState(0);

  const incrementCompletions = () => setCompletions(prev => Math.max(1, prev + 1));
  const decrementCompletions = () => setCompletions(prev => Math.max(1, prev - 1));
  const incrementReward = () => setReward(prev => parseFloat((prev + 0.1).toFixed(1)));
  const decrementReward = () => setReward(prev => Math.max(0, parseFloat((prev - 0.1).toFixed(1))));
  const incrementPenalty = () => setPenalty(prev => parseFloat((prev + 0.1).toFixed(1)));
  const decrementPenalty = () => setPenalty(prev => Math.max(0, parseFloat((prev - 0.1).toFixed(1))));

  const completionsUpProps = useContinuousPress(incrementCompletions);
  const completionsDownProps = useContinuousPress(decrementCompletions);
  const rewardUpProps = useContinuousPress(incrementReward);
  const rewardDownProps = useContinuousPress(decrementReward);
  const penaltyUpProps = useContinuousPress(incrementPenalty);
  const penaltyDownProps = useContinuousPress(decrementPenalty);

  const isPristine = () => {
    if (habit) {
      return (
        habitName === habit.text &&
        icon === habit.icon &&
        completions === habit.targetCompletions &&
        reward === habit.coins &&
        penalty === habit.penalty
      );
    }
    return (
      habitName === '' &&
      icon === '🏃' &&
      completions === 1 &&
      reward === 0.1 &&
      penalty === 0
    );
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isPristine()) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [habitName, icon, completions, reward, penalty, onCancel]);

  useEffect(() => {
    if (habit) {
      setHabitName(habit.text);
      setIcon(habit.icon);
      setCompletions(habit.targetCompletions);
      setReward(habit.coins);
      setPenalty(habit.penalty);
    } else {
        setHabitName('');
        setIcon('🏃');
        setCompletions(1);
        setReward(0.1);
        setPenalty(0);
    }
  }, [habit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newHabit = {
      ...(habit || {}),
      text: habitName,
      icon,
      targetCompletions: parseInt(completions, 10),
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
          <input type="text" value={habitName} onChange={(e) => setHabitName(e.target.value)} required />
        </label>
        <label>
          Choose icon:
          <input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} />
        </label>
        
        <div className="points-input-container">
            <label htmlFor="completions-input">No of times per day:</label>
            <div className="points-input-wrapper">
              <input
                id="completions-input"
                type="number"
                value={completions}
                onChange={(e) => setCompletions(parseInt(e.target.value, 10))}
                min="1"
                className="points-input"
              />
              <div className="points-buttons">
                <button type="button" {...completionsUpProps}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14"/></svg>
                </button>
                <button type="button" {...completionsDownProps}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14"/></svg>
                </button>
                <button type="button" {...rewardDownProps}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14"/></svg>
                </button>
                <button type="button" {...penaltyDownProps}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
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

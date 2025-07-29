import React, { useState, useEffect, useRef } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './AddTodoModal.css';
import TimePicker from '../TimePicker/TimePicker';

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

const AddTodoModal = ({ onAdd, onCancel, todo }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [date, setDate] = useState(new Date());
  const [hour, setHour] = useState('10');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('AM');
  const [points, setPoints] = useState('1.0');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const calendarRef = useRef(null);
  const timePickerRef = useRef(null);
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (nameInputRef.current) {
        nameInputRef.current.focus();
    }
  }, []);

  const incrementPoints = () => setPoints(prev => (parseFloat(prev) + 0.1).toFixed(1));
  const decrementPoints = () => setPoints(prev => (Math.max(0, parseFloat(prev) - 0.1)).toFixed(1));

  const pointsUpProps = useContinuousPress(incrementPoints);
  const pointsDownProps = useContinuousPress(decrementPoints);

  useEffect(() => {
    if (todo) {
      setText(todo.text);
      const todoDate = new Date(todo.dueDate);
      setDate(todoDate);
      setPoints(todo.points.toString());
      let h = todoDate.getHours();
      const m = todoDate.getMinutes();
      const p = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      setHour(h.toString().padStart(2, '0'));
      setMinute(m.toString().padStart(2, '0'));
      setPeriod(p);
    } else {
      setText('');
      setDate(new Date());
      setPoints('1.0');
      const now = new Date();
      let h = now.getHours();
      const m = now.getMinutes();
      const p = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      setHour(h.toString().padStart(2, '0'));
      setMinute(m.toString().padStart(2, '0'));
      setPeriod(p);
    }
  }, [todo]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        let isPristine = false;
        if (todo) {
          const todoDate = new Date(todo.dueDate);
          let h = todoDate.getHours();
          const p = h >= 12 ? 'PM' : 'AM';
          h = h % 12 || 12;
          if (
            text === todo.text &&
            date.toDateString() === todoDate.toDateString() &&
            points === todo.points.toString() &&
            hour === h.toString().padStart(2, '0') &&
            minute === todoDate.getMinutes().toString().padStart(2, '0') &&
            period === p
          ) {
            isPristine = true;
          }
        } else {
          if (text === '') {
            isPristine = true;
          }
        }

        if (isPristine) {
          onCancel();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [text, date, hour, minute, period, points, todo, onCancel]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text) {
      setError('Please enter a task name.');
      return;
    }
    setError('');

    let h = parseInt(hour, 10);
    if (period === 'PM' && h < 12) {
      h += 12;
    } else if (period === 'AM' && h === 12) {
      h = 0;
    }

    const dueDate = new Date(date);
    dueDate.setHours(h, parseInt(minute, 10), 0, 0);

    onAdd({ ...(todo || {}), text, dueDate, points: parseFloat(points) || 0 });
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setShowCalendar(false);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (error) {
      setError('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const dateInputWrapper = document.querySelector('.date-input-wrapper');
      const timeInputWrapper = document.querySelector('.time-input-wrapper');

      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target) &&
        !dateInputWrapper.contains(event.target)
      ) {
        setShowCalendar(false);
      }
      if (
        timePickerRef.current &&
        !timePickerRef.current.contains(event.target) &&
        !timeInputWrapper.contains(event.target)
      ) {
        setShowTimePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{todo ? `Edit "${todo.text}"` : 'Add a New Task'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            ref={nameInputRef}
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder="e.g., Read a chapter of a book"
            className={`task-input ${error ? 'error' : ''}`}
          />
          {error && <p className="error-message">{error}</p>}

          <div className="points-input-container">
            <label htmlFor="points-input">Points</label>
            <div className="points-input-wrapper">
              <input
                id="points-input"
                type="number"
                step="0.1"
                min="0"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="points-input"
              />
              <div className="points-buttons">
                <button type="button" {...pointsUpProps}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
                </button>
                <button type="button" {...pointsDownProps}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div className="date-time-container">
            <div className="date-input-wrapper" ref={calendarRef}>
              <div
                className="date-input"
                onClick={() => {
                  setShowCalendar(!showCalendar);
                  setShowTimePicker(false);
                }}
              >
                {date.toLocaleDateString()}
              </div>
              {showCalendar && (
                <div className="calendar-popup">
                  <Calendar onChange={handleDateChange} value={date} />
                </div>
              )}
            </div>
            <div className="time-input-wrapper" ref={timePickerRef}>
              <div
                className="time-display"
                onClick={() => {
                  setShowTimePicker(!showTimePicker);
                  setShowCalendar(false);
                }}
              >
                <span>{hour}</span>
                <span>:</span>
                <span>{minute}</span>
                <span className="period-display">{period}</span>
              </div>
              {showTimePicker && (
                <TimePicker
                  hour={hour}
                  minute={minute}
                  period={period}
                  onHourChange={setHour}
                  onMinuteChange={setMinute}
                  onPeriodChange={setPeriod}
                  onClose={() => setShowTimePicker(false)}
                />
              )}
            </div>
          </div>
          <div className="modal-actions">
            <button type="submit" className="add-btn">
              {todo ? 'Save Changes' : 'Add Task'}
            </button>
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTodoModal;

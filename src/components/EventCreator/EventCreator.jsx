import React, { useState, useEffect } from 'react';
import './EventCreator.css';

const EventCreator = ({ event, onSave, onCancel, isDragging }) => {
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (event) {
      setEventName(event.title || '');
      setDescription(event.description || '');
    }
  }, [event]);

  if (!event) {
    return null;
  }

  const handleSave = () => {
    onSave({
      ...event,
      title: eventName,
      description,
    });
  };

  const getFormattedDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const getFormattedTime = (date) => {
    let tempStart = event.start;
    let tempEnd = event.end;

    if (tempEnd < tempStart) {
        [tempStart, tempEnd] = [tempEnd, tempStart];
    }

    return tempStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  const getDuration = (start, end) => {
    if (end < start) {
        [start, end] = [end, start];
    }
    const diff = (end.getTime() - start.getTime()) / 1000 / 60; // in minutes
    if (diff < 60) {
        return `${diff} minutes`;
    }
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
  }

  return (
    <div className="event-creator-panel">
      <h3>{isDragging ? "Creating Event..." : "Edit Event"}</h3>
      <input
        type="text"
        placeholder="Event name"
        value={eventName}
        onChange={(e) => setEventName(e.target.value)}
        className="event-name-input"
        disabled={isDragging}
      />
      <div className="event-time-info">
        <p>{getFormattedDate(event.start)}</p>
        <p>{getFormattedTime(event.start)} - {getFormattedTime(event.end)} ({getDuration(event.start, event.end)})</p>
      </div>
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="event-description-input"
        disabled={isDragging}
      />
      {!isDragging && (
        <div className="event-creator-actions">
          <button onClick={onCancel} className="cancel-btn">Cancel</button>
          <button onClick={handleSave} className="save-btn">Save</button>
        </div>
      )}
    </div>
  );
};

export default EventCreator;

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarView.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EventCreator from '../EventCreator/EventCreator';


const CHUNK_SIZE = 30; // Number of days to load at a time
const DAY_COLUMN_WIDTH = 150; // The width of a single day column in pixels
const HOUR_ROW_HEIGHT = 80; // The height of a single hour row in pixels
const TIME_COLUMN_WIDTH = 70; // The width of the time column on the left
const CLICK_DRAG_THRESHOLD = 5; // Pixels to distinguish a click from a drag

// Generates a chunk of dates before or after a given date
const generateDateChunk = (baseDate, direction) => {
  const dates = [];
  const start = direction === 'prepend' ? -CHUNK_SIZE : 1;
  const end = direction === 'prepend' ? -1 : CHUNK_SIZE;

  for (let i = start; i <= end; i++) {
    const day = new Date(baseDate);
    day.setDate(baseDate.getDate() + i);
    dates.push(day);
  }
  if (direction === 'prepend') {
    return dates.reverse();
  }
  return dates;
};

// A more reliable way to get the current time in a specific timezone.
const getTimeInTimeZone = (timeZone) => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-GB', { // Using en-GB for 24-hour format
        timeZone,
        hour: 'numeric',
        minute: 'numeric',
        hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
    const minute = parseInt(parts.find(p => p.type === 'minute').value, 10);

    return { 
        hour,
        minute, 
        displayTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` 
    };
}


const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [displayedDate, setDisplayedDate] = useState(new Date());
  const [dates, setDates] = useState(() => {
    const initialDates = [];
    const today = new Date();
    for (let i = -CHUNK_SIZE; i <= CHUNK_SIZE; i++) {
        const day = new Date(today);
        day.setDate(today.getDate() + i);
        initialDates.push(day);
    }
    return initialDates;
  });

  const [timelineIndicatorPosition, setTimelineIndicatorPosition] = useState(0);
  const [currentTime, setCurrentTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const scrollTimeout = useRef(null);
  const fetchingLock = useRef(false);

  const [events, setEvents] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [dragInfo, setDragInfo] = useState(null);
  const mouseDownPos = useRef(null);


  const gridRef = useRef(null);
  const headerRef = useRef(null);
  const todayRef = useRef(null);
  const scrollState = useRef({ prevScrollWidth: 0, prevScrollLeft: 0 }).current;


  // Synchronize header scroll with the grid scroll and handle infinite scroll
  const handleGridScroll = () => {
    if (dragInfo) return;
    // Immediate updates on every scroll event
    if (headerRef.current) {
      headerRef.current.scrollLeft = gridRef.current.scrollLeft;
    }

    const { scrollLeft, clientWidth } = gridRef.current;
    const center = scrollLeft + clientWidth / 2;
    const dayIndex = Math.floor(center / DAY_COLUMN_WIDTH);
    if (dates[dayIndex]) {
        const newDate = dates[dayIndex];
        if (newDate.getMonth() !== displayedDate.getMonth() || newDate.getFullYear() !== displayedDate.getFullYear()) {
            setDisplayedDate(newDate);
        }
    }

    // Clear previous timeout to debounce the data loading part
    if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
    }

    // Debounced actions (data loading)
    scrollTimeout.current = setTimeout(() => {
        setIsAnimating(false); // Scrolling has ended
        if (isLoading || fetchingLock.current) return;

        const { scrollLeft, scrollWidth, clientWidth } = gridRef.current; // Re-get latest values

        // Load more future dates
        if (scrollWidth - scrollLeft - clientWidth < 1000) {
          fetchingLock.current = true;
          setIsLoading(true);
          const lastDate = dates[dates.length - 1];
          const newDates = generateDateChunk(lastDate, 'append');
          scrollState.prevScrollLeft = 0; // Explicitly mark as an append operation
          setDates(prevDates => [...prevDates, ...newDates]);
        }
        // Load more past dates
        else if (scrollLeft < 1000) {
          fetchingLock.current = true;
          setIsLoading(true);
          const firstDate = dates[0];
          scrollState.prevScrollWidth = scrollWidth;
          scrollState.prevScrollLeft = scrollLeft; // Mark as a prepend operation
          const newDates = generateDateChunk(firstDate, 'prepend');
          setDates(prevDates => [...newDates, ...prevDates]);
        }
    }, 150); // Detect when scrolling has stopped
  };
  
  // This effect runs after the DOM has been updated, but before the browser has painted.
  // It's used to adjust the scroll position seamlessly when new past dates are loaded.
  useLayoutEffect(() => {
    if (isLoading && gridRef.current) {
        const newScrollWidth = gridRef.current.scrollWidth;
        const scrollDiff = newScrollWidth - scrollState.prevScrollWidth;
        
        // Check if this was a prepend operation
        if(scrollDiff > 0 && scrollState.prevScrollLeft > 0) {
            gridRef.current.scrollLeft = scrollState.prevScrollLeft + scrollDiff;
        }

        scrollState.prevScrollWidth = 0; // Reset after adjustment
        setIsLoading(false);
        
        // Release the lock after a longer delay to allow scroll momentum to settle
        setTimeout(() => {
            fetchingLock.current = false;
        }, 200);
    }
  }, [dates, isLoading, scrollState]);

  
  // Effect for Shift + Scroll
  useEffect(() => {
    const element = gridRef.current;
    if (!element) return;
  
    let lastScrollTime = 0;
    const handleWheel = (e) => {
      if (e.shiftKey) {
        e.preventDefault();
        
        const now = Date.now();
        if (now - lastScrollTime < 100) return; // Debounce scroll
        lastScrollTime = now;
        
        const scrollDirection = e.deltaY > 0 ? 1 : -1;
        const currentScrollLeft = element.scrollLeft;
        const targetColumn = Math.round(currentScrollLeft / DAY_COLUMN_WIDTH) + scrollDirection;
        const targetScrollLeft = targetColumn * DAY_COLUMN_WIDTH;
        
        element.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
      }
    };
  
    element.addEventListener('wheel', handleWheel);
    return () => element.removeEventListener('wheel', handleWheel);
  }, []);

  // Effect for handling the delete key and auto-canceling new events
  useEffect(() => {
    const handleGlobalInteraction = (e) => {
        if (activeEvent) {
            if (e.key === 'Delete' && !activeEvent.id.startsWith('new-')) {
                handleDeleteEvent(activeEvent.id);
            }
            
            if (
                activeEvent.id.startsWith('new-') &&
                activeEvent.title === '' &&
                !dragInfo && 
                !e.target.closest('.event-creator-panel') &&
                !e.target.closest('.event-block')
            ) {
                setActiveEvent(null);
            }
        }
    };
    
    window.addEventListener('keydown', handleGlobalInteraction);
    window.addEventListener('mousedown', handleGlobalInteraction);

    return () => {
        window.removeEventListener('keydown', handleGlobalInteraction);
        window.removeEventListener('mousedown', handleGlobalInteraction);
    };
  }, [activeEvent, dragInfo]);
  

  // Effect to handle all initial setup: scrolling to today/time and setting up the timeline interval.
  useEffect(() => {
    // --- Timeline Setup ---
    const updateIndicator = () => {
        const { hour, minute, displayTime } = getTimeInTimeZone('Asia/Kolkata');
        const position = (hour + minute / 60) * HOUR_ROW_HEIGHT;
        setTimelineIndicatorPosition(position);
        setCurrentTime(displayTime);
        return position;
    };

    const initialPosition = updateIndicator(); // Set initial state
    const interval = setInterval(updateIndicator, 60000); // Set up interval

    // --- Initial Scroll ---
    if (todayRef.current && gridRef.current) {
      const grid = gridRef.current;
      const todayEl = todayRef.current;

      // Horizontal scroll to today
      const todayOffset = todayEl.offsetLeft - grid.offsetLeft;
      const scrollOffset = todayOffset - DAY_COLUMN_WIDTH;
      grid.scrollLeft = scrollOffset;
      
      // Vertical scroll to current time
      const gridHeight = grid.offsetHeight;
      const scrollTop = initialPosition - (gridHeight / 2);
      grid.scrollTop = scrollTop > 0 ? scrollTop : 0;
    }
    
    return () => clearInterval(interval);
  }, []); // Run only once on mount

  const handleScrollButtons = (direction) => {
    if (gridRef.current && !isAnimating) {
        setIsAnimating(true);
        const currentScrollLeft = gridRef.current.scrollLeft;
        const directionMultiplier = direction === 'left' ? -1 : 1;
        const scrollAmountInDays = 4;
        
        // Find the target column's exact starting position
        const targetColumn = Math.round(currentScrollLeft / DAY_COLUMN_WIDTH) + (directionMultiplier * scrollAmountInDays);
        const targetScrollLeft = targetColumn * DAY_COLUMN_WIDTH;

        gridRef.current.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
    }
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
    if (todayRef.current && gridRef.current) {
      const grid = gridRef.current;
      const todayEl = todayRef.current;

      // Horizontal scroll
      const todayOffset = todayEl.offsetLeft - grid.offsetLeft;
      const scrollOffset = todayOffset - DAY_COLUMN_WIDTH;
      
      // Vertical scroll
      const { hour, minute } = getTimeInTimeZone('Asia/Kolkata');
      const position = (hour + minute / 60) * HOUR_ROW_HEIGHT;
      const gridHeight = grid.offsetHeight;
      const scrollTop = position - (gridHeight / 2);

      grid.scrollTo({
        left: scrollOffset,
        top: scrollTop > 0 ? scrollTop : 0,
        behavior: 'smooth'
      });
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const today = new Date();

  const todayIndex = dates.findIndex(d => d.toDateString() === today.toDateString());

  const getDateFromPosition = (x, y) => {
    // Adjust x-coordinate for the sticky time column width
    const dayIndex = Math.floor(x / DAY_COLUMN_WIDTH);
    if (dayIndex < 0 || dayIndex >= dates.length) return null; // Clicked outside the valid date range

    const date = new Date(dates[dayIndex]);
  
    // Calculate total minutes from the top of the day and snap to nearest 15-minute interval
    const totalMinutes = y / HOUR_ROW_HEIGHT * 60;
    const snappedTotalMinutes = Math.floor(totalMinutes / 15) * 15;

    const hour = Math.floor(snappedTotalMinutes / 60);
    const minute = snappedTotalMinutes % 60;
  
    date.setHours(hour, minute, 0, 0);
    return date;
  };
  
  const handleMouseDown = (e) => {
    if (e.button !== 0 || dragInfo) return; 

    if (e.target.closest('.event-block')) return;

    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  };
  
  const handleEventMouseDown = (e, event) => {
    e.stopPropagation(); 
    if (e.button !== 0 || dragInfo) return;
  
    const startY = e.clientY - gridRef.current.getBoundingClientRect().top + gridRef.current.scrollTop;
    const eventStartInMinutes = event.start.getHours() * 60 + event.start.getMinutes();
    const clickedTimeInMinutes = (startY / HOUR_ROW_HEIGHT) * 60;
    
    setActiveEvent(event);
    setDragInfo({
        mode: 'move',
        eventId: event.id,
        offset: clickedTimeInMinutes - eventStartInMinutes,
    });
  };

  const handleMouseMove = (e) => {
    if(dragInfo) { // If we are already dragging, continue
        const gridRect = gridRef.current.getBoundingClientRect();
        const x = e.clientX - gridRect.left - TIME_COLUMN_WIDTH + gridRef.current.scrollLeft;
        const y = e.clientY - gridRect.top + gridRef.current.scrollTop;
      
        if (dragInfo.mode === 'create') {
            const currentDate = getDateFromPosition(x, y);
            if (!currentDate) return;
            setActiveEvent(prev => ({ ...prev, end: currentDate }));
        } else if (dragInfo.mode === 'move') {
            const duration = (activeEvent.end.getTime() - activeEvent.start.getTime());
            const adjustedY = y - (dragInfo.offset * HOUR_ROW_HEIGHT / 60);
            const newStartDate = getDateFromPosition(x, adjustedY);
            if (!newStartDate) return;
            const newEndDate = new Date(newStartDate.getTime() + duration);
            setActiveEvent(prev => ({ ...prev, start: newStartDate, end: newEndDate }));
        }
    } else if (mouseDownPos.current) { // If a mousedown has happened but we are not yet dragging
        const distance = Math.sqrt(
            Math.pow(e.clientX - mouseDownPos.current.x, 2) +
            Math.pow(e.clientY - mouseDownPos.current.y, 2)
        );

        if (distance > CLICK_DRAG_THRESHOLD) {
            const gridRect = gridRef.current.getBoundingClientRect();
            const x = mouseDownPos.current.x - gridRect.left - TIME_COLUMN_WIDTH + gridRef.current.scrollLeft;
            const y = mouseDownPos.current.y - gridRect.top + gridRef.current.scrollTop;
            const startDate = getDateFromPosition(x, y);
            
            if (startDate) {
                const newEvent = {
                    id: `new-${Date.now()}`,
                    start: startDate,
                    end: startDate,
                    title: '',
                    description: '',
                };
                setActiveEvent(newEvent);
                setDragInfo({ mode: 'create', eventId: newEvent.id });
            }
            mouseDownPos.current = null; // We've started dragging, so clear the initial position
        }
    }
  };
  
  const handleMouseUp = (e) => {
    if (dragInfo) {
      const start = activeEvent.start;
      const end = activeEvent.end;
  
      if (dragInfo.mode === 'create') {
        if (start.getTime() === end.getTime()) {
          setActiveEvent(null);
        } else {
          setEvents(prev => [...prev, activeEvent]);
        }
      } else if (dragInfo.mode === 'move') {
        setEvents(prev => prev.map(ev => ev.id === activeEvent.id ? activeEvent : ev));
      }
      setDragInfo(null);
    }
    mouseDownPos.current = null; // Clear on any mouse up
  };

  const handleSaveEvent = (eventData) => {
    const isNew = eventData.id.startsWith('new-');
    if (isNew) {
        setEvents(prev => [...prev.filter(e => e.id !== eventData.id), eventData]);
    } else {
        setEvents(prev => prev.map(e => e.id === eventData.id ? eventData : e));
    }
    setActiveEvent(null);
};

  const handleCancelEvent = () => {
    if (activeEvent && activeEvent.id.startsWith('new-')) {
    } else if(activeEvent) {
        const originalEvent = events.find(e => e.id === activeEvent.id);
        if(originalEvent) setActiveEvent(originalEvent);
    }
    setActiveEvent(null);
  };

  const handleDeleteEvent = (eventId) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    setActiveEvent(null);
  }

  const renderEvent = (event, isTemporary = false) => {
    const isMoving = dragInfo?.mode === 'move' && dragInfo?.eventId === event.id;
    const displayEvent = isMoving ? activeEvent : event;
    
    let { start, end } = displayEvent;
    if (end < start) [start, end] = [end, start];

    const startIndex = dates.findIndex(d => d.toDateString() === start.toDateString());
    if (startIndex === -1) return null;

    const startPos = (start.getHours() + start.getMinutes() / 60) * HOUR_ROW_HEIGHT;
    const endPos = (end.getHours() + end.getMinutes() / 60) * HOUR_ROW_HEIGHT;

    const eventStyle = {
        left: `${startIndex * DAY_COLUMN_WIDTH + 1}px`,
        top: `${startPos}px`,
        height: `${Math.max(20, endPos - startPos)}px`,
        width: `${DAY_COLUMN_WIDTH - 2}px`,
    };
    
    return (
        <div 
            key={event.id} 
            className={`event-block ${isMoving ? 'moving' : ''}`} 
            style={eventStyle}
            onMouseDown={(e) => isTemporary ? e.stopPropagation() : handleEventMouseDown(e, event)}
        >
            <span className="event-title">{displayEvent.title}</span>
        </div>
    );
  };

  return (
    <div className={`notion-calendar-container ${dragInfo ? 'dragging' : ''}`}>
      <div className="notion-sidebar">
        <div className="sidebar-header">
          <button onClick={handleToday} className="control-button">Today</button>
        </div>
        <Calendar
          value={currentDate}
          onChange={setCurrentDate}
          className="notion-small-calendar"
        />
      </div>

      <div className="notion-main-view">
        <div className="notion-header">
            <div className="header-top">
                <div className="month-year-display">
                    {displayedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <div className="header-time-display">{currentTime}</div>
                <div className="scroll-buttons">
                    <button onClick={() => handleScrollButtons('left')} className="scroll-button left" disabled={isAnimating}><ChevronLeft size={16} /></button>
                    <button onClick={() => handleScrollButtons('right')} className="scroll-button right" disabled={isAnimating}><ChevronRight size={16} /></button>
                </div>
            </div>
          <div className="day-headers-container" ref={headerRef}>
            <div className="time-column-header" />
            {dates.map(day => {
              const isToday = day.toDateString() === today.toDateString();
              return (
                <div key={day.toISOString()} className={`day-header ${isToday ? 'today' : ''}`}>
                  <span className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className={`day-number ${isToday ? 'today' : ''}`}>{day.getDate()}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div 
            className="notion-grid-container" 
            ref={gridRef} 
            onScroll={handleGridScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
          <div className="time-column">
            {hours.map(hour => (
              <div key={hour} className="time-label">
                <span>
                  {hour === 0 ? '00:00' : `${String(hour).padStart(2, '0')}:00`}
                </span>
              </div>
            ))}
          </div>
          <div className="days-grid">
            <div className="timeline-container" style={{ top: `${timelineIndicatorPosition}px`}}>
                <div className="timeline-line-full" style={{ width: `${dates.length * DAY_COLUMN_WIDTH}px` }}/>
                {todayIndex !== -1 && (
                    <>
                        <div className="timeline-line-today" style={{ left: `${todayIndex * DAY_COLUMN_WIDTH}px`, width: `${DAY_COLUMN_WIDTH}px` }} />
                        <div className="timeline-dot" style={{ left: `${todayIndex * DAY_COLUMN_WIDTH}px` }} />
                    </>
                )}
            </div>

            {/* This is the crucial part that was missing */}
            {dates.map(day => (
              <div key={day.toISOString()} ref={day.toDateString() === today.toDateString() ? todayRef : null} className={`day-column ${day.toDateString() === today.toDateString() ? 'today' : ''}`}>
                {hours.map(hour => <div key={hour} className="hour-slot"></div>)}
              </div>
            ))}
             <div className="grid-lines-overlay">
              {dates.map((_, index) => (
                <div 
                  key={index} 
                  className="grid-line" 
                  style={{ left: `${(index) * DAY_COLUMN_WIDTH}px` }}
                ></div>
              ))}
            </div>
            
            <div className="events-layer">
                {events.map(event => renderEvent(event))}
                {dragInfo?.mode === 'create' && activeEvent && renderEvent(activeEvent, true)}
            </div>
          </div>
        </div>
      </div>
      <div className="notion-sidebar notion-sidebar-right">
        {activeEvent ? (
            <EventCreator
                key={activeEvent.id}
                event={activeEvent}
                onSave={handleSaveEvent}
                onCancel={handleCancelEvent}
                onDelete={handleDeleteEvent}
                isDragging={!!dragInfo}
            />
        ) : (
            <div className="right-sidebar-placeholder">
                <h3>No meeting selected</h3>
                <p>Click and drag on the calendar to create a new event, or click an existing one to edit it.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;

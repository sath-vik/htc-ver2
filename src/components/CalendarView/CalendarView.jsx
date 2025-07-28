import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarView.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CHUNK_SIZE = 30; // Number of days to load at a time
const DAY_COLUMN_WIDTH = 150; // The width of a single day column in pixels
const HOUR_ROW_HEIGHT = 80; // The height of a single hour row in pixels

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


  const gridRef = useRef(null);
  const headerRef = useRef(null);
  const todayRef = useRef(null);
  const scrollState = useRef({ prevScrollWidth: 0, prevScrollLeft: 0 }).current;


  // Synchronize header scroll with the grid scroll and handle infinite scroll
  const handleGridScroll = () => {
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

  return (
    <div className="notion-calendar-container">
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
        
        <div className="notion-grid-container" ref={gridRef} onScroll={handleGridScroll}>
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
          </div>
        </div>
      </div>
      <div className="notion-sidebar notion-sidebar-right">
        <div className="sidebar-header">
          <button onClick={handleToday} className="control-button">Today</button>
        </div>
        <Calendar
          value={currentDate}
          onChange={setCurrentDate}
          className="notion-small-calendar"
        />
      </div>
    </div>
  );
};

export default CalendarView;

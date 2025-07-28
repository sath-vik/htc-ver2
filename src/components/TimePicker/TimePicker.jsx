import React, { useState, useEffect } from 'react';
import './TimePicker.css';

const TimePicker = ({ hour, minute, period, onHourChange, onMinuteChange, onPeriodChange, onClose }) => {
    const [is24HourFormat, setIs24HourFormat] = useState(false);
    const [internalHour, setInternalHour] = useState(hour);

    useEffect(() => {
        setInternalHour(hour);
    }, [hour]);

    const handleHourInputChange = (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        const max = is24HourFormat ? 23 : 12;
        if (parseInt(value, 10) > max) {
            value = max.toString();
        }
        setInternalHour(value);
    };
    
    const handleMinuteInputChange = (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (parseInt(value, 10) > 59) {
            value = '59';
        }
        onMinuteChange(value);
    };

    const handleHourBlur = () => {
        const min = is24HourFormat ? 0 : 1;
        const max = is24HourFormat ? 23 : 12;
        let num = parseInt(internalHour, 10);

        if (isNaN(num) || num < min) {
            num = min;
        } else if (num > max) {
            num = max;
        }

        if (is24HourFormat) {
            const newPeriod = num >= 12 ? 'PM' : 'AM';
            let new12Hour = num % 12;
            if (new12Hour === 0) {
                new12Hour = 12;
            }
            onHourChange(new12Hour.toString().padStart(2, '0'));
            onPeriodChange(newPeriod);
        } else {
            onHourChange(num.toString().padStart(2, '0'));
        }
        setInternalHour(num.toString().padStart(2, '0'));
    };
    
    const handleMinuteBlur = (e) => {
        let num = parseInt(e.target.value, 10);
        if (isNaN(num) || num < 0) {
            num = 0;
        } else if (num > 59) {
            num = 59;
        }
        onMinuteChange(num.toString().padStart(2, '0'));
    };

    const toggleFormat = () => {
        const newFormatIs24 = !is24HourFormat;
        let currentHour = parseInt(internalHour, 10);

        if (newFormatIs24) {
            // Convert from 12-hour to 24-hour
            if (period === 'PM' && currentHour < 12) {
                currentHour += 12;
            } else if (period === 'AM' && currentHour === 12) {
                currentHour = 0;
            }
        } else {
            // Convert from 24-hour to 12-hour
            const newPeriod = currentHour >= 12 ? 'PM' : 'AM';
            currentHour = currentHour % 12;
            if (currentHour === 0) {
                currentHour = 12;
            }
            onPeriodChange(newPeriod);
        }
        
        setInternalHour(currentHour.toString().padStart(2, '0'));
        onHourChange(currentHour.toString().padStart(2, '0'));
        setIs24HourFormat(newFormatIs24);
    };

    return (
        <div className="time-picker-popup">
            <div className="time-picker-header">
                Select Time
                <button type="button" onClick={toggleFormat} className="format-toggle-btn">
                    {is24HourFormat ? '12h' : '24h'}
                </button>
            </div>
            <div className="time-picker-body">
                <div className="time-picker-inputs">
                    <input
                        type="text"
                        value={internalHour}
                        onChange={handleHourInputChange}
                        onBlur={handleHourBlur}
                        className="time-picker-input"
                        maxLength="2"
                    />
                    <span className="time-picker-separator">:</span>
                    <input
                        type="text"
                        value={minute}
                        onChange={handleMinuteInputChange}
                        onBlur={handleMinuteBlur}
                        className="time-picker-input"
                        maxLength="2"
                    />
                </div>
                {!is24HourFormat && (
                    <div className="time-picker-period">
                        <button
                            type="button"
                            className={`period-toggle-btn ${period === 'AM' ? 'active' : ''}`}
                            onClick={() => onPeriodChange('AM')}
                        >
                            AM
                        </button>
                        <button
                            type="button"
                            className={`period-toggle-btn ${period === 'PM' ? 'active' : ''}`}
                            onClick={() => onPeriodChange('PM')}
                        >
                            PM
                        </button>
                    </div>
                )}
            </div>
            <div className="time-picker-footer">
                <button type="button" onClick={onClose} className="time-picker-ok-btn">OK</button>
            </div>
        </div>
    );
};

export default TimePicker;

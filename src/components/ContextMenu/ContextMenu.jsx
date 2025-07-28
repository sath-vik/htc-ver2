import React, { useState, useEffect, useRef } from 'react';
import './ContextMenu.css';

const ContextMenu = ({ x, y, options, onClose }) => {
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            onClose();
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleOptionMouseEnter = (index) => {
    if (options[index].submenu) {
      setActiveSubmenu(index);
    } else {
      setActiveSubmenu(null);
    }
  };

  const handleOptionClick = (option) => {
    if (option.action) {
      option.action();
    }
    if (!option.submenu) {
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ top: y, left: x }}
      onMouseLeave={() => setActiveSubmenu(null)}
    >
      <ul>
        {options.map((option, index) => (
          <li
            key={index}
            onMouseEnter={() => handleOptionMouseEnter(index)}
            onClick={() => handleOptionClick(option)}
          >
            {option.label}
            {option.submenu && <span className="submenu-arrow">▶</span>}
            {activeSubmenu === index && option.submenu && (
              <div className="submenu">
                <ul>
                  {option.submenu.map((subOption, subIndex) => (
                    <li key={subIndex} onClick={() => { subOption.action(); onClose(); }}>
                      {subOption.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu;

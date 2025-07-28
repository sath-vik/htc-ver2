import React from 'react';
import './Insights.css';

const Insights = ({ habits }) => {
  return (
    <div className="insights-container">
      <h2>Insights</h2>
      <ul>
        {habits.map(habit => (
          <li key={habit.id}>
            {habit.text}: {habit.completions ? habit.completions.length : 0} completions
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Insights;
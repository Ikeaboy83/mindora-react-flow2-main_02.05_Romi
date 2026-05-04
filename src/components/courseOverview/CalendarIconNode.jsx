import React from 'react';
import calendarIcon from '../../assets/calendar.svg';
import './CalendarIconNode.css';

export default function CalendarIconNode({ data }) {
  const size = data?.size || 10000;

  return (
    <div
      className="calendar-icon-node"
      style={{ width: size, height: size }}
    >
      <img
        src={calendarIcon}
        alt="Kalender"
        className="calendar-icon"
        style={{ width: size * 0.676, height: size * 0.676 }}
      />
    </div>
  );
}

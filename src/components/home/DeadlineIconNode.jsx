// components/home/DeadlineIconNode.jsx
import calendarIcon from '../../assets/calendar.svg';

export default function DeadlineIconNode() {
  return (
    <div
      style={{
        width: 50,
        height: 50,
        borderRadius: 100,
        background: '#2B7FFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 1,
        animation: 'calendar-pulse 1.8s ease-in-out infinite',
      }}
    >
      <img src={calendarIcon} alt="Kalender" width={37} height={37} />
      <style>
        {`
          @keyframes calendar-pulse {
            0%, 100% { filter: brightness(1.2); }
            50%      { filter: brightness(0.8); }
          }
        `}
      </style>
    </div>
  );
}

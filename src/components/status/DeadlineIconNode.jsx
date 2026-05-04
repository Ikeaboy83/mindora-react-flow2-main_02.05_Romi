// components/status/DeadlineIconNode.jsx
import calendarIcon from '../../assets/calendar.svg';

export default function DeadlineIconNode() {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: 100,
        background: '#2B7FFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 1,
        animation: 'calendar-pulse 1.8s ease-in-out infinite',
      }}
    >
      <img src={calendarIcon} alt="Kalender" width={15} height={15} />
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

//App.jsx
import { useState } from 'react';
import HomeFlowCanvas from './components/home/HomeFlowCanvas';
import CourseOverviewFlowCanvas from './components/courseOverview/CourseOverviewFlowCanvas';

export default function App() {
  const [active, setActive] = useState('home');
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {active === 'home'
        ? <HomeFlowCanvas
            onSwitchToCourse={() => setActive('course')}
            onSwitchToHome={() => setActive('home')}
          />
        : <CourseOverviewFlowCanvas
            onSwitchToHome={() => setActive('home')}
          />
      }
    </div>
  );
}

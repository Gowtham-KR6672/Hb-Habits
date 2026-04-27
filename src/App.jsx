import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HabitProvider } from './context/HabitContext';
import TopAppBar from './components/layout/TopAppBar';
import BottomNavBar from './components/layout/BottomNavBar';
import Dashboard from './pages/Dashboard';
import CreateHabit from './pages/CreateHabit';
import Analytics from './pages/Analytics';
import HabitDetails from './pages/HabitDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ActivityTracker from './pages/ActivityTracker';
import Activities from './pages/Activities';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const applyTheme = (themeValue) => {
  const theme = themeValue || localStorage.getItem('theme') || 'Dark';
  if (theme === 'Light') {
    document.documentElement.classList.remove('dark');
  } else if (theme === 'System') {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } else {
    document.documentElement.classList.add('dark');
  }
};

function App() {
  React.useEffect(() => {
    applyTheme();
  }, []);

  return (
    <HabitProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /><BottomNavBar /></ProtectedRoute>} />
          <Route path="/new" element={<ProtectedRoute><CreateHabit /><BottomNavBar /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /><BottomNavBar /></ProtectedRoute>} />
          <Route path="/habit/:id" element={<ProtectedRoute><HabitDetails /><BottomNavBar /></ProtectedRoute>} />
          <Route path="/track/:id" element={<ProtectedRoute><ActivityTracker /></ProtectedRoute>} />
          <Route path="/activities" element={<ProtectedRoute><Activities /><BottomNavBar /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /><BottomNavBar /></ProtectedRoute>} />
        </Routes>
      </Router>
    </HabitProvider>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import Home from './components/Home';
import Booking from './components/Booking';
import ExerciseGuidance from './components/ExerciseGuidance';
import Contact from './components/Contact';
import MyBookedSlots from './components/MyBookedSlots';
import AdminDashboard from './components/AdminDashboard';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/exercise-guidance" element={<ExerciseGuidance />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/my-bookings" element={<MyBookedSlots />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
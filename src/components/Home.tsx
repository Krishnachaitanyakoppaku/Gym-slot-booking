import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserName = localStorage.getItem('userName') || 'CS23B1027';
    const storedUserEmail = localStorage.getItem('userEmail') || 'cs23b1027@iiitdm.ac.in';
    setUserName(storedUserName);
    setUserEmail(storedUserEmail);
  }, []);

  const toggleProfile = () => {
    setShowProfile(!showProfile);
  };

  const handleLogout = () => {
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  const navigateToPage = (path: string) => {
    navigate(path);
  };

  return (
    <div className="home-background">
      <div className="profile-container">
        <button className="profile-button" onClick={toggleProfile}>
          <div className="profile-icon">
            <i className="fas fa-user"></i>
          </div>
          <span>Profile</span>
        </button>
        {showProfile && (
          <div className="profile-dropdown show">
            <div className="user-info">
              <div className="user-name">{userName}</div>
              <div className="user-email">{userEmail}</div>
            </div>
            <button className="dropdown-item" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      <img 
        src="https://imgs.search.brave.com/ZsY8in-PibjX4NPQmLpQK2yJI9HSJWoT7I3vZOWioiY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvZW4vdGh1bWIv/NC80YS9JbmRpYW5f/SW5zdGl0dXRlX29m/X0luZm9ybWF0aW9u/X1RlY2hub2xvZ3kl/MkNfRGVzaWduX2Fu/ZF9NYW51ZmFjdHVy/aW5nJTJDX0thbmNo/ZWVwdXJhbV9sb2dv/LnBuZy81MTJweC1J/bmRpYW5fSW5zdGl0/dXRlX29mX0luZm9y/bWF0aW9uX1RlY2hu/b2xvZ3klMkNfRGVz/aWduX2FuZF9NYW51/ZmFjdHVyaW5nJTJD/X0thbmNoZWVwdXJh/bV9sb2dvLnBuZw" 
        alt="IIITDM Logo" 
        className="logo" 
      />

      <div className="content">
        <h1 className="title">Welcome to IIITDM Gym</h1>
        <p className="subtitle">Your journey to fitness begins here</p>
        <button className="cta-button" onClick={() => navigateToPage('/booking')}>
          Book Your Slot
        </button>

        <div className="features">
          <div className="feature-card" onClick={() => navigateToPage('/my-bookings')}>
            <div className="feature-icon">📅</div>
            <h3 className="feature-title">My Booked Slots</h3>
            <p className="feature-description">View and manage your upcoming gym session bookings</p>
          </div>
          <div className="feature-card" onClick={() => navigateToPage('/exercise-guidance')}>
            <div className="feature-icon">🏋️</div>
            <h3 className="feature-title">Exercise Guidance</h3>
            <p className="feature-description">Get expert guidance on proper exercise techniques and workout routines</p>
          </div>
          <div className="feature-card" onClick={() => navigateToPage('/contact')}>
            <div className="feature-icon">👥</div>
            <h3 className="feature-title">Contact Us</h3>
            <p className="feature-description">Get in touch with us for any queries or assistance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
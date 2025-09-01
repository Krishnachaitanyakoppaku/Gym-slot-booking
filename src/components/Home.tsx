import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { announcementService } from '../services/announcementService';
import { Announcement } from '../lib/supabase';

const Home: React.FC = React.memo(() => {
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]); // New state
  const navigate = useNavigate();
  const location = useLocation();
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Initialize user data only once
  useEffect(() => {
    const storedUserName = localStorage.getItem('userName') || 'CS23B1027';
    const storedUserEmail = localStorage.getItem('userEmail') || 'cs23b1027@iiitdm.ac.in';
    setUserName(storedUserName);
    setUserEmail(storedUserEmail);

    // Check if the page was directly visited or refreshed
    if (location.pathname === '/home' && (document.referrer === '' || performance.navigation.type === performance.navigation.TYPE_RELOAD)) {
      setShouldAnimate(true);
    } else {
      setShouldAnimate(false);
    }
  }, [location.pathname]);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const activeAnnouncements = await announcementService.getActiveAnnouncements();
        setAnnouncements(activeAnnouncements);
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
      }
    };
    fetchAnnouncements();
  }, []); // Empty dependency array means it runs once on mount

  const toggleProfile = useCallback(() => {
    setShowProfile(prev => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    navigate('/');
  }, [navigate]);

  const navigateToPage = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  // Memoize user info to prevent unnecessary re-renders
  const userInfo = useMemo(() => ({
    userName,
    userEmail
  }), [userName, userEmail]);

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
              <div className="user-name">{userInfo.userName}</div>
              <div className="user-email">{userInfo.userEmail}</div>
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

        {announcements.length > 0 && (
          <div className="announcements-section" style={{ marginBottom: '30px', background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', textAlign: 'left' }}>
            <h3 style={{ color: '#4CAF50', marginBottom: '10px' }}>Latest Announcements</h3>
            {announcements.map(announcement => (
              <div key={announcement.id} style={{ marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                <h4 style={{ color: 'white', marginBottom: '5px' }}>{announcement.title}</h4>
                <p style={{ color: '#ddd', fontSize: '0.9rem' }}>{announcement.content}</p>
                {announcement.expires_at && (
                  <p style={{ color: '#bbb', fontSize: '0.8rem' }}>Expires: {new Date(announcement.expires_at).toLocaleDateString()}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <button className={`cta-button ${shouldAnimate ? 'animate-on-load' : ''}`} onClick={() => navigateToPage('/booking')}>
          Book Your Slot
        </button>

        <div className={`features ${shouldAnimate ? 'animate-on-load' : ''}`}>
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
});

Home.displayName = 'Home';

export default Home;
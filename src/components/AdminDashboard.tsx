import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { slotService } from '../services/slotService';
import { bookingService } from '../services/bookingService';
import { feedbackService } from '../services/feedbackService';
import { supabase, Slot, Booking, Feedback as FeedbackType } from '../lib/supabase';

interface SlotWithBookings extends Slot {
  bookings: Booking[];
  displayDay: string;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'slots' | 'feedback' | 'bookings'>('slots');
  const [slots, setSlots] = useState<SlotWithBookings[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackType[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotWithBookings | null>(null);
  const [showSlotModal, setShowSlotModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackType | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [togglingSlots, setTogglingSlots] = useState<Set<string>>(new Set()); // Now stores slot IDs instead of date-time keys
  const navigate = useNavigate();

  const timeSlots = [
    '5:00 - 6:00 AM',
    '6:00 - 7:00 AM', 
    '7:00 - 8:00 AM',
    '6:00 - 7:00 PM',
    '8:00 - 9:00 PM',
    '9:00 - 10:00 PM'
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Helper functions for date management
  const getWeeksInMonth = (year: number, month: number): Date[][] => {
    const weeks: Date[][] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Find the Monday of the first week
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Make Monday = 0
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || currentDate.getMonth() === month) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
      
      // Stop if we've gone past the month and completed a full week
      if (currentDate.getMonth() !== month && week[6].getMonth() !== month) {
        break;
      }
    }
    
    return weeks;
  };

  const getCurrentWeekDates = (): Date[] => {
    const weeks = getWeeksInMonth(selectedYear, selectedMonth);
    return weeks[selectedWeek] || [];
  };

  const formatDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getDayName = (date: Date): string => {
    return days[date.getDay() === 0 ? 6 : date.getDay() - 1]; // Convert Sunday=0 to Sunday=6
  };

  // Set current week on component mount
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const weeks = getWeeksInMonth(year, month);
    
    for (let i = 0; i < weeks.length; i++) {
      const week = weeks[i];
      if (week.some(date => 
        date.getDate() === today.getDate() && 
        date.getMonth() === today.getMonth() && 
        date.getFullYear() === today.getFullYear()
      )) {
        setSelectedWeek(i);
        break;
      }
    }
  }, []); // Only run once on mount

  useEffect(() => {
    // Ensure admin is authenticated with Supabase
    const initializeAuth = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
          navigate('/');
          return;
        }
        
        console.log('Initializing admin authentication...');
        
        // Always try to sign in to ensure fresh session
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: 'admin@iiitdm.ac.in',
          password: 'admin123'
        });
        
        if (authError) {
          console.error('Failed to establish Supabase session:', authError);
          setError('Authentication failed. Please login again.');
          return;
        }
        
        console.log('Admin authenticated successfully:', authData.user.email);
        
        // Small delay to ensure session is fully established
        setTimeout(() => {
          loadData();
        }, 100);
        
      } catch (err: any) {
        console.error('Auth initialization error:', err);
        setError('Authentication error. Please login again.');
      }
    };
    
    initializeAuth();
  }, [selectedYear, selectedMonth, selectedWeek, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load slots for the selected week
      const weekDates = getCurrentWeekDates();
      const dateStrings = weekDates.map(formatDateKey);
      
      // Initialize slots for the week if they don't exist
      await slotService.initializeSlotsForDateRange(dateStrings[0], dateStrings[6]);
      
      // Get slots for the week
      const slotsData = await slotService.getSlotsForWeek(dateStrings);
      
      // Get bookings for each slot
      const slotsWithBookings: SlotWithBookings[] = [];
      
      for (const slot of slotsData) {
        const bookings = await bookingService.getBookingsForSlot(slot.date, slot.time_slot);
        const date = new Date(slot.date);
        const dayName = getDayName(date);
        
        slotsWithBookings.push({
          ...slot,
          bookings,
          displayDay: `${dayName} (${date.getDate()}/${date.getMonth() + 1})`
        });
      }
      
      setSlots(slotsWithBookings);

      // Load feedback
      const feedbackData = await feedbackService.getAllFeedback();
      setFeedbacks(feedbackData);
      
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSlotById = async (slotId: string, currentBlocked: boolean) => {
    try {
      // Prevent multiple clicks
      if (togglingSlots.has(slotId)) {
        console.log('Already toggling this slot');
        return;
      }

      setTogglingSlots(prev => new Set(prev).add(slotId));
      setError('');
      
      console.log('Toggling slot:', { slotId, currentBlocked, newState: !currentBlocked });

      // Verify we have a valid session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found, re-authenticating...');
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: 'admin@iiitdm.ac.in',
          password: 'admin123'
        });
        
        if (authError) {
          throw new Error('Failed to re-authenticate');
        }
        console.log('Re-authentication successful');
      }

      // Method 1: Try direct update
      const { data: directResult, error: directError } = await supabase
        .from('slots')
        .update({ is_blocked: !currentBlocked })
        .eq('id', slotId)
        .select()
        .single();

      if (!directError && directResult) {
        console.log('Direct update successful:', directResult);
        // Update state with confirmed result
        setSlots(prevSlots => 
          prevSlots.map(slot => 
            slot.id === slotId ? { ...slot, is_blocked: directResult.is_blocked } : slot
          )
        );
        return;
      }

      console.log('Direct update failed, trying RPC method:', directError?.message);

      // Method 2: Try RPC function as fallback
      const currentSlot = slots.find(s => s.id === slotId);
      if (!currentSlot) {
        throw new Error('Slot not found in current data');
      }

      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('admin_toggle_slot', {
          slot_date: currentSlot.date,
          slot_time_slot: currentSlot.time_slot
        });

      if (rpcError) {
        throw new Error(`Both methods failed. Direct: ${directError?.message}, RPC: ${rpcError.message}`);
      }

      console.log('RPC method successful:', rpcResult);
      
      // Update state with RPC result
      if (rpcResult && rpcResult.length > 0) {
        setSlots(prevSlots => 
          prevSlots.map(slot => 
            slot.id === slotId ? { ...slot, is_blocked: rpcResult[0].is_blocked } : slot
          )
        );
      }

    } catch (err: any) {
      console.error('Toggle failed completely:', err);
      setError(`Toggle failed: ${err.message}`);
      
      // Force reload data to get correct state
      console.log('Reloading data to sync state...');
      loadData();
      
    } finally {
      setTogglingSlots(prev => {
        const newSet = new Set(prev);
        newSet.delete(slotId);
        return newSet;
      });
    }
  };



  const viewSlotBookings = (slot: SlotWithBookings) => {
    setSelectedSlot(slot);
    setShowSlotModal(true);
  };

  const viewFeedback = (feedback: FeedbackType) => {
    setSelectedFeedback(feedback);
    setShowFeedbackModal(true);
  };

  const updateFeedbackStatus = async (feedbackId: string, status: 'new' | 'reviewed' | 'resolved') => {
    try {
      await feedbackService.updateFeedbackStatus(feedbackId, status);
      // Update local state
      setFeedbacks(prev => prev.map(feedback =>
        feedback.id === feedbackId ? { ...feedback, status } : feedback
      ));
    } catch (err: any) {
      setError(err.message || 'Failed to update feedback status');
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'new': return '#f44336';
      case 'reviewed': return '#ff9800';
      case 'resolved': return '#4caf50';
      default: return '#666';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  return (
    <div className="admin-background">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <div className="admin-nav">
            <button 
              className={`nav-btn ${activeTab === 'slots' ? 'active' : ''}`}
              onClick={() => setActiveTab('slots')}
            >
              Slot Management
            </button>
            <button 
              className={`nav-btn ${activeTab === 'feedback' ? 'active' : ''}`}
              onClick={() => setActiveTab('feedback')}
            >
              Feedback & Complaints
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message" style={{ 
            background: '#f44336', 
            color: 'white', 
            padding: '10px', 
            borderRadius: '5px', 
            margin: '20px 0',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            color: '#666'
          }}>
            Loading...
          </div>
        )}

        {activeTab === 'slots' && (
          <div className="slots-management">
            <h2>Slot Management</h2>
            <p className="management-subtitle">Click on slots to view bookings or toggle status</p>
            
            {/* Date Navigation Controls */}
            <div className="date-navigation">
              <div className="date-controls">
                <div className="control-group">
                  <label>Year:</label>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => {
                      setSelectedYear(parseInt(e.target.value));
                      setSelectedWeek(0);
                    }}
                  >
                    {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div className="control-group">
                  <label>Month:</label>
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => {
                      setSelectedMonth(parseInt(e.target.value));
                      setSelectedWeek(0);
                    }}
                  >
                    {Array.from({length: 12}, (_, i) => i).map(month => (
                      <option key={month} value={month}>
                        {new Date(2024, month, 1).toLocaleDateString('en-US', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="control-group">
                  <label>Week:</label>
                  <select 
                    value={selectedWeek} 
                    onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                  >
                    {getWeeksInMonth(selectedYear, selectedMonth).map((week, index) => {
                      const startDate = week[0];
                      const endDate = week[6];
                      return (
                        <option key={index} value={index}>
                          Week {index + 1}: {startDate.getDate()}/{startDate.getMonth() + 1} - {endDate.getDate()}/{endDate.getMonth() + 1}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              
              <div className="quick-nav">
                <button 
                  className="nav-btn"
                  onClick={() => {
                    const today = new Date();
                    setSelectedYear(today.getFullYear());
                    setSelectedMonth(today.getMonth());
                    setSelectedWeek(0);
                  }}
                >
                  Current Week
                </button>
                <button 
                  className="nav-btn"
                  onClick={async () => {
                    try {
                      setError('Testing admin permissions...');
                      const { data: { user } } = await supabase.auth.getUser();
                      console.log('Current user:', user?.email);
                      
                      // Test direct slot access
                      const { data: testSlots, error: testError } = await supabase
                        .from('slots')
                        .select('*')
                        .limit(1);
                      
                      if (testError) {
                        setError(`Permission test failed: ${testError.message}`);
                      } else {
                        setError(`✓ Admin permissions OK. User: ${user?.email}, Slots accessible: ${testSlots?.length || 0}`);
                      }
                    } catch (err: any) {
                      setError(`Permission test error: ${err.message}`);
                    }
                  }}
                >
                  Test Permissions
                </button>
              </div>
            </div>
            
            <div className="calendar">
              <div className="calendar-header">Time</div>
              {getCurrentWeekDates().map((date, index) => {
                const dayName = getDayName(date);
                return (
                  <div key={index} className="calendar-header">
                    {dayName}<br/>
                    <span style={{ fontSize: '0.8rem', color: '#bbb' }}>
                      {date.getDate()}/{date.getMonth() + 1}
                    </span>
                  </div>
                );
              })}

              {timeSlots.map(time => (
                <React.Fragment key={time}>
                  <div className="time-slot">{time}</div>
                  {getCurrentWeekDates().map((date, index) => {
                    const dateKey = formatDateKey(date);
                    const slot = slots.find(s => s.time_slot === time && s.date === dateKey);
                    const bookingCount = slot?.bookings.length || 0;
                    const isBlocked = slot?.is_blocked || false;
                    const capacity = slot?.capacity || 30;
                    
                    // Check if this date is in the past
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const slotDate = new Date(date);
                    slotDate.setHours(0, 0, 0, 0);
                    const isPastDate = slotDate < today;
                    
                    // Use same status logic as user booking component
                    let status = 'available';
                    if (isBlocked) {
                      status = 'blocked';
                    } else if (bookingCount >= capacity) {
                      status = 'full';
                    } else if (bookingCount >= Math.floor(capacity * 0.6)) {
                      status = 'filling-fast';
                    }
                    
                    // For past dates, use a neutral status
                    if (isPastDate) {
                      status = 'past';
                    }
                    
                    return (
                      <div 
                        key={`${time}-${dateKey}`}
                        className={`booking-slot admin-slot ${status}`}
                        onClick={() => slot && viewSlotBookings(slot)}
                        style={{ 
                          cursor: 'pointer',
                          position: 'relative',
                          opacity: isPastDate ? 0.7 : 1
                        }}
                      >
                        {isPastDate ? (
                          // Past dates: Only show booking count
                          <>
                            <div style={{ fontWeight: 'bold', marginBottom: '2px', color: '#333' }}>
                              COMPLETED
                            </div>
                            <div className="capacity" style={{ color: '#333', fontWeight: 'bold' }}>
                              {bookingCount} students
                            </div>
                          </>
                        ) : (
                          // Today and future: Show status and toggle button
                          <>
                            <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                              {isBlocked ? 'BLOCKED' : 'OPEN'}
                            </div>
                            <div className="capacity">
                              {isBlocked ? 'N/A' : `${bookingCount}/${capacity}`}
                            </div>
                            <button
                              className="admin-toggle-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Button clicked!', { slot: slot?.id, isBlocked: slot?.is_blocked });
                                if (slot) {
                                  console.log('Calling toggleSlotById...');
                                  toggleSlotById(slot.id, slot.is_blocked);
                                } else {
                                  console.log('No slot found!');
                                }
                              }}
                              disabled={slot ? togglingSlots.has(slot.id) : true}
                              style={{
                                position: 'absolute',
                                bottom: '2px',
                                right: '2px',
                                padding: '2px 6px',
                                fontSize: '0.7rem',
                                border: 'none',
                                borderRadius: '3px',
                                background: (slot && togglingSlots.has(slot.id)) 
                                  ? 'rgba(255, 255, 255, 0.1)' 
                                  : 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                cursor: (slot && togglingSlots.has(slot.id)) ? 'not-allowed' : 'pointer',
                                opacity: (slot && togglingSlots.has(slot.id)) ? 0.6 : 1
                              }}
                            >
                              {(slot && togglingSlots.has(slot.id)) 
                                ? '...' 
                                : (isBlocked ? 'Open' : 'Block')
                              }
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

            <div className="legend">
              <div className="legend-item">
                <div className="legend-color available-color"></div>
                <span>Open Slots</span>
              </div>
              <div className="legend-item">
                <div className="legend-color filling-fast-color"></div>
                <span>Filling Fast</span>
              </div>
              <div className="legend-item">
                <div className="legend-color full-color"></div>
                <span>Full Slots</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#666' }}></div>
                <span>Blocked Slots</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#999' }}></div>
                <span>Past Dates</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="feedback-management">
            <h2>Feedback & Complaints</h2>
            <div className="feedback-stats">
              <div className="stat-card">
                <div className="stat-number">{feedbacks.filter(f => f.status === 'new').length}</div>
                <div className="stat-label">New</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{feedbacks.filter(f => f.status === 'reviewed').length}</div>
                <div className="stat-label">Reviewed</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{feedbacks.filter(f => f.status === 'resolved').length}</div>
                <div className="stat-label">Resolved</div>
              </div>
            </div>
            <div className="feedback-list">
              {feedbacks.map(feedback => (
                <div key={feedback.id} className="feedback-card">
                  <div className="feedback-header">
                    <div className="feedback-info">
                      <h3>{feedback.name}</h3>
                      <p>{feedback.email}</p>
                      <span className="feedback-subject">{feedback.subject}</span>
                    </div>
                    <div className="feedback-meta">
                      <div className="feedback-rating">
                        {'⭐'.repeat(feedback.rating)}
                      </div>
                      <div 
                        className="feedback-status"
                        style={{ backgroundColor: getStatusColor(feedback.status) }}
                      >
                        {feedback.status}
                      </div>
                      <div className="feedback-date">
                        {formatDate(feedback.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="feedback-message">
                    {feedback.message.length > 100 
                      ? `${feedback.message.substring(0, 100)}...` 
                      : feedback.message
                    }
                  </div>
                  <div className="feedback-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => viewFeedback(feedback)}
                    >
                      View Details
                    </button>
                    <select
                      value={feedback.status}
                      onChange={(e) => updateFeedbackStatus(feedback.id, e.target.value as any)}
                      className="status-select"
                    >
                      <option value="new">New</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slot Bookings Modal */}
        {showSlotModal && selectedSlot && (
          <div className="modal show">
            <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
              <h2>Slot Details</h2>
              <p><strong>{selectedSlot.time_slot} - {selectedSlot.displayDay}</strong></p>
              <p>Status: <span className={`status-badge ${selectedSlot.is_blocked ? 'blocked' : 'open'}`}>{selectedSlot.is_blocked ? 'blocked' : 'open'}</span></p>
              <p>Bookings: {selectedSlot.bookings.length}/{selectedSlot.capacity}</p>
              
              {selectedSlot.bookings.length > 0 ? (
                <div className="bookings-list">
                  <h3>Booked Students:</h3>
                  {selectedSlot.bookings.map(booking => {
                    // Find feedback from this user
                    const userFeedback = feedbacks.filter(f => f.user_id === booking.user_id);
                    
                    return (
                      <div key={booking.id} className="booking-item" style={{ 
                        flexDirection: 'column', 
                        alignItems: 'stretch',
                        padding: '15px',
                        marginBottom: '15px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div className="student-info">
                            <strong>{booking.user?.name || 'Unknown User'}</strong>
                            <span style={{ display: 'block', fontSize: '0.9rem', color: '#ddd' }}>
                              {booking.user?.email || 'No email'}
                            </span>
                            <span style={{ display: 'block', fontSize: '0.8rem', color: '#bbb' }}>
                              Student ID: {booking.user?.student_id || 'N/A'}
                            </span>
                          </div>
                          <div className="booking-time" style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', color: '#bbb' }}>Booked:</div>
                            <div style={{ fontSize: '0.8rem' }}>{formatDate(booking.created_at)}</div>
                          </div>
                        </div>
                        
                        {userFeedback.length > 0 && (
                          <div style={{ 
                            marginTop: '10px', 
                            padding: '10px', 
                            background: 'rgba(76, 175, 80, 0.1)',
                            borderRadius: '5px',
                            borderLeft: '3px solid #4CAF50'
                          }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#4CAF50', fontSize: '0.9rem' }}>
                              Recent Feedback ({userFeedback.length})
                            </h4>
                            {userFeedback.slice(0, 2).map(feedback => (
                              <div key={feedback.id} style={{ 
                                marginBottom: '8px', 
                                padding: '8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '4px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#4CAF50' }}>
                                    {feedback.subject}
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.8rem' }}>
                                      {'⭐'.repeat(feedback.rating)}
                                    </span>
                                    <span style={{ 
                                      fontSize: '0.7rem', 
                                      padding: '2px 6px', 
                                      borderRadius: '10px',
                                      background: feedback.status === 'new' ? '#f44336' : 
                                                 feedback.status === 'reviewed' ? '#ff9800' : '#4caf50',
                                      color: 'white'
                                    }}>
                                      {feedback.status}
                                    </span>
                                  </div>
                                </div>
                                <p style={{ 
                                  margin: '0', 
                                  fontSize: '0.8rem', 
                                  color: '#ddd',
                                  lineHeight: '1.3'
                                }}>
                                  {feedback.message.length > 100 
                                    ? `${feedback.message.substring(0, 100)}...` 
                                    : feedback.message
                                  }
                                </p>
                                <div style={{ fontSize: '0.7rem', color: '#bbb', marginTop: '5px' }}>
                                  {formatDate(feedback.created_at)}
                                </div>
                              </div>
                            ))}
                            {userFeedback.length > 2 && (
                              <div style={{ fontSize: '0.8rem', color: '#4CAF50', fontStyle: 'italic' }}>
                                +{userFeedback.length - 2} more feedback entries
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>No bookings for this slot.</p>
              )}
              
              <div className="modal-buttons">
                <button className="btn btn-secondary" onClick={() => setShowSlotModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Details Modal */}
        {showFeedbackModal && selectedFeedback && (
          <div className="modal show">
            <div className="modal-content">
              <h2>Feedback Details</h2>
              <div className="feedback-details">
                <p><strong>Name:</strong> {selectedFeedback.name}</p>
                <p><strong>Email:</strong> {selectedFeedback.email}</p>
                <p><strong>Subject:</strong> {selectedFeedback.subject}</p>
                <p><strong>Rating:</strong> {'⭐'.repeat(selectedFeedback.rating)}</p>
                <p><strong>Submitted:</strong> {formatDate(selectedFeedback.created_at)}</p>
                <p><strong>Status:</strong> 
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(selectedFeedback.status) }}
                  >
                    {selectedFeedback.status}
                  </span>
                </p>
                <div className="message-section">
                  <strong>Message:</strong>
                  <p className="full-message">{selectedFeedback.message}</p>
                </div>
              </div>
              <div className="modal-buttons">
                <button className="btn btn-secondary" onClick={() => setShowFeedbackModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { slotService } from '../services/slotService';
import { bookingService } from '../services/bookingService';
import { feedbackService } from '../services/feedbackService';
import { Slot, Booking, Feedback as FeedbackType } from '../lib/supabase';

// Helper function to get the start of the day
const getStartOfDay = (date: Date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

// Optimized Admin Dashboard Component
const AdminDashboard: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'slots' | 'feedback'>('slots');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookingCounts, setBookingCounts] = useState<Map<string, number>>(new Map());
  const [feedbacks, setFeedbacks] = useState<FeedbackType[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfDay(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [togglingSlots, setTogglingSlots] = useState<Set<string>>(new Set());

  // Modal states
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [modalBookings, setModalBookings] = useState<Booking[]>([]);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [showSlotModal, setShowSlotModal] = useState<boolean>(false);

  const navigate = useNavigate();

  const timeSlots = [
    '5:00 - 6:00 AM', '6:00 - 7:00 AM', '7:00 - 8:00 AM',
    '6:00 - 7:00 PM', '8:00 - 9:00 PM', '9:00 - 10:00 PM'
  ];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Date and week management functions
  const getWeekDates = useCallback((startDate: Date): Date[] => {
    const week: Date[] = [];
    const start = getStartOfDay(startDate);
    const dayOfWeek = start.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    start.setDate(start.getDate() - daysToSubtract);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      week.push(date);
    }
    return week;
  }, []);

  const formatDate = (date: Date): string => date.toISOString().split('T')[0];

  const isPast = (date: Date): boolean => {
    return getStartOfDay(date) < getStartOfDay(new Date());
  };

  // Data loading logic (Optimized)
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const weekDates = getWeekDates(currentWeekStart);
      const dateStrings = weekDates.map(formatDate);

      await slotService.initializeSlotsForDateRange(dateStrings[0], dateStrings[dateStrings.length - 1]);
      
      const [slotsData, feedbackData] = await Promise.all([
        slotService.getSlotsForWeek(dateStrings), 
        feedbackService.getAllFeedback()
      ]);

      const slotIds = slotsData.map(s => s.id);
      const counts = await bookingService.getBookingCountsForSlots(slotIds);
      
      setSlots(slotsData);
      setBookingCounts(new Map(Object.entries(counts)));
      setFeedbacks(feedbackData);

    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart, getWeekDates]);

  // Effects
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Event Handlers
  const handleToggleSlot = async (slot: Slot) => {
    if (togglingSlots.has(slot.id) || isPast(new Date(slot.date))) return;

    setTogglingSlots(prev => new Set(prev).add(slot.id));
    try {
      await slotService.toggleSlotStatus(slot.date, slot.time_slot);
      // Optimistic update for instant UI feedback
      setSlots(prevSlots => 
        prevSlots.map(s => s.id === slot.id ? { ...s, is_blocked: !s.is_blocked } : s)
      );
    } catch (err: any) {
      setError(err.message || 'Failed to toggle slot');
      // Revert optimistic update on failure
      loadData(); 
    } finally {
      setTogglingSlots(prev => {
        const newSet = new Set(prev);
        newSet.delete(slot.id);
        return newSet;
      });
    }
  };

  const handleViewBookings = async (slot: Slot) => {
    setSelectedSlot(slot);
    setShowSlotModal(true);
    setModalLoading(true);
    try {
      const bookings = await bookingService.getSlotBookings(slot.id);
      setModalBookings(bookings);
    } catch (err: any) {
      setError('Failed to load booking details.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  // Rendering Logic
  const renderSlot = (date: Date, time: string) => {
    const dateStr = formatDate(date);
    const slot = slots.find(s => s.date === dateStr && s.time_slot === time);

    if (!slot) return <div className="booking-slot">-</div>;

    const slotIsPast = isPast(date);
    const bookingCount = bookingCounts.get(slot.id) || 0;
    
    let statusClass = 'open';
    if (slotIsPast) statusClass = 'past';
    else if (slot.is_blocked) statusClass = 'blocked';
    else if (bookingCount >= slot.capacity) statusClass = 'full';
    else if (bookingCount >= Math.floor(slot.capacity * 0.7)) statusClass = 'filling-fast';

    return (
      <div 
        className={`booking-slot ${statusClass}`}
        onClick={() => handleViewBookings(slot)}
        style={{ cursor: 'pointer' }}
      >
        <div className="capacity">{bookingCount} / {slot.capacity}</div>
        {!slotIsPast ? (
          <button 
            className={`btn ${slot.is_blocked ? 'btn-primary' : 'btn-danger'}`}
            style={{ padding: '2px 8px', fontSize: '0.7rem', marginTop: '4px' }}
            onClick={(e) => { e.stopPropagation(); handleToggleSlot(slot); }}
            disabled={togglingSlots.has(slot.id)}
          >
            {togglingSlots.has(slot.id) ? '...' : slot.is_blocked ? 'Open' : 'Block'}
          </button>
        ) : (
          <div style={{ fontSize: '0.8rem', marginTop: '4px', fontWeight: 'bold' }}>COMPLETED</div>
        )}
      </div>
    );
  };

  return (
    <div className="booking-background">
      <div className="container">
        <div className="page-header" style={{ paddingBottom: '20px' }}>
          <h1>Admin Dashboard</h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={() => setActiveTab('slots')} className={`btn ${activeTab === 'slots' ? 'btn-primary' : 'btn-secondary'}`}>Slot Management</button>
            <button onClick={() => setActiveTab('feedback')} className={`btn ${activeTab === 'feedback' ? 'btn-primary' : 'btn-secondary'}`}>Feedback</button>
            <button onClick={handleLogout} className="btn btn-danger">Logout</button>
          </div>
        </div>

        {error && <div className="error-message" style={{textAlign: 'center'}}>{error}</div>}
        {loading && <div style={{ textAlign: 'center', color: 'white', fontSize: '1.2rem', padding: '2rem' }}>Loading Dashboard...</div>}

        {activeTab === 'slots' && !loading && (
          <>
            <div className="week-navigation" style={{ margin: '20px 0', textAlign: 'center' }}>
              <button onClick={() => {
                const newDate = new Date(currentWeekStart);
                newDate.setDate(newDate.getDate() - 7);
                setCurrentWeekStart(newDate);
              }} className="btn btn-primary">&larr; Previous Week</button>
              <span style={{ color: 'white', margin: '0 20px', fontSize: '1.2rem' }}>
                {getWeekDates(currentWeekStart)[0].toLocaleDateString()} - {getWeekDates(currentWeekStart)[6].toLocaleDateString()}
              </span>
              <button onClick={() => {
                const newDate = new Date(currentWeekStart);
                newDate.setDate(newDate.getDate() + 7);
                setCurrentWeekStart(newDate);
              }} className="btn btn-primary">Next Week &rarr;</button>
            </div>
            <div className="calendar">
              <div className="calendar-header">Time</div>
              {getWeekDates(currentWeekStart).map((date, i) => <div key={i} className="calendar-header">{days[i]}<br/><span style={{fontSize:'0.8rem'}}>{date.getDate()}/{date.getMonth()+1}</span></div>)}
              {timeSlots.map(time => (
                <React.Fragment key={time}>
                  <div className="time-slot">{time}</div>
                  {getWeekDates(currentWeekStart).map((date, i) => <React.Fragment key={i}>{renderSlot(date, time)}</React.Fragment>)}
                </React.Fragment>
              ))}
            </div>
             <div className="legend">
                <div className="legend-item"><div className="legend-color" style={{backgroundColor: 'rgba(76, 175, 80, 0.9)'}}></div><span>Open</span></div>
                <div className="legend-item"><div className="legend-color filling-fast-color"></div><span>Filling Fast</span></div>
                <div className="legend-item"><div className="legend-color full-color"></div><span>Full</span></div>
                <div className="legend-item"><div className="legend-color" style={{backgroundColor: 'rgba(255, 0, 0, 0.9)'}}></div><span>Blocked</span></div>
                <div className="legend-item"><div className="legend-color" style={{backgroundColor: '#999'}}></div><span>Past</span></div>
            </div>
          </>
        )}

        {activeTab === 'feedback' && !loading && (
          <div className="feedback-management">{feedbacks.map(f => <div key={f.id} className="feedback-card">...</div>)}</div>
        )}

        {showSlotModal && selectedSlot && (
          <div className="modal show">
            <div className="modal-content" style={{maxWidth: '500px'}}>
              <h2>Bookings for {selectedSlot.time_slot}</h2>
              <p>{new Date(selectedSlot.date).toDateString()}</p>
              <hr style={{borderColor: 'rgba(255,255,255,0.2)', margin: '1rem 0'}} />
              {modalLoading ? <p>Loading bookings...</p> : 
                modalBookings.length > 0 ? (
                  <ul style={{listStyle: 'none', padding: 0, textAlign: 'left'}}>
                    {modalBookings.map(b => <li key={b.id} style={{padding:'0.5rem', borderBottom:'1px solid #444'}}><strong>{b.user?.name}</strong> ({b.user?.email})</li>)}
                  </ul>
                ) : <p>No bookings for this slot.</p>}
              <div className="modal-buttons">
                <button className="btn btn-secondary" onClick={() => setShowSlotModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { slotService } from '../services/slotService';
import { bookingService } from '../services/bookingService';
import { supabase, Slot, Booking as BookingType } from '../lib/supabase';

interface SelectedSlot {
  time: string;
  day: string;
  date: string;
}

interface SlotWithBookings extends Slot {
  bookingCount: number;
}

type SlotStatus = 'available' | 'filling-fast' | 'full' | 'blocked';

const Booking: React.FC = () => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [slots, setSlots] = useState<SlotWithBookings[]>([]);
  const [bookings, setBookings] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
  const navigate = useNavigate();
  const { user } = useAuth();

  const timeSlots: string[] = [
    '5:00 - 6:00 AM',
    '6:00 - 7:00 AM',
    '7:00 - 8:00 AM',
    '6:00 - 7:00 PM',
    '8:00 - 9:00 PM',
    '9:00 - 10:00 PM'
  ];

  const days: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Helper functions for date management
  const getWeekDates = (startDate: Date): Date[] => {
    const week: Date[] = [];
    const start = new Date(startDate);
    
    // Find Monday of the week
    const dayOfWeek = start.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    start.setDate(start.getDate() - daysToSubtract);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      week.push(date);
    }
    
    return week;
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getCurrentDate = (): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  // Load slots and bookings data
  useEffect(() => {
    loadSlotsData();
  }, [currentWeekStart]);

  const loadSlotsData = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      const weekDates = getWeekDates(currentWeekStart);
      const dateStrings = weekDates.map(formatDate);
      
      // Note: Don't initialize slots for regular users - only admins should create slots
      // Slots should be pre-created by admin through the admin dashboard
      
      // Get ALL slots (including blocked ones) so users can see the full schedule
      const slotsData = await slotService.getAllSlotsForWeekSafe(dateStrings);
      
      // Get booking counts for all slots in one query (much faster!)
      const slotIds = slotsData.map(slot => slot.id);
      const bookingCountsBySlotIdActual = slotIds.length > 0 
        ? await bookingService.getBookingCountsForSlots(slotIds)
        : {};
      
      // Create booking counts lookup by date-time for UI compatibility
      const bookingCounts: { [key: string]: number } = {};
      
      // Create slots with booking counts
      const slotsWithBookings: SlotWithBookings[] = slotsData.map(slot => {
        const bookingCount = bookingCountsBySlotIdActual[slot.id] || 0;
        const key = `${slot.date}-${slot.time_slot}`;
        bookingCounts[key] = bookingCount;
        
        return {
          ...slot,
          bookingCount
        };
      });
      
      setSlots(slotsWithBookings);
      setBookings(bookingCounts);
      
      // Log performance info in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Loaded ${slotsWithBookings.length} slots with booking counts`);
      }
      
    } catch (err: any) {
      console.error('Error loading slots:', err);
      setError(err.message || 'Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  const getSlotForDate = (date: Date, timeSlot: string): SlotWithBookings | null => {
    const dateStr = formatDate(date);
    return slots.find(slot => slot.date === dateStr && slot.time_slot === timeSlot) || null;
  };

  const getSlotStatus = (date: Date, timeSlot: string): SlotStatus => {
    const slot = getSlotForDate(date, timeSlot);
    if (!slot) return 'available'; // No slot data means it's available for booking
    
    // Check if slot is blocked first
    if (slot.is_blocked) return 'blocked';
    
    const count = slot.bookingCount;
    if (count >= slot.capacity) return 'full';
    if (count >= Math.floor(slot.capacity * 0.6)) return 'filling-fast';
    return 'available';
  };

  const getSlotCount = (date: Date, timeSlot: string): number => {
    const slot = getSlotForDate(date, timeSlot);
    return slot?.bookingCount || 0;
  };

  const getSlotCapacity = (date: Date, timeSlot: string): number => {
    const slot = getSlotForDate(date, timeSlot);
    return slot?.capacity || 30;
  };

  const handleSlotClick = (date: Date, timeSlot: string) => {
    if (!user) {
      setError('Please login to book a slot');
      return;
    }

    const status = getSlotStatus(date, timeSlot);
    if (status === 'full' || status === 'blocked') return;

    const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
    setSelectedSlot({ 
      time: timeSlot, 
      day: `${dayName} (${date.getDate()}/${date.getMonth() + 1})`,
      date: formatDate(date)
    });
    setShowModal(true);
  };

  const confirmBooking = async () => {
    if (!selectedSlot || !user) return;

    try {
      setLoading(true);
      setError('');
      
      // Ensure user is authenticated with Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please login again to book slots');
      }
      
      console.log('Creating booking for user:', session.user.id);
      console.log('Slot:', selectedSlot.date, selectedSlot.time);
      
      await bookingService.createBooking(session.user.id, selectedSlot.date, selectedSlot.time);
      
      // Refresh slots data
      await loadSlotsData();
      
      setShowModal(false);
      setSelectedSlot(null);
      setError('');
      
      // Show success message
      alert('Booking confirmed successfully!');
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSlot(null);
  };

  if (!user) {
    return (
      <div className="booking-background">
        <div className="container">
          <div className="page-header">
            <button className="back-button" onClick={() => navigate('/home')}>
              ← Back to Home
            </button>
            <h1>Please Login</h1>
            <p>You need to be logged in to book gym slots.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-background">
      <div className="container">
        <div className="page-header">
          <div className="date-display">
            <span>{getCurrentDate()}</span>
          </div>
          <button className="back-button" onClick={() => navigate('/home')}>
            ← Back to Home
          </button>
          <h1>IIITDM Gym Slot Booking</h1>
          <p>Select your preferred time slot (Maximum capacity: 30 members per slot)</p>
          
          {/* Week Navigation */}
          <div className="week-navigation" style={{ margin: '20px 0', textAlign: 'center' }}>
            <button 
              onClick={() => {
                const newDate = new Date(currentWeekStart);
                newDate.setDate(newDate.getDate() - 7);
                setCurrentWeekStart(newDate);
              }}
              style={{ 
                background: '#4CAF50', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '5px',
                marginRight: '10px',
                cursor: 'pointer'
              }}
            >
              ← Previous Week
            </button>
            <span style={{ color: 'white', margin: '0 20px' }}>
              Week of {getWeekDates(currentWeekStart)[0].toLocaleDateString()}
            </span>
            <button 
              onClick={() => {
                const newDate = new Date(currentWeekStart);
                newDate.setDate(newDate.getDate() + 7);
                setCurrentWeekStart(newDate);
              }}
              style={{ 
                background: '#4CAF50', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '5px',
                marginLeft: '10px',
                cursor: 'pointer'
              }}
            >
              Next Week →
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

        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            color: 'white', 
            padding: '50px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            margin: '20px 0'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading slots...</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>
              Fetching available time slots for this week
            </div>
          </div>
        ) : slots.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: 'white', 
            padding: '50px',
            background: 'rgba(255, 193, 7, 0.1)',
            borderRadius: '10px',
            margin: '20px 0'
          }}>
            <h3>No slots available</h3>
            <p>There are currently no available slots for this week.</p>
            <p>This could be because:</p>
            <ul style={{ textAlign: 'left', display: 'inline-block' }}>
              <li>All slots are blocked by the administrator</li>
              <li>No slots have been created for this time period</li>
              <li>There's a database configuration issue</li>
            </ul>
            <p>Please contact the gym administrator for assistance.</p>
          </div>
        ) : (
          <div className="calendar">
            <div className="calendar-header">Time</div>
            {getWeekDates(currentWeekStart).map((date, index) => {
              const dayName = days[index];
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
                {getWeekDates(currentWeekStart).map((date, index) => {
                  const status = getSlotStatus(date, time);
                  const count = getSlotCount(date, time);
                  const capacity = getSlotCapacity(date, time);
                  
                  return (
                    <div
                      key={`${time}-${index}`}
                      className={`booking-slot ${status}`}
                      onClick={() => handleSlotClick(date, time)}
                      style={{ 
                        cursor: (status === 'full' || status === 'blocked') ? 'not-allowed' : 'pointer' 
                      }}
                    >
                      {status === 'full' ? 'Full' : 
                       status === 'blocked' ? 'Blocked' : 'Book'}
                      <div className="capacity">
                        {status === 'blocked' ? 'N/A' : `${count}/${capacity}`}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="legend">
          <div className="legend-item">
            <div className="legend-color available-color"></div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-color filling-fast-color"></div>
            <span>Filling Fast</span>
          </div>
          <div className="legend-item">
            <div className="legend-color full-color"></div>
            <span>Full</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#666' }}></div>
            <span>Blocked</span>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal show">
          <div className="modal-content">
            <h2>Confirm Booking</h2>
            <p>Would you like to book this slot?</p>
            <p><strong>{selectedSlot?.time} - {selectedSlot?.day}</strong></p>
            <div className="modal-buttons">
              <button className="btn btn-primary" onClick={confirmBooking}>
                Confirm
              </button>
              <button className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;
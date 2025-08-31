import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { slotService } from '../services/slotService';
import { bookingService } from '../services/bookingService';
import { supabase, Slot, Booking as BookingType } from '../lib/supabase';

// Helper functions for date management - moved to top
const getStartOfDay = (date: Date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const getStartOfCurrentWeek = (currentDate: Date) => {
  const today = getStartOfDay(currentDate);
  const dayOfWeek = today.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Make Monday = 0
  const startOfCurrentWeek = new Date(today);
  startOfCurrentWeek.setDate(today.getDate() - daysToSubtract);
  return startOfCurrentWeek;
};

interface SelectedSlot {
  time: string;
  day: string;
  date: string;
}

interface SlotWithBookings extends Slot {
  bookingCount: number;
}

type SlotStatus = 'available' | 'filling-fast' | 'full' | 'blocked' | 'past';

const Booking: React.FC = () => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [slots, setSlots] = useState<SlotWithBookings[]>([]);
  const [bookings, setBookings] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  // Initialize currentWeekStart using the helper function
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfCurrentWeek(new Date()));
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

  // Helper functions for date management - now defined after state for useCallback usage
  const getWeekDates = useCallback((startDate: Date): Date[] => {
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
  }, []);

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

  const isPast = (date: Date): boolean => {
    return getStartOfDay(date) < getStartOfDay(new Date());
  };

  // Load slots and bookings data
  useEffect(() => {
    loadSlotsData();
  }, [currentWeekStart]);

  const loadSlotsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      const weekDates = getWeekDates(currentWeekStart);
      // Calculate next week's dates
      const nextWeekStart = new Date(currentWeekStart);
      nextWeekStart.setDate(currentWeekStart.getDate() + 7);
      const nextWeekDates = getWeekDates(nextWeekStart);

      const allDates = [...weekDates, ...nextWeekDates]; // Combine current and next week dates
      const dateStrings = allDates.map(formatDate);
      
      const slotsData = await slotService.getAllSlotsForWeekSafe(dateStrings);
      
      const slotIds = slotsData.map(slot => slot.id);
      const bookingCountsBySlotIdActual = slotIds.length > 0 
        ? await bookingService.getBookingCountsForSlots(slotIds)
        : {};
      
      const bookingCounts: { [key: string]: number } = {};
      slotsData.forEach(slot => {
        const bookingCount = bookingCountsBySlotIdActual[slot.id] || 0;
        const key = `${slot.date}-${slot.time_slot}`;
        bookingCounts[key] = bookingCount;
      });
      
      // Transform slotsData into SlotWithBookings[]
      const slotsWithBookingCounts: SlotWithBookings[] = slotsData.map(slot => ({
        ...slot,
        bookingCount: bookingCountsBySlotIdActual[slot.id] || 0
      }));

      setSlots(slotsWithBookingCounts);
      setBookings(bookingCounts);
      
    } catch (err: any) {
      console.error('Error loading slots:', err);
      setError(err.message || 'Failed to load slots');
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart, getWeekDates]);

  const getSlotForDate = (date: Date, timeSlot: string): SlotWithBookings | null => {
    const dateStr = formatDate(date);
    return slots.find(slot => slot.date === dateStr && slot.time_slot === timeSlot) || null;
  };

  const getSlotStatus = (date: Date, timeSlot: string): SlotStatus => {
    if (isPast(date)) return 'past'; // Check for past dates first

    const slot = getSlotForDate(date, timeSlot);
    if (!slot) return 'available'; 
    
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

    if (isPast(date)) {
      alert('You cannot book slots for past dates.');
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
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please login again to book slots');
      }
      
      await bookingService.createBooking(session.user.id, selectedSlot.date, selectedSlot.time);
      
      await loadSlotsData();
      
      setShowModal(false);
      setSelectedSlot(null);
      alert('Booking confirmed successfully!');
    } catch (err: any) {
      if (err.message.includes('one slot per day')) {
        alert(err.message);
        setShowModal(false);
      } else {
        setError(err.message || 'Failed to create booking');
      }
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
              &larr; Back to Home
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
            &larr; Back to Home
          </button>
          <h1>IIITDM Gym Slot Booking</h1>
          <p>Select your preferred time slot (Maximum capacity: 30 members per slot)</p>
          
          {/* Week Navigation */}
          <div className="week-navigation" style={{ margin: '20px 0', textAlign: 'center' }}>
            {getStartOfDay(currentWeekStart).getTime() !== getStartOfCurrentWeek(new Date()).getTime() && (
              <button 
                onClick={() => {
                  setCurrentWeekStart(getStartOfCurrentWeek(new Date()));
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
                &larr; Current Week
              </button>
            )}
            <span style={{ color: 'white', margin: '0 20px' }}>
              Week: {getWeekDates(currentWeekStart)[0].toLocaleDateString()} - {getWeekDates(currentWeekStart)[6].toLocaleDateString()}
            </span>
            {getStartOfDay(currentWeekStart).getTime() === getStartOfCurrentWeek(new Date()).getTime() && (
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
                Next Week &rarr;
              </button>
            )}
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
                        cursor: (status === 'full' || status === 'blocked' || status === 'past') ? 'not-allowed' : 'pointer' 
                      }}
                    >
                      {status === 'full' ? 'Full' : 
                       status === 'blocked' ? 'Blocked' : 
                       status === 'past' ? 'Completed' : 'Book'}
                      <div className="capacity">
                        {status === 'blocked' || status === 'past' ? 'N/A' : `${count}/${capacity}`}
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
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'rgba(220, 220, 220, 0.9)' }}></div>
            <span>Completed</span>
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

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { slotService } from '../services/slotService';
import { bookingService } from '../services/bookingService';
import { Slot, Booking } from '../lib/supabase';

// Helper function to get the start of the day
const getStartOfDay = (date: Date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const BookedStudentsList: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookingsMap, setBookingsMap] = useState<Map<string, Booking[]>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<Date>(getStartOfDay(new Date()));
  const navigate = useNavigate();

  const timeSlots = [
    '5:00 - 6:00 AM', '6:00 - 7:00 AM', '7:00 - 8:00 AM',
    '6:00 - 7:00 PM', '8:00 - 9:00 PM', '9:00 - 10:00 PM'
  ];
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const formatDate = (date: Date): string => date.toISOString().split('T')[0];

  const loadBookingsData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const dateString = formatDate(currentDate);
      
      // Fetch all slots for the current day
      const slotsData = await slotService.getSlotsForWeek([dateString]);
      const slotIds = slotsData.map(s => s.id);

      // Fetch all bookings for these slots in one go
      const allBookings = await bookingService.getBookingsForSlotIds(slotIds);

      const newBookingsMap = new Map<string, Booking[]>();
      slotsData.forEach(slot => {
        newBookingsMap.set(slot.id, allBookings.filter(b => b.slot_id === slot.id));
      });
      
      setSlots(slotsData);
      setBookingsMap(newBookingsMap);

    } catch (err: any) {
      setError(err.message || 'Failed to load booking data');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadBookingsData();
  }, [loadBookingsData]);

  const handleDateChange = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + offset);
    setCurrentDate(getStartOfDay(newDate));
  };

  return (
    <div className="bookings-background">
      <div className="container">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate('/admin/dashboard')}>
            &larr; Back to Admin Dashboard
          </button>
          <button className="btn btn-info" onClick={() => window.print()} style={{ marginLeft: '10px' }}>
            Print List
          </button>
          <h1>Booked Students List</h1>
          <p>View students booked for each slot, day-wise.</p>
        </div>

        {error && <div className="error-message" style={{textAlign: 'center'}}>{error}</div>}
        {loading && <div style={{ textAlign: 'center', color: 'white', fontSize: '1.2rem', padding: '2rem' }}>Loading bookings...</div>}

        {!loading && (
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <button className="btn btn-secondary" onClick={() => handleDateChange(-1)}>&larr; Previous Day</button>
            <span style={{ color: 'white', margin: '0 20px', fontSize: '1.2rem' }}>
              {daysOfWeek[currentDate.getDay()]}, {currentDate.toLocaleDateString()}
            </span>
            <button className="btn btn-secondary" onClick={() => handleDateChange(1)}>Next Day &rarr;</button>
          </div>
        )}

        {!loading && slots.length === 0 && (
          <div style={{ textAlign: 'center', color: 'white', padding: '50px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
            <h3>No slots found for this day.</h3>
            <p>Please ensure slots are initialized for this date in the Admin Dashboard.</p>
          </div>
        )}

        {!loading && slots.length > 0 && (
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Time Slot</th>
                <th>Student Name</th>
                <th>Student Email</th>
                <th>Booked On</th>
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(timeSlot => {
                const slot = slots.find(s => s.time_slot === timeSlot);
                const bookings: Booking[] = slot ? (bookingsMap.get(slot.id) || []) : [];

                if (!slot || bookings.length === 0) {
                  return (
                    <tr key={timeSlot}>
                      <td>{timeSlot}</td>
                      <td colSpan={3}>No students booked for this slot.</td>
                    </tr>
                  );
                }

                return bookings.map((booking, index) => (
                  <tr key={booking.id}>
                    {index === 0 && <td rowSpan={bookings.length}>{timeSlot}</td>}
                    <td>{booking.user?.name || 'Unknown User'}</td>
                    <td>{booking.user?.email || 'No Email'}</td>
                    <td>{new Date(booking.created_at).toLocaleDateString()}</td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BookedStudentsList;

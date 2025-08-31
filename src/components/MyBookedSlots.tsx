
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingService } from '../services/bookingService';
import { Booking } from '../lib/supabase';

const MyBookedSlots: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookedSlots, setBookedSlots] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const bookings = await bookingService.getUserBookings(user.id);
      setBookedSlots(bookings);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookings.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancelClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!selectedBooking || !user) return;
    try {
      await bookingService.cancelBooking(selectedBooking.id, user.id);
      setShowCancelModal(false);
      setSelectedBooking(null);
      // Refresh the bookings list
      fetchBookings();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking.');
    }
  };

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const isUpcoming = (dateString: string): boolean => {
    return getStartOfDay(new Date(dateString)) >= getStartOfDay(new Date());
  };

  const getStartOfDay = (date: Date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };

  const upcomingSlots = bookedSlots.filter(b => b.slot && isUpcoming(b.slot.date));
  const pastSlots = bookedSlots.filter(b => b.slot && !isUpcoming(b.slot.date));

  if (loading) {
    return <div className="booking-background" style={{textAlign: 'center', padding: '50px'}}>Loading your bookings...</div>;
  }

  if (error) {
    return <div className="booking-background" style={{textAlign: 'center', padding: '50px', color: 'red'}}>{error}</div>;
  }

  return (
    <div className="bookings-background">
      <div className="container">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate('/home')}>
            &larr; Back to Home
          </button>
          <h1>My Booked Slots</h1>
          <p>Manage your gym session bookings</p>
        </div>

        <div className="bookings-summary">
          <div className="summary-card"><div className="summary-number">{upcomingSlots.length}</div><div className="summary-label">Upcoming</div></div>
          <div className="summary-card"><div className="summary-number">{pastSlots.length}</div><div className="summary-label">Completed</div></div>
        </div>

        {bookedSlots.length === 0 ? (
          <div className="empty-state">
            <h3>No bookings found</h3>
            <button className="btn btn-primary" onClick={() => navigate('/booking')}>Book a Slot</button>
          </div>
        ) : (
          <>
            {upcomingSlots.length > 0 && (
              <div className="slots-section">
                <h2>Upcoming Sessions</h2>
                <div className="slots-grid">
                  {upcomingSlots.map(booking => (
                    <div key={booking.id} className="slot-card upcoming">
                      <div className="slot-header">
                        <div className="slot-date">{booking.slot ? formatDate(booking.slot.date) : ''}</div>
                        <div className="slot-status">{booking.status}</div>
                      </div>
                      <div className="slot-time">{booking.slot?.time_slot}</div>
                      <div className="slot-actions">
                        <button className="btn btn-danger" onClick={() => handleCancelClick(booking)}>Cancel Booking</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {pastSlots.length > 0 && (
              <div className="slots-section">
                <h2>Past Sessions</h2>
                <div className="slots-grid">
                  {pastSlots.map(booking => (
                    <div key={booking.id} className="slot-card past">
                      <div className="slot-header">
                        <div className="slot-date">{booking.slot ? formatDate(booking.slot.date) : ''}</div>
                        <div className="slot-status completed">Completed</div>
                      </div>
                      <div className="slot-time">{booking.slot?.time_slot}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showCancelModal && selectedBooking && (
        <div className="modal show">
          <div className="modal-content">
            <h2>Cancel Booking</h2>
            <p>Are you sure you want to cancel this booking?</p>
            <div className="cancel-details">
              <strong>{selectedBooking.slot?.time_slot} - {selectedBooking.slot ? formatDate(selectedBooking.slot.date) : ''}</strong>
            </div>
            <div className="modal-buttons">
              <button className="btn btn-danger" onClick={confirmCancel}>Yes, Cancel</button>
              <button className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>Keep Booking</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookedSlots;

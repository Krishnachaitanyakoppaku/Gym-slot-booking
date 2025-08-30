import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface BookedSlot {
  id: number;
  date: string;
  time: string;
  day: string;
  status: string;
  bookedAt: string;
}

const MyBookedSlots: React.FC = () => {
  const navigate = useNavigate();
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<BookedSlot | null>(null);

  useEffect(() => {
    // Mock data for booked slots
    const mockBookedSlots: BookedSlot[] = [
      {
        id: 1,
        date: '2024-01-15',
        time: '6:00 - 7:00 AM',
        day: 'Monday',
        status: 'confirmed',
        bookedAt: '2024-01-10T10:30:00Z'
      },
      {
        id: 2,
        date: '2024-01-17',
        time: '8:00 - 9:00 PM',
        day: 'Wednesday',
        status: 'confirmed',
        bookedAt: '2024-01-12T14:20:00Z'
      },
      {
        id: 3,
        date: '2024-01-20',
        time: '7:00 - 8:00 AM',
        day: 'Saturday',
        status: 'confirmed',
        bookedAt: '2024-01-13T09:15:00Z'
      }
    ];
    setBookedSlots(mockBookedSlots);
  }, []);

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatBookedTime = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const isUpcoming = (dateString: string): boolean => {
    return new Date(dateString) > new Date();
  };

  const handleCancelSlot = (slot: BookedSlot) => {
    setSelectedSlot(slot);
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    if (selectedSlot) {
      setBookedSlots(prev => prev.filter(slot => slot.id !== selectedSlot.id));
      setShowCancelModal(false);
      setSelectedSlot(null);
    }
  };

  const closeModal = () => {
    setShowCancelModal(false);
    setSelectedSlot(null);
  };

  const upcomingSlots = bookedSlots.filter(slot => isUpcoming(slot.date));
  const pastSlots = bookedSlots.filter(slot => !isUpcoming(slot.date));

  return (
    <div className="bookings-background">
      <div className="container">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate('/home')}>
            ← Back to Home
          </button>
          <h1>My Booked Slots</h1>
          <p>Manage your gym session bookings</p>
        </div>

        <div className="bookings-summary">
          <div className="summary-card">
            <div className="summary-number">{upcomingSlots.length}</div>
            <div className="summary-label">Upcoming Sessions</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{pastSlots.length}</div>
            <div className="summary-label">Completed Sessions</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{bookedSlots.length}</div>
            <div className="summary-label">Total Bookings</div>
          </div>
        </div>

        {upcomingSlots.length > 0 && (
          <div className="slots-section">
            <h2>Upcoming Sessions</h2>
            <div className="slots-grid">
              {upcomingSlots.map(slot => (
                <div key={slot.id} className="slot-card upcoming">
                  <div className="slot-header">
                    <div className="slot-date">{formatDate(slot.date)}</div>
                    <div className="slot-status">{slot.status}</div>
                  </div>
                  <div className="slot-time">{slot.time}</div>
                  <div className="slot-info">
                    <div className="booked-time">
                      Booked on: {formatBookedTime(slot.bookedAt)}
                    </div>
                  </div>
                  <div className="slot-actions">
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleCancelSlot(slot)}
                    >
                      Cancel Booking
                    </button>
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
              {pastSlots.map(slot => (
                <div key={slot.id} className="slot-card past">
                  <div className="slot-header">
                    <div className="slot-date">{formatDate(slot.date)}</div>
                    <div className="slot-status completed">Completed</div>
                  </div>
                  <div className="slot-time">{slot.time}</div>
                  <div className="slot-info">
                    <div className="booked-time">
                      Booked on: {formatBookedTime(slot.bookedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {bookedSlots.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No bookings found</h3>
            <p>You haven't booked any gym slots yet.</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/booking')}
            >
              Book Your First Slot
            </button>
          </div>
        )}
      </div>

      {showCancelModal && (
        <div className="modal show">
          <div className="modal-content">
            <h2>Cancel Booking</h2>
            <p>Are you sure you want to cancel this booking?</p>
            <div className="cancel-details">
              <strong>{selectedSlot?.time} - {selectedSlot?.date ? formatDate(selectedSlot.date) : ''}</strong>
            </div>
            <div className="modal-buttons">
              <button className="btn btn-danger" onClick={confirmCancel}>
                Yes, Cancel
              </button>
              <button className="btn btn-secondary" onClick={closeModal}>
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookedSlots;
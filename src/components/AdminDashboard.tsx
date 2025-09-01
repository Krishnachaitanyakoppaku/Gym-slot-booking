import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { slotService } from '../services/slotService';
import { bookingService } from '../services/bookingService';
import { feedbackService } from '../services/feedbackService';
import { announcementService } from '../services/announcementService';
import { Slot, Booking, Feedback as FeedbackType, Announcement } from '../lib/supabase';

// Helper function to get the start of the day
const getStartOfDay = (date: Date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

// Optimized Admin Dashboard Component
const AdminDashboard: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'slots' | 'feedback' | 'announcements'>('slots');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookingCounts, setBookingCounts] = useState<Map<string, number>>(new Map());
  const [feedbacks, setFeedbacks] = useState<FeedbackType[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
  const [newAnnouncementExpiresAt, setNewAnnouncementExpiresAt] = useState<string>('');
  const [newAnnouncementIsActive, setNewAnnouncementIsActive] = useState(true);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
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
      
      const [slotsData, feedbackData, announcementsData] = await Promise.all([
        slotService.getSlotsForWeek(dateStrings), 
        feedbackService.getAllFeedback(),
        announcementService.getAllAnnouncements()
      ]);

      const slotIds = slotsData.map(s => s.id);
      const counts = await bookingService.getBookingCountsForSlots(slotIds);
      
      setSlots(slotsData);
      setBookingCounts(new Map(Object.entries(counts)));
      setFeedbacks(feedbackData);
      setAnnouncements(announcementsData);

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

  const handleResolveFeedback = async (feedbackId: string) => {
    try {
      await feedbackService.updateFeedbackStatus(feedbackId, 'resolved');
      // Refresh feedback list after updating status
      loadData(); 
    } catch (err: any) {
      setError(err.message || 'Failed to update feedback status');
    }
  };

  const handleCreateUpdateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAnnouncement) {
        await announcementService.updateAnnouncement(
          editingAnnouncement.id,
          newAnnouncementTitle,
          newAnnouncementContent,
          newAnnouncementExpiresAt || null,
          newAnnouncementIsActive
        );
      } else {
        await announcementService.createAnnouncement(
          newAnnouncementTitle,
          newAnnouncementContent,
          newAnnouncementExpiresAt || null
        );
      }
      alert('Announcement saved successfully!');
      setNewAnnouncementTitle('');
      setNewAnnouncementContent('');
      setNewAnnouncementExpiresAt('');
      setNewAnnouncementIsActive(true);
      setEditingAnnouncement(null);
      loadData(); // Refresh announcements
    } catch (err: any) {
      setError(err.message || 'Failed to save announcement');
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setNewAnnouncementTitle(announcement.title);
    setNewAnnouncementContent(announcement.content);
    setNewAnnouncementExpiresAt(announcement.expires_at ? new Date(announcement.expires_at).toISOString().split('T')[0] : '');
    setNewAnnouncementIsActive(announcement.is_active);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await announcementService.deleteAnnouncement(id);
        alert('Announcement deleted successfully!');
        loadData(); // Refresh announcements
      } catch (err: any) {
        setError(err.message || 'Failed to delete announcement');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingAnnouncement(null);
    setNewAnnouncementTitle('');
    setNewAnnouncementContent('');
    setNewAnnouncementExpiresAt('');
    setNewAnnouncementIsActive(true);
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
            <button onClick={() => setActiveTab('announcements')} className={`btn ${activeTab === 'announcements' ? 'btn-primary' : 'btn-secondary'}`}>Announcements</button>
            <button onClick={() => navigate('/admin/booked-students')} className="btn btn-info">View All Bookings</button>
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
          <div className="feedback-management">
            {feedbacks.length > 0 ? (
              feedbacks.map(f => (
                <div key={f.id} className="feedback-card">
                  <div className="feedback-header">
                    <div className="feedback-info">
                      <h3>{f.subject}</h3>
                      <p>From: {f.name} ({f.user?.email || f.email})</p>
                    </div>
                    <div className="feedback-meta">
                      <span className="feedback-rating">Rating: {f.rating} ⭐</span>
                      <span className="feedback-date">Submitted: {new Date(f.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="feedback-message">{f.message}</p>
                  {f.status !== 'resolved' && (
                    <div className="feedback-actions" style={{ marginTop: '15px', textAlign: 'right' }}>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleResolveFeedback(f.id)}
                        style={{ padding: '8px 15px', fontSize: '0.9rem' }}
                      >
                        Mark as Resolved
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: 'white', padding: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                <h3>No feedback received yet.</h3>
              </div>
            )}
          </div>
        )}

        {activeTab === 'announcements' && !loading && (
          <div className="announcements-management">
            <h2>Announcements Management</h2>
            <div className="announcement-form-section">
              <h3>{editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}</h3>
              <form onSubmit={handleCreateUpdateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px' }}>
                <div className="form-group">
                  <label htmlFor="announcementTitle">Title</label>
                  <input
                    type="text"
                    id="announcementTitle"
                    value={newAnnouncementTitle}
                    onChange={(e) => setNewAnnouncementTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="announcementContent">Content</label>
                  <textarea
                    id="announcementContent"
                    value={newAnnouncementContent}
                    onChange={(e) => setNewAnnouncementContent(e.target.value)}
                    required
                    rows={4}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label htmlFor="announcementExpiresAt">Expires At (Optional)</label>
                  <input
                    type="date"
                    id="announcementExpiresAt"
                    value={newAnnouncementExpiresAt}
                    onChange={(e) => setNewAnnouncementExpiresAt(e.target.value)}
                  />
                </div>
                {editingAnnouncement && (
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      id="announcementIsActive"
                      checked={newAnnouncementIsActive}
                      onChange={(e) => setNewAnnouncementIsActive(e.target.checked)}
                    />
                    <label htmlFor="announcementIsActive">Is Active</label>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary">
                    {editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
                  </button>
                  {editingAnnouncement && (
                    <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="announcements-list-section" style={{ marginTop: '30px' }}>
              <h3>Existing Announcements</h3>
              {announcements.length > 0 ? (
                <table className="bookings-table"> {/* Reusing bookings-table styles */}
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Content</th>
                      <th>Created At</th>
                      <th>Expires At</th>
                      <th>Active</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {announcements.map(announcement => (
                      <tr key={announcement.id}>
                        <td>{announcement.title}</td>
                        <td>{announcement.content.substring(0, 100)}{announcement.content.length > 100 ? '...' : ''}</td>
                        <td>{new Date(announcement.created_at).toLocaleDateString()}</td>
                        <td>{announcement.expires_at ? new Date(announcement.expires_at).toLocaleDateString() : 'N/A'}</td>
                        <td>{announcement.is_active ? 'Yes' : 'No'}</td>
                        <td>
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => handleEditAnnouncement(announcement)}
                            style={{ marginRight: '5px', padding: '5px 10px', fontSize: '0.8rem' }}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-danger" 
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', color: 'white', padding: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                  <p>No announcements created yet.</p>
                </div>
              )}
            </div>
          </div>
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
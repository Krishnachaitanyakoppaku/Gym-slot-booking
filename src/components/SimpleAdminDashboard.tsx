import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Slot {
  id: string;
  date: string;
  time_slot: string;
  capacity: number;
  is_blocked: boolean;
  created_at: string;
}

const SimpleAdminDashboard: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authStatus, setAuthStatus] = useState('');
  const [togglingSlots, setTogglingSlots] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    initializeAdmin();
  }, []);

  const initializeAdmin = async () => {
    try {
      setLoading(true);
      setError('');
      setAuthStatus('Initializing...');

      // Check admin token
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        navigate('/');
        return;
      }

      // Authenticate with Supabase
      setAuthStatus('Authenticating...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@iiitdm.ac.in',
        password: 'admin123'
      });

      if (authError) {
        setError(`Authentication failed: ${authError.message}`);
        return;
      }
      setAuthStatus(`Authenticated as: ${authData.user.email}`);

      // Load slots
      await loadSlots();

    } catch (err: any) {
      setError(`Initialization error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    try {
      setAuthStatus(prev => prev + ' | Loading slots...');
      
      // Get current week dates
      const today = new Date();
      const currentWeekStart = new Date(today);
      currentWeekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
      
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        weekDates.push(date.toISOString().split('T')[0]);
      }

      // Load slots for current week
      const { data: slotsData, error: slotsError } = await supabase
        .from('slots')
        .select('*')
        .in('date', weekDates)
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true });

      if (slotsError) {
        setError(`Failed to load slots: ${slotsError.message}`);
        return;
      }

      setSlots(slotsData || []);
      setAuthStatus(prev => prev + ` | Loaded ${slotsData?.length || 0} slots`);

    } catch (err: any) {
      setError(`Load error: ${err.message}`);
    }
  };

  const toggleSlot = async (slotId: string, currentBlocked: boolean) => {
    try {
      // Prevent multiple toggles
      if (togglingSlots.has(slotId)) {
        return;
      }
      
      setTogglingSlots(prev => new Set(prev).add(slotId));
      setError('');

      console.log('Toggling slot:', { slotId, currentBlocked });

      // Optimistic update
      setSlots(prevSlots => 
        prevSlots.map(slot => {
          if (slot.id === slotId) {
            return { ...slot, is_blocked: !currentBlocked };
          }
          return slot;
        })
      );

      // Try direct database update
      const { data: directResult, error: directError } = await supabase
        .from('slots')
        .update({ is_blocked: !currentBlocked })
        .eq('id', slotId)
        .select()
        .single();

      if (directError) {
        console.log('Direct update failed:', directError.message);
        
        // Try admin function as fallback
        const slot = slots.find(s => s.id === slotId);
        if (slot) {
          const { data: functionResult, error: functionError } = await supabase
            .rpc('admin_toggle_slot', {
              slot_date: slot.date,
              slot_time_slot: slot.time_slot
            });

          if (functionError) {
            throw new Error(`Both methods failed: ${directError.message} | ${functionError.message}`);
          }
          
          console.log('Admin function worked:', functionResult);
          
          // Update with function result
          if (functionResult && functionResult.length > 0) {
            setSlots(prevSlots => 
              prevSlots.map(s => {
                if (s.id === slotId) {
                  return { ...s, is_blocked: functionResult[0].is_blocked };
                }
                return s;
              })
            );
          }
        }
      } else {
        console.log('Direct update worked:', directResult);
        
        // Update with direct result
        setSlots(prevSlots => 
          prevSlots.map(s => {
            if (s.id === slotId) {
              return { ...s, is_blocked: directResult.is_blocked };
            }
            return s;
          })
        );
      }

      console.log('Slot toggle successful!');

    } catch (err: any) {
      console.error('Toggle error:', err);
      setError(`Toggle failed: ${err.message}`);
      
      // Revert optimistic update
      setSlots(prevSlots => 
        prevSlots.map(slot => {
          if (slot.id === slotId) {
            return { ...slot, is_blocked: currentBlocked };
          }
          return slot;
        })
      );
    } finally {
      setTogglingSlots(prev => {
        const newSet = new Set(prev);
        newSet.delete(slotId);
        return newSet;
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '15px',
        padding: '30px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px',
          borderBottom: '2px solid #eee',
          paddingBottom: '20px'
        }}>
          <h1 style={{ margin: 0, color: '#333' }}>Simple Admin Dashboard</h1>
          <button 
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>

        {/* Status */}
        <div style={{ 
          background: '#e3f2fd', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #2196f3'
        }}>
          <strong>Status:</strong> {authStatus}
        </div>

        {/* Error */}
        {error && (
          <div style={{ 
            background: '#f44336', 
            color: 'white', 
            padding: '15px', 
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            fontSize: '18px',
            color: '#666'
          }}>
            Loading...
          </div>
        )}

        {/* Controls */}
        <div style={{ marginBottom: '30px' }}>
          <button 
            onClick={loadSlots}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              marginRight: '10px'
            }}
          >
            Refresh Slots
          </button>
          <span style={{ color: '#666' }}>
            Showing current week slots ({slots.length} total)
          </span>
        </div>

        {/* Slots Grid */}
        <div style={{ display: 'grid', gap: '15px' }}>
          {slots.map(slot => (
            <div 
              key={slot.id}
              style={{
                padding: '20px',
                border: '3px solid',
                borderColor: slot.is_blocked ? '#f44336' : '#4CAF50',
                borderRadius: '12px',
                background: slot.is_blocked ? '#ffebee' : '#e8f5e8',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.3s ease'
              }}
            >
              <div>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  marginBottom: '5px'
                }}>
                  {formatDate(slot.date)} - {slot.time_slot}
                </div>
                <div>
                  <button
                    onClick={() => toggleSlot(slot.id, slot.is_blocked)}
                    disabled={loading}
                    style={{
                      padding: '8px 16px',
                      background: slot.is_blocked ? '#4CAF50' : '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {slot.is_blocked ? 'UNBLOCK' : 'BLOCK'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {slots.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          background: '#f5f5f5',
          borderRadius: '10px',
          color: '#666'
        }}>
          No slots found. Click "Refresh Data" to load slots.
        </div>
      )}
    </div>
  );
};

export default SimpleAdminDashboard;
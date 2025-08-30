import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { slotService } from '../services/slotService';

const AdminTest: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const testAdminAuth = async () => {
    setLoading(true);
    try {
      // Check current session
      const { data: { session } } = await supabase.auth.getSession();
      setResult(`Current session: ${session ? session.user.email : 'None'}`);

      if (!session) {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'admin@iiitdm.ac.in',
          password: 'admin123'
        });

        if (error) {
          setResult(prev => prev + `\nSign in failed: ${error.message}`);
          return;
        }

        setResult(prev => prev + `\nSigned in as: ${data.user.email}`);
      }

      // Test slot toggle
      const testDate = '2025-08-30';
      const testTime = '6:00 - 7:00 AM';

      const toggleResult = await slotService.toggleSlotStatus(testDate, testTime);
      setResult(prev => prev + `\nToggle successful! New status: ${toggleResult.is_blocked ? 'BLOCKED' : 'OPEN'}`);

    } catch (err: any) {
      setResult(prev => prev + `\nError: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Admin Authentication Test</h2>

      <button onClick={testAdminAuth} disabled={loading} style={{
        padding: '10px 20px',
        background: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
      }}>
        {loading ? 'Testing...' : 'Test Admin Auth & Slot Toggle'}
      </button>

      <pre style={{
        background: '#f5f5f5',
        padding: '15px',
        borderRadius: '5px',
        marginTop: '20px',
        whiteSpace: 'pre-wrap'
      }}>
        {result || 'Click the button to test...'}
      </pre>

      <div style={{ marginTop: '20px' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Click the test button above</li>
          <li>If it works, go to the admin dashboard</li>
          <li>Try toggling slots - they should work now</li>
          <li>Check browser console for detailed logs</li>
        </ol>
      </div>
    </div>
  );
};

export default AdminTest;
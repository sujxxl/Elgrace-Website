import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TestSession() {
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Session error:', error);
        return;
      }

      console.log('SESSION:', session);
      console.log('ACCESS TOKEN:', session?.access_token);
    };

    getSession();
  }, []);

  return <div style={{ padding: 16 }}>Check console for session</div>;
}

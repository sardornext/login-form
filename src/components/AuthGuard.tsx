import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Check if user is blocked
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('status')
        .eq('id', session.user.id)
        .single();

      if (profile?.status === 'blocked') {
        await supabase.auth.signOut();
        navigate('/login');
      }
    };

    const authListener = supabase.auth.onAuthStateChange(async (session) => {
      if (!session) {
        navigate('/login');
      }
    });

    checkAuth();
    return () => {
      authListener.data.subscription.unsubscribe();
    };
  }, [navigate]);

  return <>{children}</>;
}

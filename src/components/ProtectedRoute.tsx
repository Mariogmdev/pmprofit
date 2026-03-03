import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FeedbackWidget } from '@/components/FeedbackWidget';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function SessionExpiryBanner() {
  const { sessionExpiresAt } = useAuth();
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    const check = () => {
      if (!sessionExpiresAt) { setMinutesLeft(null); return; }
      const diff = sessionExpiresAt * 1000 - Date.now();
      const mins = Math.floor(diff / 1000 / 60);
      setMinutesLeft(mins <= 5 && mins > 0 ? mins : null);
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [sessionExpiresAt]);

  if (!minutesLeft) return null;

  const handleRenew = async () => {
    setRenewing(true);
    await supabase.auth.refreshSession();
    setRenewing(false);
    setMinutesLeft(null);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive/95 text-destructive-foreground px-4 py-3 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-sm">
            Tu sesión expira en {minutesLeft} minuto{minutesLeft !== 1 ? 's' : ''}
          </p>
          <p className="text-xs opacity-90">
            Guarda tu trabajo o renueva la sesión para no perder tu progreso.
          </p>
        </div>
        <button
          onClick={handleRenew}
          disabled={renewing}
          className="px-4 py-1.5 bg-background text-foreground rounded-md text-sm font-medium hover:bg-background/90 disabled:opacity-50 transition-colors"
        >
          {renewing ? 'Renovando...' : 'Renovar sesión'}
        </button>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <>
      <SessionExpiryBanner />
      {children}
      <FeedbackWidget />
    </>
  );
}

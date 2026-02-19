import { useState } from 'react';
import Rocket from 'lucide-react/dist/esm/icons/rocket';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { Button } from '@/components/ui/button';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/80 bg-secondary shadow-lg">
          <Rocket className="h-6 w-6 text-foreground/90" strokeWidth={2} />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-xl font-semibold tracking-tight">System Architect</span>
          <span className="mt-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Architecture Studio
          </span>
        </div>
      </div>

      {mode === 'login' ? <LoginForm /> : <SignupForm />}

      <div className="mt-6 text-center text-sm">
        {mode === 'login' ? (
          <p className="text-muted-foreground">
            Don't have an account?{' '}
            <Button
              variant="link"
              onClick={() => setMode('signup')}
              className="h-auto p-0 text-foreground/90"
            >
              Sign up
            </Button>
          </p>
        ) : (
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Button
              variant="link"
              onClick={() => setMode('login')}
              className="h-auto p-0 text-foreground/90"
            >
              Sign in
            </Button>
          </p>
        )}
      </div>
    </div>
  );
}

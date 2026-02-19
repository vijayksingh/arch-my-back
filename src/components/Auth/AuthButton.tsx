import { useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuthActions, useQuery } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { api } from '../../../convex/_generated/api';

export function AuthButton() {
  const { signOut } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);
  const user = useQuery(api.users.getCurrentUser);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
    } catch (err) {
      console.error('Failed to sign out:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/75 bg-background/65 px-3 py-1.5 shadow-sm">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary">
        <User className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <span className="text-sm font-medium text-foreground/85">
        {user.email}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSignOut}
        disabled={isLoading}
        title="Sign out"
        aria-label="Sign out"
        className="ml-1 h-7 w-7 text-muted-foreground hover:text-foreground"
      >
        <LogOut className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

import { createFileRoute } from '@tanstack/react-router';
import { AuthPage } from '@/components/Auth/AuthPage';

export const Route = createFileRoute('/signup')({
  component: SignupPage,
});

function SignupPage() {
  return <AuthPage />;
}

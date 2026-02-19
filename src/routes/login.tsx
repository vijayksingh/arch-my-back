import { createFileRoute } from '@tanstack/react-router';
import { AuthPage } from '@/components/Auth/AuthPage';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  return <AuthPage />;
}

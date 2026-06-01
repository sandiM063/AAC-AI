import { AuthCard } from "@/components/auth/auth-card";

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-page-decor auth-page-decor-yellow" aria-hidden />
      <div className="auth-page-decor auth-page-decor-red" aria-hidden />
      <AuthCard />
    </div>
  );
}

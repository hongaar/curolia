import { useAuth } from "@/providers/auth-provider";
import { Button } from "@curolia/ui/button";
import { Input } from "@curolia/ui/input";
import { Label } from "@curolia/ui/label";
import {
  LoginActions,
  LoginError,
  LoginField,
  LoginFooterLink,
  LoginForm,
  LoginHeader,
  LoginLayout,
} from "@curolia/ui/login-layout";
import { Stack } from "@curolia/ui/stack";
import { Text } from "@curolia/ui/text";
import { useState } from "react";
import { Navigate } from "react-router-dom";

export function ForgotPasswordPage() {
  const { user, loading, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit() {
    setBusy(true);
    setError(null);
    const { error: err } = await resetPassword(email.trim());
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  return (
    <LoginLayout>
      <LoginHeader subtitle="Enter your email and we will send you a link to reset your password." />
      <Stack gap="md">
        {sent ? (
          <Text variant="muted">
            If an account exists for that email, we sent a password reset link.
            Check your inbox and follow the link to choose a new password.
          </Text>
        ) : (
          <LoginForm
            onSubmit={(event) => {
              event.preventDefault();
              void onSubmit();
            }}
          >
            <LoginField>
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </LoginField>
            {error ? <LoginError>{error}</LoginError> : null}
            <LoginActions>
              <Button type="submit" disabled={busy}>
                Send reset link
              </Button>
            </LoginActions>
          </LoginForm>
        )}
      </Stack>
      <LoginFooterLink to="/login">Back to sign in</LoginFooterLink>
    </LoginLayout>
  );
}

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

export function ResetPasswordPage() {
  const { user, loading, updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!loading && done) {
    return <Navigate to="/login" replace />;
  }

  async function onSubmit() {
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await updatePassword(password);
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    await signOut();
    setDone(true);
  }

  const invalidLink = !loading && !user;

  return (
    <LoginLayout>
      <LoginHeader subtitle="Choose a new password for your account." />
      <Stack gap="md">
        {loading ? (
          <Text variant="muted">Loading…</Text>
        ) : invalidLink ? (
          <>
            <Text variant="muted">
              This reset link is invalid or has expired. Request a new link to
              try again.
            </Text>
            <LoginFooterLink to="/forgot-password">
              Request a new link
            </LoginFooterLink>
          </>
        ) : (
          <LoginForm
            onSubmit={(event) => {
              event.preventDefault();
              void onSubmit();
            }}
          >
            <LoginField>
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </LoginField>
            <LoginField>
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </LoginField>
            {error ? <LoginError>{error}</LoginError> : null}
            <LoginActions>
              <Button type="submit" disabled={busy}>
                Update password
              </Button>
            </LoginActions>
          </LoginForm>
        )}
      </Stack>
      {!invalidLink && !loading ? (
        <LoginFooterLink to="/login">Back to sign in</LoginFooterLink>
      ) : null}
    </LoginLayout>
  );
}

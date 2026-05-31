import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@curolia/ui/button";
import { Input } from "@curolia/ui/input";
import { Label } from "@curolia/ui/label";
import {
  LoginActions,
  LoginError,
  LoginField,
  LoginFooterLink,
  LoginHeader,
  LoginLayout,
} from "@curolia/ui/login-layout";
import { Stack } from "@curolia/ui/stack";
import { Text } from "@curolia/ui/text";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

function hasRecoveryTokenInUrl(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.has("token_hash") && params.get("type") === "recovery";
}

function stripRecoveryParamsFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("token_hash");
  url.searchParams.delete("type");
  window.history.replaceState({}, "", `${url.pathname}${url.search}`);
}

export function ResetPasswordPage() {
  const { user, loading, updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [verifying, setVerifying] = useState(hasRecoveryTokenInUrl);

  useEffect(() => {
    if (!hasRecoveryTokenInUrl()) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get("token_hash");
    if (!token_hash) {
      return;
    }
    let cancelled = false;
    void supabase.auth
      .verifyOtp({ token_hash, type: "recovery" })
      .then(({ error: verifyError }) => {
        if (cancelled) return;
        stripRecoveryParamsFromUrl();
        setVerifying(false);
        if (verifyError) setError(verifyError.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const invalidLink = !loading && !verifying && !user;

  return (
    <LoginLayout>
      <LoginHeader subtitle="Choose a new password for your account." />
      <Stack gap="md">
        {loading || verifying ? (
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
          <>
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
              <Button disabled={busy} onClick={() => void onSubmit()}>
                Update password
              </Button>
            </LoginActions>
          </>
        )}
      </Stack>
      {!invalidLink && !loading && !verifying ? (
        <LoginFooterLink to="/login">Back to sign in</LoginFooterLink>
      ) : null}
    </LoginLayout>
  );
}

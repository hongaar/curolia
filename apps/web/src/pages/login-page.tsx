import { useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@curolia/ui/button";
import { Input } from "@curolia/ui/input";
import { Label } from "@curolia/ui/label";
import { Tabs } from "@curolia/ui/tabs";
import {
  LoginActions,
  LoginError,
  LoginField,
  LoginFooterNote,
  LoginHeader,
  LoginInlineCode,
  LoginLayout,
  LoginTabPanel,
  LoginTabsList,
  LoginTabTrigger,
} from "@curolia/ui/login-layout";

function safeInternalPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const [params] = useSearchParams();
  const nextPath = safeInternalPath(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    return <Navigate to={nextPath ?? "/"} replace />;
  }

  async function onSignIn() {
    setBusy(true);
    setError(null);
    const { error: err } = await signIn(email, password);
    setBusy(false);
    if (err) setError(err.message);
  }

  async function onSignUp() {
    setBusy(true);
    setError(null);
    const { error: err } = await signUp(email, password);
    setBusy(false);
    if (err) setError(err.message);
    else
      setError(
        "Check your email to confirm your account, if required by your project.",
      );
  }

  return (
    <LoginLayout>
      <LoginHeader />
      <Tabs defaultValue="signin">
        <LoginTabsList>
          <LoginTabTrigger value="signin">Sign in</LoginTabTrigger>
          <LoginTabTrigger value="signup">Sign up</LoginTabTrigger>
        </LoginTabsList>
        <LoginTabPanel value="signin">
          <LoginField>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </LoginField>
          <LoginField>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </LoginField>
          {error ? <LoginError>{error}</LoginError> : null}
          <LoginActions>
            <Button disabled={busy} onClick={() => void onSignIn()}>
              Sign in
            </Button>
          </LoginActions>
        </LoginTabPanel>
        <LoginTabPanel value="signup">
          <LoginField>
            <Label htmlFor="email2">Email</Label>
            <Input
              id="email2"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </LoginField>
          <LoginField>
            <Label htmlFor="password2">Password</Label>
            <Input
              id="password2"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </LoginField>
          {error ? <LoginError>{error}</LoginError> : null}
          <LoginActions>
            <Button disabled={busy} onClick={() => void onSignUp()}>
              Create account
            </Button>
          </LoginActions>
        </LoginTabPanel>
      </Tabs>
      <LoginFooterNote>
        Configure <LoginInlineCode>VITE_SUPABASE_URL</LoginInlineCode> and{" "}
        <LoginInlineCode>VITE_SUPABASE_PUBLISHABLE_KEY</LoginInlineCode> in{" "}
        <LoginInlineCode>apps/web/.env</LoginInlineCode> (see repository
        README).
      </LoginFooterNote>
    </LoginLayout>
  );
}

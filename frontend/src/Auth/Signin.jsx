import { useState } from "react";
import { Alert, Button, Link, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import AuthCard from "./AuthCard";
import { useAuth } from "../context/AuthContext";

// Only follow same-site paths after sign-in (no open redirects).
const safeNext = (next) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "/");

const Signin = () => {
  const { user, signIn } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: params.get("email") || "", password: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const next = safeNext(params.get("next"));

  if (user) return <Navigate to={next} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(form.email, form.password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Sign in" subtitle="Compliance Analysis">
      <Stack component="form" spacing={2} onSubmit={submit}>
        {params.get("registered") && !error && <Alert severity="success">Account created. Sign in to continue.</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Button type="submit" variant="contained" size="large" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <Typography variant="body2" sx={{ textAlign: "center" }}>
          No account?{" "}
          <Link component={RouterLink} to="/signup">
            Create one
          </Link>
        </Typography>
      </Stack>
    </AuthCard>
  );
};

export default Signin;

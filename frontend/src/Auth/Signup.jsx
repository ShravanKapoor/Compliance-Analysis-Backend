import { useState } from "react";
import { Alert, Button, Link, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";
import AuthCard from "./AuthCard";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";

const MIN_PASSWORD = 8;

const Signup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ userName: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const mismatch = form.confirm && form.password !== form.confirm;

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < MIN_PASSWORD) return setError(`Password must be at least ${MIN_PASSWORD} characters`);
    if (mismatch) return setError("Passwords don't match");
    setBusy(true);
    setError(null);
    try {
      await api.signUp({ userName: form.userName, email: form.email, password: form.password });
      navigate(`/signin?registered=1&email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Create an account" subtitle="Compliance Analysis">
      <Stack component="form" spacing={2} onSubmit={submit}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Name" required autoFocus autoComplete="name" value={form.userName} onChange={set("userName")} />
        <TextField label="Email" type="email" required autoComplete="email" value={form.email} onChange={set("email")} />
        <TextField
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          helperText={`At least ${MIN_PASSWORD} characters`}
          value={form.password}
          onChange={set("password")}
        />
        <TextField
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          error={Boolean(mismatch)}
          helperText={mismatch ? "Passwords don't match" : " "}
          value={form.confirm}
          onChange={set("confirm")}
        />
        <Button type="submit" variant="contained" size="large" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </Button>
        <Typography variant="body2" sx={{ textAlign: "center" }}>
          Already have an account?{" "}
          <Link component={RouterLink} to="/signin">
            Sign in
          </Link>
        </Typography>
      </Stack>
    </AuthCard>
  );
};

export default Signup;

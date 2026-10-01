import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import { Page, Field, Form, ErrorNotice, Notice } from './DevangUI.jsx';
import { safeReturnPath } from './sessionFence.mjs';
export default function Login() {
  const { login, loading, features, sessionError } = useAuth();
  const navigate = useNavigate(); const location = useLocation();
  const [error, setError] = useState(null);
  async function submit(event) {
    event.preventDefault(); setError(null);
    const form = new FormData(event.currentTarget);
    try { const user = await login({ email: form.get('email').trim(), password: form.get('password') }); navigate(safeReturnPath(location.state?.from, user.role), { replace: true }); }
    catch (failure) { setError(failure); }
  }
  return <Page title="Welcome back" eyebrow="Your property workspace" auth><p className="dv-muted">Sign in to continue to your account.</p>{location.state?.passwordChanged && <Notice>Your password was changed. Sign in again with your new password.</Notice>}<ErrorNotice error={sessionError} /><ErrorNotice error={error} /><Form error={error} className="dv-form" onSubmit={submit}><Field label="Email address" name="email" type="email" autoComplete="email" required maxLength={254} /><Field label="Password" name="password" type="password" autoComplete="current-password" required /><button className="dv-button" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button></Form><div className="dv-auth-links"><Link to="/signup">Create an account</Link>{features.passwordReset && <Link to="/forgot-password">Forgot password?</Link>}</div></Page>;
}

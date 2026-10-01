import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import { Page, Field, Form, ErrorNotice, FeatureGate, Notice } from './DevangUI.jsx';
export default function ForgotPassword() {
  const { api } = useAuth(); const [pending, setPending] = useState(false); const [error, setError] = useState(null); const [done, setDone] = useState(false);
  async function submit(event) { event.preventDefault(); const email = new FormData(event.currentTarget).get('email').trim(); setPending(true); setError(null); try { await api.auth.forgotPassword({ email }); setDone(true); } catch (failure) { setError(failure); } finally { setPending(false); } }
  return <Page title="Reset your password" eyebrow="Account recovery" auth><FeatureGate feature="passwordReset"><p className="dv-muted">Enter your email to request a secure reset link.</p><ErrorNotice error={error} />{done ? <Notice>If an account exists for this email, a password reset link has been requested. Check your inbox.</Notice> : <Form error={error} className="dv-form" onSubmit={submit}><Field label="Email address" name="email" type="email" autoComplete="email" required maxLength={254} /><button className="dv-button" disabled={pending}>{pending ? 'Requesting link…' : 'Request reset link'}</button></Form>}</FeatureGate><div className="dv-auth-links"><Link to="/login">Back to sign in</Link></div></Page>;
}

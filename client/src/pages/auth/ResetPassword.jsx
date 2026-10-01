import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import { Page, Field, Form, validationError, ErrorNotice, FeatureGate, Notice } from './DevangUI.jsx';
import { passwordValid } from './Signup.jsx';
export default function ResetPassword() {
  const { api, clearSession, sessionKey } = useAuth(); const { token } = useParams();
  const account = useRef(sessionKey); account.current = sessionKey;
  useEffect(() => { account.current = sessionKey; return () => { account.current = null; }; }, [sessionKey]);
  const [pending, setPending] = useState(false); const [error, setError] = useState(null); const [done, setDone] = useState(false);
  async function submit(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const password = form.get('password'); setError(null);
    if (!passwordValid(password)) { setError(validationError('password', 'Use at least 8 characters, including a number and a symbol.')); return; }
    if (password !== form.get('confirmation')) { setError(validationError('confirmation', 'Passwords do not match.')); return; }
    const accountAtStart = account.current;
    setPending(true); try { await api.auth.resetPassword(token, { password }); if (account.current !== accountAtStart) return; clearSession(); setDone(true); } catch (failure) { if (account.current === accountAtStart) setError(failure); } finally { if (account.current === accountAtStart) setPending(false); }
  }
  return <Page title="Choose a new password" eyebrow="Account recovery" auth><FeatureGate feature="passwordReset"><ErrorNotice error={error} />{done ? <Notice>Your password was changed. Sign in again with your new password.</Notice> : <Form error={error} className="dv-form" onSubmit={submit}><Field label="New password" name="password" type="password" autoComplete="new-password" required minLength={8} help="At least 8 characters, including a number and a symbol." /><Field label="Confirm new password" name="confirmation" type="password" autoComplete="new-password" required /><button className="dv-button" disabled={pending}>{pending ? 'Changing password…' : 'Reset password'}</button></Form>}</FeatureGate><div className="dv-auth-links"><Link to="/login">Sign in</Link></div></Page>;
}

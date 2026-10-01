import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import { Page, Field, Form, validationError, ErrorNotice, enumValues, humanize } from './DevangUI.jsx';
import { roleHome } from './sessionFence.mjs';
export const passwordValid = value => value.length >= 8 && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value);
export default function Signup() {
  const { register, loading, constants } = useAuth(); const navigate = useNavigate();
  const [error, setError] = useState(null);
  async function submit(event) {
    event.preventDefault(); setError(null); const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(['name','email','phone','password','role'].map(key => [key, form.get(key)]));
    if (!passwordValid(body.password)) { setError(validationError('password', 'Use at least 8 characters, including a number and a symbol.')); return; }
    if (body.password !== form.get('confirmation')) { setError(validationError('confirmation', 'Passwords do not match.')); return; }
    body.name = body.name.trim(); body.email = body.email.trim(); body.phone = body.phone.trim();
    try { const user = await register(body); navigate(roleHome(user.role), { replace: true }); } catch (failure) { setError(failure); }
  }
  return <Page title="Create your account" eyebrow="Start with your role" auth><p className="dv-muted">Choose how you will use OwnSquare. Broker listings require administrator approval.</p><ErrorNotice error={error} /><Form error={error} className="dv-form" onSubmit={submit}><Field label="Full name" name="name" autoComplete="name" required minLength={2} maxLength={100} /><Field label="Email address" name="email" type="email" autoComplete="email" required maxLength={254} /><Field label="Phone number" name="phone" type="tel" autoComplete="tel" required pattern="\+?[0-9]{10,15}" help="10–15 digits, with an optional leading +." /><Field label="Account role" name="role"><select required defaultValue="INVESTOR">{enumValues(constants.ROLES).filter(role => role !== 'ADMIN').map(role => <option key={role} value={role}>{humanize(role)}</option>)}</select></Field><Field label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} help="At least 8 characters, including a number and a symbol." /><Field label="Confirm password" name="confirmation" type="password" autoComplete="new-password" required /><button className="dv-button" disabled={loading}>{loading ? 'Creating account…' : 'Create account'}</button></Form><div className="dv-auth-links"><Link to="/login">Already have an account? Sign in</Link></div></Page>;
}

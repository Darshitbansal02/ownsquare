import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import { Page, Field, Form, validationError, Notice, ErrorNotice, humanize } from '../auth/DevangUI.jsx';
import { passwordValid } from '../auth/Signup.jsx';
export default function Profile() {
  const { api, user, refreshUser, clearSession, sessionKey } = useAuth(); const navigate = useNavigate();
  const [values,setValues] = useState({name:user?.name ?? '',phone:user?.phone ?? ''});
  const [profilePending,setProfilePending] = useState(false); const [passwordPending,setPasswordPending] = useState(false);
  const [profileError,setProfileError] = useState(null); const [passwordError,setPasswordError] = useState(null); const [saved,setSaved] = useState(false);
  const account = useRef(sessionKey); account.current = sessionKey;
  useEffect(() => { account.current = sessionKey; return () => { account.current = null; }; }, [sessionKey]);
  useEffect(() => {setValues({name:user?.name ?? '',phone:user?.phone ?? ''});setSaved(false);},[user?._id]);
  async function updateProfile(event) {
    event.preventDefault(); const accountAtStart = account.current; setProfilePending(true); setProfileError(null); setSaved(false);
    try { await api.auth.updateProfile({name:values.name.trim(),phone:values.phone.trim()}); if(account.current !== accountAtStart) return; await refreshUser(); if(account.current === accountAtStart) setSaved(true); }
    catch(failure) { if(account.current === accountAtStart) setProfileError(failure); }
    finally { if(account.current === accountAtStart) setProfilePending(false); }
  }
  async function changePassword(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const password = form.get('password'); const currentPassword = form.get('currentPassword'); setPasswordError(null);
    if(!passwordValid(password)) { setPasswordError(validationError('password', 'Use at least 8 characters, including a number and a symbol.')); return; }
    if(password !== form.get('confirmation')) { setPasswordError(validationError('confirmation', 'New passwords do not match.')); return; }
    const accountAtStart = account.current; setPasswordPending(true);
    try { await api.auth.changePassword({currentPassword,password}); if(account.current !== accountAtStart) return; clearSession(); navigate('/login',{replace:true,state:{passwordChanged:true}}); }
    catch(failure) { if(account.current === accountAtStart) setPasswordError(failure); }
    finally { if(account.current === accountAtStart) setPasswordPending(false); }
  }
  return <Page title="Your account" eyebrow="Profile & security"><div className="dv-two-col"><section className="dv-panel"><h2>Personal details</h2><p className="dv-muted">Keep your name and contact information up to date.</p><ErrorNotice error={profileError}/>{saved && <Notice>Your profile was updated.</Notice>}<Form error={profileError} className="dv-form" onSubmit={updateProfile}><Field name="name" label="Full name" value={values.name} onChange={event => setValues(current => ({...current,name:event.target.value}))} autoComplete="name" required minLength={2} maxLength={100} disabled={profilePending || passwordPending}/><Field name="phone" label="Phone number" value={values.phone} onChange={event => setValues(current => ({...current,phone:event.target.value}))} autoComplete="tel" type="tel" pattern="\+?[0-9]{10,15}" required disabled={profilePending || passwordPending}/><Field label="Email address" value={user?.email ?? ''} type="email" readOnly help="Email changes require a separate verification flow."/><Field label="Account role" value={humanize(user?.role)} readOnly/>{user?.role === 'BROKER' && <Notice warning={!user.brokerApproved}>{user.brokerApproved ? 'Your broker account is approved.' : 'Your broker account is waiting for administrator approval.'}</Notice>}<button className="dv-button" disabled={profilePending || passwordPending}>{profilePending ? 'Saving profile…' : 'Save profile'}</button></Form></section>
    <section className="dv-panel"><h2>Change password</h2><p className="dv-muted">Changing your password ends all active sessions. You will need to sign in again.</p><ErrorNotice error={passwordError}/><Form error={passwordError} className="dv-form" onSubmit={changePassword}><Field label="Current password" name="currentPassword" type="password" autoComplete="current-password" required disabled={passwordPending || profilePending}/><Field label="New password" name="password" type="password" autoComplete="new-password" required minLength={8} help="At least 8 characters, including a number and a symbol." disabled={passwordPending || profilePending}/><Field label="Confirm new password" name="confirmation" type="password" autoComplete="new-password" required disabled={passwordPending || profilePending}/><button className="dv-button" disabled={passwordPending || profilePending}>{passwordPending ? 'Changing password…' : 'Change password & sign out'}</button></Form></section></div></Page>;
}

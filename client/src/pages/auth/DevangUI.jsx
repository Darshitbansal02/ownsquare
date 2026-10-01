import React, { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import { roleHome } from './sessionFence.mjs';
import './Devang.css';

export const enumValues = value => Object.values(value ?? {});
export const humanize = value => String(value ?? 'Unavailable').toLowerCase().replaceAll('_', ' ').replace(/^./, char => char.toUpperCase());
export const money = value => value == null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value / 100);
export const date = value => value ? new Date(value).toLocaleString('en-IN') : '—';
const FieldErrorsContext = createContext([]);
export function Form({ error, children, ...props }) { return <FieldErrorsContext.Provider value={error?.details ?? []}><form {...props}>{children}</form></FieldErrorsContext.Provider>; }
export function validationError(field, message) { return Object.assign(new Error(message), { details: [{ field, message }] }); }

export function Page({ title, eyebrow, children, actions, auth = false }) {
  const { user, logout, features } = useAuth();
  const [logoutError, setLogoutError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false); const navId = useId();
  return <div className={`dv-page ${auth ? 'dv-auth' : ''}`}>
    <header className="dv-top"><div className="dv-brand-row"><Link className="dv-brand" to={user ? roleHome(user.role) : '/'}><span aria-hidden="true">◩</span> OwnSquare</Link><button className="dv-button dv-secondary dv-menu-toggle" aria-expanded={menuOpen} aria-controls={navId} onClick={()=>setMenuOpen(previous=>!previous)}>{menuOpen?'Close menu':'Menu'}</button></div>
      <nav id={navId} data-open={menuOpen} aria-label="Account navigation" onClick={()=>setMenuOpen(false)}><NavLink to="/properties">Marketplace</NavLink>{user ? <><NavLink end to={roleHome(user.role)}>Dashboard</NavLink>{user.role === 'BROKER' && <NavLink to="/broker/properties">Listings</NavLink>}{user.role === 'INVESTOR' && <><NavLink to="/investor/portfolio">Portfolio</NavLink><NavLink to="/investor/wallet">Wallet</NavLink>{features.kyc && <NavLink to="/investor/kyc">KYC</NavLink>}{features.enquiries && <NavLink to="/investor/enquiries">Enquiries</NavLink>}</>}{user.role === 'ADMIN' && <><NavLink to="/admin/properties">Properties</NavLink><NavLink to="/admin/users">Users</NavLink>{features.kyc && <NavLink to="/admin/kyc">KYC queue</NavLink>}{features.withdrawals && <NavLink to="/admin/withdrawals">Withdrawals</NavLink>}<NavLink to="/admin/settings">Settings</NavLink></>}<NavLink to="/profile">Profile</NavLink>{features.notifications && <NavLink to="/notifications">Notifications</NavLink>}<button className="dv-text" onClick={() => logout().catch(setLogoutError)}>Sign out</button></> : <><NavLink to="/login">Sign in</NavLink><NavLink to="/signup">Create account</NavLink></>}</nav>
    </header>
    <main className={auth ? 'dv-auth-layout' : 'dv-main'}>{auth && <aside className="dv-identity"><p className="dv-kicker">PROPERTY. SHARED.</p><h2>A smaller square.<br />A bigger possibility.</h2><p>A clear view of your account, property listings and every step ahead.</p><span className="dv-identity-note">OwnSquare · Fractional property workspace</span></aside>}
      <section className={auth ? 'dv-auth-form' : ''}><header className="dv-heading"><div>{eyebrow && <p className="dv-kicker">{eyebrow}</p>}<h1>{title}</h1></div>{actions && <div className="dv-actions">{actions}</div>}</header><ErrorNotice error={logoutError} />{children}</section>
    </main><footer className="dv-footer">This is an academic project. No real money or securities are involved.</footer>
  </div>;
}
export function ErrorNotice({ error }) {
  if (!error) return null;
  return <div className="dv-alert dv-error" role="alert"><strong>{error.message || 'Something went wrong. Please try again.'}</strong>{error.details?.length > 0 && <ul>{error.details.map((detail, i) => <li key={i}>{humanize(detail.field)}: {detail.message}</li>)}</ul>}</div>;
}
export function Notice({ children, warning = false }) { return <p className={`dv-alert ${warning ? 'dv-warning' : ''}`} role="status">{children}</p>; }
export function Field({ label, name, error, help, children, ...props }) {
  const id = useId();
  const details = useContext(FieldErrorsContext); const [visible, setVisible] = useState(false);
  const fieldError = error || details.find(detail => detail.field === name)?.message;
  const describedBy = help || fieldError ? `${id}-help` : undefined;
  const input = children ? React.cloneElement(children, { id, name, 'aria-describedby': describedBy, 'aria-invalid': !!fieldError }) : <input id={id} name={name} aria-describedby={describedBy} aria-invalid={!!fieldError} {...props} type={props.type === 'password' && visible ? 'text' : props.type} />;
  return <div className="dv-field"><label htmlFor={id}>{label}{props.required && <span aria-hidden="true"> *</span>}</label>{props.type === 'password' ? <div className="dv-input-row">{input}<button type="button" className="dv-password-toggle" disabled={props.disabled} aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} aria-controls={id} aria-pressed={visible} onClick={() => setVisible(current => !current)}>{visible ? 'Hide' : 'Show'}</button></div> : input}{(help || fieldError) && <small id={`${id}-help`} className={fieldError ? 'dv-field-error' : ''}>{fieldError || help}</small>}</div>;
}
export function FeatureGate({ feature, children }) {
  const { features, featuresLoading, featuresError } = useAuth();
  if (featuresLoading) return <p role="status">Checking availability…</p>;
  if (featuresError) return <ErrorNotice error={featuresError} />;
  if (!features[feature]) return <Notice warning>{humanize(feature)} is currently unavailable on this platform.</Notice>;
  return children;
}
export function useResource(loader, dependencies = [], enabled = true) {
  const { sessionKey } = useAuth();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ key: '', loading: true, data: null, error: null });
  const key = JSON.stringify([sessionKey, enabled, revision, ...dependencies]);
  const loaderRef = useRef(loader); loaderRef.current = loader;
  useEffect(() => {
    let active = true;
    setState({ key, loading: enabled, data: null, error: null });
    if (enabled) Promise.resolve().then(() => loaderRef.current()).then(data => { if (active) setState({ key, loading: false, data, error: null }); })
      .catch(error => { if (active) setState({ key, loading: false, data: null, error }); });
    return () => { active = false; };
  }, [key]);
  return { ...(state.key === key ? state : { loading: enabled, data: null, error: null }), reload: () => setRevision(value => value + 1) };
}
export function ResourceState({ resource, children, emptyMessage = 'No records yet.' }) {
  if (resource.loading) return <div className="dv-loading" role="status">Loading your workspace…</div>;
  if (resource.error) return <><ErrorNotice error={resource.error} /><button className="dv-button dv-secondary" onClick={resource.reload}>Try again</button></>;
  if (!resource.data || (resource.data.items && !resource.data.items.length)) return <div className="dv-empty"><h2>Nothing here yet</h2><p>{emptyMessage}</p></div>;
  return children(resource.data);
}
export function Pagination({ data, page, onPage }) {
  return <nav className="dv-pagination" aria-label="Pagination"><span>{data.total} records · Page {page} of {Math.max(1, data.totalPages)}</span><div><button className="dv-button dv-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button><button className="dv-button dv-secondary" disabled={page >= data.totalPages} onClick={() => onPage(page + 1)}>Next</button></div></nav>;
}
export function Status({ value }) { return <span className={`dv-status dv-status-${String(value).toLowerCase()}`}>{humanize(value)}</span>; }
export function Funding({ property }) {
  const percent = Number.isFinite(property.fundingPct) ? Math.min(100, Math.max(0, property.fundingPct)) : 0;
  return <div className="dv-funding"><div><strong>{percent.toFixed(1)}% funded</strong><span>{property.remainingUnits ?? 0} units available</span></div><progress aria-label={`Funding for ${property.title || 'draft'}`} value={percent} max="100" /></div>;
}
export function Confirm({ open, title, children, onCancel, onConfirm, pending, confirmLabel = 'Confirm submission' }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return <dialog className="dv-dialog" ref={dialogRef} onCancel={event => { event.preventDefault(); if (!pending) onCancel(); }} aria-label={title}><h2>{title}</h2>{children}<div className="dv-actions"><button className="dv-button dv-secondary" disabled={pending} onClick={onCancel}>Cancel</button><button className="dv-button" disabled={pending} onClick={onConfirm}>{pending ? 'Processing…' : confirmLabel}</button></div></dialog>;
}

export function useAction() {
  const { sessionKey } = useAuth();
  const current = useRef(sessionKey); current.current = sessionKey;
  const busy = useRef(false);
  const [pending, setPending] = useState(false); const [error, setError] = useState(null);
  useEffect(() => { current.current = sessionKey; return () => { current.current = null; }; }, [sessionKey]);
  async function run(operation, onSuccess) {
    if (busy.current) return;
    busy.current = true; setPending(true); setError(null); const generation = current.current;
    try { const result = await operation(); if (generation === current.current) { onSuccess?.(result); return result; } }
    catch (failure) { if (generation === current.current) setError(failure); }
    finally { if (generation === current.current) { busy.current = false; setPending(false); } }
  }
  return { pending, error, setError, run };
}

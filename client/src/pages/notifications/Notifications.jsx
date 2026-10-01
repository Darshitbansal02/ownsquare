import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import { Page, FeatureGate, Field, ErrorNotice, useResource, ResourceState, Pagination, date } from '../auth/DevangUI.jsx';
function safeNotificationLink(value) {
  return typeof value === 'string' && /^\/(properties|investor|broker|admin|profile|notifications)(\/|\?|#|$)/.test(value) && !/[\\\r\n]/.test(value) ? value : null;
}
export default function Notifications() {
  const {api,features,sessionKey} = useAuth(); const [page,setPage] = useState(1); const [read,setRead] = useState('');
  const resource = useResource(() => api.notifications.list({page,limit:20,sort:'-createdAt',...(read ? {read:read === 'true'} : {})}),[page,read],!!features.notifications);
  const [pending,setPending] = useState(null); const [error,setError] = useState(null); const account = useRef(sessionKey); account.current = sessionKey;
  useEffect(() => { account.current = sessionKey; return () => { account.current = null; }; }, [sessionKey]);
  async function markRead(id) { const accountAtStart = account.current; setPending(id); setError(null); try { await api.notifications.markRead(id); if(account.current === accountAtStart) resource.reload(); } catch(failure) { if(account.current === accountAtStart) setError(failure); } finally { if(account.current === accountAtStart) setPending(null); } }
  return <Page title="Notifications" eyebrow="Account activity"><FeatureGate feature="notifications"><div className="dv-toolbar"><Field label="Show notifications"><select value={read} onChange={event => {setRead(event.target.value);setPage(1);}}><option value="">All notifications</option><option value="false">Unread</option><option value="true">Read</option></select></Field></div><ErrorNotice error={error}/><ResourceState resource={resource} emptyMessage="You have no notifications matching this filter.">{data => <><section className="dv-panel" aria-label="Your notifications">{data.items.map(notification => <article key={notification._id} className="dv-notification"><div><small>{notification.read ? 'Read' : 'Unread'} · <time dateTime={notification.createdAt}>{date(notification.createdAt)}</time></small><h2>{notification.title}</h2><p>{notification.body}</p>{safeNotificationLink(notification.link) && <Link to={safeNotificationLink(notification.link)}>View details</Link>}</div>{!notification.read && <div><button className="dv-button dv-secondary" disabled={!!pending} onClick={() => markRead(notification._id)}>{pending === notification._id ? 'Updating…' : 'Mark as read'}</button></div>}</article>)}</section><Pagination data={data} page={page} onPage={setPage}/></>}</ResourceState>{!resource.loading && resource.data?.items.length === 0 && resource.data.total > 0 && <Pagination data={resource.data} page={page} onPage={setPage}/>}</FeatureGate></Page>;
}

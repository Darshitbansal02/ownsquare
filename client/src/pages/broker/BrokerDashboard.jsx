import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import { Page, Notice, ErrorNotice, ResourceState, useResource, money, date, Status, Funding } from '../auth/DevangUI.jsx';
import FundingChart from './FundingChart.jsx';
export default function BrokerDashboard() {
  const { api, user, constants, refreshUser } = useAuth();
  const resource = useResource(() => api.broker.properties({ page: 1, limit: 5, sort: '-createdAt' }));
  const pending = useResource(() => api.broker.properties({ status: constants.PROPERTY_STATUS.PENDING_APPROVAL, page: 1, limit: 5, sort: '-createdAt' }));
  const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState(null);
  async function checkApproval() { setRefreshing(true); setError(null); try { await refreshUser(); resource.reload(); pending.reload(); } catch (failure) { setError(failure); } finally { setRefreshing(false); } }
  const labels = { propertiesListed: 'Properties listed', liveProperties: 'Live listings', fundedProperties: 'Fully funded', totalRaised: 'Capital raised', commissionEarned: 'Commission earned' };
  return <Page title={`Welcome, ${user?.name?.split(' ')[0] || 'broker'}`} eyebrow="Broker workspace" actions={user?.brokerApproved ? <Link className="dv-button" to="/broker/properties/new">Create a listing</Link> : null}>
    {!user?.brokerApproved && <Notice warning>Your account is waiting for administrator approval. Listing creation and submission will become available after approval. <button className="dv-text" disabled={refreshing} onClick={checkApproval}>{refreshing ? 'Checking…' : 'Check approval status'}</button></Notice>}<ErrorNotice error={error} />
    {resource.loading ? <p role="status">Loading your property overview…</p> : resource.error ? <><ErrorNotice error={resource.error}/><button className="dv-button dv-secondary" onClick={resource.reload}>Try again</button></> : resource.data && <>
      <section className="dv-kpis" aria-label="Broker overview">{Object.entries(labels).map(([key,label]) => <div className="dv-kpi" key={key}><p>{label}</p><strong>{key === 'totalRaised' || key === 'commissionEarned' ? money(resource.data.stats[key]) : resource.data.stats[key]}</strong></div>)}</section>
      <div className="dv-two-col"><section className="dv-panel"><div className="dv-heading"><h2>Recent listings</h2><Link to="/broker/properties">View all</Link></div>{resource.data.items.length ? resource.data.items.map(property => <article className="dv-summary-link" key={property._id}><div style={{flex:1,minWidth:0}}><Link className="dv-property-name" to={`/broker/properties/${property._id}`}>{property.title || 'Untitled draft'}</Link><p className="dv-muted">{property.city || 'Location not supplied'}</p><Funding property={property}/></div><Status value={property.status}/></article>) : <div className="dv-empty"><h2>Your first listing starts here</h2><p>Create a draft, add the property details and send it for review.</p>{user?.brokerApproved && <Link className="dv-button" to="/broker/properties/new">Create a listing</Link>}</div>}</section>
      <aside className="dv-panel"><p className="dv-kicker">Funding activity</p><h2>Capital over time</h2><FundingChart series={resource.data.fundingSeries} /><p className="dv-muted">Funding activity is provided by the server for your listings. Commission is earned when a broker listing is fully funded.</p></aside></div>
    </>}
    <section className="dv-panel" aria-labelledby="pending-approvals-heading"><div className="dv-heading"><div><p className="dv-kicker">Administrator review</p><h2 id="pending-approvals-heading">Pending approvals</h2>{pending.data && <p className="dv-muted dv-count">{pending.data.total} {pending.data.total === 1 ? 'listing awaits' : 'listings await'} a decision</p>}</div><Link to={`/broker/properties?status=${encodeURIComponent(constants.PROPERTY_STATUS.PENDING_APPROVAL)}`}>View all pending</Link></div>
      <ResourceState resource={pending} emptyMessage="You have no listings awaiting administrator approval.">{data => data.items.map(property => <article className="dv-summary-link" key={property._id}><div><Link className="dv-property-name" to={`/broker/properties/${property._id}`}>{property.title || 'Untitled listing'}</Link><small>{property.city || 'Location not supplied'} · Updated <time dateTime={property.updatedAt}>{date(property.updatedAt)}</time></small></div><Status value={property.status}/></article>)}</ResourceState>
    </section>
  </Page>;
}

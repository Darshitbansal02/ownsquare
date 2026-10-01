import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import { Page, Field, Notice, ResourceState, useResource, Pagination, Status, Funding, money, enumValues, humanize } from '../auth/DevangUI.jsx';
export default function BrokerProperties() {
  const { api, constants, user } = useAuth(); const [page, setPage] = useState(1);
  const location = useLocation();
  const [filters, setFilters] = useState(() => {
    const status = new URLSearchParams(location.search).get('status');
    return { search: '', status: enumValues(constants.PROPERTY_STATUS).includes(status) ? status : '', city: '', sort: '-createdAt' };
  });
  const resource = useResource(() => api.broker.properties({page,limit:20,...Object.fromEntries(Object.entries(filters).filter(([,value]) => value))}),[page,filters]);
  function filter(event) { event.preventDefault(); const form = new FormData(event.currentTarget); setFilters(Object.fromEntries(form)); setPage(1); }
  return <Page title="Your property listings" eyebrow="Broker portfolio" actions={user?.brokerApproved && <Link className="dv-button" to="/broker/properties/new">Create a listing</Link>}>
    {!user?.brokerApproved && <Notice warning>Your broker approval is pending. Listing creation and submission are unavailable until approval.</Notice>}
    <form className="dv-toolbar" onSubmit={filter}><Field label="Search listings" name="search" defaultValue={filters.search} maxLength={100} type="search"/><Field label="City" name="city" defaultValue={filters.city} maxLength={100}/><Field label="Status" name="status"><select defaultValue={filters.status}><option value="">All statuses</option>{enumValues(constants.PROPERTY_STATUS).map(status => <option key={status} value={status}>{humanize(status)}</option>)}</select></Field><Field label="Sort" name="sort"><select defaultValue={filters.sort}><option value="-createdAt">Newest first</option><option value="createdAt">Oldest first</option><option value="title">Title A–Z</option><option value="-unitsSold">Most units funded</option></select></Field><button className="dv-button dv-secondary">Apply filters</button></form>
    <ResourceState resource={resource} emptyMessage="No listings match these filters. Create a draft or change your filters.">{data => <><div className="dv-table-wrap" role="region" aria-label="Your listings" tabIndex={0}><table className="dv-table"><thead><tr>{['Property','Status','Unit price','Funding','Action'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{data.items.map(property => <tr key={property._id}><td><Link className="dv-property-name" to={`/broker/properties/${property._id}`}>{property.title || 'Untitled draft'}</Link><small>{property.city || 'Location not supplied'}</small></td><td><Status value={property.status}/></td><td>{money(property.unitPrice)}</td><td style={{minWidth:220}}><Funding property={property}/></td><td><Link to={`/broker/properties/${property._id}`}>View details</Link>{user?.brokerApproved && ['DRAFT','REJECTED'].includes(property.status) && <><br/><Link to={`/broker/properties/${property._id}/edit`}>Edit draft</Link></>}</td></tr>)}</tbody></table></div><Pagination data={data} page={page} onPage={setPage}/></>}</ResourceState>
    {!resource.loading && resource.data?.items.length === 0 && resource.data.total > 0 && <Pagination data={resource.data} page={page} onPage={setPage}/>}
  </Page>;
}

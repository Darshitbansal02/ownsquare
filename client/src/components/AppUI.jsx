import React from 'react';
import { Link } from 'react-router-dom';
import { money, humanize, Funding, Status, Pagination, date } from '../pages/auth/DevangUI.jsx';
import './App.css';
export function Kpis({ items }) { return <section className="dv-kpis" aria-label="Overview">{items.map(([label,value]) => <div className="dv-kpi" key={label}><p>{label}</p><strong>{value}</strong></div>)}</section>; }
export function PropertyCard({ property }) {
  return <article className="dv-property-card">{property.images?.[0] ? <Link to={`/properties/${property._id}`} tabIndex={-1} aria-hidden="true"><img src={property.images[0].url} alt="" loading="lazy"/></Link> : <div className="dv-photo-empty">Property imagery unavailable</div>}<div className="dv-card-body"><div className="dv-actions"><Status value={property.status}/><small>{humanize(property.type)}</small></div><h2><Link to={`/properties/${property._id}`}>{property.title}</Link></h2><p className="dv-muted">{property.city}, {property.state}</p><dl className="dv-dl"><div><dt>Price per unit</dt><dd>{money(property.unitPrice)}</dd></div><div><dt>Expected appreciation</dt><dd>{property.expectedAppreciationPct}% <small>estimate</small></dd></div></dl><Funding property={property}/><Link className="dv-button dv-secondary" to={`/properties/${property._id}`}>Explore property</Link></div></article>;
}
export function PropertiesGrid({ items }) { return <div className="dv-property-grid">{items.map(property => <PropertyCard key={property._id} property={property}/>)}</div>; }
export function Percent({ value }) { return <span className={value < 0 ? 'dv-negative' : ''}>{value == null ? '—' : `${value.toFixed(2)}%`}</span>; }
export function LedgerTable({ data, page, onPage }) { return <><div className="dv-table-wrap" role="region" aria-label="Ledger transactions" tabIndex={0}><table className="dv-table"><thead><tr>{['Date','Type','Direction','Amount','Balance after','Reference'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{data.items.map(row => <tr key={row._id}><td>{date(row.createdAt)}</td><td>{humanize(row.type)}</td><td>{humanize(row.direction)}</td><td>{money(row.amount)}</td><td>{money(row.balanceAfter)}</td><td>{row.refType} · {row.refId}</td></tr>)}</tbody></table></div>{onPage && <Pagination data={data} page={page} onPage={onPage}/>}</>; }
export function EmptyPagePagination({ resource, page, onPage }) { return !resource.loading && resource.data?.items?.length === 0 && resource.data.total > 0 ? <Pagination data={resource.data} page={page} onPage={onPage}/> : null; }
export function Allocation({ items }) {
  const total = items.reduce((sum,item) => sum+item.amount,0);
  if (!total) return <p className="dv-muted">Allocation appears after your first active investment.</p>;
  let offset = 0;
  const colors = ['#0f2a4a','#087c66','#9d7210','#406fa1','#7068a3'];
  return <><svg viewBox="0 0 160 160" className="dv-allocation" role="img" aria-label="Allocation of active invested principal by property; exact amounts listed below"><circle cx="80" cy="80" r="56" fill="none" stroke="#e3e9f0" strokeWidth="20"/>{items.map((item,index) => { const length=item.amount/total*100; const dash=offset; offset+=length; return <circle key={item.propertyId} cx="80" cy="80" r="56" fill="none" stroke={colors[index%colors.length]} strokeWidth="20" pathLength="100" strokeDasharray={`${length} ${100-length}`} strokeDashoffset={-dash} transform="rotate(-90 80 80)"/>; })}</svg><ul className="dv-allocation-list">{items.map((item,index) => <li key={item.propertyId}><span style={{borderLeft:`4px solid ${colors[index%colors.length]}`,paddingLeft:8}}>{item.title}</span><strong>{money(item.amount)}</strong></li>)}</ul></>;
}

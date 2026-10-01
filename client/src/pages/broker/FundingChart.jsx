import React from 'react';
import { money, date } from '../auth/DevangUI.jsx';
export default function FundingChart({ series = [], propertyId }) {
  const scoped = propertyId ? series.filter(item => item.propertyId === propertyId) : series;
  const totals = new Map();
  for (const item of scoped) for (const point of item.points ?? []) totals.set(point.date, (totals.get(point.date) ?? 0) + point.amount);
  const points = [...totals].sort(([a],[b]) => a.localeCompare(b));
  if (!points.length) return <div className="dv-empty"><p>No recorded funding activity yet.</p></div>;
  const max = Math.max(...points.map(([,amount]) => amount), 1);
  const line = points.map(([,amount],index) => `${points.length > 1 ? 20+index/(points.length-1)*460 : 250},${170-amount/max*140}`).join(' ');
  return <><svg className="dv-chart" viewBox="0 0 500 200" role="img" aria-label={`Funding activity across ${points.length} recorded dates. Full values follow in the table.`}><line x1="20" y1="170" x2="480" y2="170" stroke="#c9d3df"/><line x1="20" y1="30" x2="480" y2="30" stroke="#e4eaf0"/><polyline points={line} fill="none" stroke="#087c66" strokeWidth="3"/>{points.map(([,amount],index) => <circle key={index} cx={points.length > 1 ? 20+index/(points.length-1)*460 : 250} cy={170-amount/max*140} r="4" fill="#087c66"/>)}</svg><details><summary>View funding values</summary><div className="dv-table-wrap" role="region" aria-label="Funding values" tabIndex={0}><table className="dv-chart-table"><thead><tr><th scope="col">Date</th><th scope="col">Amount raised</th></tr></thead><tbody>{points.map(([when,amount]) => <tr key={when}><td>{date(when)}</td><td>{money(amount)}</td></tr>)}</tbody></table></div></details></>;
}

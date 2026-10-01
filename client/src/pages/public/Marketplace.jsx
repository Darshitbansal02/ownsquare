import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth.js';
import { Page, Field, Form, ErrorNotice, ResourceState, useResource, Pagination, enumValues, humanize, validationError } from '../auth/DevangUI.jsx';
import { PropertiesGrid, EmptyPagePagination } from '../../components/AppUI.jsx';
import { parseRupees } from '../../features/broker/money.mjs';
export default function Marketplace() {
  const {api,constants}=useAuth(); const [page,setPage]=useState(1); const [query,setQuery]=useState({sort:'-createdAt'}); const [error,setError]=useState(null);
  const resource=useResource(()=>api.properties.list({page,limit:12,...query}),[page,query]);
  function apply(event) {
    event.preventDefault(); setError(null);
    try {
      const values=Object.fromEntries(new FormData(event.currentTarget)); const body={};
      for(const [key,value] of Object.entries(values)) if(value.trim()) body[key]=value.trim();
      for(const field of ['minPrice','maxPrice']) if(body[field]) {try{body[field]=parseRupees(body[field]);}catch(failure){throw validationError(field,failure.message);}}
      for(const field of ['minFundingPct','maxFundingPct']) if(body[field]) {if(!/^\d+(\.\d+)?$/.test(body[field]) || Number(body[field])>100) throw validationError(field,'Enter a percentage between 0 and 100.');body[field]=Number(body[field]);}
      if(body.minPrice!=null && body.maxPrice!=null && body.minPrice>body.maxPrice) throw validationError('maxPrice','Maximum unit price must be at least the minimum.');
      if(body.minFundingPct!=null && body.maxFundingPct!=null && body.minFundingPct>body.maxFundingPct) throw validationError('maxFundingPct','Maximum funding must be at least the minimum.');
      setQuery(body); setPage(1);
    }catch(failure){setError(failure);}
  }
  return <Page title="Find your next square" eyebrow="Property marketplace"><p className="dv-portfolio-intro">Compare disclosed property details and choose units that fit your simulated investment budget.</p><div className="dv-panel"><ErrorNotice error={error}/><Form error={error} className="dv-filter-grid" onSubmit={apply}><Field label="Search" name="search" type="search" maxLength={100}/><Field label="City" name="city" maxLength={100}/><Field label="Property type" name="type"><select defaultValue=""><option value="">All types</option>{enumValues(constants.PROPERTY_TYPES).map(type=><option key={type} value={type}>{humanize(type)}</option>)}</select></Field><Field label="Status" name="status"><select defaultValue=""><option value="">Live & funded</option>{[constants.PROPERTY_STATUS.LIVE,constants.PROPERTY_STATUS.FUNDED].map(status=><option key={status} value={status}>{humanize(status)}</option>)}</select></Field><Field label="Minimum unit price (₹)" name="minPrice" inputMode="decimal"/><Field label="Maximum unit price (₹)" name="maxPrice" inputMode="decimal"/><Field label="Minimum funding (%)" name="minFundingPct" inputMode="decimal"/><Field label="Maximum funding (%)" name="maxFundingPct" inputMode="decimal"/><Field label="Sort by" name="sort"><select defaultValue="-createdAt"><option value="-createdAt">Newest first</option><option value="unitPrice">Unit price: low to high</option><option value="-unitPrice">Unit price: high to low</option><option value="-expectedAppreciationPct">Expected appreciation</option><option value="-unitsSold">Units funded</option></select></Field><button className="dv-button">Apply filters</button></Form></div><ResourceState resource={resource} emptyMessage="No published properties match your filters. Try a different city, type or price range.">{data=><><p className="dv-small">{data.total} properties found</p><PropertiesGrid items={data.items}/><Pagination data={data} page={page} onPage={setPage}/></>}</ResourceState><EmptyPagePagination resource={resource} page={page} onPage={setPage}/></Page>;
}

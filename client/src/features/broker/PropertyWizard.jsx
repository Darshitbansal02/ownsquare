import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import { Field, Form, ErrorNotice, Notice, Status, Confirm, money, enumValues, humanize, useResource } from '../../pages/auth/DevangUI.jsx';
import { parseRupees, rupeeText, parsePositiveInteger, provisionalUnitPrice } from './money.mjs';

const steps = ['Basics', 'Location', 'Financials', 'Media & docs', 'Review'];
const textFields = ['title','description','type','address','city','state','pincode'];
const integerFields = ['totalUnits','minUnits','maxUnitsPerInvestor','holdingPeriodMonths'];
const numericFields = ['areaSqft','expectedAppreciationPct','rentalYieldPct'];
function initialForm(property = {}) {
  return Object.fromEntries([...textFields,...integerFields,...numericFields].map(field => [field, property[field] == null ? '' : String(property[field])]).concat([['valuation',rupeeText(property.valuation)],['images',property.images ?? []],['documents',property.documents ?? []],['lat',property.geo?.lat == null ? '' : String(property.geo.lat)],['lng',property.geo?.lng == null ? '' : String(property.geo.lng)]]));
}
function draftPayload(form, saved, capEnabled) {
  const payload = {};
  for (const field of textFields) {
    const value = form[field].trim();
    if (value) payload[field] = value;
    else if (saved?.[field] != null) payload[field] = null;
  }
  for (const field of integerFields) {
    if (field === 'maxUnitsPerInvestor' && !capEnabled) continue;
    if (form[field] !== '') payload[field] = parsePositiveInteger(form[field], humanize(field));
    else if (saved?.[field] != null) payload[field] = null;
  }
  for (const field of numericFields) {
    if (form[field] !== '') {
      if (!/^\d+(\.\d+)?$/.test(form[field]) || !Number.isFinite(Number(form[field]))) throw new Error(`${humanize(field)} must be a finite nonnegative number.`);
      payload[field] = Number(form[field]);
      if (field === 'areaSqft' && payload[field] <= 0) throw new Error('Area must be greater than zero.');
      if (field !== 'areaSqft' && payload[field] > 100) throw new Error('Percentages must be between 0 and 100.');
    } else if (saved?.[field] != null) payload[field] = null;
  }
  if (form.valuation !== '') { payload.valuation = parseRupees(form.valuation); if (!payload.valuation) throw new Error('Valuation must be greater than zero.'); }
  else if (saved?.valuation != null) payload.valuation = null;
  if (payload.valuation != null && payload.totalUnits != null) provisionalUnitPrice(payload.valuation, payload.totalUnits);
  if (payload.totalUnits != null && payload.minUnits != null && payload.minUnits > payload.totalUnits) throw new Error('Minimum units cannot exceed total units.');
  if (payload.totalUnits != null && payload.maxUnitsPerInvestor != null && payload.maxUnitsPerInvestor > payload.totalUnits) throw new Error('Investor unit cap cannot exceed total units.');
  if (form.lat !== '' || form.lng !== '') {
    if (form.lat === '' || form.lng === '') throw new Error('Supply both latitude and longitude, or leave both blank.');
    const lat = Number(form.lat); const lng = Number(form.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error('Enter valid latitude (−90 to 90) and longitude (−180 to 180).');
    payload.geo = { lat, lng };
  } else if (saved?.geo) payload.geo = null;
  payload.images = form.images; payload.documents = form.documents;
  return payload;
}
function submissionErrors(form, capEnabled) {
  const required = [...textFields,'areaSqft','valuation','totalUnits','minUnits','expectedAppreciationPct','rentalYieldPct','holdingPeriodMonths'];
  const missing = required.filter(field => form[field].trim() === '');
  if (missing.length) throw new Error(`Complete these fields before submission: ${missing.map(humanize).join(', ')}.`);
  if (form.title.trim().length < 3) throw new Error('Title must contain at least 3 characters.');
  if (form.description.trim().length < 20) throw new Error('Description must contain at least 20 characters.');
  if (!/^\d{6}$/.test(form.pincode)) throw new Error('Pincode must contain six digits.');
  if (form.images.length < 3) throw new Error('Upload at least three property images before submission.');
  draftPayload(form, null, capEnabled);
}

export default function PropertyWizard({ mode = 'broker', propertyId, onSaved, onSubmitted }) {
  const { api, user, constants, features, sessionKey } = useAuth();
  const resource = useResource(() => api.properties.detail(propertyId), [propertyId], !!propertyId);
  const [saved, setSaved] = useState(null); const [form, setForm] = useState(() => initialForm());
  const [step, setStep] = useState(0); const [pending, setPending] = useState(false); const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null); const [message, setMessage] = useState(''); const [confirm, setConfirm] = useState(false);
  const account = useRef(sessionKey); account.current = sessionKey;
  useEffect(() => { account.current = sessionKey; return () => { account.current = null; }; }, [sessionKey]);
  const currentId = saved?._id ?? propertyId;
  const broker = mode === 'broker';
  const approved = !broker || user?.brokerApproved;
  const correctRole = broker ? user?.role === 'BROKER' : user?.role === 'ADMIN';
  const editable = !saved || ['DRAFT', 'REJECTED'].includes(saved.status);
  useEffect(() => { if (resource.data) { setSaved(resource.data); setForm(initialForm(resource.data)); } }, [resource.data]);
  function change(field, value) { setForm(previous => ({ ...previous, [field]: value })); setMessage(''); }
  async function save(moveTo) {
    setPending(true); setError(null); setMessage(''); const accountAtStart = account.current;
    try {
      const payload = draftPayload(form, saved, features.ownershipCap);
      const result = currentId ? await api.properties.update(currentId, payload) : await api.properties.create(payload);
      if (account.current !== accountAtStart) return;
      setSaved(result); setMessage('Draft saved. Your changes are stored on the server.');
      onSaved?.(result);
      if (moveTo != null) setStep(moveTo);
      return result;
    } catch (failure) { if (account.current === accountAtStart) setError(failure); }
    finally { if (account.current === accountAtStart) setPending(false); }
  }
  function reviewSubmission() {
    setError(null);
    try { submissionErrors(form, features.ownershipCap); setConfirm(true); } catch (failure) { setError(failure); }
  }
  async function submit() {
    const accountAtStart = account.current;
    setPending(true); setError(null);
    try {
      submissionErrors(form, features.ownershipCap);
      const payload = draftPayload(form, saved, features.ownershipCap);
      const draft = currentId ? await api.properties.update(currentId, payload) : await api.properties.create(payload);
      if (account.current !== accountAtStart) return;
      setSaved(draft);
      const result = await api.properties.submit(draft._id);
      if (account.current !== accountAtStart) return;
      setSaved(result); setConfirm(false); setMessage('Listing submitted for administrator approval. Editing is locked during review.'); onSubmitted?.(result);
    } catch (failure) { if (account.current === accountAtStart) { setConfirm(false); setError(failure); } }
    finally { if (account.current === accountAtStart) setPending(false); }
  }
  async function upload(event) {
    const files = Array.from(event.target.files ?? []); event.target.value = '';
    const accountAtStart = account.current;
    setError(null); setUploading(true);
    try {
      for (const file of files) {
        if (!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type)) throw new Error('Use JPG, PNG, WEBP or PDF files.');
        if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} exceeds the 5 MB file limit.`);
        const media = await api.uploads.create(file, 'property');
        if (account.current !== accountAtStart) return;
        const collection = file.type === 'application/pdf' ? 'documents' : 'images';
        setForm(previous => ({ ...previous, [collection]: [...previous[collection], media] }));
      }
      if (account.current === accountAtStart) setMessage('Upload complete. Save the draft to attach these files.');
    } catch (failure) { if (account.current === accountAtStart) setError(failure); }
    finally { if (account.current === accountAtStart) setUploading(false); }
  }
  let preview = null; let previewError = null;
  try { preview = provisionalUnitPrice(form.valuation ? parseRupees(form.valuation) : null, form.totalUnits ? parsePositiveInteger(form.totalUnits, 'Total units') : null); } catch (failure) { previewError = failure.message; }
  const input = (field, label, props = {}) => <Field name={field} label={label} value={form[field]} onChange={event => change(field, event.target.value)} disabled={pending || uploading} {...props} />;
  if (!correctRole) return <Notice warning>This listing form is available to the matching broker or administrator role.</Notice>;
  if (propertyId && resource.loading) return <p role="status">Loading listing draft…</p>;
  if (resource.error) return <><ErrorNotice error={resource.error} /><button className="dv-button dv-secondary" onClick={resource.reload}>Try again</button></>;
  return <div className="dv-wizard">
    {!approved && <Notice warning>Your broker approval is pending. You can create listings after an administrator approves your account.</Notice>}
    {saved?.rejectionReason && <Notice warning>Administrator feedback: {saved.rejectionReason}. Correct the listing and resubmit.</Notice>}
    {saved && <p><Status value={saved.status} /> <small>Listing {saved._id}</small></p>}
    {message && <Notice>{message}</Notice>}<ErrorNotice error={error} />
    {!editable ? <div className="dv-panel"><h2>Listing is locked</h2><p>Only draft or rejected listings can be edited here. Follow its progress on the property detail page.</p><Link className="dv-button dv-secondary" to={`/${mode}/properties/${currentId}`}>View listing</Link></div> : <>
    <ol className="dv-steps" aria-label="Listing progress">{steps.map((label, index) => <li key={label}><button type="button" aria-current={step === index ? 'step' : undefined} disabled={pending || uploading} onClick={() => setStep(index)}><span>{index + 1}</span>{label}</button></li>)}</ol>
    <div className="dv-two-col"><Form error={error} className="dv-panel" aria-label="Property listing" onSubmit={event => { event.preventDefault(); if (approved && !pending && !uploading) save(); }}><h2>{steps[step]}</h2><p className="dv-muted">{step === 4 ? 'Check your listing before sending it for approval.' : 'Save a partial draft at any step. Complete all required details before submission.'}</p><fieldset disabled={!approved || pending || uploading} style={{ border: 0, padding: 0, margin: 0 }}><legend className="dv-visually-hidden">{steps[step]} listing fields</legend>
      {step === 0 && <div className="dv-form">{input('title','Property title',{maxLength:150,help:'3–150 characters when submitted.'})}<Field name="description" label="Description"><textarea value={form.description} maxLength={10000} onChange={event => change('description', event.target.value)} /></Field><Field name="type" label="Property type"><select value={form.type} onChange={event => change('type', event.target.value)}><option value="">Choose a property type</option>{enumValues(constants.PROPERTY_TYPES).map(type => <option key={type} value={type}>{humanize(type)}</option>)}</select></Field>{input('areaSqft','Area (sq ft)',{inputMode:'decimal'})}</div>}
      {step === 1 && <div className="dv-form-grid"><div className="dv-span">{input('address','Street address',{maxLength:300})}</div>{input('city','City',{maxLength:100})}{input('state','State',{maxLength:100})}{input('pincode','Pincode',{inputMode:'numeric',maxLength:6,help:'Six digits.'})}{input('lat','Latitude (optional)',{inputMode:'decimal'})}{input('lng','Longitude (optional)',{inputMode:'decimal'})}</div>}
      {step === 2 && <div className="dv-form-grid">{input('valuation','Valuation (₹)',{inputMode:'decimal',help:'Full rupee amount without commas; up to 2 decimal places.'})}{input('totalUnits','Total units',{inputMode:'numeric'})}{input('minUnits','Minimum units per purchase',{inputMode:'numeric',help:'Positive whole number, no more than total units.'})}{features.ownershipCap && input('maxUnitsPerInvestor','Maximum units per investor (optional)',{inputMode:'numeric',help:'Leave blank to apply the platform cap.'})}{input('expectedAppreciationPct','Expected appreciation (%)',{inputMode:'decimal',help:'Projection assumption, 0–100%.'})}{input('rentalYieldPct','Rental yield (%)',{inputMode:'decimal',help:'Disclosure only; rent distribution is unavailable.'})}{input('holdingPeriodMonths','Holding period (months)',{inputMode:'numeric'})}<Field label="Saved server unit price" value={money(saved?.unitPrice)} readOnly help="Computed by the server after financials are saved." /></div>}
      {step === 3 && <><Field name="images" label="Upload property images or documents" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={upload} help="JPG, PNG, WEBP or PDF. Maximum 5 MB each. At least 3 images before submission." />{uploading && <p role="status">Uploading files…</p>}<div className="dv-media">{form.images.map((media,index) => <figure key={media.publicId}><img src={media.url} alt={`Property image ${index+1}: ${media.name}`} /><figcaption>{media.name}</figcaption><button type="button" className="dv-text" onClick={() => change('images', form.images.filter((_,position) => position !== index))}>Remove image {index+1}</button></figure>)}</div><ul className="dv-document-list">{form.documents.map((media,index) => <li key={media.publicId}><a href={media.url} target="_blank" rel="noreferrer">{media.name}</a> <button type="button" className="dv-text" onClick={() => change('documents',form.documents.filter((_,position) => position !== index))}>Remove document</button></li>)}</ul></>}
      {step === 4 && <><dl className="dv-dl">{[['Property',form.title || 'Not supplied'],['Type',form.type ? humanize(form.type) : 'Not supplied'],['City',form.city || 'Not supplied'],['Address',[form.address,form.state,form.pincode].filter(Boolean).join(', ') || 'Not supplied'],['Area',form.areaSqft ? `${form.areaSqft} sq ft` : 'Not supplied'],['Images',form.images.length],['Documents',form.documents.length],['Expected appreciation',form.expectedAppreciationPct ? `${form.expectedAppreciationPct}%` : 'Not supplied'],['Rental yield',form.rentalYieldPct ? `${form.rentalYieldPct}%` : 'Not supplied'],['Holding period',form.holdingPeriodMonths ? `${form.holdingPeriodMonths} months` : 'Not supplied']].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="dv-property-description" style={{marginTop:24}}>{form.description || 'Description not supplied.'}</p><Notice warning>Submission sends this listing for administrator review. It remains unavailable to investors until approved. Editing is locked while review is pending.</Notice></>}
    </fieldset><div className="dv-actions dv-wizard-actions"><button type="submit" className="dv-button dv-secondary" disabled={pending || uploading || !approved}>{pending ? 'Saving…' : 'Save draft'}</button><div className="dv-actions">{step > 0 && <button type="button" className="dv-button dv-secondary" disabled={pending || uploading} onClick={() => setStep(step - 1)}>Back</button>}{step < 4 ? <button type="button" className="dv-button" disabled={pending || uploading || !approved} onClick={() => save(step+1)}>Save & continue</button> : <button type="button" className="dv-button" disabled={pending || uploading || !approved} onClick={reviewSubmission}>Submit for review</button>}</div></div></Form>
    <aside className="dv-panel dv-review"><p className="dv-kicker">Financial review</p><h2>{form.title || 'Your new listing'}</h2><dl className="dv-dl"><div><dt>Valuation</dt><dd>{form.valuation && !previewError ? money(parseRupees(form.valuation)) : '—'}</dd></div><div><dt>Total units</dt><dd>{form.totalUnits || '—'}</dd></div><div><dt>Provisional unit price</dt><dd>{money(preview)}</dd></div><div><dt>Saved server unit price</dt><dd>{money(saved?.unitPrice)}</dd></div></dl>{previewError && <p className="dv-field-error" style={{marginTop:16}}>{previewError}</p>}<p style={{marginTop:24}}>The local preview is provisional. The server validates the valuation and derives the final unit price. Each unit must have a whole-rupee price.</p><p>Appreciation is an estimate and does not guarantee returns.</p><div className="dv-summary-link"><span>Images attached</span><strong>{form.images.length} / 3 minimum</strong></div></aside></div>
    </>}
    <Confirm open={confirm} title="Submit listing for approval?" pending={pending} onCancel={() => setConfirm(false)} onConfirm={submit}><p><strong>{form.title}</strong></p><p>Your latest changes will be saved and sent for administrator review. You cannot edit the listing while approval is pending.</p><dl className="dv-dl"><div><dt>Valuation</dt><dd>{form.valuation && !previewError ? money(parseRupees(form.valuation)) : '—'}</dd></div><div><dt>Units</dt><dd>{form.totalUnits}</dd></div></dl><p style={{marginTop:24}}>No investment or money movement happens on submission.</p></Confirm>
  </div>;
}

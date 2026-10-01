import React from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../auth/DevangUI.jsx';
import EnquiryThreads from '../broker/EnquiryThreads.jsx';
export default function InvestorEnquiries(){return <Page title="Your property conversations" eyebrow="Investor enquiries" actions={<Link className="dv-button dv-secondary" to="/properties">Find a property</Link>}><p className="dv-portfolio-intro">Ask a broker from a published property detail page, then follow the conversation here.</p><section className="dv-panel"><EnquiryThreads/></section></Page>;}

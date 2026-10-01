import React from 'react';
import { Page } from '../auth/DevangUI.jsx';
import EnquiryThreads from './EnquiryThreads.jsx';

export default function BrokerEnquiries() {
  return (
    <Page title="Client Enquiries" eyebrow="Investor Conversations">
      <EnquiryThreads />
    </Page>
  );
}

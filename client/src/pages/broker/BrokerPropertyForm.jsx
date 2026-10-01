import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Page } from '../auth/DevangUI.jsx';
import PropertyWizard from '../../features/broker/PropertyWizard.jsx';
export default function BrokerPropertyForm() {
  const { id } = useParams();
  return <Page title={id ? 'Edit property listing' : 'Create a property listing'} eyebrow="Five steps to a complete listing" actions={<Link className="dv-button dv-secondary" to="/broker/properties">All listings</Link>}><PropertyWizard propertyId={id}/></Page>;
}

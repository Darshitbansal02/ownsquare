import React from 'react';
import {Link,Routes,Route} from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';
import Login from '../pages/auth/Login.jsx';
import Signup from '../pages/auth/Signup.jsx';
import ForgotPassword from '../pages/auth/ForgotPassword.jsx';
import ResetPassword from '../pages/auth/ResetPassword.jsx';
import Profile from '../pages/profile/Profile.jsx';
import Notifications from '../pages/notifications/Notifications.jsx';
import BrokerDashboard from '../pages/broker/BrokerDashboard.jsx';
import BrokerProperties from '../pages/broker/BrokerProperties.jsx';
import BrokerPropertyForm from '../pages/broker/BrokerPropertyForm.jsx';
import BrokerPropertyDetail from '../pages/broker/BrokerPropertyDetail.jsx';
import Landing from '../pages/public/Landing.jsx';
import Marketplace from '../pages/public/Marketplace.jsx';
import PropertyDetail from '../pages/public/PropertyDetail.jsx';
import InvestorDashboard from '../pages/investor/InvestorDashboard.jsx';
import Portfolio from '../pages/investor/Portfolio.jsx';
import HoldingDetail from '../pages/investor/HoldingDetail.jsx';
import InvestCheckout from '../pages/investor/InvestCheckout.jsx';
import Wallet from '../pages/investor/Wallet.jsx';
import Kyc from '../pages/investor/Kyc.jsx';
import InvestorEnquiries from '../pages/investor/InvestorEnquiries.jsx';
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import AdminProperties from '../pages/admin/AdminProperties.jsx';
import PropertySale from '../pages/admin/PropertySale.jsx';
import AdminUsers from '../pages/admin/AdminUsers.jsx';
import AdminKyc from '../pages/admin/AdminKyc.jsx';
import AdminWithdrawals from '../pages/admin/AdminWithdrawals.jsx';
import AdminSettings from '../pages/admin/AdminSettings.jsx';
import {Page} from '../pages/auth/DevangUI.jsx';
export default function AppRoutes() {
  const {constants,sessionKey}=useAuth();
  return <Routes>
    <Route path="/" element={<Landing/>}/><Route path="/properties" element={<Marketplace/>}/><Route path="/properties/:id" element={<PropertyDetail/>}/>
    <Route path="/login" element={<Login/>}/><Route path="/signup" element={<Signup/>}/><Route path="/forgot-password" element={<ForgotPassword/>}/><Route path="/reset/:token" element={<ResetPassword/>}/>
    <Route element={<ProtectedRoute key={sessionKey}/>}><Route path="/profile" element={<Profile/>}/><Route path="/notifications" element={<Notifications/>}/>
      <Route element={<RoleRoute roles={[constants.ROLES.BROKER]}/>}><Route path="/broker" element={<BrokerDashboard/>}/><Route path="/broker/properties" element={<BrokerProperties/>}/><Route path="/broker/properties/new" element={<BrokerPropertyForm/>}/><Route path="/broker/properties/:id/edit" element={<BrokerPropertyForm/>}/><Route path="/broker/properties/:id" element={<BrokerPropertyDetail/>}/></Route>
      <Route element={<RoleRoute roles={[constants.ROLES.ADMIN]}/>}><Route path="/admin" element={<AdminDashboard/>}/><Route path="/admin/properties" element={<AdminProperties/>}/><Route path="/admin/properties/:id/sell" element={<PropertySale/>}/><Route path="/admin/users" element={<AdminUsers/>}/><Route path="/admin/kyc" element={<AdminKyc/>}/><Route path="/admin/withdrawals" element={<AdminWithdrawals/>}/><Route path="/admin/settings" element={<AdminSettings/>}/></Route>
      <Route element={<RoleRoute roles={[constants.ROLES.INVESTOR]}/>}><Route path="/investor" element={<InvestorDashboard/>}/><Route path="/investor/portfolio" element={<Portfolio/>}/><Route path="/investor/portfolio/:propertyId" element={<HoldingDetail/>}/><Route path="/investor/invest/:id" element={<InvestCheckout/>}/><Route path="/investor/wallet" element={<Wallet/>}/><Route path="/investor/kyc" element={<Kyc/>}/><Route path="/investor/enquiries" element={<InvestorEnquiries/>}/></Route>
    </Route>
    <Route path="/403" element={<Page title="Access denied"><p>Your account does not have access to this page.</p><Link to="/">Return to your workspace</Link></Page>}/>
    <Route path="*" element={<Page title="Page not found"><Link to="/">Return home</Link></Page>}/>
  </Routes>;
}

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import cobytesTheme from './theme/cobytes-theme';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ScanNew from './pages/ScanNew';
import ScanList from './pages/ScanList';
import ScanDetail from './pages/ScanDetail';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import AllScanners from './pages/AllScanners';
import HowTo from './pages/HowTo';
import ApiStatus from './pages/ApiStatus';
import DirectScan from './pages/DirectScan';
import CorsTest from './pages/CorsTest';
import ProxyScan from './pages/ProxyScan';
import CorsProxyTest from './pages/CorsProxyTest';
import AllScannersNew from './pages/AllScannersNew';
import IntegrationStatus from './pages/IntegrationStatus';
import ScanStatus from './pages/ScanStatus';
import ScanDemo from './pages/ScanDemo';
import SecurityDashboard from './pages/SecurityDashboard';
import Reports from './pages/Reports';
import FreeScan from './pages/FreeScan';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderPayment from './pages/OrderPayment';
import OrderSuccess from './pages/OrderSuccess';
import OrderCancelled from './pages/OrderCancelled';
import './App.css';

function App() {
  return (
    <ThemeProvider theme={cobytesTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/products" element={<Products />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders/:orderId/pay" element={<OrderPayment />} />
          <Route path="/orders/:orderId/success" element={<OrderSuccess />} />
          <Route path="/orders/:orderId/cancelled" element={<OrderCancelled />} />
          <Route path="/free-scan" element={<FreeScan />} />
          <Route path="/all-scanners-new" element={<AllScannersNew />} />
          <Route path="/integration-status" element={<IntegrationStatus />} />
          <Route path="/scan-status/:scanId" element={<ScanStatus />} />
          <Route path="/scan-demo" element={<FreeScan />} />
          <Route path="/security-dashboard" element={<SecurityDashboard />} />
          <Route path="/dashboard" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="scans" element={<ScanList />} />
            <Route path="scans/new" element={<ScanNew />} />
            <Route path="scans/:id" element={<ScanDetail />} />
            <Route path="reports" element={<Reports />} />
            <Route path="scanners" element={<AllScanners />} />
            <Route path="how-to" element={<HowTo />} />
            <Route path="api-status" element={<ApiStatus />} />
            <Route path="direct-scan" element={<DirectScan />} />
            <Route path="cors-test" element={<CorsTest />} />
            <Route path="proxy-scan" element={<ProxyScan />} />
            <Route path="cors-proxy-test" element={<CorsProxyTest />} />
            <Route path="all-scanners" element={<AllScannersNew />} />
            <Route path="integration" element={<IntegrationStatus />} />
            <Route path="pricing" element={<Pricing />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
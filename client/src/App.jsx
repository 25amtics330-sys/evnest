import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import MapPage from './pages/MapPage';
import Login from './pages/Login';
import Register from './pages/Register';
import RangeCalculator from './pages/RangeCalculator';
import ChargerDetail from './pages/ChargerDetail';
import BookingPage from './pages/BookingPage';
import UserDashboard from './pages/UserDashboard';
import MerchantDashboard from './pages/MerchantDashboard';
import MerchantBookings from './pages/MerchantBookings';
import AddEditCharger from './pages/AddEditCharger';

const App = () => {
  return (
    <Router>
      <div className="flex h-screen flex-col bg-slate-50 text-slate-800 overflow-hidden">
        <Navbar />
        <main className="flex-1 flex flex-col overflow-y-auto scroll-smooth">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <MapPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/range-calculator" 
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <RangeCalculator />
                </ProtectedRoute>
              } 
            />

            {/* Driver/User Routes */}
            <Route 
              path="/charger/:id" 
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <ChargerDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/booking/:id" 
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <BookingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Merchant Routes */}
            <Route 
              path="/merchant" 
              element={
                <ProtectedRoute allowedRoles={['merchant']}>
                  <MerchantDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/merchant/bookings" 
              element={
                <ProtectedRoute allowedRoles={['merchant']}>
                  <MerchantBookings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/merchant/add" 
              element={
                <ProtectedRoute allowedRoles={['merchant']}>
                  <AddEditCharger />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/merchant/edit/:id" 
              element={
                <ProtectedRoute allowedRoles={['merchant']}>
                  <AddEditCharger />
                </ProtectedRoute>
              } 
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;

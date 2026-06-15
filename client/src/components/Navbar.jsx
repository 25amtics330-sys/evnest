import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Menu, X, LogOut, User, MapPin, Calculator, ShieldAlert, BookOpen } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) => 
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
      isActive(path) 
        ? 'bg-emerald-50 text-emerald-700' 
        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
    }`;

  return (
    <nav className="glass-panel sticky top-0 z-[1000] w-full px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
            <Zap className="h-4.5 w-4.5 fill-current" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            EV<span className="text-emerald-600">Nest</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {user && user.role === 'user' && (
            <>
              <Link to="/" className={linkClass('/')}>
                <MapPin className="h-4 w-4" />
                Charger Map
              </Link>
              <Link to="/range-calculator" className={linkClass('/range-calculator')}>
                <Calculator className="h-4 w-4" />
                Range Calc
              </Link>
              <Link to="/dashboard" className={linkClass('/dashboard')}>
                <BookOpen className="h-4 w-4" />
                My Bookings
              </Link>
            </>
          )}

          {user && user.role === 'merchant' && (
            <>
              <Link to="/merchant" className={linkClass('/merchant')}>
                <Zap className="h-4 w-4" />
                Host Console
              </Link>
              <Link to="/merchant/bookings" className={linkClass('/merchant/bookings')}>
                <BookOpen className="h-4 w-4" />
                Incoming Bookings
              </Link>
            </>
          )}
        </div>

        {/* Right side Profile & Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800">{user.name}</span>
                  <span className="text-xs text-slate-400 capitalize">{user.role === 'merchant' ? 'Host' : 'Driver'}</span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors duration-200"
              >
                Login
              </Link>
              <Link 
                to="/register"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm transition-all duration-200"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mt-3 rounded-xl bg-white border border-slate-200 p-4 space-y-1 shadow-lg">
          {user && user.role === 'user' && (
            <>
              <Link 
                to="/" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <MapPin className="h-5 w-5 text-emerald-600" />
                Charger Map
              </Link>
              <Link 
                to="/range-calculator" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <Calculator className="h-5 w-5 text-emerald-600" />
                Range Calculator
              </Link>
              <Link 
                to="/dashboard" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <BookOpen className="h-5 w-5 text-emerald-600" />
                My Bookings
              </Link>
            </>
          )}

          {user && user.role === 'merchant' && (
            <>
              <Link 
                to="/merchant" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <Zap className="h-5 w-5 text-emerald-600" />
                Host Console
              </Link>
              <Link 
                to="/merchant/bookings" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <BookOpen className="h-5 w-5 text-emerald-600" />
                Incoming Bookings
              </Link>
            </>
          )}

          <div className="border-t border-slate-100 pt-3 mt-2">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-3">
                  <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{user.name}</div>
                    <div className="text-xs text-slate-400 capitalize">{user.role === 'merchant' ? 'Host' : 'Driver'}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-red-500 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

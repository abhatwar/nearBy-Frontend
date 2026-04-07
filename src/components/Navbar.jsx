import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); setDropdownOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    const load = async () => {
      try {
        const { data } = await api.get('/admin/stats');
        setPendingCount(data.stats?.pendingBusinesses || 0);
      } catch { /* ignore */ }
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [user]);

  const handleLogout = () => { logout(); navigate('/'); };

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
        location.pathname === to
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow">
              📍
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">
              Nearby<span className="text-blue-600">Finder</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLink('/', 'Explore')}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`relative text-sm font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/admin' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                Admin
                {pendingCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Link>
            )}
            {(user?.role === 'enterprise' || user?.role === 'admin') && navLink('/enterprise', 'Dashboard')}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            {!user ? (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors px-3 py-1.5">
                  Sign In
                </Link>
                <Link to="/register" className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm">
                  Get Started
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800 leading-tight">{user.name.split(' ')[0]}</p>
                    <p className="text-[10px] text-gray-400 capitalize leading-tight">{user.role}</p>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-50">
                      <p className="font-semibold text-gray-800 text-sm">{user.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{user.role} account</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1 pb-4">
            <Link to="/" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">
              🏠 Explore
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">
                ⚙️ Admin Dashboard
                {pendingCount > 0 && <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{pendingCount}</span>}
              </Link>
            )}
            {(user?.role === 'enterprise' || user?.role === 'admin') && (
              <Link to="/enterprise" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">
                📊 Dashboard
              </Link>
            )}
            <div className="border-t border-gray-100 mt-2 pt-2">
              {!user ? (
                <>
                  <Link to="/login" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">
                    Sign In
                  </Link>
                  <Link to="/register" className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold mt-1">
                    Get Started Free
                  </Link>
                </>
              ) : (
                <>
                  <div className="px-3 py-2 text-xs text-gray-400">{user.name} · {user.role}</div>
                  <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 text-sm font-medium">
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {dropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />}
    </nav>
  );
}

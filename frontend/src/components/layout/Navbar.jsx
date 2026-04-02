import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close mobile menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200" ref={menuRef}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link 
              to="/" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-xl font-bold text-indigo-600"
            >
              CampusLostFound
            </Link>
            
            {/* Desktop Nav Links */}
            <div className="hidden md:flex space-x-6">
              <Link to="/posts" className="text-gray-600 hover:text-indigo-600 font-medium transition">
                Browse Posts
              </Link>
              {isAuthenticated && (
                <>
                  <Link to="/posts/new" className="text-gray-600 hover:text-indigo-600 font-medium transition">
                    Report Item
                  </Link>
                  <Link to="/my-posts" className="text-gray-600 hover:text-indigo-600 font-medium transition">
                    My Posts
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Desktop Right Side Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  {user.name} ({user.role})
                </span>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
  <div className="flex items-center gap-3">
    <Link
      to="/login"
      className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition"
    >
      Login
    </Link>
    <Link
      to="/register"
      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
    >
      Register
    </Link>
  </div>
)}

          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white absolute top-16 left-0 right-0 shadow-lg">
          <div className="px-4 pt-2 pb-4 space-y-1 sm:px-6">
            <Link 
              to="/posts" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
            >
              Browse Posts
            </Link>
            {isAuthenticated && (
              <>
                <Link 
                  to="/posts/new" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                >
                  Report Item
                </Link>
                <Link 
                  to="/my-posts" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                >
                  My Posts
                </Link>
                <div className="border-t border-gray-100 my-2 pt-2">
                  <div className="px-3 py-2 text-sm font-medium text-gray-500">
                    Signed in as <span className="text-gray-900">{user.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="mt-1 block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md transition"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
            {!isAuthenticated && (
              <div className="border-t border-gray-100 mt-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 mt-2 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

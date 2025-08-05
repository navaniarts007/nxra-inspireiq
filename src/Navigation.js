import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

export default function Navigation() {
  const { currentUser, loginWithGoogle, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleAuthAction = async () => {
    try {
      if (currentUser) {
        await logout();
      } else {
        await loginWithGoogle();
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  const NavLink = ({ href, children, icon, badge }) => (
    <a
      href={href}
      className="group flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white relative"
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span>{children}</span>
      {badge && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {badge}
        </span>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-600/0 group-hover:from-blue-500/5 group-hover:to-purple-600/5 rounded-xl transition-all duration-200"></div>
    </a>
  );

  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );

  return (
    <nav className="sticky top-0 z-50 glass border-b border-slate-200/50 dark:border-slate-700/50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <a href="/" className="group flex items-center space-x-3">
              <div className="relative">
                <img 
                  src="/logo.jpg" 
                  alt="NXRA insights Pvt. Ltd. Logo" 
                  className="w-10 h-10 object-contain group-hover:scale-105 transition-all duration-300 text-slate-900 dark:text-white"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 hidden">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  NXRA InspireIQ
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Technology that Thinks Ahead</p>
              </div>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            {currentUser && (
              <>
                <NavLink href="/" icon="✨">New Analysis</NavLink>
                <NavLink href="/history" icon="📚">History</NavLink>
                <NavLink href="/dashboard" icon="📊" badge="New">Dashboard</NavLink>
              </>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            
            {currentUser ? (
              <div className="flex items-center space-x-3">
                {/* User Profile */}
                <div className="hidden md:flex items-center space-x-3 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2">
                  <img
                    src={currentUser.photoURL || '/default-avatar.png'}
                    alt="Profile"
                    className="w-8 h-8 rounded-lg border-2 border-white dark:border-slate-700 shadow-sm"
                  />
                  <div className="text-sm">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {currentUser.displayName?.split(' ')[0] || 'User'}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                      {currentUser.email?.substring(0, 20)}...
                    </p>
                  </div>
                </div>
                
                {/* Sign Out Button */}
                <button
                  onClick={handleAuthAction}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span className="hidden md:inline">Sign Out</span>
                  <span className="md:hidden">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleAuthAction}
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300 -z-10"></div>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && currentUser && (
          <div className="lg:hidden py-4 border-t border-slate-200 dark:border-slate-700">
            <div className="space-y-2">
              <NavLink href="/" icon="✨">New Analysis</NavLink>
              <NavLink href="/history" icon="📚">History</NavLink>
              <NavLink href="/dashboard" icon="📊" badge="New">Dashboard</NavLink>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

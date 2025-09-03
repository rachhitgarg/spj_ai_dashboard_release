import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  BookOpen, 
  Users, 
  Target, 
  Building2, 
  Upload, 
  User,
  X,
  GraduationCap
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/overview', icon: BarChart3 },
  { name: 'AI Tutor', href: '/ai-tutor', icon: BookOpen },
  { name: 'AI Mentor', href: '/ai-mentor', icon: Users },
  { name: 'JPT', href: '/jpt', icon: Target },
  { name: 'Placements', href: '/placements', icon: Building2 },
  { name: 'Data Uploader', href: '/data-uploader', icon: Upload },
];

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">SPJ AI</span>
            </div>
            <button
              className="lg:hidden"
              onClick={() => setOpen(false)}
            >
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <Link
              to="/profile"
              className={`sidebar-link ${location.pathname === '/profile' ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <User className="mr-3 h-5 w-5" />
              Profile
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;


import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard,
  Image,
  Info,
  Building,
  Award,
  FolderTree,
  Package,
  FileText,
  Briefcase,
  Users,
  Phone,
  LogOut,
  Menu,
  X
} from 'lucide-react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/hero-banners', icon: Image, label: 'Hero Banners' },
    { path: '/admin/about-us', icon: Info, label: 'About Us' },
    { path: '/admin/corporate-entities', icon: Building, label: 'Corporate Entities' },
    { path: '/admin/company-profiles-admin', icon: Building, label: 'Admin Company Profiles' },
    { path: '/admin/certifications', icon: Award, label: 'Certifications' },
    { path: '/admin/product-categories', icon: FolderTree, label: 'Product Categories' },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/articles', icon: FileText, label: 'Articles' },
    { path: '/admin/careers', icon: Briefcase, label: 'Careers' },
    { path: '/admin/applications', icon: Users, label: 'Applications' },
    { path: '/admin/contact-info', icon: Phone, label: 'Contact Info' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside 
          className={`${
            sidebarOpen ? 'w-64' : 'w-16'
          } bg-white shadow-sm border-r border-gray-200 min-h-screen transition-all duration-300 fixed lg:relative z-10`}
        >
          <nav className="p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.exact}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    <item.icon className={`h-5 w-5 ${sidebarOpen ? 'mr-3' : ''}`} />
                    {sidebarOpen && <span>{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 ${sidebarOpen ? 'lg:ml-0' : ''} p-6`}>
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-5 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;

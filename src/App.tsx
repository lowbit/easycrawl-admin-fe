import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppSidebar } from '@/layouts/AppSidebar';
import { TopBar } from '@/layouts/TopBar';
import Dashboard from '@/pages/Dashboard';
import CrawlerRawPage from '@/pages/CrawlerRawPage';
import CrawlerConfigsPage from '@/pages/CrawlerConfigsPage';
import JobsPage from '@/pages/JobsPage';
import ProductsPage from '@/pages/ProductsPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import RegistryPage from '@/pages/RegistryPage';
import Login from '@/pages/Login';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Database, Settings, List, Package, ClipboardList } from 'lucide-react';

const menuItems = [
  {
    text: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    text: 'Products',
    icon: Package,
    path: '/products',
  },
  {
    text: 'System Registry',
    icon: ClipboardList,
    path: '/registry',
  },
  {
    text: 'Crawler Raw',
    icon: Database,
    path: '/crawler-raw',
  },
  {
    text: 'Crawler Configs',
    icon: Settings,
    path: '/crawler-configs',
  },
  {
    text: 'Jobs',
    icon: List,
    path: '/jobs',
  },
];

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <>
      {!isAuthenticated ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div className="flex h-screen">
          <AppSidebar
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
            menuItems={menuItems}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar darkMode={darkMode} onToggleTheme={toggleTheme} />
            <main className="flex-1 overflow-y-auto p-4">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/registry" element={<RegistryPage />} />
                <Route path="/crawler-raw" element={<CrawlerRawPage />} />
                <Route path="/crawler-configs" element={<CrawlerConfigsPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      )}
      <Toaster />
    </>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

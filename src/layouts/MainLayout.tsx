import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Package,
  Code2,
  Briefcase,
  Brain,
  LucideIcon,
  Settings
} from 'lucide-react';
import { AppSidebar } from '@/layouts/AppSidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { useLocation } from 'react-router-dom';

interface MenuItem {
  text: string;
  icon: LucideIcon;
  path: string;
}

const menuItems: MenuItem[] = [
  { text: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { text: 'Products', icon: Package, path: '/products' },
  { text: 'Crawler Raw', icon: Code2, path: '/crawler-raw' },
  { text: 'Jobs', icon: Briefcase, path: '/jobs' },
  { text: 'AI', icon: Brain, path: '/ai' },
  { text: 'Registry', icon: Settings, path: '/registry' }
];

interface MainLayoutProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ darkMode, toggleTheme }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar
        collapsed={isCollapsed}
        onCollapsedChange={setIsCollapsed}
        menuItems={menuItems}
      />

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-dashed bg-background">
          <div className="flex items-center gap-2 px-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight/>
              ) : (
                <ChevronLeft />
              )}
            </Button>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href={location.pathname}>
                    {menuItems.find((item: MenuItem) => item.path === location.pathname)?.text || 'Current Page'}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className=""
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 
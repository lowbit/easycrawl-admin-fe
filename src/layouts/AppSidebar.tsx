import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LogOut,
  Bug,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface MenuItem {
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

interface AppSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  menuItems: MenuItem[];
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed,
  onCollapsedChange,
  menuItems,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Sidebar
      collapsible="icon"
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
      className="hidden md:flex border-r border-dashed p-0"
    >
      <SidebarHeader className="border-b border-dashed h-14 relative min-h-14">
        <div className={collapsed ? "flex gap-3 px-4" : "flex gap-3 px-4"}>
          <Bug className="h-6 w-6 shrink-0" />
          <span className={cn(
            "font-semibold whitespace-nowrap transition-all duration-300",
            collapsed && "hidden"
          )}>
            EasyCrawl Admin
          </span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onCollapsedChange(!collapsed)}
          className="absolute right-0 z-10 rounded-full translate-y-3/4 translate-x-1/2 border-dashed"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight/>
          ) : (
            <ChevronLeft  />
          )}
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="px-1">
          <nav className="grid gap-1 p-1">
            {menuItems.map((item) => (
              <Button
                key={item.text}
                variant={location.pathname === item.path ? 'secondary' : 'ghost'}
                className={
                  "justify-start px-3"
                }
                onClick={() => navigate(item.path)}
                title={collapsed ? item.text : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className={cn(
                  "ml-2 whitespace-nowrap transition-all duration-300",
                  collapsed && "hidden"
                )}>
                  {item.text}
                </span>
              </Button>
            ))}
          </nav>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t border-dashed">
        <div className="px-2 py-2">
          <Button
            variant="ghost"
            className={cn(
              "w-full px-3",
              collapsed ? "justify-center" : "justify-start"
            )}
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={cn(
              "ml-2 whitespace-nowrap transition-all duration-300",
              collapsed && "hidden"
            )}>
              Logout
            </span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}; 
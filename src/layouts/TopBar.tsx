import React from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface TopBarProps {
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ darkMode, onToggleTheme }) => {
  const location = useLocation();

  // Convert path segments to breadcrumb items
  const getBreadcrumbs = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return [{ text: 'Dashboard', path: '/' }];

    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      const text = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return { text, path };
    });
  };

  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <div className="h-14 min-h-14 border-b border-dashed px-4 flex items-center justify-between bg-background">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={item.path}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage>{item.text}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.path}>{item.text}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          className="h-9 w-9"
        >
          {darkMode ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}; 
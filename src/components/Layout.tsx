import { useState, useEffect } from 'react';
import { Moon, Sun, FileText, CheckSquare, Clock, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('focusNote-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('focusNote-theme', newTheme ? 'dark' : 'light');
  };

  const navItems = [
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'todos', label: 'To-Do', icon: CheckSquare },
    { id: 'timer', label: 'Timer', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background">
      {/* Navigation */}
      <nav className="glass-nav sticky top-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-gradient">FocusNote</h1>
            
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onTabChange(item.id)}
                    className={`
                      flex items-center space-x-2 transition-all duration-200
                      ${activeTab === item.id 
                        ? 'bg-primary text-primary-foreground shadow-glass' 
                        : 'hover:bg-surface-hover text-foreground-secondary'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-9 h-9 p-0 hover:bg-surface-hover"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-foreground-secondary" />
              ) : (
                <Moon className="w-4 h-4 text-foreground-secondary" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-9 h-9 p-0 hover:bg-surface-hover"
            >
              <Settings className="w-4 h-4 text-foreground-secondary" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden glass-nav border-t border-glass-border fixed bottom-0 left-0 right-0 z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => onTabChange(item.id)}
                className={`
                  flex flex-col items-center space-y-1 h-auto py-2 px-3
                  ${activeTab === item.id 
                    ? 'text-primary' 
                    : 'text-foreground-secondary'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
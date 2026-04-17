
"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Briefcase, 
  Mail, 
  FolderKanban, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Workflow
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'My Work', href: '/app/my-work', icon: Workflow },
  { name: 'Enquiries', href: '/app/enquiries', icon: Mail },
  { name: 'Projects', href: '/app/projects', icon: FolderKanban },
  { name: 'CRM', href: '/app/crm', icon: Users },
  { name: 'Admin', href: '/app/admin', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "flex flex-col border-r bg-white transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && (
          <span className="text-xl font-bold text-primary font-headline">Chrysalis Ops</span>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className={cn(
          "flex items-center gap-3",
          collapsed ? "flex-col" : "flex-row"
        )}>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-accent text-accent-foreground font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold">{user?.email?.split('@')[0] || 'User'}</p>
              <p className="truncate text-xs text-muted-foreground capitalize">Admin</p>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => signOut()}
            className={cn("text-muted-foreground hover:text-destructive", collapsed && "mt-2")}
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </aside>
  );
}

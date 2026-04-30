import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  BarChart3,
  Settings,
  Sparkles,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Pricing Engine', href: '/pricing', icon: Sparkles },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Data I/O', href: '/data-io', icon: Database },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-card px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-foreground">PriceAI</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    cn(
                      'group flex gap-x-3 rounded-md p-3 text-sm font-semibold leading-6 transition-colors',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer info */}
        <div className="mt-auto">
          <div className="rounded-lg bg-accent p-4">
            <p className="text-xs font-medium text-accent-foreground">AI-Powered</p>
            <p className="text-xs text-muted-foreground mt-1">
              Dynamic pricing optimization using machine learning
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

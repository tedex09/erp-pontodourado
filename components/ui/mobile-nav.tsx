'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useThemeStore } from '@/store/useThemeStore';
import { useEffect, useState } from 'react';
import {
  Home,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  Settings,
  Menu,
  Store,
  DollarSign,
  Clock,
  UserCheck,
  LogOut,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, roles: ['admin', 'vendedor', 'caixa', 'estoque'] },
  { name: 'PDV', href: '/pdv', icon: ShoppingCart, roles: ['admin', 'vendedor', 'caixa'] },
  { name: 'Clientes', href: '/customers', icon: Users, roles: ['admin', 'vendedor'] },
  { name: 'Produtos', href: '/products', icon: Package, roles: ['admin'] },
  { name: 'Categorias', href: '/categories', icon: Store, roles: ['admin'] },
  { name: 'Estoque', href: '/inventory', icon: Store, roles: ['admin', 'estoque'] },
  { name: 'Fiados', href: '/fiados', icon: DollarSign, roles: ['admin', 'vendedor', 'caixa'] },
  { name: 'Fluxo de Caixa', href: '/cash-management', icon: DollarSign, roles: ['admin'] },
  { name: 'Ponto', href: '/ponto', icon: Clock, roles: ['vendedor', 'caixa', 'estoque'] },
  { name: 'Campanhas', href: '/campaigns', icon: Users, roles: ['admin', 'vendedor'] },
  { name: 'Funcionários', href: '/employees', icon: UserCheck, roles: ['admin'] },
  { name: 'Folha Pagamento', href: '/payroll', icon: DollarSign, roles: ['admin'] },
  { name: 'Funções', href: '/roles', icon: UserCheck, roles: ['admin'] },
  { name: 'Relatórios', href: '/reports', icon: BarChart3, roles: ['admin'] },
   { name: 'Análise Inteligente', href: '/analytics', icon: Brain, roles: ['admin'] },
  { name: 'Configurações', href: '/settings', icon: Settings, roles: ['admin'] },
];

// Navegação principal para mobile (bottom nav)
const primaryNavigation = [
  { name: 'Início', href: '/', icon: Home },
  { name: 'PDV', href: '/pdv', icon: ShoppingCart },
  { name: 'Produtos', href: '/products', icon: Package },
  { name: 'Clientes', href: '/customers', icon: Users },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  
  const userRole = session?.user?.role || 'vendedor';
  
  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(userRole)
  );

  const filteredPrimaryNav = primaryNavigation.filter(item => {
    const navItem = navigation.find(nav => nav.href === item.href);
    return navItem ? navItem.roles.includes(userRole) : false;
  });

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="grid grid-cols-5 h-16">
        {filteredPrimaryNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors',
                isActive
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center space-y-1 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <Menu className="h-5 w-5" />
              <span>Mais</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <div className="py-4">
              <h2 className="text-lg font-semibold mb-4">Menu Completo</h2>
              <div className="grid grid-cols-2 gap-3">
                {filteredNavigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center space-x-3 p-3 rounded-lg border transition-colors',
                        isActive
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
              
              {/* Logout Button */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2 h-12 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sair</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

export function MobileHeader() {
  const { data: session } = useSession();
  const { companyName } = useThemeStore();
  const [logo, setLogo] = useState<string>('');
  
  useEffect(() => {
    const savedLogo = localStorage.getItem('company-logo');
    if (savedLogo) {
      setLogo(savedLogo);
    }
  }, []);
  
  return (
    <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 safe-area-top">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {logo ? (
            <img src={logo} alt={companyName} className="h-6 w-auto max-w-32" />
          ) : (
            <>
              <span className="text-lg font-semibold text-gray-900">
                {companyName}
              </span>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            {session?.user?.name}
          </Badge>
        </div>
      </div>
    </div>
  );
}
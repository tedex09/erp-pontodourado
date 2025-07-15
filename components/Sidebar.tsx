'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
  Home,
  ShoppingCart,
  Users,
  Package,
  UserCheck,
  BarChart3,
  Settings,
  Store,
  DollarSign,
  Clock,
  Brain,
  CreditCard,
  FileText,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, roles: ['admin', 'vendedor', 'caixa', 'estoque'] },
  { name: 'PDV', href: '/pdv', icon: ShoppingCart, roles: ['admin', 'vendedor', 'caixa'] },
  { name: 'Clientes', href: '/customers', icon: Users, roles: ['admin', 'vendedor'] },
  { name: 'Produtos', href: '/products', icon: Package, roles: ['admin', 'vendedor', 'estoque'] },
  { name: 'Categorias', href: '/categories', icon: Store, roles: ['admin'] },
  { name: 'Estoque', href: '/inventory', icon: Store, roles: ['admin', 'estoque'] },
  { name: 'Fiados', href: '/fiados', icon: CreditCard, roles: ['admin', 'vendedor', 'caixa'] },
  { name: 'Caixa', href: '/cash-management', icon: DollarSign, roles: ['admin', 'vendedor', 'caixa'] },
  { name: 'Ponto', href: '/ponto', icon: Clock, roles: ['admin', 'vendedor', 'caixa', 'estoque'] },
  { name: 'Campanhas', href: '/campaigns', icon: Users, roles: ['admin', 'vendedor'] },
  { name: 'Funcionários', href: '/employees', icon: UserCheck, roles: ['admin'] },
  { name: 'Folha Pagamento', href: '/payroll', icon: FileText, roles: ['admin'] },
  { name: 'Funções', href: '/roles', icon: UserCheck, roles: ['admin'] },
  { name: 'Relatórios', href: '/reports', icon: BarChart3, roles: ['admin'] },
  { name: 'Análise Inteligente', href: '/analytics', icon: Brain, roles: ['admin'] },
  { name: 'Configurações', href: '/settings', icon: Settings, roles: ['admin'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [companyName, setCompanyName] = useState('Ponto Dourado');
  const [logo, setLogo] = useState<string>('');
  
  const userRole = session?.user?.role || 'vendedor';
  
  useEffect(() => {
    const loadThemeSettings = async () => {
      try {
        const response = await fetch('/api/theme-settings');
        if (response.ok) {
          const settings = await response.json();
          setCompanyName(settings.companyName);
          setLogo(settings.logo || '');
        }
      } catch (error) {
        console.error('Error loading theme settings:', error);
        // Fallback to localStorage
        const cached = localStorage.getItem('theme-settings');
        if (cached) {
          const settings = JSON.parse(cached);
          setCompanyName(settings.companyName);
          setLogo(settings.logo || '');
        }
      }
    };

    loadThemeSettings();
  }, []);
  
  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(userRole)
  );
  
  return (
    <div className="hidden md:flex md:flex-shrink-0 h-screen">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-primary border-r border-primary">
          <div className="flex items-center flex-shrink-0 px-4">
            {logo ? (
              <img src={logo} alt={companyName} className="h-8 w-auto max-w-full" />
            ) : (
              <span className="ml-2 text-lg font-semibold text-white">
                {companyName}
              </span>
            )}
          </div>
          
          <div className="mt-12 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-white/20 text-yellow-500 !font-bold'
                        : 'border-transparent text-white/30 hover:text-yellow-500 hover:bg-white/5'
                    } group flex items-center pl-3 pr-4 py-2 border-l-4 text-sm rounded-sm font-light transition-colors duration-150`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-yellow-500' : 'group-hover:text-yellow-500'
                      } mr-3 h-5 w-5`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
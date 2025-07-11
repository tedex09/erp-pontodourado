'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Home,
  ShoppingCart,
  Users,
  Package,
  UserCheck,
  BarChart3,
  Settings,
  Store,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, roles: ['admin', 'vendedor', 'caixa', 'estoque'] },
  { name: 'PDV', href: '/pdv', icon: ShoppingCart, roles: ['admin', 'vendedor', 'caixa'] },
  { name: 'Clientes', href: '/customers', icon: Users, roles: ['admin', 'vendedor'] },
  { name: 'Produtos', href: '/products', icon: Package, roles: ['admin', 'vendedor', 'estoque'] },
  { name: 'Estoque', href: '/inventory', icon: Store, roles: ['admin', 'estoque'] },
  { name: 'Funcionários', href: '/employees', icon: UserCheck, roles: ['admin'] },
  { name: 'Relatórios', href: '/reports', icon: BarChart3, roles: ['admin'] },
  { name: 'Configurações', href: '/settings', icon: Settings, roles: ['admin'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const userRole = session?.user?.role || 'vendedor';
  
  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(userRole)
  );
  
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
          <div className="flex items-center flex-shrink-0 px-4">
            <Package className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-lg font-semibold text-gray-900">
              Bijuterias
            </span>
          </div>
          
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    } group flex items-center pl-3 pr-4 py-2 border-l-4 text-sm font-medium transition-colors duration-150`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
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
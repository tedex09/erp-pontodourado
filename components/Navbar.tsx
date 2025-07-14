'use client';

import { useSession, signOut } from 'next-auth/react';
import { User, LogOut, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { useThemeStore } from '@/store/useThemeStore';

export default function Navbar() {
  const { data: session } = useSession();
  
  return (
    <nav className="bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {session?.user?.name}
              </span>
              <span className="text-xs text-gray-500 capitalize">
                ({session?.user?.role})
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { MobileBottomNav, MobileHeader } from './ui/mobile-nav';
import { ThemeProvider } from './ThemeProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Clock, MapPin, AlertTriangle } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [hasClockIn, setHasClockIn] = useState<boolean | null>(null);
  const [hasCashRegister, setHasCashRegister] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isPDVPage = pathname === '/pdv';
  const isPontoPage = pathname === '/ponto';
  
  useEffect(() => {
    if (session && !isAuthPage && session.user.role !== 'admin') {
      checkClockInAndCash();
    } else {
      setLoading(false);
    }
  }, [session, pathname]);

  const checkClockInAndCash = async () => {
    try {
      // Check today's clock in
      const clockResponse = await fetch('/api/time-tracking/today');
      const clockData = clockResponse.ok ? await clockResponse.json() : [];
      const hasClockInToday = clockData.length > 0;
      
      // Check current cash register
      const cashResponse = await fetch('/api/cash-register/current');
      const cashData = cashResponse.ok ? await cashResponse.json() : null;
      const hasCashOpen = !!cashData;
      
      setHasClockIn(hasClockInToday);
      setHasCashRegister(hasCashOpen);
      
      // Redirect to ponto if needed and not already there
      if (!hasClockInToday && !isPontoPage) {
        router.push('/ponto');
        return;
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error checking clock in and cash:', error);
      setLoading(false);
    }
  };

  // Show loading for non-admin users while checking requirements
  if (loading && session && !isAuthPage && session.user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando requisitos...</p>
        </div>
      </div>
    );
  }

  // Show access restriction for non-admin users
  if (session && !isAuthPage && !isPontoPage && session.user.role !== 'admin' && (!hasClockIn || !hasCashRegister)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-yellow-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Acesso Restrito
            </CardTitle>
            <CardDescription>
              Para acessar o sistema, você precisa:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className={`flex items-center space-x-3 p-3 rounded-lg ${hasClockIn ? 'bg-green-50' : 'bg-red-50'}`}>
                <Clock className={`h-5 w-5 ${hasClockIn ? 'text-green-600' : 'text-red-600'}`} />
                <div>
                  <p className={`font-medium ${hasClockIn ? 'text-green-800' : 'text-red-800'}`}>
                    {hasClockIn ? '✓ Ponto registrado' : '✗ Bater ponto'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {hasClockIn ? 'Ponto já foi registrado hoje' : 'Registre seu ponto de entrada'}
                  </p>
                </div>
              </div>
              
              <div className={`flex items-center space-x-3 p-3 rounded-lg ${hasCashRegister ? 'bg-green-50' : 'bg-red-50'}`}>
                <MapPin className={`h-5 w-5 ${hasCashRegister ? 'text-green-600' : 'text-red-600'}`} />
                <div>
                  <p className={`font-medium ${hasCashRegister ? 'text-green-800' : 'text-red-800'}`}>
                    {hasCashRegister ? '✓ Caixa aberto' : '✗ Abrir caixa'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {hasCashRegister ? 'Caixa já está aberto' : 'Abra o caixa para iniciar'}
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => router.push('/ponto')} 
              className="w-full bg-primary hover:bg-indigo-700 h-12 touch-button"
            >
              <Clock className="mr-2 h-4 w-4" />
              Ir para Controle de Ponto
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isAuthPage || !session) {
    return (
      <ThemeProvider>
        {children}
      </ThemeProvider>
    );
  }

  // PDV Layout - Full screen without sidebar
  if (isPDVPage) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50">
          {children}
          <MobileBottomNav />
        </div>
      </ThemeProvider>
    );
  }
  
  // Default Layout with sidebar for desktop and mobile navigation
  return (
    <ThemeProvider>
      <div className="flex h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop Navbar */}
          <div className="hidden md:block">
            <Navbar />
          </div>
          
          {/* Mobile Header */}
          <MobileHeader />
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-30 pb-16 md:pb-0">
            <div className="container mx-auto px-4 py-4 md:py-8">
              {children}
            </div>
          </main>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </ThemeProvider>
  );
}
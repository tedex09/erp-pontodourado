'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    const checkIfInstalled = () => {
      // PWA instalado
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // iOS Safari standalone
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    // Detectar iOS
    const detectIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipa d|ipod/.test(userAgent);
      setIsIOS(isIOSDevice);
    };

    checkIfInstalled();
    detectIOS();

    // Listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      //  Mostrar prompt após 3 segundos se não estiver instalado
      if (!isInstalled) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      }
    };

    // Listener para quando o app é instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      setShowPrompt(false);
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Não mostrar novamente nesta sessão
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Não mostrar se já está instalado ou foi dispensado nesta sessão
  /* if (isInstalled || sessionStorage.getItem('pwa-prompt-dismissed')) { */
  if (isInstalled) {
    return null;
  }

  return (
    <Sheet open={showPrompt} onOpenChange={setShowPrompt}>
      <SheetContent side="bottom" className="h-auto">
        <div className="flex justify-between items-start mb-4">
          <SheetHeader className="flex-1">
            <SheetTitle className="flex items-center text-lg">
              <Smartphone className="mr-2 h-5 w-5 text-indigo-600" />
              Instalar Aplicativo
            </SheetTitle>
            <SheetDescription>
              Instale nosso app para uma experiência mais rápida e conveniente
            </SheetDescription>
          </SheetHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="ml-4"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Benefícios */}
          <div className="grid grid-cols-1  md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Acesso offline</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Notificações push</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Experiência nativa</span>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex space-x-3">
            {!isIOS && deferredPrompt ? (
              <Button
                onClick={handleInstallClick}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Instalar Agora
              </Button>
            ) : isIOS ? (
              <div className="flex-1 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 mb-2 font-medium">
                  Para instalar no iOS:
                </p>
                <ol className="text-xs text-blue-700 space-y-1">
                  <li>1. Toque no ícone de compartilhamento</li>
                  <li>2. Selecione "Adicionar à Tela de Início"</li>
                  <li>3. Toque em "Adicionar"</li>
                </ol>
              </div>
            ) : (
              <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  A instalação não está disponível neste navegador.
                </p>
              </div>
            )}
            
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="px-6"
            >
              Agora Não
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
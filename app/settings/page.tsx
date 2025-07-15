'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon, 
  Palette, 
  CreditCard, 
  MapPin, 
  Bell, 
  BarChart3,
  Upload,
  Save,
  Percent,
  DollarSign
} from 'lucide-react';
import { showToast } from '@/components/ui/toast';

interface GeneralSettings {
  defaultMargin: number;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  lowStockAlert: number;
  companyName: string;
  companyPhone?: string;
  companyEmail?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
    address?: string;
  };
}

interface PaymentSettings {
  methods: {
    dinheiro: { enabled: boolean };
    pix: { enabled: boolean; fee: number; feeType: 'percentage' | 'fixed' };
    pixQrCode: { 
      enabled: boolean; 
      fee: number; 
      feeType: 'percentage' | 'fixed';
      feeResponsibility: 'customer' | 'store';
    };
    debitoCard: { 
      enabled: boolean; 
      fee: number; 
      feeType: 'percentage' | 'fixed';
      feeResponsibility: 'customer' | 'store';
    };
    creditoCard: { 
      enabled: boolean; 
      fee: number; 
      feeType: 'percentage' | 'fixed';
      feeResponsibility: 'customer' | 'store';
      installments?: Array<{
        parcelas: number;
        taxa: number;
      }>;
    };
    fiado: { enabled: boolean };
  };
}

interface ThemeSettings {
  companyName: string;
  logo?: string;
  colors: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    input: string;
    ring: string;
  };
}

interface AnalyticsSettings {
  enabled: boolean;
  autoReports: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    whatsappEnabled: boolean;
    emailEnabled: boolean;
  };
  thresholds: {
    lowRotationDays: number;
    inactiveCustomerDays: number;
    lowPerformanceThreshold: number;
    lowStockThreshold: number;
    highTicketThreshold: number;
    frequentCustomerPurchases: number;
  };
  notifications: {
    criticalAlerts: boolean;
    dailyInsights: boolean;
    weeklyReports: boolean;
    performanceAlerts: boolean;
  };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    defaultMargin: 300,
    emailNotifications: false,
    whatsappNotifications: false,
    lowStockAlert: 5,
    companyName: 'Ponto Dourado',
  });
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    methods: {
      dinheiro: { enabled: true },
      pix: { enabled: true, fee: 0, feeType: 'percentage' },
      pixQrCode: { enabled: true, fee: 0.99, feeType: 'percentage', feeResponsibility: 'customer' },
      debitoCard: { enabled: true, fee: 1.99, feeType: 'percentage', feeResponsibility: 'customer' },
      creditoCard: { 
        enabled: true, 
        fee: 3.09, 
        feeType: 'percentage', 
        feeResponsibility: 'customer',
        installments: [
          { parcelas: 1, taxa: 3.09 },
          { parcelas: 2, taxa: 4.5 },
          { parcelas: 3, taxa: 6.0 },
          { parcelas: 4, taxa: 7.5 },
          { parcelas: 5, taxa: 9.0 },
          { parcelas: 6, taxa: 10.5 },
        ]
      },
      fiado: { enabled: true },
    },
  });
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    companyName: 'Ponto Dourado',
    colors: {
      primary: '222.2 84% 4.9%',
      primaryForeground: '210 40% 98%',
      secondary: '210 40% 96%',
      secondaryForeground: '222.2 84% 4.9%',
      accent: '210 40% 96%',
      accentForeground: '222.2 84% 4.9%',
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      muted: '210 40% 96%',
      mutedForeground: '215.4 16.3% 46.9%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '222.2 84% 4.9%',
    },
  });
  const [analyticsSettings, setAnalyticsSettings] = useState<AnalyticsSettings>({
    enabled: true,
    autoReports: {
      enabled: true,
      frequency: 'daily',
      recipients: [],
      whatsappEnabled: false,
      emailEnabled: true,
    },
    thresholds: {
      lowRotationDays: 30,
      inactiveCustomerDays: 60,
      lowPerformanceThreshold: 20,
      lowStockThreshold: 5,
      highTicketThreshold: 500,
      frequentCustomerPurchases: 5,
    },
    notifications: {
      criticalAlerts: true,
      dailyInsights: true,
      weeklyReports: true,
      performanceAlerts: true,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Fetch general settings
      const generalResponse = await fetch('/api/settings');
      if (generalResponse.ok) {
        const general = await generalResponse.json();
        setGeneralSettings(general);
      }

      // Fetch payment settings
      const paymentResponse = await fetch('/api/payment-settings');
      if (paymentResponse.ok) {
        const payment = await paymentResponse.json();
        setPaymentSettings(payment);
      }

      // Fetch theme settings
      const themeResponse = await fetch('/api/theme-settings');
      if (themeResponse.ok) {
        const theme = await themeResponse.json();
        setThemeSettings(theme);
      }

      // Fetch analytics settings
      const analyticsResponse = await fetch('/api/analytics/settings');
      if (analyticsResponse.ok) {
        const analytics = await analyticsResponse.json();
        setAnalyticsSettings(analytics);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showToast.error('Erro ao carregar configurações');
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const promises = [];

      // Save based on active tab
      switch (activeTab) {
        case 'general':
          promises.push(
            fetch('/api/settings', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(generalSettings),
            })
          );
          break;
        case 'payments':
          // Ensure installments are properly formatted before sending
          const paymentData = {
            ...paymentSettings,
            methods: {
              ...paymentSettings.methods,
              creditoCard: {
                ...paymentSettings.methods.creditoCard,
                installments: (paymentSettings.methods.creditoCard.installments || []).map(inst => ({
                  parcelas: Number(inst.parcelas),
                  taxa: Number(inst.taxa)
                }))
              }
            }
          };
          
          promises.push(
            fetch('/api/payment-settings', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(paymentData),
            })
          );
          break;
        case 'theme':
          promises.push(
            fetch('/api/theme-settings', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(themeSettings),
            })
          );
          break;
        case 'analytics':
          promises.push(
            fetch('/api/analytics/settings', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(analyticsSettings),
            })
          );
          break;
      }

      const responses = await Promise.all(promises);
      const allSuccessful = responses.every(response => response.ok);

      if (allSuccessful) {
        showToast.success('Configurações salvas com sucesso');
        
        // For payment settings, refresh the data to ensure UI reflects saved state
        if (activeTab === 'payments') {
          const response = responses[0];
          const updatedSettings = await response.json();
          setPaymentSettings(updatedSettings);
        }
        
        // Reload theme if theme settings were saved
        if (activeTab === 'theme') {
          window.location.reload();
        }
      } else {
        showToast.error('Erro ao salvar algumas configurações');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        setThemeSettings(prev => ({ ...prev, logo: url }));
        showToast.success('Logo carregado com sucesso');
      } else {
        showToast.error('Erro ao carregar logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      showToast.error('Erro ao carregar logo');
    }
  };

  const addInstallment = () => {
    const currentInstallments = paymentSettings.methods.creditoCard.installments || [];
    const newParcelas = currentInstallments.length + 1;
    const newInstallment = { parcelas: newParcelas, taxa: 3.09 };
    
    setPaymentSettings(prev => ({
      ...prev,
      methods: {
        ...prev.methods,
        creditoCard: {
          ...prev.methods.creditoCard,
          installments: [...currentInstallments, newInstallment]
        }
      }
    }));
  };

  const removeInstallment = (index: number) => {
    setPaymentSettings(prev => ({
      ...prev,
      methods: {
        ...prev.methods,
        creditoCard: {
          ...prev.methods.creditoCard,
          installments: (prev.methods.creditoCard.installments || []).filter((_, i) => i !== index)
        }
      }
    }));
  };

  const updateInstallment = (index: number, field: 'parcelas' | 'taxa', value: number) => {
    setPaymentSettings(prev => ({
      ...prev,
      methods: {
        ...prev.methods,
        creditoCard: {
          ...prev.methods.creditoCard,
          installments: (prev.methods.creditoCard.installments || []).map((item, i) => 
            i === index ? { ...item, [field]: Number(value) || (field === 'parcelas' ? 1 : 0) } : item
          )
        }
      }
    }));
  };
  

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <Button onClick={saveSettings} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="mr-2 h-4 w-4" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="theme">
            <Palette className="mr-2 h-4 w-4" />
            Tema
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="mr-2 h-4 w-4" />
            Análises
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configure as informações básicas da sua loja
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    value={generalSettings.companyName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, companyName: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Telefone</Label>
                  <Input
                    id="companyPhone"
                    value={generalSettings.companyPhone || ''}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, companyPhone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">E-mail</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={generalSettings.companyEmail || ''}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, companyEmail: e.target.value })}
                    placeholder="contato@empresa.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultMargin">Margem Padrão (%)</Label>
                  <Input
                    id="defaultMargin"
                    type="number"
                    value={generalSettings.defaultMargin}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, defaultMargin: Number(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lowStockAlert">Alerta de Estoque Baixo</Label>
                  <Input
                    id="lowStockAlert"
                    type="number"
                    value={generalSettings.lowStockAlert}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, lowStockAlert: Number(e.target.value) })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Notificações</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações por E-mail</Label>
                      <p className="text-sm text-gray-500">Receber alertas por e-mail</p>
                    </div>
                    <Switch
                      checked={generalSettings.emailNotifications}
                      onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, emailNotifications: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações por WhatsApp</Label>
                      <p className="text-sm text-gray-500">Receber alertas por WhatsApp</p>
                    </div>
                    <Switch
                      checked={generalSettings.whatsappNotifications}
                      onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, whatsappNotifications: checked })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
              <CardDescription>
                Configure as formas de pagamento aceitas e suas taxas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dinheiro */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Dinheiro</h3>
                  <p className="text-sm text-gray-500">Pagamento em espécie</p>
                </div>
                <Switch
                  checked={paymentSettings.methods.dinheiro.enabled}
                  onCheckedChange={(checked) => setPaymentSettings({
                    ...paymentSettings,
                    methods: {
                      ...paymentSettings.methods,
                      dinheiro: { enabled: checked }
                    }
                  })}
                />
              </div>

              {/* PIX */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">PIX</h3>
                    <p className="text-sm text-gray-500">Pagamento via PIX</p>
                  </div>
                  <Switch
                    checked={paymentSettings.methods.pix.enabled}
                    onCheckedChange={(checked) => setPaymentSettings({
                      ...paymentSettings,
                      methods: {
                        ...paymentSettings.methods,
                        pix: { ...paymentSettings.methods.pix, enabled: checked }
                      }
                    })}
                  />
                </div>
                {paymentSettings.methods.pix.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Taxa (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={paymentSettings.methods.pix.fee}
                        onChange={(e) => setPaymentSettings({
                          ...paymentSettings,
                          methods: {
                            ...paymentSettings.methods,
                            pix: { ...paymentSettings.methods.pix, fee: Number(e.target.value) }
                          }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Cartão de Crédito */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Cartão de Crédito</h3>
                    <p className="text-sm text-gray-500">Pagamento parcelado</p>
                  </div>
                  <Switch
                    checked={paymentSettings.methods.creditoCard.enabled}
                    onCheckedChange={(checked) => setPaymentSettings({
                      ...paymentSettings,
                      methods: {
                        ...paymentSettings.methods,
                        creditoCard: { ...paymentSettings.methods.creditoCard, enabled: checked }
                      }
                    })}
                  />
                </div>
                
                {paymentSettings.methods.creditoCard.enabled && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Configuração de Parcelas</h4>
                      <Button onClick={addInstallment} size="sm">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Adicionar Parcela
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {(paymentSettings.methods.creditoCard.installments || []).map((installment, index) => (
                        <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <Label>Parcelas</Label>
                            <Input
                              type="number"
                              min="1"
                              value={installment.parcelas}
                              onChange={(e) => updateInstallment(index, 'parcelas', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="flex-1">
                            <Label>Taxa (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={installment.taxa}
                              onChange={(e) => updateInstallment(index, 'taxa', parseFloat(e.target.value)|| 0)}
                            />
                          </div>
                          <Button
                            onClick={() => removeInstallment(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            Remover
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cartão de Débito */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Cartão de Débito</h3>
                    <p className="text-sm text-gray-500">Pagamento à vista</p>
                  </div>
                  <Switch
                    checked={paymentSettings.methods.debitoCard.enabled}
                    onCheckedChange={(checked) => setPaymentSettings({
                      ...paymentSettings,
                      methods: {
                        ...paymentSettings.methods,
                        debitoCard: { ...paymentSettings.methods.debitoCard, enabled: checked }
                      }
                    })}
                  />
                </div>
                {paymentSettings.methods.debitoCard.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Taxa (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={paymentSettings.methods.debitoCard.fee}
                        onChange={(e) => setPaymentSettings({
                          ...paymentSettings,
                          methods: {
                            ...paymentSettings.methods,
                            debitoCard: { ...paymentSettings.methods.debitoCard, fee: Number(e.target.value) }
                          }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Fiado */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Fiado</h3>
                  <p className="text-sm text-gray-500">Pagamento a prazo</p>
                </div>
                <Switch
                  checked={paymentSettings.methods.fiado.enabled}
                  onCheckedChange={(checked) => setPaymentSettings({
                    ...paymentSettings,
                    methods: {
                      ...paymentSettings.methods,
                      fiado: { enabled: checked }
                    }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personalização do Tema</CardTitle>
              <CardDescription>
                Customize a aparência da sua loja
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="themeName">Nome da Loja</Label>
                  <Input
                    id="themeName"
                    value={themeSettings.companyName}
                    onChange={(e) => setThemeSettings({ ...themeSettings, companyName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logomarca</Label>
                  <div className="flex items-center space-x-4">
                    {themeSettings.logo && (
                      <img
                        src={themeSettings.logo}
                        alt="Logo"
                        className="w-16 h-16 object-contain border rounded-lg"
                      />
                    )}
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="mb-2"
                      />
                      <p className="text-sm text-gray-500">
                        Recomendado: PNG ou SVG, máximo 2MB
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Cores do Sistema</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Cor Primária</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="color"
                          value={`hsl(${themeSettings.colors.primary})`}
                          onChange={(e) => {
                            const hsl = e.target.value;
                            // Convert hex to HSL (simplified)
                            setThemeSettings({
                              ...themeSettings,
                              colors: { ...themeSettings.colors, primary: '222.2 84% 4.9%' }
                            });
                          }}
                          className="w-16 h-10"
                        />
                        <Input
                          value={themeSettings.colors.primary}
                          onChange={(e) => setThemeSettings({
                            ...themeSettings,
                            colors: { ...themeSettings.colors, primary: e.target.value }
                          })}
                          placeholder="222.2 84% 4.9%"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cor Secundária</Label>
                      <Input
                        value={themeSettings.colors.secondary}
                        onChange={(e) => setThemeSettings({
                          ...themeSettings,
                          colors: { ...themeSettings.colors, secondary: e.target.value }
                        })}
                        placeholder="210 40% 96%"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Cor de Destaque</Label>
                      <Input
                        value={themeSettings.colors.accent}
                        onChange={(e) => setThemeSettings({
                          ...themeSettings,
                          colors: { ...themeSettings.colors, accent: e.target.value }
                        })}
                        placeholder="210 40% 96%"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Análises</CardTitle>
              <CardDescription>
                Configure as análises inteligentes e relatórios automáticos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Habilitar Análises Inteligentes</Label>
                  <p className="text-sm text-gray-500">Ativar geração automática de insights</p>
                </div>
                <Switch
                  checked={analyticsSettings.enabled}
                  onCheckedChange={(checked) => setAnalyticsSettings({ ...analyticsSettings, enabled: checked })}
                />
              </div>

              {analyticsSettings.enabled && (
                <>
                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Relatórios Automáticos</h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Habilitar Relatórios Automáticos</Label>
                        <p className="text-sm text-gray-500">Enviar relatórios periodicamente</p>
                      </div>
                      <Switch
                        checked={analyticsSettings.autoReports.enabled}
                        onCheckedChange={(checked) => setAnalyticsSettings({
                          ...analyticsSettings,
                          autoReports: { ...analyticsSettings.autoReports, enabled: checked }
                        })}
                      />
                    </div>

                    {analyticsSettings.autoReports.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Frequência</Label>
                          <select
                            value={analyticsSettings.autoReports.frequency}
                            onChange={(e) => setAnalyticsSettings({
                              ...analyticsSettings,
                              autoReports: { 
                                ...analyticsSettings.autoReports, 
                                frequency: e.target.value as 'daily' | 'weekly' | 'monthly' 
                              }
                            })}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="daily">Diário</option>
                            <option value="weekly">Semanal</option>
                            <option value="monthly">Mensal</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Limites e Alertas</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Dias sem venda (baixa rotatividade)</Label>
                        <Input
                          type="number"
                          value={analyticsSettings.thresholds.lowRotationDays}
                          onChange={(e) => setAnalyticsSettings({
                            ...analyticsSettings,
                            thresholds: { 
                              ...analyticsSettings.thresholds, 
                              lowRotationDays: Number(e.target.value) 
                            }
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Dias sem compra (cliente inativo)</Label>
                        <Input
                          type="number"
                          value={analyticsSettings.thresholds.inactiveCustomerDays}
                          onChange={(e) => setAnalyticsSettings({
                            ...analyticsSettings,
                            thresholds: { 
                              ...analyticsSettings.thresholds, 
                              inactiveCustomerDays: Number(e.target.value) 
                            }
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Limite baixo desempenho (%)</Label>
                        <Input
                          type="number"
                          value={analyticsSettings.thresholds.lowPerformanceThreshold}
                          onChange={(e) => setAnalyticsSettings({
                            ...analyticsSettings,
                            thresholds: { 
                              ...analyticsSettings.thresholds, 
                              lowPerformanceThreshold: Number(e.target.value) 
                            }
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Valor para cliente VIP (R$)</Label>
                        <Input
                          type="number"
                          value={analyticsSettings.thresholds.highTicketThreshold}
                          onChange={(e) => setAnalyticsSettings({
                            ...analyticsSettings,
                            thresholds: { 
                              ...analyticsSettings.thresholds, 
                              highTicketThreshold: Number(e.target.value) 
                            }
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Notificações</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Alertas Críticos</Label>
                          <p className="text-sm text-gray-500">Notificar sobre problemas urgentes</p>
                        </div>
                        <Switch
                          checked={analyticsSettings.notifications.criticalAlerts}
                          onCheckedChange={(checked) => setAnalyticsSettings({
                            ...analyticsSettings,
                            notifications: { 
                              ...analyticsSettings.notifications, 
                              criticalAlerts: checked 
                            }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Insights Diários</Label>
                          <p className="text-sm text-gray-500">Receber insights diários</p>
                        </div>
                        <Switch
                          checked={analyticsSettings.notifications.dailyInsights}
                          onCheckedChange={(checked) => setAnalyticsSettings({
                            ...analyticsSettings,
                            notifications: { 
                              ...analyticsSettings.notifications, 
                              dailyInsights: checked 
                            }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Relatórios Semanais</Label>
                          <p className="text-sm text-gray-500">Receber resumo semanal</p>
                        </div>
                        <Switch
                          checked={analyticsSettings.notifications.weeklyReports}
                          onCheckedChange={(checked) => setAnalyticsSettings({
                            ...analyticsSettings,
                            notifications: { 
                              ...analyticsSettings.notifications, 
                              weeklyReports: checked 
                            }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Alertas de Performance</Label>
                          <p className="text-sm text-gray-500">Notificar sobre baixo desempenho</p>
                        </div>
                        <Switch
                          checked={analyticsSettings.notifications.performanceAlerts}
                          onCheckedChange={(checked) => setAnalyticsSettings({
                            ...analyticsSettings,
                            notifications: { 
                              ...analyticsSettings.notifications, 
                              performanceAlerts: checked 
                            }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
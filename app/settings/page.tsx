'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings,
  Save,
  Building,
  Percent,
  AlertTriangle,
  Mail,
  MessageCircle,
  CreditCard,
  DollarSign,
  MapPin,
  Palette,
  Type
} from 'lucide-react';
import { showToast } from '@/components/ui/toast';
import { useThemeStore } from '@/store/useThemeStore';

interface SettingsData {
  _id?: string;
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
  _id?: string;
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
    };
    fiado: { enabled: boolean };
  };
}

export default function SettingsPage() {
  const { colors, companyName, setColors, setCompanyName, resetToDefault } = useThemeStore();
  
  const [settings, setSettings] = useState<SettingsData>({
    defaultMargin: 72,
    emailNotifications: false,
    whatsappNotifications: false,
    lowStockAlert: 5,
    companyName: 'Ponto Dourado',
    companyPhone: '',
    companyEmail: '',
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    methods: {
      dinheiro: { enabled: true },
      pix: { enabled: true, fee: 0, feeType: 'percentage' },
      pixQrCode: { enabled: true, fee: 0.99, feeType: 'percentage', feeResponsibility: 'customer' },
      debitoCard: { enabled: true, fee: 1.99, feeType: 'percentage', feeResponsibility: 'customer' },
      creditoCard: { enabled: true, fee: 3.09, feeType: 'percentage', feeResponsibility: 'customer' },
      fiado: { enabled: true },
    },
  });

  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Theme form state
  const [themeForm, setThemeForm] = useState({
    companyName: companyName,
    primaryColor: '#6366f1',
    backgroundColor: '#ffffff',
    textColor: '#111827',
  });

  useEffect(() => {
    fetchSettings();
    fetchPaymentSettings();
    loadMapScript();
    setThemeForm(prev => ({ ...prev, companyName }));
  }, [companyName]);

  const loadMapScript = () => {
    if (window.google) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showToast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch('/api/payment-settings');
      if (response.ok) {
        const data = await response.json();
        setPaymentSettings(data);
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast.error('Geolocalização não suportada pelo navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation(position);
        setSettings(prev => ({
          ...prev,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            radius: prev.location?.radius || 100,
            address: prev.location?.address || '',
          },
        }));
        showToast.success('Localização obtida com sucesso');
      },
      (error) => {
        showToast.error('Erro ao obter localização: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const initializeMap = () => {
    if (!mapLoaded || !window.google) {
      showToast.error('Mapa não disponível. Usando localização atual.');
      getCurrentLocation();
      return;
    }

    const mapContainer = document.getElementById('location-map');
    if (!mapContainer) return;

    const defaultLocation = settings.location || { latitude: -23.5505, longitude: -46.6333 }; // São Paulo default
    
    const map = new window.google.maps.Map(mapContainer, {
      center: { lat: defaultLocation.latitude, lng: defaultLocation.longitude },
      zoom: 15,
    });

    const marker = new window.google.maps.Marker({
      position: { lat: defaultLocation.latitude, lng: defaultLocation.longitude },
      map: map,
      draggable: true,
    });

    marker.addListener('dragend', () => {
      const position = marker.getPosition();
      if (position) {
        setSettings(prev => ({
          ...prev,
          location: {
            latitude: position.lat(),
            longitude: position.lng(),
            radius: prev.location?.radius || 100,
            address: prev.location?.address || '',
          },
        }));
        showToast.success('Localização atualizada no mapa');
      }
    });

    map.addListener('click', (event: any) => {
      const position = event.latLng;
      marker.setPosition(position);
      setSettings(prev => ({
        ...prev,
        location: {
          latitude: position.lat(),
          longitude: position.lng(),
          radius: prev.location?.radius || 100,
          address: prev.location?.address || '',
        },
      }));
      showToast.success('Localização atualizada no mapa');
    });
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        showToast.success('Configurações salvas com sucesso');
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaymentSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/payment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentSettings),
      });
      
      if (response.ok) {
        showToast.success('Configurações de pagamento salvas');
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Error saving payment settings:', error);
      showToast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTheme = () => {
    setCompanyName(themeForm.companyName);
    
    // Convert hex colors to HSL for CSS variables
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    setColors({
      primary: hexToHsl(themeForm.primaryColor),
      background: hexToHsl(themeForm.backgroundColor),
      foreground: hexToHsl(themeForm.textColor),
    });

    showToast.success('Tema atualizado com sucesso');
  };

  const updateSetting = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updatePaymentMethod = (method: string, field: string, value: any) => {
    setPaymentSettings(prev => ({
      ...prev,
      methods: {
        ...prev.methods,
        [method]: {
          ...prev.methods[method as keyof typeof prev.methods],
          [field]: value,
        },
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Configurações</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="general" className="text-xs md:text-sm p-2 md:p-3">Geral</TabsTrigger>
          <TabsTrigger value="theme" className="text-xs md:text-sm p-2 md:p-3">Tema</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs md:text-sm p-2 md:p-3">Pagamentos</TabsTrigger>
          <TabsTrigger value="location" className="text-xs md:text-sm p-2 md:p-3">Localização</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveSettings} 
              disabled={saving} 
              className="bg-indigo-600 hover:bg-indigo-700 h-12 md:h-10 touch-button"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  Informações da Empresa
                </CardTitle>
                <CardDescription>
                  Configure as informações básicas da sua loja
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => updateSetting('companyName', e.target.value)}
                    placeholder="Nome da sua loja"
                    className="h-12 md:h-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Telefone</Label>
                  <Input
                    id="companyPhone"
                    value={settings.companyPhone || ''}
                    onChange={(e) => updateSetting('companyPhone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="h-12 md:h-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">E-mail</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={settings.companyEmail || ''}
                    onChange={(e) => updateSetting('companyEmail', e.target.value)}
                    placeholder="contato@sualojabyju.com"
                    className="h-12 md:h-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Percent className="mr-2 h-5 w-5" />
                  Configurações de Preço
                </CardTitle>
                <CardDescription>
                  Defina a margem padrão para sugestão de preços
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultMargin">Margem Padrão (%)</Label>
                  <Input
                    id="defaultMargin"
                    type="number"
                    min="0"
                    max="1000"
                    value={settings.defaultMargin}
                    onChange={(e) => updateSetting('defaultMargin', Number(e.target.value))}
                    className="h-12 md:h-10"
                  />
                  <p className="text-sm text-gray-500">
                    Esta margem será usada como sugestão padrão ao criar categorias e produtos.
                    Exemplo: 300% significa que o preço sugerido será 4x o custo.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Exemplo de Cálculo</h4>
                  <p className="text-sm text-blue-700">
                    Custo: R$ 10,00 → Preço sugerido: R$ {((10 * (settings.defaultMargin + 100)) / 100).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Stock Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Controle de Estoque
                </CardTitle>
                <CardDescription>
                  Configure alertas de estoque baixo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lowStockAlert">Alerta de Estoque Baixo</Label>
                  <Input
                    id="lowStockAlert"
                    type="number"
                    min="0"
                    value={settings.lowStockAlert}
                    onChange={(e) => updateSetting('lowStockAlert', Number(e.target.value))}
                    className="h-12 md:h-10"
                  />
                  <p className="text-sm text-gray-500">
                    Produtos com estoque igual ou menor que este valor aparecerão nos alertas.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="mr-2 h-5 w-5" />
                  Notificações
                </CardTitle>
                <CardDescription>
                  Configure como você deseja receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Notificações por E-mail</Label>
                    <p className="text-sm text-gray-500">
                      Receba alertas de estoque baixo e relatórios por e-mail
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Notificações por WhatsApp
                    </Label>
                    <p className="text-sm text-gray-500">
                      Receba notificações importantes via WhatsApp
                    </p>
                  </div>
                  <Switch
                    checked={settings.whatsappNotifications}
                    onCheckedChange={(checked) => updateSetting('whatsappNotifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <div className="flex justify-between">
            <Button 
              onClick={resetToDefault} 
              variant="outline"
              className="h-12 md:h-10 touch-button"
            >
              Restaurar Padrão
            </Button>
            <Button 
              onClick={handleSaveTheme} 
              className="bg-indigo-600 hover:bg-indigo-700 h-12 md:h-10 touch-button"
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Tema
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                Personalização Visual
              </CardTitle>
              <CardDescription>
                Customize as cores e aparência do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="themeCompanyName" className="flex items-center">
                  <Type className="mr-2 h-4 w-4" />
                  Nome da Loja
                </Label>
                <Input
                  id="themeCompanyName"
                  value={themeForm.companyName}
                  onChange={(e) => setThemeForm({ ...themeForm, companyName: e.target.value })}
                  placeholder="Nome da sua loja"
                  className="h-12 md:h-10"
                />
                <p className="text-sm text-gray-500">
                  Este nome aparecerá no título da aba e na navegação
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Cor Principal</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={themeForm.primaryColor}
                      onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })}
                      className="w-16 h-12 md:h-10 p-1 border rounded"
                    />
                    <Input
                      value={themeForm.primaryColor}
                      onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })}
                      placeholder="#6366f1"
                      className="flex-1 h-12 md:h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Cor de Fundo</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={themeForm.backgroundColor}
                      onChange={(e) => setThemeForm({ ...themeForm, backgroundColor: e.target.value })}
                      className="w-16 h-12 md:h-10 p-1 border rounded"
                    />
                    <Input
                      value={themeForm.backgroundColor}
                      onChange={(e) => setThemeForm({ ...themeForm, backgroundColor: e.target.value })}
                      placeholder="#ffffff"
                      className="flex-1 h-12 md:h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textColor">Cor do Texto</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={themeForm.textColor}
                      onChange={(e) => setThemeForm({ ...themeForm, textColor: e.target.value })}
                      className="w-16 h-12 md:h-10 p-1 border rounded"
                    />
                    <Input
                      value={themeForm.textColor}
                      onChange={(e) => setThemeForm({ ...themeForm, textColor: e.target.value })}
                      placeholder="#111827"
                      className="flex-1 h-12 md:h-10"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Pré-visualização</h4>
                <div 
                  className="p-4 rounded-lg border-2"
                  style={{ 
                    backgroundColor: themeForm.backgroundColor,
                    borderColor: themeForm.primaryColor,
                    color: themeForm.textColor
                  }}
                >
                  <h3 className="font-semibold mb-2">{themeForm.companyName}</h3>
                  <button 
                    className="px-4 py-2 rounded text-white font-medium"
                    style={{ backgroundColor: themeForm.primaryColor }}
                  >
                    Botão de Exemplo
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="flex justify-end">
            <Button 
              onClick={handleSavePaymentSettings} 
              disabled={saving} 
              className="bg-indigo-600 hover:bg-indigo-700 h-12 md:h-10 touch-button"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Métodos de Pagamento
              </CardTitle>
              <CardDescription>
                Configure quais métodos de pagamento estão disponíveis e suas taxas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {/* Dinheiro */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <Label className="font-medium">Dinheiro</Label>
                      <p className="text-sm text-gray-500">Pagamento em espécie</p>
                    </div>
                  </div>
                  <Switch
                    checked={paymentSettings.methods.dinheiro.enabled}
                    onCheckedChange={(checked) => updatePaymentMethod('dinheiro', 'enabled', checked)}
                  />
                </div>

                {/* PIX */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <div>
                        <Label className="font-medium">PIX</Label>
                        <p className="text-sm text-gray-500">Transferência instantânea</p>
                      </div>
                    </div>
                    <Switch
                      checked={paymentSettings.methods.pix.enabled}
                      onCheckedChange={(checked) => updatePaymentMethod('pix', 'enabled', checked)}
                    />
                  </div>
                  {paymentSettings.methods.pix.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Taxa (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={paymentSettings.methods.pix.fee}
                          onChange={(e) => updatePaymentMethod('pix', 'fee', Number(e.target.value))}
                          className="h-12 md:h-10"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* PIX QR Code */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      <div>
                        <Label className="font-medium">PIX QR Code</Label>
                        <p className="text-sm text-gray-500">PIX via QR Code (com taxa)</p>
                      </div>
                    </div>
                    <Switch
                      checked={paymentSettings.methods.pixQrCode.enabled}
                      onCheckedChange={(checked) => updatePaymentMethod('pixQrCode', 'enabled', checked)}
                    />
                  </div>
                  {paymentSettings.methods.pixQrCode.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Taxa (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={paymentSettings.methods.pixQrCode.fee}
                          onChange={(e) => updatePaymentMethod('pixQrCode', 'fee', Number(e.target.value))}
                          className="h-12 md:h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Responsabilidade</Label>
                        <Select
                          value={paymentSettings.methods.pixQrCode.feeResponsibility}
                          onValueChange={(value) => updatePaymentMethod('pixQrCode', 'feeResponsibility', value)}
                        >
                          <SelectTrigger className="h-12 md:h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Cliente</SelectItem>
                            <SelectItem value="store">Loja</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cartão de Débito */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-indigo-600" />
                      <div>
                        <Label className="font-medium">Cartão de Débito</Label>
                        <p className="text-sm text-gray-500">Débito na conta</p>
                      </div>
                    </div>
                    <Switch
                      checked={paymentSettings.methods.debitoCard.enabled}
                      onCheckedChange={(checked) => updatePaymentMethod('debitoCard', 'enabled', checked)}
                    />
                  </div>
                  {paymentSettings.methods.debitoCard.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Taxa (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={paymentSettings.methods.debitoCard.fee}
                          onChange={(e) => updatePaymentMethod('debitoCard', 'fee', Number(e.target.value))}
                          className="h-12 md:h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Responsabilidade</Label>
                        <Select
                          value={paymentSettings.methods.debitoCard.feeResponsibility}
                          onValueChange={(value) => updatePaymentMethod('debitoCard', 'feeResponsibility', value)}
                        >
                          <SelectTrigger className="h-12 md:h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Cliente</SelectItem>
                            <SelectItem value="store">Loja</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cartão de Crédito */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-red-600" />
                      <div>
                        <Label className="font-medium">Cartão de Crédito</Label>
                        <p className="text-sm text-gray-500">Crédito parcelado</p>
                      </div>
                    </div>
                    <Switch
                      checked={paymentSettings.methods.creditoCard.enabled}
                      onCheckedChange={(checked) => updatePaymentMethod('creditoCard', 'enabled', checked)}
                    />
                  </div>
                  {paymentSettings.methods.creditoCard.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Taxa (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={paymentSettings.methods.creditoCard.fee}
                          onChange={(e) => updatePaymentMethod('creditoCard', 'fee', Number(e.target.value))}
                          className="h-12 md:h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Responsabilidade</Label>
                        <Select
                          value={paymentSettings.methods.creditoCard.feeResponsibility}
                          onValueChange={(value) => updatePaymentMethod('creditoCard', 'feeResponsibility', value)}
                        >
                          <SelectTrigger className="h-12 md:h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Cliente</SelectItem>
                            <SelectItem value="store">Loja</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fiado */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-orange-600" />
                    <div>
                      <Label className="font-medium">Fiado</Label>
                      <p className="text-sm text-gray-500">Pagamento a prazo (só com cliente)</p>
                    </div>
                  </div>
                  <Switch
                    checked={paymentSettings.methods.fiado.enabled}
                    onCheckedChange={(checked) => updatePaymentMethod('fiado', 'enabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location" className="space-y-6">
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveSettings} 
              disabled={saving} 
              className="bg-indigo-600 hover:bg-indigo-700 h-12 md:h-10 touch-button"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Configurações de Localização
              </CardTitle>
              <CardDescription>
                Configure a localização da loja para controle de ponto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                  <Button onClick={getCurrentLocation} variant="outline" className="flex-1 h-12 md:h-10 touch-button">
                    <MapPin className="mr-2 h-4 w-4" />
                    Usar Localização Atual
                  </Button>
                  <Button onClick={initializeMap} variant="outline" className="flex-1 h-12 md:h-10 touch-button">
                    <MapPin className="mr-2 h-4 w-4" />
                    Selecionar no Mapa
                  </Button>
                </div>

                {/* Map Container */}
                <div className="space-y-2">
                  <Label>Selecionar Localização no Mapa</Label>
                  <div 
                    id="location-map" 
                    className="w-full h-64 border rounded-lg bg-gray-100 flex items-center justify-center"
                  >
                    {!mapLoaded ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                        <p className="text-gray-500">Carregando mapa...</p>
                      </div>
                    ) : (
                      <p className="text-gray-500">Clique em "Selecionar no Mapa" para ativar</p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Clique no mapa ou arraste o marcador para definir a localização da loja.
                  </p>
                </div>

                {settings.location && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">Localização Configurada</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-green-600">Latitude:</p>
                        <p className="font-medium">{settings.location.latitude.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-green-600">Longitude:</p>
                        <p className="font-medium">{settings.location.longitude.toFixed(6)}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="radius">Raio de Tolerância (metros)</Label>
                  <Input
                    id="radius"
                    type="number"
                    min="10"
                    max="1000"
                    value={settings.location?.radius || 100}
                    onChange={(e) => updateSetting('location', {
                      ...settings.location,
                      radius: Number(e.target.value)
                    })}
                    className="h-12 md:h-10"
                  />
                  <p className="text-sm text-gray-500">
                    Funcionários podem bater ponto dentro deste raio da localização configurada.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço (opcional)</Label>
                  <Input
                    id="address"
                    value={settings.location?.address || ''}
                    onChange={(e) => updateSetting('location', {
                      ...settings.location,
                      address: e.target.value
                    })}
                    placeholder="Endereço da loja para referência"
                    className="h-12 md:h-10"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Como Funciona</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Funcionários precisam estar dentro do raio configurado para bater ponto</li>
                  <li>• A localização é verificada automaticamente pelo navegador</li>
                  <li>• Pontos fora da área são marcados como inválidos</li>
                  <li>• Recomendamos um raio de 50-200 metros dependendo do tamanho da loja</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-900">Versão</p>
              <p className="text-gray-500">2.0.0</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Última Atualização</p>
              <p className="text-gray-500">{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Ambiente</p>
              <p className="text-gray-500">Produção</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
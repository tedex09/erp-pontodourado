'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, Save, Mail, MessageCircle, Percent, AlertTriangle, Building } from 'lucide-react';
import { showToast } from '@/components/ui/toast';

interface SettingsData {
  _id?: string;
  defaultMargin: number;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  lowStockAlert: number;
  companyName: string;
  companyPhone?: string;
  companyEmail?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    defaultMargin: 300,
    emailNotifications: false,
    whatsappNotifications: false,
    lowStockAlert: 5,
    companyName: 'Loja de Bijuterias',
    companyPhone: '',
    companyEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

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

  const handleSave = async () => {
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

  const updateSetting = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
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
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Telefone</Label>
              <Input
                id="companyPhone"
                value={settings.companyPhone || ''}
                onChange={(e) => updateSetting('companyPhone', e.target.value)}
                placeholder="(11) 99999-9999"
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
              />
              <p className="text-sm text-gray-500">
                Esta margem será usada para calcular o preço sugerido dos produtos.
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
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> As notificações são apenas para demonstração nesta versão.
                Para implementar notificações reais, será necessário integrar com serviços de e-mail e WhatsApp.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

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
              <p className="text-gray-500">1.0.0</p>
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
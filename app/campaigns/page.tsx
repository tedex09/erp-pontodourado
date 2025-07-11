'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Gift, 
  MessageCircle, 
  Users, 
  Calendar, 
  Phone, 
  ExternalLink,
  UserPlus,
  TrendingUp,
  Heart,
  Copy
} from 'lucide-react';
import { showToast } from '@/components/ui/toast';

interface BirthdayCustomer {
  _id: string;
  name: string;
  phone: string;
  birthday: string;
  totalSpent: number;
  lastPurchase?: string;
}

interface CampaignTarget {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  totalSpent: number;
  purchaseCount: number;
  lastPurchase?: string;
}

interface Referral {
  _id: string;
  referrerName: string;
  referredName: string;
  referredPhone: string;
  status: 'pending' | 'converted' | 'cancelled';
  firstPurchaseValue?: number;
  createdAt: string;
}

export default function CampaignsPage() {
  const [birthdayCustomers, setBirthdayCustomers] = useState<BirthdayCustomer[]>([]);
  const [campaignTargets, setCampaignTargets] = useState<CampaignTarget[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    message: '',
    targetType: 'all' as 'all' | 'birthday' | 'highValue' | 'frequent' | 'category',
    minValue: 1000,
    minPurchases: 5,
    categoryPreference: 'todos',
  });

  const [referralForm, setReferralForm] = useState({
    referrerCustomerId: '',
    referrerName: '',
    referredName: '',
    referredPhone: '',
    notes: '',
  });

  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    fetchBirthdayCustomers();
    fetchReferrals();
    fetchCustomers();
  }, []);

  const fetchBirthdayCustomers = async () => {
    try {
      const response = await fetch('/api/campaigns/birthday');
      if (response.ok) {
        const data = await response.json();
        setBirthdayCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching birthday customers:', error);
    }
  };

  const fetchCampaignTargets = async () => {
    try {
      let url = '/api/campaigns/targets';
      const params = new URLSearchParams();
      
      if (campaignForm.targetType === 'highValue') {
        params.append('type', 'highValue');
        params.append('minValue', campaignForm.minValue.toString());
      } else if (campaignForm.targetType === 'frequent') {
        params.append('type', 'frequent');
        params.append('minPurchases', campaignForm.minPurchases.toString());
      } else if (campaignForm.targetType === 'category') {
        params.append('type', 'category');
        params.append('category', campaignForm.categoryPreference);
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCampaignTargets(data);
      }
    } catch (error) {
      console.error('Error fetching campaign targets:', error);
    }
  };

  const fetchReferrals = async () => {
    try {
      const response = await fetch('/api/referrals');
      if (response.ok) {
        const data = await response.json();
        setReferrals(data);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(referralForm),
      });
      
      if (response.ok) {
        showToast.success('Indicação registrada com sucesso');
        setShowReferralDialog(false);
        resetReferralForm();
        fetchReferrals();
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Erro ao registrar indicação');
      }
    } catch (error) {
      console.error('Error creating referral:', error);
      showToast.error('Erro ao registrar indicação');
    } finally {
      setLoading(false);
    }
  };

  const resetReferralForm = () => {
    setReferralForm({
      referrerCustomerId: '',
      referrerName: '',
      referredName: '',
      referredPhone: '',
      notes: '',
    });
  };

  const generateWhatsAppUrl = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
  };

  const generateBirthdayMessage = (customerName: string) => {
    return `Olá ${customerName}! 🎉 A equipe da nossa loja de bijuterias deseja um feliz aniversário! Como presente especial, você tem 15% de desconto em qualquer produto da loja. Venha nos visitar! 💎✨`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast.success('Texto copiado para a área de transferência');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'converted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'converted':
        return 'Convertido';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Campanhas e Fidelização</h1>
      </div>

      <Tabs defaultValue="birthday" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="birthday">Aniversariantes</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="referrals">Indicações</TabsTrigger>
        </TabsList>

        <TabsContent value="birthday" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="mr-2 h-5 w-5" />
                Aniversariantes do Mês
              </CardTitle>
              <CardDescription>
                Clientes que fazem aniversário este mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {birthdayCustomers.map((customer) => (
                  <Card key={customer._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                          <p className="text-sm text-gray-500 flex items-center">
                            <Calendar className="mr-1 h-4 w-4" />
                            {formatDate(customer.birthday)}
                          </p>
                        </div>
                        <Badge className="bg-pink-100 text-pink-800">
                          🎂 Aniversário
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{customer.phone}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>Total gasto:</strong> {formatCurrency(customer.totalSpent)}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            const message = generateBirthdayMessage(customer.name);
                            const url = generateWhatsAppUrl(customer.phone, message);
                            window.open(url, '_blank');
                          }}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          WhatsApp
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const message = generateBirthdayMessage(customer.name);
                            copyToClipboard(message);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {birthdayCustomers.length === 0 && (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum aniversariante este mês</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Envio de Campanhas
                </div>
                <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Nova Campanha
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Criar Nova Campanha</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Título da Campanha</Label>
                        <Input
                          value={campaignForm.title}
                          onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                          placeholder="Ex: Promoção de Verão"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Público Alvo</Label>
                        <Select
                          value={campaignForm.targetType}
                          onValueChange={(value: any) => setCampaignForm({ ...campaignForm, targetType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os clientes</SelectItem>
                            <SelectItem value="birthday">Aniversariantes</SelectItem>
                            <SelectItem value="highValue">Alto valor (R$ 1000+)</SelectItem>
                            <SelectItem value="frequent">Clientes frequentes (5+ compras)</SelectItem>
                            <SelectItem value="category">Por categoria de preferência</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {campaignForm.targetType === 'highValue' && (
                        <div className="space-y-2">
                          <Label>Valor mínimo gasto</Label>
                          <Input
                            type="number"
                            value={campaignForm.minValue}
                            onChange={(e) => setCampaignForm({ ...campaignForm, minValue: Number(e.target.value) })}
                          />
                        </div>
                      )}
                      
                      {campaignForm.targetType === 'frequent' && (
                        <div className="space-y-2">
                          <Label>Número mínimo de compras</Label>
                          <Input
                            type="number"
                            value={campaignForm.minPurchases}
                            onChange={(e) => setCampaignForm({ ...campaignForm, minPurchases: Number(e.target.value) })}
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label>Mensagem</Label>
                        <Textarea
                          value={campaignForm.message}
                          onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })}
                          placeholder="Digite sua mensagem aqui. Use {nome} para personalizar com o nome do cliente."
                          rows={4}
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button onClick={fetchCampaignTargets} className="flex-1">
                          Visualizar Público
                        </Button>
                        <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
                          Fechar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {campaignTargets.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Público Selecionado ({campaignTargets.length} clientes)
                    </h3>
                    <Button
                      onClick={() => {
                        const message = campaignForm.message || 'Olá {nome}! Temos novidades incríveis para você!';
                        const allMessages = campaignTargets.map(customer => 
                          message.replace('{nome}', customer.name)
                        ).join('\n\n---\n\n');
                        copyToClipboard(allMessages);
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar Todas as Mensagens
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {campaignTargets.map((customer) => (
                      <Card key={customer._id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold">{customer.name}</h4>
                              <p className="text-sm text-gray-500">{customer.phone}</p>
                            </div>
                            
                            <div className="text-sm text-gray-600">
                              <p><strong>Total gasto:</strong> {formatCurrency(customer.totalSpent)}</p>
                              <p><strong>Compras:</strong> {customer.purchaseCount}</p>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  const personalizedMessage = campaignForm.message.replace('{nome}', customer.name);
                                  const url = generateWhatsAppUrl(customer.phone, personalizedMessage);
                                  window.open(url, '_blank');
                                }}
                              >
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Enviar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const personalizedMessage = campaignForm.message.replace('{nome}', customer.name);
                                  copyToClipboard(personalizedMessage);
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {campaignTargets.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Configure uma campanha para visualizar o público alvo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Programa de Indicações
                </div>
                <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Nova Indicação
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Registrar Nova Indicação</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleReferralSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Cliente que Indicou</Label>
                        <Select
                          value={referralForm.referrerCustomerId}
                          onValueChange={(value) => {
                            const customer = customers.find(c => c._id === value);
                            setReferralForm({
                              ...referralForm,
                              referrerCustomerId: value,
                              referrerName: customer?.name || '',
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer._id} value={customer._id}>
                                {customer.name} - {customer.phone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Nome do Indicado</Label>
                        <Input
                          value={referralForm.referredName}
                          onChange={(e) => setReferralForm({ ...referralForm, referredName: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Telefone do Indicado</Label>
                        <Input
                          value={referralForm.referredPhone}
                          onChange={(e) => setReferralForm({ ...referralForm, referredPhone: e.target.value })}
                          placeholder="(11) 99999-9999"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea
                          value={referralForm.notes}
                          onChange={(e) => setReferralForm({ ...referralForm, notes: e.target.value })}
                          placeholder="Informações adicionais sobre a indicação"
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button type="submit" disabled={loading} className="flex-1">
                          {loading ? 'Salvando...' : 'Registrar Indicação'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowReferralDialog(false);
                            resetReferralForm();
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referrals.map((referral) => (
                  <div key={referral._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-full">
                        <UserPlus className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          <strong>{referral.referrerName}</strong> indicou <strong>{referral.referredName}</strong>
                        </p>
                        <p className="text-sm text-gray-500">
                          {referral.referredPhone} • {formatDate(referral.createdAt)}
                        </p>
                        {referral.firstPurchaseValue && (
                          <p className="text-sm text-green-600">
                            Primeira compra: {formatCurrency(referral.firstPurchaseValue)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(referral.status)}>
                      {getStatusLabel(referral.status)}
                    </Badge>
                  </div>
                ))}
              </div>
              
              {referrals.length === 0 && (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma indicação registrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
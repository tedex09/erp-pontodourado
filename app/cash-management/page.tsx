'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
  Plus, 
  Minus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Filter,
  Download,
  Receipt
} from 'lucide-react';
import { showToast } from '@/components/ui/toast';

interface CashMovement {
  _id: string;
  type: 'entrada' | 'saida' | 'venda';
  category: string;
  amount: number;
  description: string;
  userName: string;
  createdAt: string;
}

interface CashRegister {
  _id: string;
  openingAmount: number;
  totalSales: number;
  status: 'open' | 'closed';
}

export default function CashManagementPage() {
  const { data: session } = useSession();
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [currentCash, setCurrentCash] = useState<CashRegister | null>(null);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  
  const [movementForm, setMovementForm] = useState({
    type: 'entrada' as 'entrada' | 'saida',
    category: '',
    amount: 0,
    description: '',
  });

  const entryCategories = [
    { value: 'venda_externa', label: 'Venda Externa' },
    { value: 'devolucao', label: 'Devolução de Cliente' },
    { value: 'outros_recebimentos', label: 'Outros Recebimentos' },
  ];

  const exitCategories = [
    { value: 'retirada', label: 'Retirada do Caixa' },
    { value: 'despesa', label: 'Despesa Rápida' },
    { value: 'compra', label: 'Compra Rápida' },
    { value: 'pagamento', label: 'Pagamento Diverso' },
  ];

  useEffect(() => {
    fetchCurrentCash();
    fetchMovements();
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [dateFilter]);

  const fetchCurrentCash = async () => {
    try {
      const response = await fetch('/api/cash-register/current');
      if (response.ok) {
        const data = await response.json();
        setCurrentCash(data);
      }
    } catch (error) {
      console.error('Error fetching current cash:', error);
    }
  };

  const fetchMovements = async () => {
    try {
      const params = new URLSearchParams();
      if (currentCash) {
        params.append('cashRegisterId', currentCash._id);
      }
      params.append('startDate', dateFilter.startDate);
      params.append('endDate', dateFilter.endDate);

      const response = await fetch(`/api/cash-movements?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setMovements(data);
      }
    } catch (error) {
      console.error('Error fetching movements:', error);
    }
  };

  const handleSubmitMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCash) {
      showToast.error('Nenhum caixa aberto');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/cash-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...movementForm,
          cashRegisterId: currentCash._id,
        }),
      });
      
      if (response.ok) {
        showToast.success('Movimentação registrada com sucesso');
        setShowMovementDialog(false);
        resetForm();
        fetchMovements();
        fetchCurrentCash();
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Erro ao registrar movimentação');
      }
    } catch (error) {
      console.error('Error creating movement:', error);
      showToast.error('Erro ao processar movimentação');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMovementForm({
      type: 'entrada',
      category: '',
      amount: 0,
      description: '',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getCategoryLabel = (category: string) => {
    const allCategories = [...entryCategories, ...exitCategories];
    const found = allCategories.find(c => c.value === category);
    return found?.label || category;
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'entrada':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'saida':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'venda':
        return <Receipt className="h-4 w-4 text-blue-600" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'entrada':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'saida':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'venda':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Calcular totais
  const totalEntradas = movements
    .filter(m => m.type === 'entrada' || m.type === 'venda')
    .reduce((sum, m) => sum + m.amount, 0);
  
  const totalSaidas = movements
    .filter(m => m.type === 'saida')
    .reduce((sum, m) => sum + m.amount, 0);
  
  const saldoFinal = (currentCash?.openingAmount || 0) + totalEntradas - totalSaidas;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Caixa</h1>
        {currentCash && (
          <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Nova Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Movimentação</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitMovement} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Movimentação</Label>
                  <Select
                    value={movementForm.type}
                    onValueChange={(value: 'entrada' | 'saida') => 
                      setMovementForm({ ...movementForm, type: value, category: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={movementForm.category}
                    onValueChange={(value) => setMovementForm({ ...movementForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {(movementForm.type === 'entrada' ? entryCategories : exitCategories).map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={movementForm.amount}
                    onChange={(e) => setMovementForm({ ...movementForm, amount: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={movementForm.description}
                    onChange={(e) => setMovementForm({ ...movementForm, description: e.target.value })}
                    placeholder="Descreva a movimentação..."
                    rows={3}
                    required
                  />
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Registrando...' : 'Registrar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowMovementDialog(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!currentCash && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800">
                Nenhum caixa aberto. Abra um caixa para registrar movimentações.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo do Caixa */}
      {currentCash && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Valor Inicial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(currentCash.openingAmount)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalEntradas)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalSaidas)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Saldo Final</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(saldoFinal)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Movimentações do Caixa</CardTitle>
              <CardDescription>
                Histórico detalhado de entradas e saídas
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                className="w-40"
              />
              <span className="text-gray-500">até</span>
              <Input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                className="w-40"
              />
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {movements.map((movement) => (
              <div key={movement._id} className={`flex items-center justify-between p-4 rounded-lg border ${getMovementColor(movement.type)}`}>
                <div className="flex items-center space-x-4">
                  {getMovementIcon(movement.type)}
                  <div>
                    <p className="font-medium">{getCategoryLabel(movement.category)}</p>
                    <p className="text-sm opacity-75">{movement.description}</p>
                    <p className="text-xs opacity-60">
                      {movement.userName} • {formatDateTime(movement.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    movement.type === 'entrada' || movement.type === 'venda' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {movement.type === 'entrada' || movement.type === 'venda' ? '+' : '-'}
                    {formatCurrency(movement.amount)}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {movement.type.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {movements.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma movimentação encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
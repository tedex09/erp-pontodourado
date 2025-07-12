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
import { 
  Search, 
  Calendar, 
  User, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Filter
} from 'lucide-react';
import { showToast } from '@/components/ui/toast';

interface Fiado {
  _id: string;
  saleId: string;
  customerId: string;
  customerName: string;
  amount: number;
  dueDate?: string;
  isPaid: boolean;
  paidAt?: string;
  paidByName?: string;
  notes?: string;
  createdAt: string;
}

interface Customer {
  _id: string;
  name: string;
  phone: string;
}

export default function FiadosPage() {
  const [fiados, setFiados] = useState<Fiado[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [customerFilter, setCustomerFilter] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedFiado, setSelectedFiado] = useState<Fiado | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [paymentData, setPaymentData] = useState({
    notes: '',
  });

  useEffect(() => {
    fetchFiados();
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterFiados();
  }, [searchTerm, statusFilter, customerFilter]);

  const fetchFiados = async () => {
    try {
      const response = await fetch('/api/fiados');
      if (response.ok) {
        const data = await response.json();
        setFiados(data);
      }
    } catch (error) {
      console.error('Error fetching fiados:', error);
      showToast.error('Erro ao carregar fiados');
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

  const filterFiados = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (customerFilter) params.append('customer', customerFilter);

      const response = await fetch(`/api/fiados?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setFiados(data);
      }
    } catch (error) {
      console.error('Error filtering fiados:', error);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedFiado) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/fiados/${selectedFiado._id}/pay`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      
      if (response.ok) {
        showToast.success('Fiado marcado como pago');
        setShowPaymentDialog(false);
        setSelectedFiado(null);
        setPaymentData({ notes: '' });
        fetchFiados();
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Erro ao marcar como pago');
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
      showToast.error('Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
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

  const isOverdue = (fiado: Fiado) => {
    if (!fiado.dueDate || fiado.isPaid) return false;
    return new Date(fiado.dueDate) < new Date();
  };

  const getStatusBadge = (fiado: Fiado) => {
    if (fiado.isPaid) {
      return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
    }
    if (isOverdue(fiado)) {
      return <Badge className="bg-red-100 text-red-800">Vencido</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
  };

  const getStatusIcon = (fiado: Fiado) => {
    if (fiado.isPaid) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (isOverdue(fiado)) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
    return <Clock className="h-4 w-4 text-yellow-600" />;
  };

  const totalPendente = fiados
    .filter(f => !f.isPaid)
    .reduce((sum, f) => sum + f.amount, 0);

  const totalVencido = fiados
    .filter(f => !f.isPaid && isOverdue(f))
    .reduce((sum, f) => sum + f.amount, 0);

  const totalPago = fiados
    .filter(f => f.isPaid)
    .reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Controle de Fiados</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(totalPendente)}
            </div>
            <p className="text-xs text-muted-foreground">
              {fiados.filter(f => !f.isPaid).length} fiados pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vencido</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalVencido)}
            </div>
            <p className="text-xs text-muted-foreground">
              {fiados.filter(f => !f.isPaid && isOverdue(f)).length} fiados vencidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPago)}
            </div>
            <p className="text-xs text-muted-foreground">
              {fiados.filter(f => f.isPaid).length} fiados pagos
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Fiados</CardTitle>
          <CardDescription>
            Gerencie vendas feitas no fiado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por cliente ou ID da venda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="unpaid">Pendentes</SelectItem>
                <SelectItem value="overdue">Vencidos</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={customerFilter || 'all'} onValueChange={(value) => {
              setCustomerFilter(value === 'all' ? '' : value);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer._id} value={customer._id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>


            <Button onClick={filterFiados} variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
          </div>

          {/* Fiados List */}
          <div className="space-y-4">
            {fiados.map((fiado) => (
              <Card key={fiado._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(fiado)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{fiado.customerName}</h3>
                          {getStatusBadge(fiado)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4" />
                            {formatDate(fiado.createdAt)}
                          </div>
                          {fiado.dueDate && (
                            <div className="flex items-center">
                              <Clock className="mr-1 h-4 w-4" />
                              Vence: {formatDate(fiado.dueDate)}
                            </div>
                          )}
                          <div className="flex items-center">
                            <span>Venda: #{fiado.saleId.slice(-6)}</span>
                          </div>
                        </div>
                        {fiado.isPaid && fiado.paidAt && (
                          <div className="text-sm text-green-600 mt-1">
                            Pago em {formatDate(fiado.paidAt)} por {fiado.paidByName}
                          </div>
                        )}
                        {fiado.notes && (
                          <div className="text-sm text-gray-600 mt-1">
                            Obs: {fiado.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {formatCurrency(fiado.amount)}
                      </div>
                      {!fiado.isPaid && (
                        <Button
                          onClick={() => {
                            setSelectedFiado(fiado);
                            setShowPaymentDialog(true);
                          }}
                          size="sm"
                          className="mt-2"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marcar como Pago
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {fiados.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum fiado encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar Fiado como Pago</DialogTitle>
          </DialogHeader>
          {selectedFiado && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold">{selectedFiado.customerName}</h3>
                <p className="text-sm text-gray-600">
                  Venda: #{selectedFiado.saleId.slice(-6)}
                </p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(selectedFiado.amount)}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  placeholder="Informações sobre o pagamento..."
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleMarkAsPaid} disabled={loading} className="flex-1">
                  {loading ? 'Processando...' : 'Confirmar Pagamento'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentDialog(false);
                    setSelectedFiado(null);
                    setPaymentData({ notes: '' });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
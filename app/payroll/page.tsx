'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  CheckCircle, 
  Clock, 
  Calculator,
  FileText,
  TrendingUp
} from 'lucide-react';
import { showToast } from '@/components/ui/toast';

interface PayrollEntry {
  _id: string;
  userId: string;
  userName: string;
  month: number;
  year: number;
  dailyRate: number;
  workedDays: number;
  totalAmount: number;
  commissionAmount: number;
  finalAmount: number;
  status: 'pending' | 'paid';
  paidAt?: string;
  paidByName?: string;
  notes?: string;
}

export default function PayrollPage() {
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    fetchPayrollEntries();
  }, [selectedMonth, selectedYear]);

  const fetchPayrollEntries = async () => {
    try {
      const response = await fetch(`/api/payroll?month=${selectedMonth}&year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setPayrollEntries(data);
      }
    } catch (error) {
      console.error('Error fetching payroll entries:', error);
      showToast.error('Erro ao carregar folha de pagamento');
    }
  };

  const generatePayroll = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      });
      
      if (response.ok) {
        showToast.success('Folha de pagamento gerada com sucesso');
        fetchPayrollEntries();
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Erro ao gerar folha de pagamento');
      }
    } catch (error) {
      console.error('Error generating payroll:', error);
      showToast.error('Erro ao processar folha de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async () => {
    if (!selectedEntry) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/payroll/${selectedEntry._id}/pay`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: paymentNotes }),
      });
      
      if (response.ok) {
        showToast.success('Pagamento registrado com sucesso');
        setShowPaymentDialog(false);
        setSelectedEntry(null);
        setPaymentNotes('');
        fetchPayrollEntries();
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Erro ao registrar pagamento');
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

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const totalPending = payrollEntries
    .filter(entry => entry.status === 'pending')
    .reduce((sum, entry) => sum + entry.finalAmount, 0);

  const totalPaid = payrollEntries
    .filter(entry => entry.status === 'paid')
    .reduce((sum, entry) => sum + entry.finalAmount, 0);

  const totalCommissions = payrollEntries
    .reduce((sum, entry) => sum + entry.commissionAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Folha de Pagamento</h1>
        <div className="flex items-center space-x-4">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(Number(value))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {getMonthName(i + 1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          <Button onClick={generatePayroll} disabled={loading}>
            <Calculator className="mr-2 h-4 w-4" />
            {loading ? 'Gerando...' : 'Gerar Folha'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Funcionários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {payrollEntries.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(totalPending)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Comissões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalCommissions)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Folha de Pagamento - {getMonthName(selectedMonth)} {selectedYear}
          </CardTitle>
          <CardDescription>
            Controle de pagamentos e diárias dos funcionários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payrollEntries.map((entry) => (
              <Card key={entry._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-full">
                        <Users className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{entry.userName}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4" />
                            {entry.workedDays} dias trabalhados
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="mr-1 h-4 w-4" />
                            Diária: {formatCurrency(entry.dailyRate)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">
                          Salário: {formatCurrency(entry.totalAmount)}
                        </div>
                        {entry.commissionAmount > 0 && (
                          <div className="text-sm text-purple-600">
                            Comissão: {formatCurrency(entry.commissionAmount)}
                          </div>
                        )}
                        <div className="text-lg font-bold text-green-600">
                          Total: {formatCurrency(entry.finalAmount)}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant={entry.status === 'paid' ? 'default' : 'secondary'}>
                          {entry.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                        
                        {entry.status === 'pending' ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedEntry(entry);
                              setShowPaymentDialog(true);
                            }}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Marcar como Pago
                          </Button>
                        ) : (
                          <div className="text-xs text-gray-500">
                            Pago em {formatDate(entry.paidAt!)} por {entry.paidByName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {entry.notes && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                      <strong>Observações:</strong> {entry.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {payrollEntries.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Nenhuma folha de pagamento encontrada para este período
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Clique em "Gerar Folha" para criar a folha de pagamento do mês
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold">{selectedEntry.userName}</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <p>Período: {getMonthName(selectedEntry.month)} {selectedEntry.year}</p>
                  <p>Dias trabalhados: {selectedEntry.workedDays}</p>
                  <p>Salário: {formatCurrency(selectedEntry.totalAmount)}</p>
                  {selectedEntry.commissionAmount > 0 && (
                    <p>Comissão: {formatCurrency(selectedEntry.commissionAmount)}</p>
                  )}
                  <p className="font-semibold text-green-600">
                    Total: {formatCurrency(selectedEntry.finalAmount)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Observações do Pagamento</Label>
                <Textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Informações sobre o pagamento..."
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={markAsPaid} disabled={loading} className="flex-1">
                  {loading ? 'Processando...' : 'Confirmar Pagamento'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentDialog(false);
                    setSelectedEntry(null);
                    setPaymentNotes('');
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
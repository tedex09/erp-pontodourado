'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, CreditCard, Package } from 'lucide-react';

interface CustomerHistory {
  customer: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    totalSpent: number;
    totalPurchases: number;
  };
  sales: Array<{
    _id: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      total: number;
    }>;
    total: number;
    paymentMethod: string;
    sellerName: string;
    createdAt: string;
  }>;
}

export default function CustomerHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const [history, setHistory] = useState<CustomerHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchCustomerHistory(params.id as string);
    }
  }, [params.id]);

  const fetchCustomerHistory = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Error fetching customer history:', error);
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
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      dinheiro: 'Dinheiro',
      pix: 'PIX',
      cartao: 'Cartão',
      fiado: 'Fiado',
    };
    return labels[method] || method;
  };

  const getPaymentMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      dinheiro: 'bg-green-100 text-green-800',
      pix: 'bg-blue-100 text-blue-800',
      cartao: 'bg-purple-100 text-purple-800',
      fiado: 'bg-yellow-100 text-yellow-800',
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!history) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Cliente não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          Histórico de Compras - {history.customer.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo do Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nome</p>
                <p className="font-medium">{history.customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Telefone</p>
                <p className="font-medium">{history.customer.phone}</p>
              </div>
              {history.customer.email && (
                <div>
                  <p className="text-sm text-gray-500">E-mail</p>
                  <p className="font-medium">{history.customer.email}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Total de Compras</p>
                <p className="font-medium">{history.customer.totalPurchases}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Gasto</p>
                <p className="font-medium text-green-600">
                  {formatCurrency(history.customer.totalSpent)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Vendas</CardTitle>
              <CardDescription>
                Todas as compras realizadas pelo cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.sales.map((sale) => (
                  <Card key={sale._id} className="border-l-4 border-l-indigo-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">Venda #{sale._id.slice(-6)}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-4 w-4" />
                              {formatDate(sale.createdAt)}
                            </div>
                            <div className="flex items-center">
                              <User className="mr-1 h-4 w-4" />
                              {sale.sellerName}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(sale.total)}
                          </p>
                          <Badge className={getPaymentMethodColor(sale.paymentMethod)}>
                            <CreditCard className="mr-1 h-3 w-3" />
                            {getPaymentMethodLabel(sale.paymentMethod)}
                          </Badge>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <Package className="mr-1 h-4 w-4" />
                          Itens Comprados:
                        </p>
                        <div className="space-y-1">
                          {sale.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>
                                {item.quantity}x {item.name}
                              </span>
                              <span className="font-medium">
                                {formatCurrency(item.total)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {history.sales.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma compra realizada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
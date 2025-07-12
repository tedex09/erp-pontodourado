'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  Clock, 
  TrendingUp, 
  UserPlus, 
  History,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Trophy,
  Target,
  Calendar,
  DollarSign
} from 'lucide-react';

interface DashboardData {
  myStats: {
    todaySales: number;
    todayRevenue: number;
    customersServed: number;
    averageTicket: number;
  };
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  recentSales: Array<{
    _id: string;
    customerName?: string;
    total: number;
    createdAt: string;
  }>;
  ranking: {
    position: number;
    totalSellers: number;
    myRevenue: number;
    topSeller?: {
      name: string;
      revenue: number;
    };
  };
  clockStatus: {
    hasClockIn: boolean;
    lastEntry?: {
      type: string;
      time: string;
    };
    nextAction?: string;
  };
  cashStatus: {
    isOpen: boolean;
    openingAmount?: number;
    currentSales?: number;
  };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Redirect admins to the full dashboard
  useEffect(() => {
    if (session?.user?.role === 'admin') {
      window.location.href = '/admin-dashboard';
      return;
    }
  }, [session]);

  useEffect(() => {
    if (session && session.user.role !== 'admin') {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch my sales today
      const salesResponse = await fetch(`/api/reports?type=sales&period=day&sellerId=${session?.user?.id}`);
      const salesData = salesResponse.ok ? await salesResponse.json() : { totalSales: 0, totalRevenue: 0 };
      
      // Fetch my customers served today
      const customersResponse = await fetch(`/api/sales?sellerId=${session?.user?.id}&period=today`);
      const todaySales = customersResponse.ok ? await customersResponse.json() : [];
      const uniqueCustomers = new Set(todaySales.map((sale: any) => sale.customerId).filter(Boolean)).size;
      
      // Fetch my top products today
      const topProductsResponse = await fetch(`/api/reports?type=products&sellerId=${session?.user?.id}&period=day`);
      const topProducts = topProductsResponse.ok ? await topProductsResponse.json() : [];
      
      // Fetch recent sales
      const recentSales = todaySales.slice(0, 3);
      
      // Fetch ranking
      const rankingResponse = await fetch('/api/reports?type=employees&period=day');
      const allSellers = rankingResponse.ok ? await rankingResponse.json() : [];
      const myPosition = allSellers.findIndex((seller: any) => seller._id === session?.user?.id) + 1;
      const topSeller = allSellers[0];
      
      // Fetch clock status
      const clockResponse = await fetch('/api/time-tracking/today');
      const clockEntries = clockResponse.ok ? await clockResponse.json() : [];
      const lastEntry = clockEntries[clockEntries.length - 1];
      
      // Fetch cash status
      const cashResponse = await fetch('/api/cash-register/current');
      const cashData = cashResponse.ok ? await cashResponse.json() : null;
      
      const averageTicket = salesData.totalSales > 0 ? salesData.totalRevenue / salesData.totalSales : 0;
      
      setData({
        myStats: {
          todaySales: salesData.totalSales || 0,
          todayRevenue: salesData.totalRevenue || 0,
          customersServed: uniqueCustomers,
          averageTicket,
        },
        topProducts: topProducts.slice(0, 3),
        recentSales,
        ranking: {
          position: myPosition || 0,
          totalSellers: allSellers.length,
          myRevenue: salesData.totalRevenue || 0,
          topSeller: topSeller ? {
            name: topSeller.sellerName,
            revenue: topSeller.totalRevenue
          } : undefined,
        },
        clockStatus: {
          hasClockIn: clockEntries.length > 0,
          lastEntry: lastEntry ? {
            type: lastEntry.type,
            time: new Date(lastEntry.timestamp).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          } : undefined,
          nextAction: getNextClockAction(clockEntries),
        },
        cashStatus: {
          isOpen: !!cashData,
          openingAmount: cashData?.openingAmount,
          currentSales: cashData?.totalSales,
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextClockAction = (entries: any[]) => {
    if (entries.length === 0) return 'Bater Ponto de Entrada';
    
    const lastEntry = entries[entries.length - 1];
    switch (lastEntry.type) {
      case 'inicio_turno':
        return 'Saída para Intervalo';
      case 'saida_intervalo':
        return 'Retorno do Intervalo';
      case 'retorno_intervalo':
        return 'Fim do Turno';
      case 'fim_turno':
        return 'Turno Finalizado';
      default:
        return 'Bater Ponto';
    }
  };

  const getClockStatusColor = (hasClockIn: boolean, nextAction?: string) => {
    if (!hasClockIn) return 'text-red-600 bg-red-50';
    if (nextAction === 'Turno Finalizado') return 'text-gray-600 bg-gray-50';
    return 'text-green-600 bg-green-50';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Erro ao carregar dados do dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header com saudação */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Olá, {session?.user?.name}! 👋
            </h1>
            <p className="text-indigo-100 mt-1">
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-indigo-200">Suas vendas hoje</p>
            <p className="text-2xl font-bold">{formatCurrency(data.myStats.todayRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Status de Ponto e Caixa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={`border-l-4 ${data.clockStatus.hasClockIn ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${getClockStatusColor(data.clockStatus.hasClockIn, data.clockStatus.nextAction)}`}>
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Status do Ponto</p>
                  {data.clockStatus.lastEntry ? (
                    <p className="text-sm text-gray-500">
                      Última entrada: {data.clockStatus.lastEntry.time}
                    </p>
                  ) : (
                    <p className="text-sm text-red-500">Ponto não batido hoje</p>
                  )}
                </div>
              </div>
              <Link href="/ponto">
                <Button size="sm" variant={data.clockStatus.hasClockIn ? "outline" : "default"}>
                  {data.clockStatus.nextAction}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${data.cashStatus.isOpen ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${data.cashStatus.isOpen ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50'}`}>
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Status do Caixa</p>
                  <p className="text-sm text-gray-500">
                    {data.cashStatus.isOpen ? 'Caixa aberto' : 'Caixa fechado'}
                  </p>
                </div>
              </div>
              {data.cashStatus.isOpen && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Vendas</p>
                  <p className="font-medium">{formatCurrency(data.cashStatus.currentSales || 0)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas do Dia */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-blue-50 rounded-full">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-600">{data.myStats.todaySales}</p>
            <p className="text-sm text-gray-500">Vendas Hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-green-50 rounded-full">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-lg font-bold text-green-600">{formatCurrency(data.myStats.todayRevenue)}</p>
            <p className="text-sm text-gray-500">Faturamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-purple-50 rounded-full">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-purple-600">{data.myStats.customersServed}</p>
            <p className="text-sm text-gray-500">Clientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-orange-50 rounded-full">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <p className="text-lg font-bold text-orange-600">{formatCurrency(data.myStats.averageTicket)}</p>
            <p className="text-sm text-gray-500">Ticket Médio</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          <CardDescription>Acesse rapidamente as funcionalidades principais</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/pdv">
              <Button className="w-full h-20 flex flex-col space-y-2 bg-indigo-600 hover:bg-indigo-700">
                <ShoppingCart className="h-6 w-6" />
                <span className="text-sm">Abrir PDV</span>
              </Button>
            </Link>

            <Link href="/customers">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                <UserPlus className="h-6 w-6" />
                <span className="text-sm">Novo Cliente</span>
              </Button>
            </Link>

            <Link href="/products">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                <Package className="h-6 w-6" />
                <span className="text-sm">Produtos</span>
              </Button>
            </Link>

            <Link href="/ponto">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                <Clock className="h-6 w-6" />
                <span className="text-sm">Controle Ponto</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Ranking e Performance */}
      {data.ranking.totalSellers > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
              Ranking de Vendas Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-yellow-500 text-white rounded-full font-bold">
                    {data.ranking.position}
                  </div>
                  <div>
                    <p className="font-medium">Sua Posição</p>
                    <p className="text-sm text-gray-500">
                      {data.ranking.position}º de {data.ranking.totalSellers} vendedores
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(data.ranking.myRevenue)}</p>
                  <p className="text-sm text-gray-500">Seu faturamento</p>
                </div>
              </div>

              {data.ranking.topSeller && data.ranking.position > 1 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">🏆 Líder do dia:</p>
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{data.ranking.topSeller.name}</p>
                    <p className="font-bold text-green-600">
                      {formatCurrency(data.ranking.topSeller.revenue)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Produtos Mais Vendidos e Vendas Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seus Produtos Mais Vendidos Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{index + 1}</Badge>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.quantity} vendidos</p>
                    </div>
                  </div>
                  <p className="font-medium text-sm">{formatCurrency(product.revenue)}</p>
                </div>
              ))}
              {data.topProducts.length === 0 && (
                <p className="text-center text-gray-500 py-4">Nenhuma venda hoje</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Suas Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentSales.map((sale) => (
                <div key={sale._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">#{sale._id.slice(-6)}</p>
                    <p className="text-xs text-gray-500">
                      {sale.customerName || 'Cliente não informado'}
                    </p>
                    <p className="text-xs text-gray-500">{formatTime(sale.createdAt)}</p>
                  </div>
                  <p className="font-medium text-sm">{formatCurrency(sale.total)}</p>
                </div>
              ))}
              {data.recentSales.length === 0 && (
                <p className="text-center text-gray-500 py-4">Nenhuma venda recente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dicas e Motivação */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-blue-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">💡 Dica do Dia</h3>
              <p className="text-blue-800 text-sm">
                {data.myStats.todaySales === 0 
                  ? "Que tal começar o dia com uma venda? Acesse o PDV e atenda seus clientes!"
                  : data.myStats.todaySales < 5
                  ? "Você está indo bem! Continue assim e tente bater sua meta diária."
                  : "Excelente performance hoje! Continue mantendo esse ritmo."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
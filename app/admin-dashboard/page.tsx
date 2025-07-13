'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign, 
  AlertTriangle, 
  ShoppingCart, 
  Calendar, 
  Clock,
  CreditCard,
  UserCheck,
  Store,
  BarChart3,
  Settings,
  MapPin,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';

interface AdminDashboardData {
  revenue: {
    daily: number;
    monthly: number;
    total: number;
  };
  sales: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  averageTicket: number;
  topProducts: Array<{
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    total: number;
  }>;
  weekdayStats: Array<{
    day: string;
    sales: number;
    revenue: number;
  }>;
  fiados: {
    totalPending: number;
    activeCustomers: number;
    overdue: number;
  };
  lowStockProducts: Array<{
    _id: string;
    name: string;
    code: string;
    stock: number;
    minStock: number;
  }>;
  cashStatus: {
    isOpen: boolean;
    activeEmployees: number;
    totalCashRegisters: number;
  };
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
  }>;
}

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch revenue data
      const [dailyRes, monthlyRes, totalRes] = await Promise.all([
        fetch('/api/reports?type=sales&period=day'),
        fetch('/api/reports?type=sales&period=month'),
        fetch('/api/reports?type=sales&period=year')
      ]);
      
      const dailyData = dailyRes.ok ? await dailyRes.json() : { totalRevenue: 0, totalSales: 0 };
      const monthlyData = monthlyRes.ok ? await monthlyRes.json() : { totalRevenue: 0, totalSales: 0, averageTicket: 0 };
      const totalData = totalRes.ok ? await totalRes.json() : { totalRevenue: 0 };
      
      // Fetch weekly sales
      const weeklyRes = await fetch('/api/reports?type=sales&period=week');
      const weeklyData = weeklyRes.ok ? await weeklyRes.json() : { totalSales: 0 };
      
      // Fetch top products
      const topProductsRes = await fetch('/api/reports?type=products');
      const topProducts = topProductsRes.ok ? await topProductsRes.json() : [];
      
      // Fetch payment methods stats
      const paymentStatsRes = await fetch('/api/reports/payment-methods');
      const paymentMethods = paymentStatsRes.ok ? await paymentStatsRes.json() : [];
      
      // Fetch weekday stats
      const weekdayRes = await fetch('/api/reports/weekday-stats');
      const weekdayStats = weekdayRes.ok ? await weekdayRes.json() : [];
      
      // Fetch fiados data
      const fiadosRes = await fetch('/api/fiados/stats');
      const fiadosData = fiadosRes.ok ? await fiadosRes.json() : { totalPending: 0, activeCustomers: 0, overdue: 0 };
      
      // Fetch low stock products
      const lowStockRes = await fetch('/api/products?lowStock=true');
      const lowStockProducts = lowStockRes.ok ? await lowStockRes.json() : [];
      
      // Fetch cash and employee status
      const cashStatusRes = await fetch('/api/admin/cash-status');
      const cashStatus = cashStatusRes.ok ? await cashStatusRes.json() : { isOpen: false, activeEmployees: 0, totalCashRegisters: 0 };
      
      // Generate alerts
      const alerts = [];
      if (lowStockProducts.length > 0) {
        alerts.push({
          type: 'warning' as const,
          message: `${lowStockProducts.length} produto(s) com estoque baixo`
        });
      }
      if (fiadosData.overdue > 0) {
        alerts.push({
          type: 'error' as const,
          message: `${fiadosData.overdue} fiado(s) vencido(s)`
        });
      }
      if (!cashStatus.isOpen) {
        alerts.push({
          type: 'info' as const,
          message: 'Nenhum caixa aberto no momento'
        });
      }
      
      setData({
        revenue: {
          daily: dailyData.totalRevenue || 0,
          monthly: monthlyData.totalRevenue || 0,
          total: totalData.totalRevenue || 0,
        },
        sales: {
          daily: dailyData.totalSales || 0,
          weekly: weeklyData.totalSales || 0,
          monthly: monthlyData.totalSales || 0,
        },
        averageTicket: monthlyData.averageTicket || 0,
        topProducts: topProducts.slice(0, 5),
        paymentMethods,
        weekdayStats,
        fiados: fiadosData,
        lowStockProducts: lowStockProducts.slice(0, 5),
        cashStatus,
        alerts,
      });
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
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

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
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
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-sm text-gray-500 mt-1">
            Bem-vindo, {session?.user?.name} • {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert, index) => (
            <div key={index} className={`flex items-center space-x-2 p-3 rounded-lg border ${getAlertColor(alert.type)}`}>
              {getAlertIcon(alert.type)}
              <span className="text-sm font-medium">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Faturamento Diário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{formatCurrency(data.revenue.daily)}</div>
            <p className="text-xs text-green-100 mt-1">Hoje</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Faturamento Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{formatCurrency(data.revenue.monthly)}</div>
            <p className="text-xs text-blue-100 mt-1">Este mês</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{formatCurrency(data.revenue.total)}</div>
            <p className="text-xs text-purple-100 mt-1">Acumulado</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales and Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.sales.daily}</div>
            <p className="text-xs text-muted-foreground">vendas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Semana</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.sales.weekly}</div>
            <p className="text-xs text-muted-foreground">vendas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.sales.monthly}</div>
            <p className="text-xs text-muted-foreground">vendas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.averageTicket)}</div>
            <p className="text-xs text-muted-foreground">por venda</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <CardDescription>Top 5 produtos por quantidade</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="productName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalQuantity" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Formas de Pagamento</CardTitle>
            <CardDescription>Distribuição por método</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.paymentMethods}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ method, percent }) => `${method} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekday Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>Mapa de Calor - Dias da Semana</CardTitle>
            <CardDescription>Vendas por dia da semana</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.weekdayStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(Number(value)) : value,
                  name === 'revenue' ? 'Faturamento' : 'Vendas'
                ]} />
                <Bar dataKey="sales" fill="#10b981" />
                <Bar dataKey="revenue" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fiados Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Painel de Fiados</CardTitle>
            <CardDescription>Status dos pagamentos a prazo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{formatCurrency(data.fiados.totalPending)}</div>
                  <p className="text-xs text-gray-500">Total Pendente</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{data.fiados.activeCustomers}</div>
                  <p className="text-xs text-gray-500">Clientes Ativos</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{data.fiados.overdue}</div>
                  <p className="text-xs text-gray-500">Vencidos</p>
                </div>
              </div>
              <Link href="/fiados">
                <Button className="w-full" variant="outline">
                  Ver Todos os Fiados
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
              Produtos em Estoque Baixo
            </CardTitle>
            <CardDescription>Produtos que precisam de reposição</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.lowStockProducts.map((product) => (
                <div key={product._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-red-900">{product.name}</p>
                    <p className="text-sm text-red-600">Código: {product.code}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">{product.stock} / {product.minStock}</Badge>
                  </div>
                </div>
              ))}
              {data.lowStockProducts.length === 0 && (
                <p className="text-center text-gray-500 py-4">Todos os produtos com estoque normal</p>
              )}
              <Link href="/inventory">
                <Button className="w-full" variant="outline">
                  Gerenciar Estoque
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>Informações operacionais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Status do Caixa</span>
                </div>
                <Badge variant={data.cashStatus.isOpen ? 'default' : 'secondary'}>
                  {data.cashStatus.isOpen ? 'Aberto' : 'Fechado'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Funcionários Ativos</span>
                </div>
                <Badge variant="outline">{data.cashStatus.activeEmployees}</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Caixas Abertos</span>
                </div>
                <Badge variant="outline">{data.cashStatus.totalCashRegisters}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Atalhos Rápidos</CardTitle>
          <CardDescription>Acesso rápido às principais funcionalidades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/categories">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                <Store className="h-6 w-6" />
                <span className="text-sm">Categorias</span>
              </Button>
            </Link>

            <Link href="/products">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                <Package className="h-6 w-6" />
                <span className="text-sm">Produtos</span>
              </Button>
            </Link>

            <Link href="/customers">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                <Users className="h-6 w-6" />
                <span className="text-sm">Clientes</span>
              </Button>
            </Link>

            <Link href="/reports">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">Relatórios</span>
              </Button>
            </Link>

            <Link href="/employees">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                <UserCheck className="h-6 w-6" />
                <span className="text-sm">Funcionários</span>
              </Button>
            </Link>

            <Link href="/campaigns">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                <Users className="h-6 w-6" />
                <span className="text-sm">Campanhas</span>
              </Button>
            </Link>

            <Link href="/inventory">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                <Package className="h-6 w-6" />
                <span className="text-sm">Estoque</span>
              </Button>
            </Link>

            <Link href="/settings">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                <Settings className="h-6 w-6" />
                <span className="text-sm">Configurações</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
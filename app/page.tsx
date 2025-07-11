'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Package, DollarSign, AlertTriangle, ShoppingCart, Calendar } from 'lucide-react';

interface DashboardData {
  salesData: {
    totalSales: number;
    totalRevenue: number;
    todaySales: number;
    monthlyRevenue: number;
  };
  counts: {
    totalCustomers: number;
    totalProducts: number;
    lowStockProducts: number;
  };
  topProducts: Array<{
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  recentSales: Array<{
    _id: string;
    customerName?: string;
    total: number;
    createdAt: string;
    sellerName: string;
  }>;
  lowStockItems: Array<{
    _id: string;
    name: string;
    code: string;
    stock: number;
    minStock: number;
  }>;
  dailySales: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch sales data
      const salesResponse = await fetch('/api/reports?type=sales&period=month');
      const salesData = salesResponse.ok ? await salesResponse.json() : { totalSales: 0, totalRevenue: 0 };
      
      // Fetch today's sales
      const todayResponse = await fetch('/api/reports?type=sales&period=day');
      const todayData = todayResponse.ok ? await todayResponse.json() : { totalSales: 0, totalRevenue: 0 };
      
      // Fetch counts
      const [customersRes, productsRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/products')
      ]);
      
      const customers = customersRes.ok ? await customersRes.json() : [];
      const products = productsRes.ok ? await productsRes.json() : [];
      
      // Fetch top products
      const topProductsResponse = await fetch('/api/reports?type=products');
      const topProducts = topProductsResponse.ok ? await topProductsResponse.json() : [];
      
      // Fetch recent sales
      const recentSalesResponse = await fetch('/api/sales');
      const allSales = recentSalesResponse.ok ? await recentSalesResponse.json() : [];
      const recentSales = allSales.slice(0, 5);
      
      // Fetch daily sales for chart
      const dailySalesResponse = await fetch('/api/reports?type=daily&days=7');
      const dailySales = dailySalesResponse.ok ? await dailySalesResponse.json() : [];
      
      // Calculate low stock products
      const lowStockItems = products.filter((p: any) => p.stock <= p.minStock);
      
      setData({
        salesData: {
          totalSales: salesData.totalSales || 0,
          totalRevenue: salesData.totalRevenue || 0,
          todaySales: todayData.totalSales || 0,
          monthlyRevenue: salesData.totalRevenue || 0,
        },
        counts: {
          totalCustomers: customers.length,
          totalProducts: products.length,
          lowStockProducts: lowStockItems.length,
        },
        topProducts: topProducts.slice(0, 5),
        recentSales,
        lowStockItems: lowStockItems.slice(0, 5),
        dailySales,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const cards = [
    {
      title: 'Vendas Hoje',
      value: data.salesData.todaySales,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Receita Mensal',
      value: formatCurrency(data.salesData.monthlyRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total de Clientes',
      value: data.counts.totalCustomers,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Produtos Cadastrados',
      value: data.counts.totalProducts,
      icon: Package,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Estoque Baixo',
      value: data.counts.lowStockProducts,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Total de Vendas',
      value: data.salesData.totalSales,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Bem-vindo, {session?.user?.name}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`h-10 w-10 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendas dos Últimos 7 Dias</CardTitle>
            <CardDescription>
              Evolução das vendas diárias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(Number(value)) : value,
                    name === 'revenue' ? 'Faturamento' : 'Vendas'
                  ]}
                />
                <Bar dataKey="sales" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <CardDescription>
              Top 5 produtos da semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{index + 1}</Badge>
                    <div>
                      <p className="font-medium text-sm">{product.productName}</p>
                      <p className="text-xs text-gray-500">{product.totalQuantity} vendidos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrency(product.totalRevenue)}</p>
                  </div>
                </div>
              ))}
              {data.topProducts.length === 0 && (
                <p className="text-center text-gray-500 py-4">Nenhuma venda registrada</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
            <CardDescription>
              Últimas vendas realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentSales.map((sale) => (
                <div key={sale._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Venda #{sale._id.slice(-6)}</p>
                    <p className="text-sm text-gray-500">
                      {sale.customerName || 'Cliente não informado'} • {sale.sellerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(sale.total)}</p>
                    <p className="text-sm text-gray-500">{formatDate(sale.createdAt)}</p>
                  </div>
                </div>
              ))}
              {data.recentSales.length === 0 && (
                <p className="text-center text-gray-500 py-4">Nenhuma venda recente</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Produtos em Baixa</CardTitle>
            <CardDescription>
              Produtos com estoque baixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.lowStockItems.map((product) => (
                <div key={product._id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">Código: {product.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">{product.stock} unidades</p>
                    <p className="text-sm text-gray-500">Mín: {product.minStock}</p>
                  </div>
                </div>
              ))}
              {data.lowStockItems.length === 0 && (
                <p className="text-center text-gray-500 py-4">Todos os produtos com estoque normal</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
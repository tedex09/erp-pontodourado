'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Package, DollarSign, Calendar, Download } from 'lucide-react';
import { showToast } from '@/components/ui/toast';

interface SalesData {
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  averageTicket: number;
}

interface DailySalesData {
  date: string;
  sales: number;
  revenue: number;
}

interface ProductData {
  _id: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  salesCount: number;
}

interface CustomerData {
  _id: string;
  customerName: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchase: string;
}

interface EmployeeData {
  _id: string;
  sellerName: string;
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [dailySales, setDailySales] = useState<DailySalesData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductData[]>([]);
  const [topCustomers, setTopCustomers] = useState<CustomerData[]>([]);
  const [employeeData, setEmployeeData] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch sales data
      const salesResponse = await fetch(`/api/reports?type=sales&period=${period}`);
      if (salesResponse.ok) {
        const sales = await salesResponse.json();
        setSalesData(sales);
      }

      // Fetch daily sales
      const dailyResponse = await fetch('/api/reports?type=daily&days=30');
      if (dailyResponse.ok) {
        const daily = await dailyResponse.json();
        setDailySales(daily);
      }

      // Fetch top products
      const productsResponse = await fetch('/api/reports?type=products');
      if (productsResponse.ok) {
        const products = await productsResponse.json();
        setTopProducts(products);
      }

      // Fetch top customers
      const customersResponse = await fetch('/api/reports?type=customers');
      if (customersResponse.ok) {
        const customers = await customersResponse.json();
        setTopCustomers(customers);
      }

      // Fetch employee data
      const employeesResponse = await fetch('/api/reports?type=employees');
      if (employeesResponse.ok) {
        const employees = await employeesResponse.json();
        setEmployeeData(employees);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      showToast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
        <div className="flex items-center space-x-4">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hoje</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {salesData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesData.totalSales}</div>
              <p className="text-xs text-muted-foreground">
                vendas no período
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(salesData.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                receita total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Estimado</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(salesData.totalProfit)}</div>
              <p className="text-xs text-muted-foreground">
                margem de lucro
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(salesData.averageTicket)}</div>
              <p className="text-xs text-muted-foreground">
                por venda
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendas Diárias (Últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(Number(value)) : value,
                    name === 'revenue' ? 'Faturamento' : 'Vendas'
                  ]}
                />
                <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="productName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalQuantity" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Produtos</CardTitle>
            <CardDescription>Produtos mais vendidos por quantidade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.slice(0, 10).map((product, index) => (
                <div key={product._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{product.productName}</p>
                      <p className="text-sm text-gray-500">
                        {product.salesCount} vendas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{product.totalQuantity} un.</p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(product.totalRevenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Clientes</CardTitle>
            <CardDescription>Clientes que mais compraram</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCustomers.slice(0, 10).map((customer, index) => (
                <div key={customer._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{customer.customerName}</p>
                      <p className="text-sm text-gray-500">
                        {customer.totalPurchases} compras
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(customer.totalSpent)}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(customer.lastPurchase)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Funcionário</CardTitle>
          <CardDescription>Vendas e faturamento por vendedor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employeeData.map((employee) => (
              <Card key={employee._id}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">{employee.sellerName}</h3>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Vendas:</span>
                        <span className="font-medium">{employee.totalSales}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Faturamento:</span>
                        <span className="font-medium">{formatCurrency(employee.totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Ticket Médio:</span>
                        <span className="font-medium">{formatCurrency(employee.averageTicket)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
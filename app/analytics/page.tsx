'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Target,
  Zap,
  BarChart3,
  RefreshCw,
  MessageCircle,
  Gift,
  UserX,
  Star,
  Calendar,
  DollarSign
} from 'lucide-react';
import { showToast } from '@/components/ui/toast';

interface DashboardData {
  summary: {
    totalInsights: number;
    criticalAlerts: number;
    opportunities: number;
    todayRevenue: number;
    monthRevenue: number;
    avgDailyRevenue: number;
    revenueGrowth: number;
  };
  insightStats: Array<{
    _id: string;
    count: number;
    highPriority: number;
  }>;
  criticalInsights: Array<{
    _id: string;
    type: string;
    category: string;
    priority: string;
    title: string;
    description: string;
    data: any;
    actionable: boolean;
    createdAt: string;
  }>;
  opportunities: Array<any>;
  lowRotationProducts: Array<any>;
  inactiveCustomers: Array<any>;
  topProducts: Array<any>;
  quickActions: Array<{
    title: string;
    description: string;
    action: string;
    priority: string;
  }>;
}

interface Insight {
  _id: string;
  type: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  data: any;
  actionable: boolean;
  actionTaken: boolean;
  createdAt: string;
}

export default function AnalyticsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchInsights();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchInsights = async (filters?: any) => {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.priority) params.append('priority', filters.priority);
      
      const response = await fetch(`/api/analytics/insights?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  const generateInsights = async () => {
    setLoading(true);
    try {
      // First ensure settings are properly loaded
      setSettingsLoading(true);
      const settingsResponse = await fetch('/api/analytics/settings');
      if (!settingsResponse.ok) {
        throw new Error('Failed to load analytics settings');
      }
      setSettingsLoading(false);
      
      const response = await fetch('/api/analytics/insights', {
        method: 'POST',
      });
      
      if (response.ok) {
        showToast.success('Insights gerados com sucesso!');
        fetchDashboardData();
        fetchInsights();
      } else {
        showToast.error('Erro ao gerar insights');
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      showToast.error('Erro ao processar análises');
      setSettingsLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const markActionTaken = async (insightId: string) => {
    try {
      const response = await fetch(`/api/analytics/insights/${insightId}/action`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Ação realizada pelo usuário' }),
      });
      
      if (response.ok) {
        showToast.success('Ação registrada com sucesso!');
        fetchDashboardData();
        fetchInsights();
        setSelectedInsight(null);
      } else {
        showToast.error('Erro ao registrar ação');
      }
    } catch (error) {
      console.error('Error marking action:', error);
      showToast.error('Erro ao processar ação');
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'opportunity':
        return <Lightbulb className="h-4 w-4" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4" />;
      case 'recommendation':
        return <Target className="h-4 w-4" />;
      case 'achievement':
        return <Star className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <Package className="h-5 w-5" />;
      case 'customer':
        return <Users className="h-5 w-5" />;
      case 'employee':
        return <UserX className="h-5 w-5" />;
      case 'schedule':
        return <Clock className="h-5 w-5" />;
      case 'inventory':
        return <Package className="h-5 w-5" />;
      default:
        return <BarChart3 className="h-5 w-5" />;
    }
  };

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Brain className="mr-3 h-8 w-8 text-indigo-600" />
            Análise Inteligente
          </h1>
          <p>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading || settingsLoading ? 'animate-spin' : ''}`} />
            {loading ? 'Analisando...' : settingsLoading ? 'Carregando configurações...' : 'Atualizar Análises'}
          </p>
        </div>
        <Button onClick={generateInsights} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analisando...' : 'Atualizar Análises'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="all">Todos os Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total de Insights</p>
                    <p className="text-2xl font-bold">{dashboardData.summary.totalInsights}</p>
                  </div>
                  <Brain className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Alertas Críticos</p>
                    <p className="text-2xl font-bold">{dashboardData.summary.criticalAlerts}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Oportunidades</p>
                    <p className="text-2xl font-bold">{dashboardData.summary.opportunities}</p>
                  </div>
                  <Lightbulb className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Crescimento Hoje</p>
                    <p className="text-2xl font-bold">
                      {dashboardData.summary.revenueGrowth > 0 ? '+' : ''}
                      {dashboardData.summary.revenueGrowth.toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2 h-5 w-5 text-yellow-500" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dashboardData.quickActions.map((action, index) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    action.priority === 'high' ? 'border-l-red-500 bg-red-50' :
                    action.priority === 'medium' ? 'border-l-yellow-500 bg-yellow-50' :
                    'border-l-blue-500 bg-blue-50'
                  }`}>
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                    <Button size="sm" className="mt-3" variant="outline">
                      Executar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Critical Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Alertas Críticos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.criticalInsights.slice(0, 5).map((insight) => (
                    <div key={insight._id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                         onClick={() => setSelectedInsight(insight)}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2">
                          {getTypeIcon(insight.type)}
                          <div>
                            <p className="font-medium text-sm">{insight.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{insight.description}</p>
                          </div>
                        </div>
                        <Badge className={getPriorityColor(insight.priority)}>
                          {insight.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <Lightbulb className="mr-2 h-5 w-5" />
                  Oportunidades de Melhoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.opportunities.slice(0, 5).map((opportunity) => (
                    <div key={opportunity._id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                         onClick={() => setSelectedInsight(opportunity)}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2">
                          {getTypeIcon(opportunity.type)}
                          <div>
                            <p className="font-medium text-sm">{opportunity.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{opportunity.description}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          Oportunidade
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.filter(i => i.category === 'opportunity').map((insight) => (
              <Card key={insight._id} className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedInsight(insight)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(insight.type)}
                      <Badge className="bg-green-100 text-green-800">
                        {insight.type}
                      </Badge>
                    </div>
                    <Badge className={getPriorityColor(insight.priority)}>
                      {insight.priority}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{insight.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{formatDate(insight.createdAt)}</span>
                    {insight.actionable && !insight.actionTaken && (
                      <Button size="sm" onClick={(e) => {
                        e.stopPropagation();
                        markActionTaken(insight._id);
                      }}>
                        Executar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.filter(i => i.category === 'alert').map((insight) => (
              <Card key={insight._id} className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-red-500"
                    onClick={() => setSelectedInsight(insight)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(insight.type)}
                      <Badge className="bg-red-100 text-red-800">
                        {insight.type}
                      </Badge>
                    </div>
                    <Badge className={getPriorityColor(insight.priority)}>
                      {insight.priority}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{insight.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{formatDate(insight.createdAt)}</span>
                    {insight.actionable && !insight.actionTaken && (
                      <Button size="sm" variant="outline" onClick={(e) => {
                        e.stopPropagation();
                        markActionTaken(insight._id);
                      }}>
                        Resolver
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="flex items-center space-x-4 mb-4">
            <Button onClick={() => fetchInsights({ category: 'opportunity' })} variant="outline" size="sm">
              Oportunidades
            </Button>
            <Button onClick={() => fetchInsights({ category: 'alert' })} variant="outline" size="sm">
              Alertas
            </Button>
            <Button onClick={() => fetchInsights({ priority: 'high' })} variant="outline" size="sm">
              Alta Prioridade
            </Button>
            <Button onClick={() => fetchInsights()} variant="outline" size="sm">
              Todos
            </Button>
          </div>
          
          <div className="space-y-3">
            {insights.map((insight) => (
              <Card key={insight._id} className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedInsight(insight)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getCategoryIcon(insight.category)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                          <Badge className={getPriorityColor(insight.priority)}>
                            {insight.priority}
                          </Badge>
                          <Badge variant="outline">
                            {insight.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{insight.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-500">{formatDate(insight.createdAt)}</span>
                          {insight.actionTaken && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Resolvido
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {insight.actionable && !insight.actionTaken && (
                      <Button size="sm" onClick={(e) => {
                        e.stopPropagation();
                        markActionTaken(insight._id);
                      }}>
                        Ação
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Insight Detail Dialog */}
      <Dialog open={!!selectedInsight} onOpenChange={() => setSelectedInsight(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedInsight && getCategoryIcon(selectedInsight.category)}
              <span>{selectedInsight?.title}</span>
              <Badge className={selectedInsight ? getPriorityColor(selectedInsight.priority) : ''}>
                {selectedInsight?.priority}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedInsight && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{selectedInsight.description}</p>
              </div>
              
              {selectedInsight.data && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Detalhes:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Object.entries(selectedInsight.data).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="ml-2 font-medium">
                          {typeof value === 'number' && key.includes('Amount') ? 
                            formatCurrency(value) : 
                            String(value)
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-gray-500">
                  Criado em: {formatDate(selectedInsight.createdAt)}
                </span>
                {selectedInsight.actionable && !selectedInsight.actionTaken && (
                  <Button onClick={() => markActionTaken(selectedInsight._id)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar como Resolvido
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
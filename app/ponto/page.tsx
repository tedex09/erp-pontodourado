'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  Coffee, 
  LogOut,
  DollarSign,
  Calculator
} from 'lucide-react';
import { showToast } from '@/components/ui/toast';

interface TimeEntry {
  _id: string;
  type: 'inicio_turno' | 'saida_intervalo' | 'retorno_intervalo' | 'fim_turno';
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  isValid: boolean;
  notes?: string;
}

interface CashRegister {
  _id: string;
  openingAmount: number;
  closingAmount?: number;
  expectedAmount?: number;
  difference?: number;
  openedAt: string;
  closedAt?: string;
  totalSales: number;
  status: 'open' | 'closed';
}

export default function PontoPage() {
  const { data: session } = useSession();
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [showClockInDialog, setShowClockInDialog] = useState(false);
  const [showCashDialog, setShowCashDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [currentCash, setCurrentCash] = useState<CashRegister | null>(null);
  
  const [clockInData, setClockInData] = useState({
    type: 'inicio_turno' as 'inicio_turno' | 'saida_intervalo' | 'retorno_intervalo' | 'fim_turno',
    notes: '',
  });

  const [cashData, setCashData] = useState({
    openingAmount: 0,
    closingAmount: 0,
    notes: '',
  });

  useEffect(() => {
    fetchTodayEntries();
    fetchCurrentCash();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada pelo navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation(position);
        setLocationError('');
      },
      (error) => {
        setLocationError('Erro ao obter localização: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const fetchTodayEntries = async () => {
    try {
      const response = await fetch('/api/time-tracking/today');
      if (response.ok) {
        const data = await response.json();
        setTodayEntries(data);
      }
    } catch (error) {
      console.error('Error fetching time entries:', error);
    }
  };

  const fetchCurrentCash = async () => {
    try {
      const response = await fetch('/api/cash-register/current');
      if (response.ok) {
        const data = await response.json();
        setCurrentCash(data);
      }
    } catch (error) {
      console.error('Error fetching cash register:', error);
    }
  };

  const handleClockIn = async () => {
    if (!currentLocation) {
      showToast.error('Localização necessária para bater ponto');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/time-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: clockInData.type,
          location: {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            accuracy: currentLocation.coords.accuracy,
          },
          notes: clockInData.notes,
        }),
      });
      
      if (response.ok) {
        showToast.success('Ponto registrado com sucesso');
        setShowClockInDialog(false);
        setClockInData({ type: 'inicio_turno', notes: '' });
        fetchTodayEntries();
        
        // Se for início de turno, abrir caixa
        if (clockInData.type === 'inicio_turno') {
          setShowCashDialog(true);
        }
        
        // Se for fim de turno, fechar caixa
        if (clockInData.type === 'fim_turno' && currentCash) {
          setShowCashDialog(true);
        }
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Erro ao registrar ponto');
      }
    } catch (error) {
      console.error('Error clocking in:', error);
      showToast.error('Erro ao registrar ponto');
    } finally {
      setLoading(false);
    }
  };

  const handleCashOperation = async () => {
    setLoading(true);
    
    try {
      const isOpening = !currentCash;
      const url = isOpening ? '/api/cash-register' : `/api/cash-register/${currentCash._id}/close`;
      const method = isOpening ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isOpening ? {
          openingAmount: cashData.openingAmount,
          notes: cashData.notes,
        } : {
          closingAmount: cashData.closingAmount,
          notes: cashData.notes,
        }),
      });
      
      if (response.ok) {
        showToast.success(isOpening ? 'Caixa aberto com sucesso' : 'Caixa fechado com sucesso');
        setShowCashDialog(false);
        setCashData({ openingAmount: 0, closingAmount: 0, notes: '' });
        fetchCurrentCash();
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Erro na operação do caixa');
      }
    } catch (error) {
      console.error('Error with cash operation:', error);
      showToast.error('Erro na operação do caixa');
    } finally {
      setLoading(false);
    }
  };

  const getNextClockType = (): 'inicio_turno' | 'saida_intervalo' | 'retorno_intervalo' | 'fim_turno' => {
    if (todayEntries.length === 0) return 'inicio_turno';
    
    const lastEntry = todayEntries[todayEntries.length - 1];
    
    switch (lastEntry.type) {
      case 'inicio_turno':
        return 'saida_intervalo';
      case 'saida_intervalo':
        return 'retorno_intervalo';
      case 'retorno_intervalo':
        return 'fim_turno';
      default:
        return 'inicio_turno';
    }
  };

  const getClockTypeLabel = (type: string) => {
    const labels = {
      inicio_turno: 'Início do Turno',
      saida_intervalo: 'Saída para Intervalo',
      retorno_intervalo: 'Retorno do Intervalo',
      fim_turno: 'Fim do Turno',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getClockTypeIcon = (type: string) => {
    switch (type) {
      case 'inicio_turno':
        return <Clock className="h-4 w-4 text-green-600" />;
      case 'saida_intervalo':
        return <Coffee className="h-4 w-4 text-yellow-600" />;
      case 'retorno_intervalo':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'fim_turno':
        return <LogOut className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const canClockIn = todayEntries.length === 0 || 
    todayEntries[todayEntries.length - 1].type !== 'fim_turno';

  const nextClockType = getNextClockType();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Controle de Ponto</h1>
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-600">
            {currentLocation ? 'Localização obtida' : 'Obtendo localização...'}
          </span>
        </div>
      </div>

      {locationError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{locationError}</p>
              <Button onClick={getCurrentLocation} size="sm" variant="outline">
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clock In Section */}
        <Card>
          <CardHeader>
            <CardTitle>Registrar Ponto</CardTitle>
            <CardDescription>
              Registre sua entrada, saída e intervalos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {canClockIn ? (
                <Button
                  onClick={() => {
                    setClockInData({ ...clockInData, type: nextClockType });
                    setShowClockInDialog(true);
                  }}
                  disabled={!currentLocation || loading}
                  className="w-full h-16 text-lg"
                >
                  {getClockTypeIcon(nextClockType)}
                  <span className="ml-2">{getClockTypeLabel(nextClockType)}</span>
                </Button>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-gray-600">Turno finalizado</p>
                </div>
              )}

              {/* Today's Entries */}
              <div className="space-y-2">
                <h3 className="font-semibold">Registros de Hoje</h3>
                {todayEntries.map((entry) => (
                  <div key={entry._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getClockTypeIcon(entry.type)}
                      <div>
                        <p className="font-medium">{getClockTypeLabel(entry.type)}</p>
                        {entry.notes && (
                          <p className="text-sm text-gray-500">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatTime(entry.timestamp)}</p>
                      <Badge variant={entry.isValid ? 'default' : 'destructive'}>
                        {entry.isValid ? 'Válido' : 'Inválido'}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {todayEntries.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    Nenhum registro hoje
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cash Register Section */}
        <Card>
          <CardHeader>
            <CardTitle>Controle de Caixa</CardTitle>
            <CardDescription>
              Status do caixa atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentCash ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-green-800">Caixa Aberto</h3>
                    <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-green-600">Valor Inicial:</p>
                      <p className="font-medium">{formatCurrency(currentCash.openingAmount)}</p>
                    </div>
                    <div>
                      <p className="text-green-600">Vendas:</p>
                      <p className="font-medium">{formatCurrency(currentCash.totalSales)}</p>
                    </div>
                    <div>
                      <p className="text-green-600">Aberto em:</p>
                      <p className="font-medium">{formatTime(currentCash.openedAt)}</p>
                    </div>
                    <div>
                      <p className="text-green-600">Esperado:</p>
                      <p className="font-medium">
                        {formatCurrency(currentCash.openingAmount + currentCash.totalSales)}
                      </p>
                    </div>
                  </div>
                </div>

                {nextClockType === 'fim_turno' && (
                  <Button
                    onClick={() => setShowCashDialog(true)}
                    className="w-full"
                    variant="outline"
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    Fechar Caixa
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Caixa fechado</p>
                {nextClockType === 'inicio_turno' && (
                  <p className="text-sm text-gray-500">
                    O caixa será aberto automaticamente ao bater ponto
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clock In Dialog */}
      <Dialog open={showClockInDialog} onOpenChange={setShowClockInDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Ponto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                {getClockTypeIcon(clockInData.type)}
                <h3 className="font-semibold text-blue-800">
                  {getClockTypeLabel(clockInData.type)}
                </h3>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                {new Date().toLocaleString('pt-BR')}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Textarea
                value={clockInData.notes}
                onChange={(e) => setClockInData({ ...clockInData, notes: e.target.value })}
                placeholder="Informações adicionais..."
                rows={3}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleClockIn} disabled={loading} className="flex-1">
                {loading ? 'Registrando...' : 'Confirmar'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowClockInDialog(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cash Dialog */}
      <Dialog open={showCashDialog} onOpenChange={setShowCashDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentCash ? 'Fechar Caixa' : 'Abrir Caixa'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {currentCash ? (
              <>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Resumo do Turno</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Valor Inicial:</p>
                      <p className="font-medium">{formatCurrency(currentCash.openingAmount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total de Vendas:</p>
                      <p className="font-medium">{formatCurrency(currentCash.totalSales)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-600">Valor Esperado no Caixa:</p>
                      <p className="font-bold text-lg">
                        {formatCurrency(currentCash.openingAmount + currentCash.totalSales)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Valor Real no Caixa *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={cashData.closingAmount}
                    onChange={(e) => setCashData({ ...cashData, closingAmount: Number(e.target.value) })}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                {cashData.closingAmount > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Diferença:</strong> {formatCurrency(
                        cashData.closingAmount - (currentCash.openingAmount + currentCash.totalSales)
                      )}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <Label>Valor Inicial do Caixa *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={cashData.openingAmount}
                  onChange={(e) => setCashData({ ...cashData, openingAmount: Number(e.target.value) })}
                  placeholder="0.00"
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Textarea
                value={cashData.notes}
                onChange={(e) => setCashData({ ...cashData, notes: e.target.value })}
                placeholder="Informações sobre o caixa..."
                rows={3}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleCashOperation} disabled={loading} className="flex-1">
                {loading ? 'Processando...' : (currentCash ? 'Fechar Caixa' : 'Abrir Caixa')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCashDialog(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
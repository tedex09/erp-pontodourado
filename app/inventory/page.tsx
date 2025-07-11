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
import { Plus, Minus, AlertTriangle, Package, History, TrendingUp, TrendingDown } from 'lucide-react';
import { showToast } from '@/components/ui/toast';

interface Product {
  _id: string;
  name: string;
  code: string;
  stock: number;
  minStock: number;
}

interface StockMovement {
  _id: string;
  productName: string;
  type: 'entrada' | 'saida' | 'ajuste';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  observation?: string;
  userName: string;
  createdAt: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [movementData, setMovementData] = useState({
    type: 'entrada' as 'entrada' | 'saida' | 'ajuste',
    quantity: 0,
    reason: '',
    observation: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchMovements();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast.error('Erro ao carregar produtos');
    }
  };

  const fetchMovements = async () => {
    try {
      const response = await fetch('/api/stock');
      if (response.ok) {
        const data = await response.json();
        setMovements(data);
      }
    } catch (error) {
      console.error('Error fetching movements:', error);
      showToast.error('Erro ao carregar movimentações');
    }
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct._id,
          ...movementData,
        }),
      });
      
      if (response.ok) {
        showToast.success('Movimentação realizada com sucesso');
        setShowMovementDialog(false);
        resetMovementForm();
        fetchProducts();
        fetchMovements();
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Erro ao realizar movimentação');
      }
    } catch (error) {
      console.error('Error creating movement:', error);
      showToast.error('Erro ao processar movimentação');
    } finally {
      setLoading(false);
    }
  };

  const resetMovementForm = () => {
    setMovementData({
      type: 'entrada',
      quantity: 0,
      reason: '',
      observation: '',
    });
    setSelectedProduct(null);
  };

  const openMovementDialog = (product: Product) => {
    setSelectedProduct(product);
    setShowMovementDialog(true);
  };

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'entrada':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'saida':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'ajuste':
        return <Package className="h-4 w-4 text-blue-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'entrada':
        return 'text-green-600 bg-green-50';
      case 'saida':
        return 'text-red-600 bg-red-50';
      case 'ajuste':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Controle de Estoque</h1>
        <div className="flex items-center space-x-4">
          <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <History className="mr-2 h-4 w-4" />
                Histórico
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Histórico de Movimentações</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {movements.map((movement) => (
                  <div key={movement._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getMovementIcon(movement.type)}
                      <div>
                        <p className="font-medium">{movement.productName}</p>
                        <p className="text-sm text-gray-500">
                          {movement.reason} • {movement.userName}
                        </p>
                        {movement.observation && (
                          <p className="text-xs text-gray-400">{movement.observation}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getMovementColor(movement.type)}>
                        {movement.type === 'entrada' ? '+' : movement.type === 'saida' ? '-' : ''}
                        {movement.quantity}
                      </Badge>
                      <p className="text-sm text-gray-500 mt-1">
                        {movement.previousStock} → {movement.newStock}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(movement.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Alerta de Estoque Baixo
            </CardTitle>
            <CardDescription className="text-red-600">
              {lowStockProducts.length} produto(s) com estoque baixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockProducts.map((product) => (
                <div key={product._id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.code}</p>
                  </div>
                  <Badge variant="destructive">
                    {product.stock} / {product.minStock}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Produtos em Estoque</CardTitle>
          <CardDescription>
            Gerencie entradas, saídas e ajustes de estoque
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.code}</p>
                    </div>
                    <Badge variant={product.stock > product.minStock ? 'default' : 'destructive'}>
                      {product.stock}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-500 mb-4">
                    <span>Estoque mínimo: {product.minStock}</span>
                    <span className={product.stock <= product.minStock ? 'text-red-600 font-medium' : ''}>
                      {product.stock <= product.minStock ? 'Baixo' : 'Normal'}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => openMovementDialog(product)}
                      size="sm"
                      className="flex-1"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Movimentar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Movimentar Estoque - {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMovement} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Movimentação</Label>
              <Select
                value={movementData.type}
                onValueChange={(value: 'entrada' | 'saida' | 'ajuste') => 
                  setMovementData({ ...movementData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="ajuste">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min="1"
                value={movementData.quantity}
                onChange={(e) => setMovementData({ ...movementData, quantity: Number(e.target.value) })}
                required
              />
              {selectedProduct && (
                <p className="text-sm text-gray-500">
                  Estoque atual: {selectedProduct.stock}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input
                value={movementData.reason}
                onChange={(e) => setMovementData({ ...movementData, reason: e.target.value })}
                placeholder="Ex: Compra, Venda, Correção..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Observação (opcional)</Label>
              <Textarea
                value={movementData.observation}
                onChange={(e) => setMovementData({ ...movementData, observation: e.target.value })}
                placeholder="Informações adicionais..."
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Processando...' : 'Confirmar Movimentação'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowMovementDialog(false);
                  resetMovementForm();
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
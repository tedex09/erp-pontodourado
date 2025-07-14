'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { usePDVStore } from '@/store/usePDVStore';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  CreditCard,
  Package,
  Calculator,
  Check,
  X,
  Filter
} from 'lucide-react';
import { showToast } from '@/components/ui/toast';

interface Product {
  _id: string;
  name: string;
  code: string;
  category: string;
  categoryId: string;
  image?: string;
  salePrice: number;
  stock: number;
  active: boolean;
}

interface Category {
  _id: string;
  name: string;
  icon: string;
}

interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
}

interface PaymentMethod {
  type: 'dinheiro' | 'pix' | 'pixQrCode' | 'debitoCard' | 'creditoCard' | 'fiado';
  amount: number;
  fee?: number;
  chargeAmount?: number;
}

export default function PDVPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTotal,
    getFinalAmount,
  } = usePDVStore();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, selectedCategory, allProducts]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        const activeProducts = data.filter((p: Product) => p.active && p.stock > 0);
        setAllProducts(activeProducts);
        setProducts(activeProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast.error('Erro ao carregar produtos');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
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

  const filterProducts = () => {
    let filtered = [...allProducts];

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.code.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(product => {
        // Check both categoryId and category name for compatibility
        return product.categoryId === selectedCategory || 
               product.category === selectedCategory ||
               (categories.find(cat => cat._id === selectedCategory)?.name === product.category);
      });
    }

    setProducts(filtered);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleAddToCart = (product: Product) => {
    const cartItem = cart.find(item => item.id === product._id);
    const currentQuantity = cartItem ? cartItem.quantity : 0;
    
    if (currentQuantity >= product.stock) {
      showToast.error('Estoque insuficiente');
      return;
    }

    addToCart({
      id: product._id,
      name: product.name,
      price: product.salePrice,
      stock: product.stock,
    });
    
    showToast.success(`${product.name} adicionado ao carrinho`);
  };

  const handleFinalizeSale = async () => {
    if (cart.length === 0) {
      showToast.error('Carrinho vazio');
      return;
    }

    if (paymentMethods.length === 0) {
      showToast.error('Selecione uma forma de pagamento');
      return;
    }

    const totalPayments = paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);
    const finalAmount = getFinalAmount();

    if (Math.abs(totalPayments - finalAmount) > 0.01) {
      showToast.error('Valor dos pagamentos não confere com o total');
      return;
    }

    setLoading(true);

    try {
      const saleData = {
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
          discountType: item.discountType || 'fixed',
          total: (item.price * item.quantity) - (item.discount || 0),
        })),
        customerId: selectedCustomer?._id,
        customerName: selectedCustomer?.name,
        subtotal: getSubtotal(),
        total: getTotal(),
        finalAmount: getFinalAmount(),
        paymentMethods,
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });

      if (response.ok) {
        showToast.success('Venda realizada com sucesso!');
        clearCart();
        setSelectedCustomer(null);
        setPaymentMethods([]);
        setShowPaymentDialog(false);
        fetchProducts(); // Refresh products to update stock
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Erro ao finalizar venda');
      }
    } catch (error) {
      console.error('Error finalizing sale:', error);
      showToast.error('Erro ao processar venda');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Products Section */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b p-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">PDV - Ponto de Venda</h1>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Vendedor:</span>
                <Badge variant="outline">{session?.user?.name}</Badge>
              </div>
            </div>
            
            {/* Search and Filters */}
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar produtos por nome ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((product) => (
                <Card 
                  key={product._id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleAddToCart(product)}
                >
                  <CardContent className="p-4">
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-md mb-3"
                      />
                    )}
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{product.code}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(product.salePrice)}
                      </span>
                      <Badge variant={product.stock > 10 ? 'default' : 'destructive'}>
                        {product.stock}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm || selectedCategory ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-96 bg-white border-l flex flex-col">
          {/* Cart Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Carrinho</h2>
              <Badge variant="outline">{cart.length} itens</Badge>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Carrinho vazio</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(item.price)} cada
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="p-4 border-t space-y-4">
              {/* Customer Selection */}
              <div>
                <Label className="text-sm font-medium">Cliente (opcional)</Label>
                <div className="flex space-x-2 mt-1">
                  <Select
                    value={selectedCustomer?._id || ''}
                    onValueChange={(value) => {
                      const customer = customers.find(c => c._id === value);
                      setSelectedCustomer(customer || null);
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem cliente</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer._id} value={customer._id}>
                          {customer.name} - {customer.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomerDialog(true)}
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(getSubtotal())}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">{formatCurrency(getTotal())}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={() => setShowPaymentDialog(true)}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={cart.length === 0}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Finalizar Venda
                </Button>
                <Button
                  onClick={clearCart}
                  variant="outline"
                  className="w-full"
                  disabled={cart.length === 0}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpar Carrinho
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Sale Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Resumo da Venda</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(getSubtotal())}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(getTotal())}</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <h3 className="font-semibold mb-3">Formas de Pagamento</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPaymentMethods([{
                      type: 'dinheiro',
                      amount: getTotal(),
                    }]);
                  }}
                  className="h-16 flex flex-col"
                >
                  <span className="text-2xl mb-1">💵</span>
                  <span className="text-sm">Dinheiro</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setPaymentMethods([{
                      type: 'pix',
                      amount: getTotal(),
                    }]);
                  }}
                  className="h-16 flex flex-col"
                >
                  <span className="text-2xl mb-1">📱</span>
                  <span className="text-sm">PIX</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setPaymentMethods([{
                      type: 'debitoCard',
                      amount: getTotal(),
                    }]);
                  }}
                  className="h-16 flex flex-col"
                >
                  <span className="text-2xl mb-1">💳</span>
                  <span className="text-sm">Débito</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setPaymentMethods([{
                      type: 'creditoCard',
                      amount: getTotal(),
                    }]);
                  }}
                  className="h-16 flex flex-col"
                >
                  <span className="text-2xl mb-1">💳</span>
                  <span className="text-sm">Crédito</span>
                </Button>
              </div>
            </div>

            {/* Selected Payment Methods */}
            {paymentMethods.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Pagamentos Selecionados:</h4>
                <div className="space-y-2">
                  {paymentMethods.map((pm, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="capitalize">{pm.type}</span>
                      <span className="font-medium">{formatCurrency(pm.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={handleFinalizeSale}
                disabled={loading || paymentMethods.length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Confirmar Venda
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentDialog(false);
                  setPaymentMethods([]);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Para cadastrar um novo cliente, acesse o menu "Clientes" no sistema.
            </p>
            <Button
              onClick={() => setShowCustomerDialog(false)}
              className="w-full"
            >
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { usePDVStore } from '@/store/usePDVStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  User, 
  CreditCard, 
  UserPlus,
  Percent,
  DollarSign,
  Calculator,
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

interface PaymentSettings {
  methods: {
    dinheiro: { enabled: boolean };
    pix: { enabled: boolean; fee: number; feeType: 'percentage' | 'fixed' };
    pixQrCode: { enabled: boolean; fee: number; feeType: 'percentage' | 'fixed' };
    debitoCard: { enabled: boolean; fee: number; feeType: 'percentage' | 'fixed' };
    creditoCard: { enabled: boolean; fee: number; feeType: 'percentage' | 'fixed' };
    fiado: { enabled: boolean };
  };
  feeResponsibility: 'customer' | 'store';
}

export default function PDVPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showAdditionDialog, setShowAdditionDialog] = useState(false);
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState<string | null>(null);
  
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    preference: 'todos' as 'masculino' | 'feminino' | 'infantil' | 'todos',
  });

  const [paymentForm, setPaymentForm] = useState({
    type: 'dinheiro' as 'dinheiro' | 'pix' | 'pixQrCode' | 'debitoCard' | 'creditoCard' | 'fiado',
    amount: 0,
  });

  const [discountForm, setDiscountForm] = useState({
    amount: 0,
    type: 'fixed' as 'percentage' | 'fixed',
  });

  const [additionForm, setAdditionForm] = useState({
    amount: 0,
    type: 'fixed' as 'percentage' | 'fixed',
  });

  const {
    cart,
    customer,
    discount,
    discountType,
    addition,
    additionType,
    paymentMethods,
    selectedCategory,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemDiscount,
    clearCart,
    setCustomer,
    setDiscount,
    setAddition,
    setPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setSelectedCategory,
    getSubtotal,
    getDiscountAmount,
    getAdditionAmount,
    getTotal,
    getTotalFees,
    getFinalAmount,
  } = usePDVStore();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCustomers();
    fetchPaymentSettings();
  }, []);

  useEffect(() => {
    searchProducts();
  }, [searchTerm, selectedCategory]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
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

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch('/api/payment-settings');
      if (response.ok) {
        const data = await response.json();
        setPaymentSettings(data);
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const searchProducts = async () => {
    try {
      let url = '/api/products';
      const params = new URLSearchParams();
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm);
      }
      
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      showToast.error('Erro ao buscar produtos');
    }
  };

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      showToast.error('Produto sem estoque');
      return;
    }
    
    addToCart({
      id: product._id,
      name: product.name,
      price: product.salePrice,
      quantity: 1,
      stock: product.stock,
      image: product.image,
    });
    
    showToast.success('Produto adicionado ao carrinho');
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      showToast.error('Nome e telefone são obrigatórios');
      return;
    }

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      });

      if (response.ok) {
        const customer = await response.json();
        setCustomer({
          id: customer._id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
        });
        setCustomers([...customers, customer]);
        setShowCustomerDialog(false);
        setNewCustomer({ name: '', phone: '', email: '', preference: 'todos' });
        showToast.success('Cliente criado e selecionado');
      } else {
        showToast.error('Erro ao criar cliente');
      }
    } catch (error) {
      showToast.error('Erro ao criar cliente');
    }
  };

  const calculatePaymentFee = (method: string, amount: number) => {
    if (!paymentSettings) return { fee: 0, chargeAmount: amount };

    const methodConfig = paymentSettings.methods[method as keyof typeof paymentSettings.methods];
    if (!methodConfig || !('fee' in methodConfig)) return { fee: 0, chargeAmount: amount };

    let fee = 0;
    if (methodConfig.feeType === 'percentage') {
      fee = (amount * methodConfig.fee) / 100;
    } else {
      fee = methodConfig.fee;
    }

    const chargeAmount = paymentSettings.feeResponsibility === 'customer' ? amount + fee : amount;
    
    return { fee, chargeAmount };
  };

  const handleAddPayment = () => {
    if (paymentForm.amount <= 0) {
      showToast.error('Valor deve ser maior que zero');
      return;
    }

    const remainingAmount = getTotal() - paymentMethods.reduce((sum, p) => sum + p.amount, 0);
    if (paymentForm.amount > remainingAmount) {
      showToast.error('Valor excede o restante a pagar');
      return;
    }

    const { fee, chargeAmount } = calculatePaymentFee(paymentForm.type, paymentForm.amount);

    addPaymentMethod({
      type: paymentForm.type,
      amount: paymentForm.amount,
      fee: paymentSettings?.feeResponsibility === 'customer' ? fee : 0,
      chargeAmount,
    });

    setPaymentForm({ type: 'dinheiro', amount: 0 });
    setShowPaymentDialog(false);
  };

  const handleApplyDiscount = () => {
    if (selectedItemForDiscount) {
      updateItemDiscount(selectedItemForDiscount, discountForm.amount, discountForm.type);
      setSelectedItemForDiscount(null);
    } else {
      setDiscount(discountForm.amount, discountForm.type);
    }
    setDiscountForm({ amount: 0, type: 'fixed' });
    setShowDiscountDialog(false);
  };

  const handleApplyAddition = () => {
    setAddition(additionForm.amount, additionForm.type);
    setAdditionForm({ amount: 0, type: 'fixed' });
    setShowAdditionDialog(false);
  };

  const completeSale = async () => {
    if (cart.length === 0) {
      showToast.error('Carrinho vazio');
      return;
    }

    const totalPayments = paymentMethods.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(totalPayments - getTotal()) > 0.01) {
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
          discount: item.discount,
          discountType: item.discountType,
          total: (item.price * item.quantity) - (item.discountType === 'percentage' 
            ? (item.price * item.quantity * item.discount) / 100 
            : item.discount),
        })),
        customerId: customer?.id,
        customerName: customer?.name,
        subtotal: getSubtotal(),
        discount: getDiscountAmount(),
        addition: getAdditionAmount(),
        total: getTotal(),
        paymentMethods: paymentMethods,
        fees: getTotalFees(),
        finalAmount: getFinalAmount(),
      };
      
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });
      
      if (response.ok) {
        showToast.success('Venda realizada com sucesso!');
        clearCart();
        fetchProducts();
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Erro ao realizar venda');
      }
    } catch (error) {
      showToast.error('Erro ao processar venda');
    } finally {
      setLoading(false);
    }
  };

  const getEnabledPaymentMethods = () => {
    if (!paymentSettings) return [];
    
    return Object.entries(paymentSettings.methods)
      .filter(([_, config]) => config.enabled)
      .filter(([method]) => method !== 'fiado' || customer) // Fiado só se tiver cliente
      .map(([method, config]) => ({
        value: method,
        label: getPaymentMethodLabel(method),
        config,
      }));
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      dinheiro: 'Dinheiro',
      pix: 'PIX',
      pixQrCode: 'PIX QR Code',
      debitoCard: 'Cartão de Débito',
      creditoCard: 'Cartão de Crédito',
      fiado: 'Fiado',
    };
    return labels[method] || method;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">PDV - Ponto de Venda</h1>
        <div className="flex items-center space-x-2">
          <ShoppingCart className="h-5 w-5 text-gray-500" />
          <Badge variant="secondary">{cart.length} itens</Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
              <CardDescription>
                Busque e adicione produtos ao carrinho
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Buscar por nome ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={searchProducts} variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCategory && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCategory('')}
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto mt-4">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleAddToCart(product)}
                  >
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-24 object-cover rounded-md mb-3"
                      />
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 text-sm">{product.name}</h3>
                      <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                        {product.stock}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {product.code} • {product.category}
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(product.salePrice)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Cart Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Carrinho</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Carrinho vazio
                </p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(item.price)} cada
                          </p>
                          {item.discount > 0 && (
                            <p className="text-xs text-green-600">
                              Desconto: {item.discountType === 'percentage' ? `${item.discount}%` : formatCurrency(item.discount)}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedItemForDiscount(item.id);
                              setDiscountForm({ amount: item.discount, type: item.discountType });
                              setShowDiscountDialog(true);
                            }}
                          >
                            <Percent className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="font-medium">
                          {formatCurrency((item.price * item.quantity) - (item.discountType === 'percentage' 
                            ? (item.price * item.quantity * item.discount) / 100 
                            : item.discount))}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(getSubtotal())}</span>
                    </div>
                    
                    {discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Desconto:</span>
                        <span>-{formatCurrency(getDiscountAmount())}</span>
                      </div>
                    )}
                    
                    {addition > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span>Acréscimo:</span>
                        <span>+{formatCurrency(getAdditionAmount())}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(getTotal())}</span>
                    </div>
                    
                    {getTotalFees() > 0 && (
                      <div className="flex justify-between text-orange-600">
                        <span>Taxas:</span>
                        <span>+{formatCurrency(getTotalFees())}</span>
                      </div>
                    )}
                    
                    {getFinalAmount() !== getTotal() && (
                      <div className="flex justify-between text-lg font-bold text-purple-600">
                        <span>Total Final:</span>
                        <span>{formatCurrency(getFinalAmount())}</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    {/* Customer Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Cliente</Label>
                      <div className="flex space-x-2">
                        <Select
                          value={customer?.id || ''}
                          onValueChange={(value) => {
                            const selectedCustomer = customers.find(c => c._id === value);
                            setCustomer(selectedCustomer ? {
                              id: selectedCustomer._id,
                              name: selectedCustomer.name,
                              phone: selectedCustomer.phone,
                              email: selectedCustomer.email,
                            } : null);
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecionar cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Sem cliente</SelectItem>
                            {customers.map((c) => (
                              <SelectItem key={c._id} value={c._id}>
                                {c.name} - {c.phone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Novo Cliente</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Nome *</Label>
                                <Input
                                  value={newCustomer.name}
                                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Telefone *</Label>
                                <Input
                                  value={newCustomer.phone}
                                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>E-mail</Label>
                                <Input
                                  type="email"
                                  value={newCustomer.email}
                                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Preferência</Label>
                                <Select
                                  value={newCustomer.preference}
                                  onValueChange={(value: any) => setNewCustomer({ ...newCustomer, preference: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
                                    <SelectItem value="masculino">Masculino</SelectItem>
                                    <SelectItem value="feminino">Feminino</SelectItem>
                                    <SelectItem value="infantil">Infantil</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex space-x-2">
                                <Button onClick={handleCreateCustomer} className="flex-1">
                                  Criar Cliente
                                </Button>
                                <Button variant="outline" onClick={() => setShowCustomerDialog(false)}>
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {/* Discount and Addition */}
                    <div className="flex space-x-2">
                      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1">
                            <Percent className="mr-2 h-4 w-4" />
                            Desconto
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {selectedItemForDiscount ? 'Desconto no Item' : 'Desconto Total'}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Tipo de Desconto</Label>
                              <Select
                                value={discountForm.type}
                                onValueChange={(value: 'percentage' | 'fixed') => 
                                  setDiscountForm({ ...discountForm, type: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                                  <SelectItem value="percentage">Percentual (%)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Valor</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={discountForm.amount}
                                onChange={(e) => setDiscountForm({ ...discountForm, amount: Number(e.target.value) })}
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button onClick={handleApplyDiscount} className="flex-1">
                                Aplicar
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setShowDiscountDialog(false);
                                  setSelectedItemForDiscount(null);
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showAdditionDialog} onOpenChange={setShowAdditionDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1">
                            <Plus className="mr-2 h-4 w-4" />
                            Acréscimo
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Acréscimo Total</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Tipo de Acréscimo</Label>
                              <Select
                                value={additionForm.type}
                                onValueChange={(value: 'percentage' | 'fixed') => 
                                  setAdditionForm({ ...additionForm, type: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                                  <SelectItem value="percentage">Percentual (%)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Valor</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={additionForm.amount}
                                onChange={(e) => setAdditionForm({ ...additionForm, amount: Number(e.target.value) })}
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button onClick={handleApplyAddition} className="flex-1">
                                Aplicar
                              </Button>
                              <Button variant="outline" onClick={() => setShowAdditionDialog(false)}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Pagamentos</Label>
                      
                      {paymentMethods.map((payment, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="text-sm font-medium">
                              {getPaymentMethodLabel(payment.type)}
                            </span>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(payment.amount)}
                              {payment.fee && payment.fee > 0 && (
                                <span className="text-orange-600">
                                  {' '}(Taxa: {formatCurrency(payment.fee)})
                                </span>
                              )}
                              {payment.chargeAmount && payment.chargeAmount !== payment.amount && (
                                <span className="text-purple-600">
                                  {' '}→ Cobrar: {formatCurrency(payment.chargeAmount)}
                                </span>
                              )}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removePaymentMethod(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}

                      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Pagamento
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adicionar Forma de Pagamento</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Método de Pagamento</Label>
                              <Select
                                value={paymentForm.type}
                                onValueChange={(value: any) => setPaymentForm({ ...paymentForm, type: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {getEnabledPaymentMethods().map((method) => (
                                    <SelectItem key={method.value} value={method.value}>
                                      {method.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Valor</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                              />
                              <p className="text-xs text-gray-500">
                                Restante: {formatCurrency(getTotal() - paymentMethods.reduce((sum, p) => sum + p.amount, 0))}
                              </p>
                            </div>
                            
                            {paymentForm.amount > 0 && paymentSettings && (
                              <div className="p-3 bg-blue-50 rounded-lg">
                                {(() => {
                                  const { fee, chargeAmount } = calculatePaymentFee(paymentForm.type, paymentForm.amount);
                                  if (fee > 0 && paymentSettings.feeResponsibility === 'customer') {
                                    return (
                                      <div className="text-sm">
                                        <p className="font-medium text-blue-900">Cobrança com Taxa:</p>
                                        <p className="text-blue-700">
                                          Cobrar <strong>{formatCurrency(chargeAmount)}</strong> para receber <strong>{formatCurrency(paymentForm.amount)}</strong>
                                        </p>
                                        <p className="text-xs text-blue-600">
                                          Taxa: {formatCurrency(fee)}
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            )}
                            
                            <div className="flex space-x-2">
                              <Button onClick={handleAddPayment} className="flex-1">
                                Adicionar
                              </Button>
                              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <Button
                      onClick={completeSale}
                      disabled={loading || cart.length === 0 || paymentMethods.reduce((sum, p) => sum + p.amount, 0) !== getTotal()}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {loading ? 'Processando...' : 'Finalizar Venda'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
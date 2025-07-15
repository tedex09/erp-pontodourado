'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePDVStore } from '@/store/usePDVStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  User, 
  CreditCard, 
  UserPlus,
  Percent,
  Package,
  ArrowLeft
} from 'lucide-react';
import { showToast } from '@/components/ui/toast';
import { debounce } from 'lodash';
import { filterByTextIgnoreAccents } from '@/lib/utils/textUtils';
import { useRouter } from 'next/navigation';
import { NumericFormat } from 'react-number-format';

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
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
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
  const [showCartSheet, setShowCartSheet] = useState(false);
  
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    preference: 'todos' as 'masculino' | 'feminino' | 'infantil' | 'todos',
  });

  const [paymentForm, setPaymentForm] = useState({
    type: 'dinheiro' as 'dinheiro' | 'pix' | 'pixQrCode' | 'debitoCard' | 'creditoCard' | 'fiado',
    amount: 0,
    receivedAmount: 0,
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
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    await Promise.all([
      fetchProducts(),
      fetchCategories(),
      fetchCustomers(),
      fetchPaymentSettings(),
    ]);
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        setAllProducts(data);
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

  // Busca com filtro melhorado (ignora acentos) - CORRIGIDO
  const debouncedSearch = useCallback(
    debounce((term: string, category: string) => {
      let filtered = allProducts;
      
      // Filtrar por categoria primeiro - CORRIGIDO para usar categoryId
      if (category && category !== 'all') {
        filtered = filtered.filter(product => {
          return  product.categoryId === category ||
                  product.category === category ||
                  (categories.find(cat => cat._id === category)?.name === product.category);
        });
      }
      
      // Depois filtrar por termo de busca (ignorando acentos)
      if (term.trim()) {
        filtered = filterByTextIgnoreAccents(filtered, term, ['name', 'code']);
      }
      
      setProducts(filtered);
    }, 300),
    [allProducts]
  );

  useEffect(() => {
    debouncedSearch(searchTerm, selectedCategory || 'all');
  }, [searchTerm, selectedCategory, debouncedSearch]);

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

  const calculateChange = () => {
    if (paymentForm.type === 'dinheiro' && paymentForm.receivedAmount > 0) {
      const total = getTotal();
      const remainingAmount = total - paymentMethods.reduce((sum, p) => sum + p.amount, 0);
      const change = paymentForm.receivedAmount - remainingAmount;
      return change > 0 ? change : 0;
    }
    return 0;
  };

  const getTotalChange = () => {
    const dinheiroPayments = paymentMethods.filter(p => p.type === 'dinheiro');
    if (dinheiroPayments.length === 0) return 0;
    
    const totalDinheiro = dinheiroPayments.reduce((sum, p) => sum + p.amount, 0);
    const total = getTotal();
    const change = totalDinheiro - total;
    return change > 0 ? change : 0;
  };

  const handleAddPayment = () => {
    if (paymentForm.amount <= 0) {
      showToast.error('Valor deve ser maior que zero');
      return;
    }

    const remainingAmount = getTotal() - paymentMethods.reduce((sum, p) => sum + p.amount, 0);
    
    if (paymentForm.amount > remainingAmount && paymentForm.type !== 'dinheiro') {
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

    setPaymentForm({ type: 'dinheiro', amount: 0, receivedAmount: 0 });
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
    const total = getTotal();
    
    if (totalPayments < total) {
      showToast.error('Valor dos pagamentos é menor que o total da venda');
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
        const totalChange = getTotalChange();
        if (totalChange > 0) {
          showToast.success(`Venda realizada! Troco: ${formatCurrency(totalChange)}`);
        } else {
          showToast.success('Venda realizada com sucesso!');
        }
        clearCart();
        fetchProducts();
        setShowCartSheet(false);
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
      .filter(([method]) => method !== 'fiado' || customer)
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const change = calculateChange();
  const totalChange = getTotalChange();

  const totalPaid = paymentMethods.reduce((sum, p) => sum + p.amount, 0);
  const total = getTotal();
  const isPaymentEnough = Number(totalPaid.toFixed(2)) >= Number(total.toFixed(2));


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">PDV</h1>
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5 text-gray-500" />
            <Badge variant="secondary">{cart.length}</Badge>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">
            PDV - Ponto de Venda
          </h1>
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5 text-gray-500" />
            <Badge variant="secondary">{cart.length} itens</Badge>
          </div>
        </div>
      </div>

      <div className="p-4 pb-32 md:pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Produtos</CardTitle>
                <CardDescription>
                  Busque e adicione produtos ao carrinho
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <Input
                      placeholder="Buscar por nome ou código"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />

                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
                
                {/* Grid de produtos - 2 colunas no mobile, mais no desktop */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto mt-4">
                  {products.map((product) => (
                    <div
                      key={product._id}
                      className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer bg-white touch-button"
                      onClick={() => handleAddToCart(product)}
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-16 object-cover rounded-md mb-2"
                        />
                      ) : (
                        <div className="w-full h-16 bg-gray-100 rounded-md mb-2 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-xs text-gray-900 line-clamp-2 leading-tight">
                            {product.name}
                          </h3>
                          <Badge variant={product.stock > 0 ? 'default' : 'destructive'} className="text-xs px-1 py-0">
                            {product.stock}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">{product.code}</p>
                        <p className="text-sm font-bold text-green-600">
                          {formatCurrency(product.salePrice)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {products.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum produto encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Desktop Cart Section */}
          <div className="hidden lg:block space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Carrinho</CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Carrinho vazio
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="max-h-64 overflow-y-auto space-y-3">
                      {cart.map((item) => (
                        <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
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
                                className="h-8 w-8 p-0 touch-button"
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
                                className="h-8 w-8 p-0 touch-button"
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
                                className="h-8 px-2 touch-button"
                              >
                                <Percent className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeFromCart(item.id)}
                                className="h-8 px-2 touch-button"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="font-medium text-sm">
                              {formatCurrency((item.price * item.quantity) - (item.discountType === 'percentage' 
                                ? (item.price * item.quantity * item.discount) / 100 
                                : item.discount))}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(getSubtotal())}</span>
                      </div>
                      
                      {discount > 0 && (
                        <div className="flex justify-between text-red-600 text-sm">
                          <span>Desconto:</span>
                          <span>-{formatCurrency(getDiscountAmount())}</span>
                        </div>
                      )}
                      
                      {addition > 0 && (
                        <div className="flex justify-between text-blue-600 text-sm">
                          <span>Acréscimo:</span>
                          <span>+{formatCurrency(getAdditionAmount())}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>{formatCurrency(getTotal())}</span>
                      </div>
                      
                      {getTotalFees() > 0 && (
                        <div className="flex justify-between text-orange-600 text-sm">
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

                      {totalChange > 0 && (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex justify-between items-center">
                            <span className="text-green-800 font-medium">TROCO:</span>
                            <span className="text-xl font-bold text-green-800">
                              {formatCurrency(totalChange)}
                            </span>
                          </div>
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
                            value={customer?.id || 'none'}
                            onValueChange={(value) => {
                              if (value === 'none') {
                                setCustomer(null);
                                return;
                              }
                              const selectedCustomer = customers.find(c => c._id === value);
                              setCustomer(selectedCustomer ? {
                                id: selectedCustomer._id,
                                name: selectedCustomer.name,
                                phone: selectedCustomer.phone,
                                email: selectedCustomer.email,
                              } : null);
                            }}
                          >
                            <SelectTrigger className="flex-1 h-12 md:h-10">
                              <SelectValue placeholder="Selecionar cliente" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem cliente</SelectItem>
                              {customers.map((c) => (
                                <SelectItem key={c._id} value={c._id}>
                                  {c.name} - {c.phone}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon" className="h-12 w-12 md:h-10 md:w-10 touch-button">
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
                                    className="h-12 md:h-10"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Telefone *</Label>
                                  <Input
                                    value={newCustomer.phone}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                    className="h-12 md:h-10"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>E-mail</Label>
                                  <Input
                                    type="email"
                                    value={newCustomer.email}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                    className="h-12 md:h-10"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Preferência</Label>
                                  <Select
                                    value={newCustomer.preference}
                                    onValueChange={(value: any) => setNewCustomer({ ...newCustomer, preference: value })}
                                  >
                                    <SelectTrigger className="h-12 md:h-10">
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
                                  <Button onClick={handleCreateCustomer} className="flex-1 h-12 md:h-10">
                                    Criar Cliente
                                  </Button>
                                  <Button variant="outline" onClick={() => setShowCustomerDialog(false)} className="h-12 md:h-10">
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
                            <Button variant="outline" className="flex-1 h-12 md:h-10 touch-button" size="sm">
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
                                  <SelectTrigger className="h-12 md:h-10">
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
                                  className="h-12 md:h-10"
                                />
                              </div>
                              <div className="flex space-x-2">
                                <Button onClick={handleApplyDiscount} className="flex-1 h-12 md:h-10">
                                  Aplicar
                                </Button>
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setShowDiscountDialog(false);
                                    setSelectedItemForDiscount(null);
                                  }}
                                  className="h-12 md:h-10"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={showAdditionDialog} onOpenChange={setShowAdditionDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1 h-12 md:h-10 touch-button" size="sm">
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
                                  <SelectTrigger className="h-12 md:h-10">
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
                                  className="h-12 md:h-10"
                                />
                              </div>
                              <div className="flex space-x-2">
                                <Button onClick={handleApplyAddition} className="flex-1 h-12 md:h-10">
                                  Aplicar
                                </Button>
                                <Button variant="outline" onClick={() => setShowAdditionDialog(false)} className="h-12 md:h-10">
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
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <div>
                              <span className="font-medium">
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
                              className="h-8 px-2 touch-button"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}

                        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full h-12 md:h-10 touch-button" size="sm">
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
                                  <SelectTrigger className="h-12 md:h-10">
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
                                <Label>Valor do Pagamento</Label>
                                <NumericFormat
                                  value={paymentForm.amount}
                                  onValueChange={({ floatValue }) => setPaymentForm((prev) => ({
                                    ...prev,
                                    amount: floatValue || 0,
                                    receivedAmount: floatValue || 0,
                                  }))}
                                  thousandSeparator="."
                                  decimalSeparator=","
                                  prefix="R$ "
                                  decimalScale={2}
                                  fixedDecimalScale
                                  allowNegative={false}
                                  className="h-12 md:h-10 w-full p-2 border rounded-md"
                                />
                                <p className="text-xs text-gray-500">
                                  Restante: {formatCurrency(getTotal() - paymentMethods.reduce((sum, p) => sum + p.amount, 0))}
                                </p>
                              </div>
                              
                              {paymentForm.type === 'dinheiro' && change > 0 && (
                                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                  <div className="text-center">
                                    <p className="text-sm text-green-700 font-medium">TROCO</p>
                                    <p className="text-2xl font-bold text-green-800">
                                      {formatCurrency(change)}
                                    </p>
                                  </div>
                                </div>
                              )}
                              
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
                                <Button onClick={handleAddPayment} className="flex-1 h-12 md:h-10">
                                  Adicionar
                                </Button>
                                <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="h-12 md:h-10">
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      <Button
                        onClick={completeSale}
                        disabled={loading || cart.length === 0 || !isPaymentEnough}
                        className="w-full bg-green-600 hover:bg-green-700 h-12 md:h-10 touch-button"
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

      {/* Mobile Bottom Actions */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-4 space-y-3">
        {/* Cart Button */}
        <Sheet open={showCartSheet} onOpenChange={setShowCartSheet}>
          <SheetTrigger asChild>
            <Button 
              className="w-full h-14 bg-primary hover:bg-indigo-700 text-lg font-semibold"
              disabled={cart.length === 0}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Ver Carrinho ({cart.length})
              {cart.length > 0 && (
                <span className="ml-2 text-sm">
                  • {formatCurrency(getTotal())}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Carrinho de Compras</SheetTitle>
            </SheetHeader>
            
            <div className="mt-6 space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Carrinho vazio
                </p>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
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
                              className="h-8 w-8 p-0"
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
                              className="h-8 w-8 p-0"
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
                              className="h-8 px-2"
                            >
                              <Percent className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeFromCart(item.id)}
                              className="h-8 px-2"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="font-medium text-sm">
                            {formatCurrency((item.price * item.quantity) - (item.discountType === 'percentage' 
                              ? (item.price * item.quantity * item.discount) / 100 
                              : item.discount))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(getSubtotal())}</span>
                    </div>
                    
                    {discount > 0 && (
                      <div className="flex justify-between text-red-600 text-sm">
                        <span>Desconto:</span>
                        <span>-{formatCurrency(getDiscountAmount())}</span>
                      </div>
                    )}
                    
                    {addition > 0 && (
                      <div className="flex justify-between text-blue-600 text-sm">
                        <span>Acréscimo:</span>
                        <span>+{formatCurrency(getAdditionAmount())}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(getTotal())}</span>
                    </div>
                    
                    {getTotalFees() > 0 && (
                      <div className="flex justify-between text-orange-600 text-sm">
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

                    {totalChange > 0 && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="text-green-800 font-medium">TROCO:</span>
                          <span className="text-xl font-bold text-green-800">
                            {formatCurrency(totalChange)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Actions */}
                  <div className="space-y-3">
                    {/* Customer Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Cliente</Label>
                      <div className="flex space-x-2">
                        <Select
                          value={customer?.id || 'none'}
                          onValueChange={(value) => {
                            if (value === 'none') {
                              setCustomer(null);
                              return;
                            }
                            const selectedCustomer = customers.find(c => c._id === value);
                            setCustomer(selectedCustomer ? {
                              id: selectedCustomer._id,
                              name: selectedCustomer.name,
                              phone: selectedCustomer.phone,
                              email: selectedCustomer.email,
                            } : null);
                          }}
                        >
                          <SelectTrigger className="flex-1 h-12">
                            <SelectValue placeholder="Selecionar cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem cliente</SelectItem>
                            {customers.map((c) => (
                              <SelectItem key={c._id} value={c._id}>
                                {c.name} - {c.phone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon" className="h-12 w-12">
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
                                  className="h-12"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Telefone *</Label>
                                <Input
                                  value={newCustomer.phone}
                                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                  className="h-12"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>E-mail</Label>
                                <Input
                                  type="email"
                                  value={newCustomer.email}
                                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                  className="h-12"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Preferência</Label>
                                <Select
                                  value={newCustomer.preference}
                                  onValueChange={(value: any) => setNewCustomer({ ...newCustomer, preference: value })}
                                >
                                  <SelectTrigger className="h-12">
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
                                <Button onClick={handleCreateCustomer} className="flex-1 h-12">
                                  Criar Cliente
                                </Button>
                                <Button variant="outline" onClick={() => setShowCustomerDialog(false)} className="h-12">
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="h-12">
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
                                <SelectTrigger className="h-12">
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
                                className="h-12"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button onClick={handleApplyDiscount} className="flex-1 h-12">
                                Aplicar
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setShowDiscountDialog(false);
                                  setSelectedItemForDiscount(null);
                                }}
                                className="h-12"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showAdditionDialog} onOpenChange={setShowAdditionDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="h-12">
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
                                <SelectTrigger className="h-12">
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
                                className="h-12"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button onClick={handleApplyAddition} className="flex-1 h-12">
                                Aplicar
                              </Button>
                              <Button variant="outline" onClick={() => setShowAdditionDialog(false)} className="h-12">
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
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <div>
                            <span className="font-medium">
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
                            className="h-8 px-2"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}

                      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full h-12">
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
                                <SelectTrigger className="h-12">
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
                              <Label>Valor do Pagamento</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({ ...paymentForm, receivedAmount: Number(e.target.value), amount: Number(e.target.value) })}
                                className="h-12"
                              />
                              <p className="text-xs text-gray-500">
                                Restante: {formatCurrency(getTotal() - paymentMethods.reduce((sum, p) => sum + p.amount, 0))}
                              </p>
                            </div>
                            
                            {paymentForm.type === 'dinheiro' && change > 0 && (
                              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="text-center">
                                  <p className="text-sm text-green-700 font-medium">TROCO</p>
                                  <p className="text-2xl font-bold text-green-800">
                                    {formatCurrency(change)}
                                  </p>
                                </div>
                              </div>
                            )}
                            
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
                              <Button onClick={handleAddPayment} className="flex-1 h-12">
                                Adicionar
                              </Button>
                              <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="h-12">
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <Button
                      onClick={completeSale}
                      disabled={loading || cart.length === 0 || !isPaymentEnough}
                      className="w-full bg-green-600 hover:bg-green-700 h-14 text-lg font-semibold"
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      {loading ? 'Processando...' : 'Finalizar Venda'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Quick Actions Row */}
        {cart.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-12">
                  <User className="mr-1 h-4 w-4" />
                  Cliente
                </Button>
              </DialogTrigger>
            </Dialog>
            
            <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-12">
                  <Percent className="mr-1 h-4 w-4" />
                  Desconto
                </Button>
              </DialogTrigger>
            </Dialog>
            
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-12">
                  <CreditCard className="mr-1 h-4 w-4" />
                  Pagamento
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Edit, AlertTriangle, Trash2, Package } from 'lucide-react';
import { showToast } from '@/components/ui/toast';
import { NumericFormat } from 'react-number-format';

interface Product {
  _id: string;
  name: string;
  code: string;
  category: string;
  categoryId: string;
  image?: string;
  costPrice: number;
  salePrice: number;
  suggestedPrice: number;
  margin: number;
  stock: number;
  minStock: number;
  active: boolean;
  createdAt: string;
}

interface Category {
  _id: string;
  name: string;
  icon: string;
  defaultMargin: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    categoryId: '',
    costPrice: 0,
    salePrice: 0,
    suggestedPrice: 0,
    stock: 0,
    minStock: 5,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [currentPage, searchTerm]);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      const response = await fetch(`/api/products?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || data);
        setTotalPages(data.totalPages || Math.ceil((data.length || 0) / itemsPerPage));
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

  const searchProducts = async () => {
    setCurrentPage(1);
    fetchProducts();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let imageUrl = '';
      
      // Upload image if selected
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('image', imageFile);
        
        const imageResponse = await fetch('/api/upload', {
          method: 'POST',
          body: imageFormData,
        });
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          imageUrl = imageData.url;
        }
      }
      
      const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const submitData = {
        ...formData,
        ...(imageUrl && { image: imageUrl }),
      };
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });
      
      if (response.ok) {
        showToast.success(editingProduct ? 'Produto atualizado' : 'Produto criado');
        setShowDialog(false);
        setEditingProduct(null);
        resetForm();
        fetchProducts();
      } else {
        showToast.error('Erro ao salvar produto');
      }
    } catch (error) {
      showToast.error('Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productToDelete._id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showToast.success('Produto excluído com sucesso');
        setShowDeleteDialog(false);
        setProductToDelete(null);
        fetchProducts();
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Erro ao excluir produto');
      }
    } catch (error) {
      showToast.error('Erro ao excluir produto');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      category: '',
      categoryId: '',
      costPrice: 0,
      salePrice: 0,
      suggestedPrice: 0,
      stock: 0,
      minStock: 5,
    });
    setImageFile(null);
    setImagePreview('');
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      category: product.category,
      categoryId: product.categoryId || '',
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      suggestedPrice: product.suggestedPrice,
      stock: product.stock,
      minStock: product.minStock,
    });
    setImagePreview(product.image || '');
    setShowDialog(true);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteDialog(true);
  };

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(c => c._id === categoryId);
    if (category && formData.costPrice > 0) {
      const suggestedPrice = formData.costPrice / (1 - (category.defaultMargin / 100));
      setFormData(prev => ({
        ...prev,
        categoryId,
        category: category.name,
        suggestedPrice,
        salePrice: suggestedPrice,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        categoryId,
        category: category?.name || '',
      }));
    }
  };

  const handleCostPriceChange = (costPrice: number) => {
    const category = categories.find(c => c._id === formData.categoryId);
    let suggestedPrice = 0;
    
    if (category && costPrice > 0) {
      suggestedPrice = costPrice / (1 - (category.defaultMargin / 100));
    }
    
    setFormData(prev => ({
      ...prev,
      costPrice,
      suggestedPrice,
      ...(suggestedPrice > 0 && { salePrice: suggestedPrice }),
    }));
  };

  const handleSalePriceChange = (salePrice: number) => {
    setFormData(prev => ({
      ...prev,
      salePrice,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const margin = formData.salePrice > 0 ? (1 - (formData.costPrice / formData.salePrice)) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">Imagem do Produto</Label>
                <div className="flex items-center space-x-4">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                  )}
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Deixe vazio para gerar automaticamente"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <select
                  id="category"
                  value={formData.categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.icon} {category.name} (Margem: {category.defaultMargin}%)
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Preço de Custo</Label>
                  <NumericFormat
                    id="costPrice"
                    value={formData.costPrice}
                    onValueChange={({ floatValue }) => {
                      handleCostPriceChange(floatValue || 0);
                    }}
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="R$ "
                    decimalScale={2}
                    fixedDecimalScale
                    allowNegative={false}
                    className="w-full p-2 border rounded-md"
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Preço de Venda</Label>
                  <NumericFormat
                    id="salePrice"
                    value={formData.salePrice}
                    onValueChange={({ floatValue }) => {
                      setFormData(prev => ({ ...prev, salePrice: floatValue || 0 }));
                    }}
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="R$ "
                    decimalScale={2}
                    fixedDecimalScale
                    allowNegative={false}
                    className="w-full p-2 border rounded-md"
                    onFocus={(e) => e.target.select()}
                  />

                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço Sugerido</Label>
                  <div className="p-2 bg-gray-50 rounded border">
                    R$ {formData.suggestedPrice.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Margem Atual</Label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {margin.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Estoque</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStock">Estoque Mínimo</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDialog(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
          <CardDescription>
            Gerencie seus produtos e estoque
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-6">
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
              className="flex-1"
            />
            <Button onClick={searchProducts} variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.code}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {product.stock <= product.minStock && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <Badge variant={product.stock > product.minStock ? 'default' : 'destructive'}>
                        {product.stock}
                      </Badge>
                    </div>
                  </div>
                  
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-md mb-3"
                    />
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Categoria:</span>
                      <span className="text-sm">{product.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Preço:</span>
                      <span className="text-sm font-medium">R$ {product.salePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Margem:</span>
                      <span className="text-sm">{product.margin.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleEdit(product)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(product)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Anterior
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className="w-10"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Próximo
              </Button>
            </div>
          )}

          {products.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum produto encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Tem certeza que deseja excluir o produto <strong>{productToDelete?.name}</strong>?</p>
            <p className="text-sm text-gray-500">Esta ação não pode ser desfeita.</p>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleDelete}
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                {loading ? 'Excluindo...' : 'Sim, Excluir'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setProductToDelete(null);
                }}
                className="flex-1"
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
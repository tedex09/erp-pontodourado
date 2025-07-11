'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, Tag } from 'lucide-react';
import { showToast } from '@/components/ui/toast';

interface Category {
  _id: string;
  name: string;
  icon: string;
  description?: string;
  active: boolean;
  createdAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    icon: '💎',
    description: '',
    defaultMargin: 300,
  });

  const commonIcons = ['💎', '👑', '💍', '📿', '⌚', '👂', '🔗', '💄', '👜', '🎀', '✨', '🌟'];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      showToast.error('Erro ao carregar categorias');
    }
  };

  const searchCategories = async () => {
    if (!searchTerm.trim()) {
      fetchCategories();
      return;
    }
    
    try {
      const response = await fetch(`/api/categories?search=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error searching categories:', error);
      showToast.error('Erro ao buscar categorias');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const url = editingCategory ? `/api/categories/${editingCategory._id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        showToast.success(editingCategory ? 'Categoria atualizada' : 'Categoria criada');
        setShowDialog(false);
        setEditingCategory(null);
        resetForm();
        fetchCategories();
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Erro ao salvar categoria');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      showToast.error('Erro ao salvar categoria');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${category.name}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/categories/${category._id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showToast.success('Categoria excluída');
        fetchCategories();
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Erro ao excluir categoria');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast.error('Erro ao excluir categoria');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      icon: '💎',
      description: '',
      defaultMargin: 300,
    });
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      description: category.description || '',
      defaultMargin: category.defaultMargin || 300,
    });
    setShowDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Ícone</Label>
                <div className="grid grid-cols-6 gap-2 mb-2">
                  {commonIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`p-2 text-2xl border rounded-lg hover:bg-gray-50 ${
                        formData.icon === icon ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="Ou digite um emoji personalizado"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional da categoria"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultMargin">Margem de Lucro Padrão (%)</Label>
                <Input
                  id="defaultMargin"
                  type="number"
                  min="0"
                  max="1000"
                  value={formData.defaultMargin}
                  onChange={(e) => setFormData({ ...formData, defaultMargin: Number(e.target.value) })}
                  required
                />
                <p className="text-sm text-gray-500">
                  Esta margem será usada como padrão para produtos desta categoria.
                  Exemplo: 300% significa que o preço sugerido será 4x o custo.
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDialog(false);
                    setEditingCategory(null);
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
          <CardTitle>Lista de Categorias</CardTitle>
          <CardDescription>
            Organize seus produtos por categorias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-6">
            <Input
              placeholder="Buscar categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchCategories()}
              className="flex-1"
            />
            <Button onClick={searchCategories} variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                        )}
                      </div>
                      <p className="text-sm text-indigo-600 font-medium mt-1">
                        Margem padrão: {category.defaultMargin}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-4">
                    Criado em: {formatDate(category.createdAt)}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleEdit(category)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDelete(category)}
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
          
          {categories.length === 0 && (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma categoria encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
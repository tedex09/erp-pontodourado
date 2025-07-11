'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Shield, Trash2 } from 'lucide-react';
import { showToast } from '@/components/ui/toast';

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: {
    dashboard: boolean;
    pdv: boolean;
    products: boolean;
    inventory: boolean;
    reports: boolean;
    customers: boolean;
    campaigns: boolean;
    settings: boolean;
    employees: boolean;
    categories: boolean;
  };
  active: boolean;
  createdAt: string;
}

const permissionLabels = {
  dashboard: 'Dashboard',
  pdv: 'PDV (Ponto de Venda)',
  products: 'Produtos',
  inventory: 'Controle de Estoque',
  reports: 'Relatórios',
  customers: 'Clientes',
  campaigns: 'Campanhas e Fidelização',
  settings: 'Configurações',
  employees: 'Funcionários',
  categories: 'Categorias',
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {
      dashboard: true,
      pdv: false,
      products: false,
      inventory: false,
      reports: false,
      customers: false,
      campaigns: false,
      settings: false,
      employees: false,
      categories: false,
    },
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      showToast.error('Erro ao carregar funções');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const url = editingRole ? `/api/roles/${editingRole._id}` : '/api/roles';
      const method = editingRole ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        showToast.success(editingRole ? 'Função atualizada' : 'Função criada');
        setShowDialog(false);
        setEditingRole(null);
        resetForm();
        fetchRoles();
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Erro ao salvar função');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      showToast.error('Erro ao salvar função');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (role: Role) => {
    if (!confirm(`Tem certeza que deseja excluir a função "${role.name}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/roles/${role._id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showToast.success('Função excluída');
        fetchRoles();
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Erro ao excluir função');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      showToast.error('Erro ao excluir função');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: {
        dashboard: true,
        pdv: false,
        products: false,
        inventory: false,
        reports: false,
        customers: false,
        campaigns: false,
        settings: false,
        employees: false,
        categories: false,
      },
    });
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions,
    });
    setShowDialog(true);
  };

  const updatePermission = (permission: keyof typeof formData.permissions, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value,
      },
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Funções e Permissões</h1>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              Nova Função
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? 'Editar Função' : 'Nova Função'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Função *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional da função"
                  rows={3}
                />
              </div>
              
              <div className="space-y-4">
                <Label className="text-base font-semibold">Permissões</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label className="font-medium">{label}</Label>
                      </div>
                      <Switch
                        checked={formData.permissions[key as keyof typeof formData.permissions]}
                        onCheckedChange={(checked) => updatePermission(key as keyof typeof formData.permissions, checked)}
                      />
                    </div>
                  ))}
                </div>
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
                    setEditingRole(null);
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
          <CardTitle>Lista de Funções</CardTitle>
          <CardDescription>
            Gerencie funções e suas permissões no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card key={role._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                    </div>
                  </div>
                  
                  {role.description && (
                    <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-medium text-gray-500">PERMISSÕES ATIVAS:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(role.permissions)
                        .filter(([_, value]) => value)
                        .map(([key, _]) => (
                          <span
                            key={key}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800"
                          >
                            {permissionLabels[key as keyof typeof permissionLabels]}
                          </span>
                        ))}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-4">
                    Criado em: {formatDate(role.createdAt)}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleEdit(role)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDelete(role)}
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
          
          {roles.length === 0 && (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma função encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from 'axios'; // Added axios import
import { toast } from 'react-toastify'; // Added toast import


import { PlusCircle, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const TeamManagement = () => {
  const { user, API_BASE, csrfToken } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '',
    position: '',
    permissions: [],
    password: '',
    email: ''
  });
  
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [tempPermissions, setTempPermissions] = useState([]);

  useEffect(() => {
    loadEmployees();
    loadAvailablePermissions();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/teams`, { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Новая функция для загрузки разрешений
  const loadAvailablePermissions = async () => {
    try {
      const response = await axios.get('/api/permissions');
      if (response.data.success) {
        // Преобразуем для использования в Checkbox
        const permissions = response.data.permissions.map(p => ({
          value: p.id,
          label: p.label
        }));
        setAvailablePermissions(permissions);
      }
    } catch (error) {
      console.error("Ошибка загрузки разрешений:", error);
      toast.error('Не удалось загрузить список разрешений.');
    }
  };

  const handleOpenModal = (employee = null) => {
    if (employee) {
      setIsEditing(true);
      setCurrentEmployee(employee);
      setFormData({
        username: employee.username,
        position: employee.position || '',
        permissions: employee.permissions || [],
        password: '',
        email: employee.email
      });
      setTempPermissions(employee.permissions || []);
    } else {
      setIsEditing(false);
      setCurrentEmployee(null);
      setFormData({
        username: '',
        position: '',
        permissions: [],
        password: '',
        email: ''
      });
      setTempPermissions([]);
    }
    setIsModalOpen(true);
  };
  
  const handleGenerate = (type) => {
    const randomString = Math.random().toString(36).substring(2, 10);
    if (type === 'password') {
        setFormData(prev => ({ ...prev, password: randomString }));
    } else if (type === 'username') {
        setFormData(prev => ({ ...prev, username: `user_${randomString}` }));
    }
  }

  const handlePermissionsChange = (permissionId) => {
    setTempPermissions(prev => 
      prev.includes(permissionId) 
        ? prev.filter(p => p !== permissionId) 
        : [...prev, permissionId]
    );
  };

  const handleSavePermissions = () => {
    setFormData(prev => ({ ...prev, permissions: tempPermissions }));
    setIsPermissionsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing ? `${API_BASE}/api/teams/${currentEmployee._id}` : `${API_BASE}/api/teams`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        loadEmployees();
        setIsModalOpen(false);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleDelete = async (employeeId) => {
    if (window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
        try {
            await fetch(`${API_BASE}/api/teams/${employeeId}`, { method: 'DELETE', credentials: 'include', headers: { 'X-CSRF-Token': csrfToken } });
            loadEmployees();
        } catch (err) {
            setError(err.message);
        }
    }
  };

  return (
    <div className="p-6">


      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Команда</CardTitle>
          <Button onClick={() => handleOpenModal()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Добавить сотрудника
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Логин</TableHead>
                <TableHead>Должность</TableHead>
                <TableHead>Разрешения</TableHead>
                <TableHead className="text-right">Функционал</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map(employee => (
                <TableRow key={employee._id}>
                  <TableCell>{employee.username}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      {employee.permissions.length > 0 ? 'Есть права' : 'Нет прав'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(employee)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(employee._id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Редактировать сотрудника' : 'Добавить сотрудника'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Логин</Label>
                <div className="flex gap-2">
                  <Input id="username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required />
                  <Button type="button" variant="outline" onClick={() => handleGenerate('username')}>Сгенерировать</Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required disabled={isEditing} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="position">Должность</Label>
                <Input id="position" value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} />
              </div>
               <div className="grid gap-2">
                <Label>Разрешения</Label>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground flex-grow">
                        Выбрано: {formData.permissions.length}
                    </p>
                    <Button type="button" variant="outline" onClick={() => {
                        setTempPermissions(formData.permissions);
                        setIsPermissionsModalOpen(true);
                    }}>
                        Изменить
                    </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">{isEditing ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль'}</Label>
                 <div className="flex gap-2">
                    <Input id="password" type="text" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required={!isEditing} />
                    <Button type="button" variant="outline" onClick={() => handleGenerate('password')}>Сгенерировать</Button>
                 </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Сохранить</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPermissionsModalOpen} onOpenChange={setIsPermissionsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Выбор разрешений</DialogTitle>
            <DialogDescription>
              Выберите вкладки, к которым у сотрудника будет доступ.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-72 w-full rounded-md border p-4">
            <div className="space-y-2">
              {availablePermissions.map((item) => (
                <div key={item.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`perm-${item.value}`}
                    checked={tempPermissions.includes(item.value)}
                    onCheckedChange={() => handlePermissionsChange(item.value)}
                  />
                  <label
                    htmlFor={`perm-${item.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={handleSavePermissions}>Готово</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
};

export default TeamManagement;

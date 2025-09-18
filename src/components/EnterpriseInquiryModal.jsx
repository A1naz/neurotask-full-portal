import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext'; // Импортируем useAuth
import NotificationPopup from './NotificationPopup'; // Импортируем NotificationPopup

const EnterpriseInquiryModal = ({ isOpen, onClose }) => {
  const { API_BASE, csrfToken } = useAuth(); // Получаем API_BASE и csrfToken
  const [notification, setNotification] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    country: '',
    company: '',
    position: '',
    email: '',
    primaryFunction: '',
    useCase: '',
    details: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/contact/enterprise-inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setNotification('Ваш запрос успешно отправлен!');
        setTimeout(() => {
          onClose();
          setNotification('');
        }, 3000);
      } else {
        const errorData = await response.json();
        setNotification(errorData.message || 'Ошибка отправки запроса.');
      }
    } catch (error) {
      setNotification('Ошибка сети. Попробуйте снова.');
    }
  };

  return (
    <>
      <NotificationPopup message={notification} onClose={() => setNotification('')} />
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Запрос о предприятии</DialogTitle>
            <p className="text-center text-sm text-gray-500">Поговорите с представителем нашей команды по продажам</p>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Имя</Label>
                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Имя" />
              </div>
              <div>
                <Label htmlFor="lastName">Фамилия</Label>
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Фамилия" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Страна</Label>
                <Input id="country" name="country" value={formData.country} onChange={handleChange} placeholder="Выберите страну" />
              </div>
              <div>
                <Label htmlFor="company">Компания</Label>
                <Input id="company" name="company" value={formData.company} onChange={handleChange} placeholder="Название компании" />
              </div>
            </div>
            <div>
              <Label htmlFor="position">Какова Ваша должность?</Label>
              <Input id="position" name="position" value={formData.position} onChange={handleChange} placeholder="Ваша должность" />
            </div>
            <div>
              <Label htmlFor="email">Какой у вас рабочий адрес электронной почты?</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="XXXX@example.com" />
            </div>
            <div>
              <Label htmlFor="primaryFunction">Какие функции GlobalGPT вы в первую очередь планируете использовать?</Label>
              <Select onValueChange={(value) => handleSelectChange('primaryFunction', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите вариант" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api">API интеграция</SelectItem>
                  <SelectItem value="chat">Чат-интерфейсы</SelectItem>
                  <SelectItem value="automation">Автоматизация задач</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="useCase">Как вы планируете использовать GlobalGPT?</Label>
              <Select onValueChange={(value) => handleSelectChange('useCase', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите вариант" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Для внутренних команд</SelectItem>
                  <SelectItem value="customer">Для взаимодействия с клиентами</SelectItem>
                  <SelectItem value="product">Для встраивания в продукт</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="details">Необязательно: расскажите нам подробнее о вашем варианте использования.</Label>
              <Textarea id="details" name="details" value={formData.details} onChange={handleChange} placeholder="Расскажите нам, как вы планируете использовать GlobalGPT" />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800">Представлять на рассмотрение</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnterpriseInquiryModal;

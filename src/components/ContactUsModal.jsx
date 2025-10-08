import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ContactUsModal = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { user, API_BASE, csrfToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Пожалуйста, введите сообщение.');
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`${API_BASE}/api/contact-us`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ message }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Не удалось отправить сообщение.');
      }

      setSuccess(true);
      setMessage('');
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Нужна помощь? Мы здесь, чтобы помочь.</h2>
          <p className="text-gray-600 mb-6">
            Оставьте нам сообщение или отправьте письмо на{' '}
            <a href="support@neurotask.ru" className="text-purple-600 underline">
            support@neurotask.ru
            </a>{' '}
            — наша команда вскоре ответит.
          </p>
        </div>

        {success ? (
          <div className="text-center p-8">
            <h3 className="text-xl font-semibold text-green-600">Спасибо!</h3>
            <p className="text-gray-700">Ваше сообщение было успешно отправлено.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Textarea
              placeholder="Есть вопрос, обнаружили проблему, или хотите поделиться идеей? Мы рады помочь."
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mb-4"
              disabled={isSending}
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSending}>
              {isSending ? 'Отправка...' : 'Отправить'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ContactUsModal;

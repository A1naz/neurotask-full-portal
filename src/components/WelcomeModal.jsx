import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const WelcomeModal = ({ isOpen, onClose }) => {
  const handleDoNotShowAgain = () => {
    localStorage.setItem('welcomeModalShown', 'true');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Добро пожаловать на NeurоTask!👋</DialogTitle>
        </DialogHeader>
        <div className="py-4 px-6 space-y-4">
          <p>Мы находимся на стадии запуска, предоставляем каждого пользователю 50 бесплатных токенов каждый день.</p>
          <p>Все что вам необходимо для работы, направляйте в поддержку (справа внизу).</p>
          <p>Каждое ваше обращение важно для нас!</p>
          <p>Давайте вместе создадим лучшую платформу на рынке, которая будет закрывать все наши задачи в одном месте с помощью Нейросетей.</p>
          <p className="font-semibold">Ознакомьтесь с “Обзором кабинета” за 120 секунд, ниже 👇</p>
        </div>
        <div className="px-6">
          <video className="w-full rounded-lg" controls>
            <source src="/videos/introduction.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <DialogFooter>
          <Button onClick={handleDoNotShowAgain} variant="outline">
            Больше не показывать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;

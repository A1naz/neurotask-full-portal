import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { X, Copy } from 'lucide-react';

const ReferralModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [copied, setCopied] = useState(false);

    // Get base URL from env variable, with a fallback
    const baseURL = import.meta.env.VITE_APP_BASE_URL || 'https://neurotask.ru';
    const referralLink = user ? `${baseURL}/?ref=${user._id}` : '';

    const handleCopy = () => {
        if (referralLink) {
            navigator.clipboard.writeText(referralLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative text-center">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4"
                    onClick={onClose}
                >
                    <X className="h-5 w-5" />
                </Button>

                <h2 className="text-2xl font-bold mb-4">Поделитесь Neurotask — заработайте бесплатные кредиты!</h2>
                <p className="text-gray-600 mb-6">
                    Пригласите друзей присоединиться к Neurotask — за каждые 10 новых зарегистрированных пользователей вы получите 1000 бесплатных кредитов. Вы можете получать вознаграждения за 10 приглашений в день.
                </p>

                <div className="relative mb-2">
                    <Input
                        type="text"
                        readOnly
                        value={referralLink}
                        className="pr-12 text-gray-700"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8"
                        onClick={handleCopy}
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
                <p className="text-sm text-gray-500 mb-6">{copied ? "Ссылка скопирована!" : "Ваша пригласительная ссылка готова!"}</p>

                <Button onClick={onClose} className="w-full bg-black text-white hover:bg-gray-800 rounded-full py-3">
                    Хорошо
                </Button>
            </div>
        </div>
    );
};

export default ReferralModal;

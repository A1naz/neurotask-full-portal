import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { History, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ChatHistoryMenu = ({ onShowHistory }) => {
    const { user, csrfToken, API_BASE, selectChat, currentChatId, isSidebarCollapsed } = useAuth();
    const [recentHistory, setRecentHistory] = useState([]);
    const [isExpanded, setIsExpanded] = useState(true);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const loadRecentHistory = useCallback(async () => {
        if (!user || !csrfToken || loading) return;
        setLoading(true);
        try {
            // Загружаем только последние 5 чатов
            const response = await fetch(`${API_BASE}/api/multi-chat/all-chat-histories?page=1&limit=5`, {
                credentials: 'include',
                headers: { 'X-CSRF-Token': csrfToken, 'x-user-id': user._id },
            });
            if (response.ok) {
                const data = await response.json();
                setRecentHistory(data.chatHistories || []);
            }
        } catch (error) {
            console.error('Ошибка загрузки недавней истории чатов:', error);
        } finally {
            setLoading(false);
        }
    }, [user, csrfToken, API_BASE, loading]);

    useEffect(() => {
        loadRecentHistory();
    }, [user]);

    const handleChatClick = (chatId) => {
        selectChat(chatId);
        navigate('/assistant/multi-chat');
    };

    if (recentHistory.length === 0 && !loading) {
        return null;
    }

    return (
        <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-1 mb-2">
                <Button
                    variant="ghost"
                    className={cn("flex-1 justify-start", isSidebarCollapsed && "px-2")}
                    onClick={() => !isSidebarCollapsed && setIsExpanded(!isExpanded)}
                >
                    <History className={cn("h-5 w-5", isSidebarCollapsed ? "mx-auto" : "mr-3")} />
                    {!isSidebarCollapsed && "История"}
                </Button>
                {!isSidebarCollapsed && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsExpanded(!isExpanded)}>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                )}
            </div>

            {isExpanded && !isSidebarCollapsed && (
                <div className="space-y-1 mb-2">
                    {recentHistory.map(chat => (
                        <Button
                            key={chat.chatId}
                            variant={currentChatId === chat.chatId ? "secondary" : "ghost"}
                            className="w-full justify-start text-sm"
                            onClick={() => handleChatClick(chat.chatId)}
                        >
                            <span className="truncate">{chat.chatTitle || `Чат ${chat.chatId.substring(0, 8)}`}</span>
                        </Button>
                    ))}
                     <Button variant="link" className="w-full mt-2 text-sm" onClick={onShowHistory}>
                        Показать всё
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ChatHistoryMenu;

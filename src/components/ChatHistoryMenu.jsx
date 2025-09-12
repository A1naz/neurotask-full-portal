import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { History, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ChatHistoryMenu = () => {
    const { user, csrfToken, API_BASE, selectChat, currentChatId, isSidebarCollapsed } = useAuth();
    const [history, setHistory] = useState([]);
    const [isExpanded, setIsExpanded] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const observer = useRef();
    const navigate = useNavigate();

    const loadUserChatHistories = useCallback(async (currentPage) => {
        if (!user || !csrfToken || loading) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/multi-chat/all-chat-histories?page=${currentPage}&limit=30`, {
                credentials: 'include',
                headers: {
                    'X-CSRF-Token': csrfToken,
                    'x-user-id': user._id,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setHistory(prev => [...prev, ...(data.chatHistories || [])]);
                setHasMore(data.hasMore);
            }
        } catch (error) {
            console.error('Ошибка загрузки истории чатов:', error);
        } finally {
            setLoading(false);
        }
    }, [user, csrfToken, API_BASE, loading]);

    useEffect(() => {
        setHistory([]);
        setPage(1);
        setHasMore(true);
    }, [user]);

    useEffect(() => {
        if (hasMore) {
            loadUserChatHistories(page);
        }
    }, [page, user, hasMore, loadUserChatHistories]);

    const lastChatElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    const handleChatClick = (chatId) => {
        selectChat(chatId);
        navigate('/assistant/multi-chat');
    };
    
    const groupedByMonth = history.reduce((acc, chat) => {
        const date = new Date(chat.lastActivity);
        if (isNaN(date.getTime())) {
            return acc;
        }
        const month = date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
        if (!acc[month]) {
            acc[month] = [];
        }
        acc[month].push(chat);
        return acc;
    }, {});


    if (history.length === 0 && !loading) {
        return null;
    }

    return (
        <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-1 mb-2">
                <Button
                    variant="ghost"
                    className={cn(
                        "flex-1 justify-start",
                        isSidebarCollapsed && "px-2"
                    )}
                >
                    <History className={cn("h-5 w-5", isSidebarCollapsed ? "mx-auto" : "mr-3")} />
                    {!isSidebarCollapsed && "История"}
                </Button>
                {!isSidebarCollapsed && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                )}
            </div>

            {isExpanded && !isSidebarCollapsed && (
                <div className="ml-4 space-y-1 mb-2">
                    {Object.entries(groupedByMonth).map(([month, chats]) => (
                        <div key={month}>
                            <h3 className="px-4 text-sm text-gray-500 my-2">{month.charAt(0).toUpperCase() + month.slice(1)}</h3>
                            {chats.map((chat, index) => (
                                <Button
                                    key={chat.chatId}
                                    ref={chats.length === index + 1 ? lastChatElementRef : null}
                                    variant={currentChatId === chat.chatId ? "secondary" : "ghost"}
                                    className="w-full justify-start text-sm"
                                    onClick={() => handleChatClick(chat.chatId)}
                                >
                                    <span className="truncate">{chat.chatTitle || `Чат ${chat.chatId.substring(0, 8)}`}</span>
                                </Button>
                            ))}
                        </div>
                    ))}
                    {loading && <p className="text-center text-sm text-gray-500">Загрузка...</p>}
                </div>
            )}
        </div>
    );
};

export default ChatHistoryMenu;

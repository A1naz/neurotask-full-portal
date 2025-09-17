import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { X, Search, Edit, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const ChatHistoryModal = ({ isOpen, onClose }) => {
    const { user, csrfToken, API_BASE, selectChat, currentChatId, loadUserChatHistories: authLoadHistories } = useAuth();
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const observer = useRef();
    const navigate = useNavigate();

    const loadChatHistories = useCallback(async (currentPage, search, append = false) => {
        if (!user || !csrfToken || loading) return;
        setLoading(true);
        try {
            const url = `${API_BASE}/api/multi-chat/all-chat-histories?page=${currentPage}&limit=30&search=${encodeURIComponent(search)}`;
            const response = await fetch(url, {
                credentials: 'include',
                headers: { 'X-CSRF-Token': csrfToken },
            });
            if (response.ok) {
                const data = await response.json();
                setHistory(prev => append ? [...prev, ...(data.chatHistories || [])] : (data.chatHistories || []));
                setHasMore(data.hasMore);
            }
        } catch (error) {
            console.error('Ошибка загрузки истории чатов:', error);
        } finally {
            setLoading(false);
        }
    }, [user, csrfToken, API_BASE, loading]);

    useEffect(() => {
        if (isOpen) {
            setPage(1);
            loadChatHistories(1, searchTerm, false);
        }
    }, [isOpen, searchTerm]);
    
    useEffect(() => {
        if (isOpen && page > 1) {
            loadChatHistories(page, searchTerm, true);
        }
    }, [page]);


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
        onClose();
    };

    const handleCreateNewChat = () => {
        selectChat(null);
        navigate('/assistant/multi-chat');
        onClose();
    };
    
    const handleDeleteChat = async (chatId) => {
        if (!confirm('Вы уверены, что хотите удалить этот чат?')) return;
        try {
            await fetch(`${API_BASE}/api/multi-chat/${chatId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'X-CSRF-Token': csrfToken },
            });
            setHistory(prev => prev.filter(c => c.chatId !== chatId));
            authLoadHistories(); // Обновляем историю в AuthContext
        } catch (error) {
            console.error('Ошибка удаления чата:', error);
        }
    };

    const handleRenameChat = async (chatId, currentTitle) => {
        const newTitle = prompt('Введите новое название чата:', currentTitle);
        if (newTitle && newTitle.trim() !== '') {
            try {
                await fetch(`${API_BASE}/api/multi-chat/${chatId}/rename`, {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
                    body: JSON.stringify({ title: newTitle.trim() }),
                });
                setHistory(prev => prev.map(c => c.chatId === chatId ? { ...c, chatTitle: newTitle.trim() } : c));
                authLoadHistories(); // Обновляем историю в AuthContext
            } catch (error) {
                console.error('Ошибка переименования чата:', error);
            }
        }
    };

    const groupedByYear = history.reduce((acc, chat) => {
        const date = new Date(chat.lastActivity);
        if (isNaN(date.getTime())) return acc;
        const year = date.getFullYear().toString();
        if (!acc[year]) acc[year] = [];
        acc[year].push(chat);
        return acc;
    }, {});

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg h-[80vh] flex flex-col relative">
                <Button variant="ghost" className="absolute top-2 right-2 h-8 w-8 p-0 z-10" onClick={onClose}>
                    <X className="h-5 w-5" />
                </Button>

                <div className="p-4 border-b pr-12">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input 
                            placeholder="Поиск..." 
                            className="pl-10" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">Действия</h3>
                    <Button variant="ghost" className="w-full justify-start" onClick={handleCreateNewChat}>
                        <Edit className="h-4 w-4 mr-2" />
                        Создать новый чат
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    {Object.entries(groupedByYear).map(([year, chats]) => (
                        <div key={year}>
                            <h3 className="text-sm font-semibold text-gray-500 my-3">{year === new Date().getFullYear().toString() ? "В этом году" : year}</h3>
                            {chats.map((chat, index) => {
                                const isLastElement = chats.length === index + 1;
                                const date = new Date(chat.lastActivity);
                                const formattedDate = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '');

                                return (
                                <div 
                                    key={chat.chatId} 
                                    ref={isLastElement ? lastChatElementRef : null}
                                    className="flex items-center justify-between p-3 rounded-lg group hover:bg-gray-100"
                                >
                                    <div 
                                        className="flex-1 truncate pr-4 cursor-pointer"
                                        onClick={() => handleChatClick(chat.chatId)}
                                    >
                                        <span className={cn(currentChatId === chat.chatId && "font-semibold")}>
                                            {chat.chatTitle || `Чат ${chat.chatId.substring(0, 8)}`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {currentChatId === chat.chatId && (
                                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Текущий</span>
                                      )}
                                      <span className="text-xs text-gray-500">{formattedDate}</span>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleRenameChat(chat.chatId, chat.chatTitle)}>
                                                <Edit2 className="h-4 w-4 mr-2" />
                                                Переименовать
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeleteChat(chat.chatId)} className="text-red-500">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Удалить
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                </div>
                            )})}
                        </div>
                    ))}
                    {loading && <p className="text-center text-sm text-gray-500 py-4">Загрузка...</p>}
                </div>
            </div>
        </div>
    );
};

export default ChatHistoryModal;

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { History, ChevronDown, ChevronRight, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from "sonner";

const ChatHistoryMenu = ({ onShowHistory }) => {
    const { user, csrfToken, API_BASE, selectChat, currentChatId, isSidebarCollapsed } = useAuth();
    const [recentHistory, setRecentHistory] = useState([]);
    const [isExpanded, setIsExpanded] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editingChat, setEditingChat] = useState(null);
    const [newChatTitle, setNewChatTitle] = useState("");
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

    const handleDeleteChat = async (chatId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот чат?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/multi-chat/${chatId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'X-CSRF-Token': csrfToken,
                    'x-user-id': user._id
                },
            });

            const data = await response.json();

            if (data.success) {
                setRecentHistory(prev => prev.filter(chat => chat.chatId !== chatId));
                toast.success("Чат успешно удален.");
                if (currentChatId === chatId) {
                    selectChat(null);
                }
            } else {
                throw new Error(data.message || 'Не удалось удалить чат.');
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleEditChat = async () => {
        if (!editingChat || !newChatTitle.trim() || newChatTitle === editingChat.chatTitle) {
            setShowEditDialog(false);
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}/api/multi-chat/${editingChat.chatId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                    'x-user-id': user._id
                },
                body: JSON.stringify({ chatTitle: newChatTitle }),
            });

            const data = await response.json();

            if (data.success) {
                setRecentHistory(prev => prev.map(chat =>
                    chat.chatId === editingChat.chatId ? { ...chat, chatTitle: newChatTitle } : chat
                ));
                toast.success("Чат успешно переименован.");
            } else {
                throw new Error(data.message || 'Не удалось переименовать чат.');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setShowEditDialog(false);
            setEditingChat(null);
            setNewChatTitle("");
        }
    };

    const openEditDialog = (chat) => {
        setEditingChat(chat);
        setNewChatTitle(chat.chatTitle);
        setShowEditDialog(true);
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
                        <div key={chat.chatId} className="flex items-center group pr-2">
                            <Button
                                variant={currentChatId === chat.chatId ? "secondary" : "ghost"}
                                className="w-full justify-start text-sm flex-1"
                                onClick={() => handleChatClick(chat.chatId)}
                            >
                                <span className="truncate">{chat.chatTitle || `Чат ${chat.chatId.substring(0, 8)}`}</span>
                            </Button>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(chat); }}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            <span>Редактировать</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.chatId); }}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Удалить</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                     <Button variant="link" className="w-full mt-2 text-sm" onClick={onShowHistory}>
                        Показать всё
                    </Button>
                </div>
            )}
            
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Редактировать название чата</DialogTitle>
                        <DialogDescription>
                            Введите новое название для вашего чата.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newChatTitle}
                            onChange={(e) => setNewChatTitle(e.target.value)}
                            placeholder="Новое название"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>Отмена</Button>
                        <Button onClick={handleEditChat}>Сохранить</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ChatHistoryMenu;

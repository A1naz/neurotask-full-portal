import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useTokenBalance } from '@/contexts/TokenBalanceContext'; // Import useTokenBalance
import { Plus, Minus, History, Wallet, Calendar, Filter, TrendingUp, BarChart3 } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';

const TokenHistory = () => {
  const location = useLocation();
  const { API_BASE, csrfToken } = useAuth();
  const { balance, fetchBalance } = useTokenBalance(); // Get balance and fetchBalance from context
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  // const [currentBalance, setCurrentBalance] = useState(0); // Removed local state
  const [showTopUpForm, setShowTopUpForm] = useState(false);
  const topUpInputRef = useRef(null);
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({
    totalTopUps: 0,
    totalSpent: 0,
    totalRefunds: 0,
    totalBonuses: 0
  });
  
  // Состояние для фильтров
  const [filters, setFilters] = useState({
    period: 'all', // all, today, week, month, custom
    startDate: '',
    endDate: '',
    type: 'all' // all, top_up, spend
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'topup') {
      setShowTopUpForm(true);
    }
  }, [location]);

  useEffect(() => {
    if (showTopUpForm) {
      setTimeout(() => {
        topUpInputRef.current?.focus();
      }, 100);
    }
  }, [showTopUpForm]);

  useEffect(() => {
    loadHistory();
  }, [filters]); // Перезагружаем при изменении фильтров

  const loadHistory = async () => {
    setLoading(true);
    try {
      // Строим параметры запроса
      const params = new URLSearchParams();
      
      if (filters.period !== 'all') {
        params.append('period', filters.period);
      }
      
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      
      if (filters.type && filters.type !== 'all') {
        params.append('type', filters.type);
      }

      const response = await fetch(`${API_BASE}/api/tokens/history?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.transactions || []);
        
        // Подготавливаем данные для графика
        prepareChartData(data.transactions || []);
        prepareStats(data.transactions || []);
      } else {
        }
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (transactions) => {
    // Группируем транзакции по дням
    const groupedByDate = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.createdAt).toLocaleDateString('ru-RU');
      
      if (!acc[date]) {
        acc[date] = {
          date,
          topUps: 0,
          spent: 0,
          refunds: 0,
          bonuses: 0,
          balance: 0
        };
      }
      
      switch (transaction.type) {
        case 'top_up':
          acc[date].topUps += transaction.amount;
          break;
        case 'spend':
          acc[date].spent += transaction.amount;
          break;
        case 'refund':
          acc[date].refunds += transaction.amount;
          break;
        case 'bonus':
          acc[date].bonuses += transaction.amount;
          break;
      }
      
      acc[date].balance = transaction.balanceAfter;
      
      return acc;
    }, {});
    
    // Преобразуем в массив и сортируем по дате
    const chartDataArray = Object.values(groupedByDate).sort((a, b) => 
      new Date(a.date.split('.').reverse().join('-')) - new Date(b.date.split('.').reverse().join('-'))
    );
    
    setChartData(chartDataArray);
  };

  const prepareStats = (transactions) => {
    const stats = transactions.reduce((acc, transaction) => {
      switch (transaction.type) {
        case 'top_up':
          acc.totalTopUps += transaction.amount;
          break;
        case 'spend':
          acc.totalSpent += transaction.amount;
          break;
        case 'refund':
          acc.totalRefunds += transaction.amount;
          break;
        case 'bonus':
          acc.totalBonuses += transaction.amount;
          break;
      }
      return acc;
    }, {
      totalTopUps: 0,
      totalSpent: 0,
      totalRefunds: 0,
      totalBonuses: 0
    });
    
    setStats(stats);
  };

  const handleTopUp = async () => {
    if (!topUpAmount || topUpAmount <= 0) {
      alert('Введите корректную сумму');
      return;
    }

    if (!csrfToken) {
      alert('Ошибка безопасности: CSRF токен не найден');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/tokens/top-up`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ amount: parseInt(topUpAmount) }),
      });

      if (response.ok) {
        const data = await response.json();
        // setCurrentBalance(data.newBalance); // Removed local state update
        fetchBalance(); // Refresh balance from context
        setTopUpAmount('');
        setShowTopUpForm(false);
        loadHistory(); // Перезагружаем историю
        alert('Баланс успешно пополнен!');
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.message}`);
      }
    } catch (error) {
      alert('Ошибка при пополнении баланса');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period) => {
    setFilters(prev => ({
      ...prev,
      period,
      // Сбрасываем даты при выборе предустановленного периода
      startDate: period === 'custom' ? prev.startDate : '',
      endDate: period === 'custom' ? prev.endDate : ''
    }));
  };

  const handleTypeChange = (type) => {
    setFilters(prev => ({
      ...prev,
      type
    }));
  };

  const handleDateChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      period: 'all',
      startDate: '',
      endDate: '',
      type: 'all'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const getOperationIcon = (type) => {
    switch (type) {
      case 'top_up':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'spend':
        return <Minus className="w-4 h-4 text-red-600" />;
      default:
        return <History className="w-4 h-4 text-gray-600" />;
    }
  };

  const getOperationColor = (type) => {
    switch (type) {
      case 'top_up':
        return 'text-green-600';
      case 'spend':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getOperationText = (type) => {
    switch (type) {
      case 'top_up':
        return 'Пополнение';
      case 'spend':
        return 'Списание';
      default:
        return 'Операция';
    }
  };

  const getPeriodText = (period) => {
    switch (period) {
      case 'all':
        return 'Все время';
      case 'today':
        return 'Сегодня';
      case 'week':
        return 'Неделя';
      case 'month':
        return 'Месяц';
      case 'custom':
        return 'Произвольный период';
      default:
        return 'Все время';
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value} токенов
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Текущий баланс */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Текущий баланс
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{balance} токенов</div>
            <Button 
              onClick={() => setShowTopUpForm(!showTopUpForm)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Пополнить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Форма пополнения */}
      {showTopUpForm && (
        <Card>
          <CardHeader>
            <CardTitle>Пополнение баланса</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount"></Label>
              <Input
                ref={topUpInputRef}
                id="amount"
                type="number"
                className="-mt-3"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="Введите количество токенов"
                min="1"
              />
              <p className="text-sm text-gray-500 mt-2">
                Стоимость токена 1₽ К оплате: {topUpAmount ? parseInt(topUpAmount, 10) : 0}₽
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[500, 1500, 2500, 5000].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setTopUpAmount(amount.toString())}
                >
                  {amount.toLocaleString('ru-RU')}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleTopUp} disabled={loading}>
                {loading ? 'Пополнение...' : 'Пополнить'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowTopUpForm(false)}
              >
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Пополнения</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalTopUps}</p>
              </div>
              <Plus className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Списания</p>
                <p className="text-2xl font-bold text-red-600">{stats.totalSpent}</p>
              </div>
              <Minus className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Возвраты</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalRefunds}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Бонусы</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalBonuses}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Графики и история */}
      <Tabs defaultValue="history" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chart">График</TabsTrigger>
          <TabsTrigger value="history">История</TabsTrigger>
          <TabsTrigger value="balance">Баланс</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Динамика операций
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Загрузка графика...</div>
              ) : chartData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Нет данных для отображения графика
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Линейный график */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Линейный график операций</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="topUps" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          name="Пополнения"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="spent" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          name="Списания"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="refunds" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="Возвраты"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="bonuses" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          name="Бонусы"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Столбчатый график */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Столбчатый график</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="topUps" fill="#10b981" name="Пополнения" />
                        <Bar dataKey="spent" fill="#ef4444" name="Списания" />
                        <Bar dataKey="refunds" fill="#3b82f6" name="Возвраты" />
                        <Bar dataKey="bonuses" fill="#8b5cf6" name="Бонусы" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* График баланса */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Динамика баланса</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="balance" 
                          stroke="#6366f1" 
                          fill="#6366f1" 
                          fillOpacity={0.3}
                          name="Баланс"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  История операций
                  {history.length > 0 && (
                    <Badge variant="outline" className="ml-2">
                      {history.length} операций
                    </Badge>
                  )}
                </CardTitle>

                <div className="flex flex-wrap items-end gap-2">
                  {/* Период */}
                  <div className="space-y-2">
                    <Label>Период</Label>
                    <Select value={filters.period} onValueChange={handlePeriodChange}>
                      <SelectTrigger className="w-auto sm:w-[180px]">
                        <SelectValue placeholder="Выберите период" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Сегодня</SelectItem>
                        <SelectItem value="yesterday">Вчера</SelectItem>
                        <SelectItem value="3days">3 дня</SelectItem>
                        <SelectItem value="7days">7 дней</SelectItem>
                        <SelectItem value="30days">30 дней</SelectItem>
                        <SelectItem value="all">Все время</SelectItem>
                        <SelectItem value="custom">Произвольный период</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Тип операции */}
                  <div className="space-y-2">
                    <Label>Тип операции</Label>
                    <Select value={filters.type} onValueChange={handleTypeChange}>
                      <SelectTrigger className="w-auto sm:w-[180px]">
                        <SelectValue placeholder="Все типы" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все типы</SelectItem>
                        <SelectItem value="top_up">Пополнения</SelectItem>
                        <SelectItem value="spend">Списания</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Кнопки управления фильтрами */}
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Сбросить фильтры
                  </Button>
                </div>
              </div>
              {/* Custom date range picker */}
              {filters.period === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Начальная дата</Label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleDateChange('startDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Конечная дата</Label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleDateChange('endDate', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Загрузка истории...</div>
              ) : history.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {(filters.period !== 'all' || filters.type !== 'all') 
                    ? 'По выбранным фильтрам операций не найдено'
                    : 'История операций пуста'
                  }
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((operation, index) => (
                    <div 
                      key={operation._id || index} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getOperationIcon(operation.type)}
                        <div>
                          <div className="font-medium">
                            {getOperationText(operation.type)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {operation.description || 'Операция с токенами'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatDate(operation.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${getOperationColor(operation.type)}`}>
                          {operation.type === 'top_up' ? '+' : '-'}{operation.amount} токенов
                        </div>
                        <div className="text-sm text-gray-500">
                          Баланс: {operation.balanceAfter} токенов
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Динамика баланса
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Загрузка данных...</div>
              ) : chartData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Нет данных для отображения
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#6366f1" 
                      fill="#6366f1" 
                      fillOpacity={0.3}
                      name="Баланс"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TokenHistory; 
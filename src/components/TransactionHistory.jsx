import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
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
  Bar
} from 'recharts';
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus,
  RefreshCw,
  Filter,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

const TransactionHistory = () => {
  const { API_BASE } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [chartData, setChartData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    period: 'all',
    type: '',
    startDate: '',
    endDate: '',
    page: 1
  });

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        period: filters.period,
        page: filters.page.toString(),
        limit: '20'
      });

      if (filters.type) params.append('type', filters.type);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`${API_BASE}/api/transactions?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setStats(data.stats);
        setChartData(data.chartData);
        setPagination(data.pagination);
      }
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'top_up':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'spend':
        return <Minus className="h-4 w-4 text-red-600" />;
      case 'refund':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'bonus':
        return <CheckCircle2 className="h-4 w-4 text-purple-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionTypeName = (type) => {
    switch (type) {
      case 'top_up':
        return 'Пополнение';
      case 'spend':
        return 'Списание';
      case 'refund':
        return 'Возврат';
      case 'bonus':
        return 'Бонус';
      default:
        return 'Неизвестно';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'top_up':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'spend':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'refund':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'bonus':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatAmount = (amount) => {
    return amount > 0 ? `+${amount}` : amount.toString();
  };

  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy, HH:mm', { locale: ru });
  };

  const handlePeriodChange = (period) => {
    setFilters(prev => ({ ...prev, period, page: 1 }));
  };

  const handleTypeChange = (type) => {
    setFilters(prev => ({ ...prev, type, page: 1 }));
  };

  const handleCustomDateChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Дата', 'Тип', 'Сумма', 'Баланс после', 'Описание'],
      ...transactions.map(t => [
        formatDate(t.createdAt),
        getTransactionTypeName(t.type),
        formatAmount(t.amount),
        t.balanceAfter,
        t.description
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка истории операций...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">История операций</h2>
          <p className="text-gray-600">Просмотр и анализ ваших транзакций</p>
        </div>
        <Button onClick={exportTransactions} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Экспорт
        </Button>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="period">Период</Label>
              <Select value={filters.period} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все время</SelectItem>
                  <SelectItem value="today">Сегодня</SelectItem>
                  <SelectItem value="week">Неделя</SelectItem>
                  <SelectItem value="month">Месяц</SelectItem>
                  <SelectItem value="custom">Произвольный период</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Тип операции</Label>
              <Select value={filters.type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Все типы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Все типы</SelectItem>
                  <SelectItem value="top_up">Пополнения</SelectItem>
                  <SelectItem value="spend">Списания</SelectItem>
                  <SelectItem value="refund">Возвраты</SelectItem>
                  <SelectItem value="bonus">Бонусы</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filters.period === 'custom' && (
              <>
                <div>
                  <Label htmlFor="startDate">Начальная дата</Label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Конечная дата</Label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Plus className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Пополнения</p>
                <p className="text-2xl font-bold text-green-600">+{stats.totalTopUps || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Minus className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Списания</p>
                <p className="text-2xl font-bold text-red-600">-{Math.abs(stats.totalSpent || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Возвраты</p>
                <p className="text-2xl font-bold text-blue-600">+{stats.totalRefunds || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle2 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Бонусы</p>
                <p className="text-2xl font-bold text-purple-600">+{stats.totalBonuses || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* График */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>График операций</CardTitle>
            <CardDescription>Динамика операций по дням</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="_id" 
                  tickFormatter={(value) => format(new Date(value), 'dd MMM', { locale: ru })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), 'dd MMM yyyy', { locale: ru })}
                  formatter={(value, name) => [
                    value, 
                    {
                      'topUps': 'Пополнения',
                      'spent': 'Списания',
                      'refunds': 'Возвраты',
                      'bonuses': 'Бонусы'
                    }[name] || name
                  ]
                } />
                <Legend />
                <Line type="monotone" dataKey="topUps" stroke="#10b981" strokeWidth={2} name="Пополнения" />
                <Line type="monotone" dataKey="spent" stroke="#ef4444" strokeWidth={2} name="Списания" />
                <Line type="monotone" dataKey="refunds" stroke="#3b82f6" strokeWidth={2} name="Возвраты" />
                <Line type="monotone" dataKey="bonuses" stroke="#8b5cf6" strokeWidth={2} name="Бонусы" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Список транзакций */}
      <Card>
        <CardHeader>
          <CardTitle>Транзакции</CardTitle>
          <CardDescription>
            Всего: {pagination.total || 0} операций
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Транзакции не найдены</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-600">{formatDate(transaction.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getTransactionColor(transaction.type)}>
                      {getTransactionTypeName(transaction.type)}
                    </Badge>
                    <div className="text-right">
                      <p className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatAmount(transaction.amount)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Баланс: {transaction.balanceAfter}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Пагинация */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page <= 1}
              >
                Назад
              </Button>
              <span className="text-sm text-gray-600">
                Страница {filters.page} из {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page >= pagination.pages}
              >
                Вперед
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionHistory; 
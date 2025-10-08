import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const TokenBalanceContext = createContext();

export const useTokenBalance = () => {
  const context = useContext(TokenBalanceContext);
  if (!context) {
    throw new Error('useTokenBalance must be used within a TokenBalanceProvider');
  }
  return context;
};

export const TokenBalanceProvider = ({ children }) => {
  const [balance, setBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user, API_BASE } = useAuth();

  const fetchBalance = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/tokens/balance`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance || 0);
        setBonusBalance(data.bonusBalance || 0);
        setTotalBalance(data.totalBalance || 0);
      }
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const updateBalance = (newBalance) => {
    setBalance(newBalance);
    // Recalculate total balance
    setTotalBalance(newBalance + bonusBalance);
  };

  const updateBonusBalance = (newBonusBalance) => {
    setBonusBalance(newBonusBalance);
    // Recalculate total balance
    setTotalBalance(balance + newBonusBalance);
  };

  // Загружаем баланс при инициализации
  useEffect(() => {
    if (user) {
      // fetchBalance(); // Removed to avoid double fetch
    }
  }, [user, API_BASE]);

  // Автообновление баланса каждые 30 секунд
  useEffect(() => {
    if (!user) return;

    fetchBalance(); // Fetch immediately on mount and user change

    const interval = setInterval(() => {
      fetchBalance();
    }, 30000); // 30 секунд

    return () => clearInterval(interval);
  }, [user, API_BASE]);

  const value = {
    balance,
    bonusBalance,
    totalBalance,
    loading,
    fetchBalance,
    updateBalance,
    updateBonusBalance,
  };

  return (
    <TokenBalanceContext.Provider value={value}>
      {children}
    </TokenBalanceContext.Provider>
  );
}; 
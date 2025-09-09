import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CustomDropdown,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from '@/components/ui/custom-dropdown';
import { Button } from '@/components/ui/button';
import { User, Wallet, Plus, LogOut } from 'lucide-react';

const ProfileDropdown = ({
  user,
  tokenBalance,
  profileMenuItems,
  isLoading,
  error,
  onLogout,
  trigger,
  direction = 'down', // 'up' or 'down'
}) => {
  const navigate = useNavigate();

  return (
    <CustomDropdown
      position={direction === 'up' ? 'top' : 'bottom'}
      trigger={trigger}
    >
      <DropdownLabel>
        <div className="flex items-center">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
            <User className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">{user?.username}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
      </DropdownLabel>
      <DropdownSeparator />

      {/* Token Balance Section */}
      <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 mx-2 rounded-md border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-700">Баланс токенов</span>
            <div className="text-xs text-gray-500">Доступно для использования</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-blue-600">
              {tokenBalance.toLocaleString()}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/assistant/token-history?action=topup')}
              className="h-6 w-6 p-0 hover:bg-blue-100 rounded-full"
              title="Пополнить баланс"
            >
              <Plus className="h-3 w-3 text-blue-600" />
            </Button>
          </div>
        </div>
      </div>

      <DropdownSeparator />

      {/* Dynamic Menu Items */}
      {isLoading ? (
        <DropdownItem disabled>Загрузка...</DropdownItem>
      ) : error ? (
        <DropdownItem disabled className="text-red-500">{error}</DropdownItem>
      ) : (
        profileMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownItem key={item.id} onClick={() => navigate(item.path)}>
              {Icon && <Icon className="mr-3 h-4 w-4" />}
              <div>
                <div className="font-medium">{item.label}</div>
                {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
              </div>
            </DropdownItem>
          );
        })
      )}

      <DropdownSeparator />

      {/* Logout */}
      <DropdownItem onClick={onLogout} className="text-red-600">
        <LogOut className="mr-3 h-4 w-4" />
        <div>
          <div className="font-medium">Выйти</div>
          <div className="text-xs text-gray-500">Завершить сессию</div>
        </div>
      </DropdownItem>
    </CustomDropdown>
  );
};

export default ProfileDropdown;

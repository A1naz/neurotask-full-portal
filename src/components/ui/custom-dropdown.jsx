import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const CustomDropdown = ({ trigger, children, className = "", position = "bottom" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
             {isOpen && (
         <div className={`absolute w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50 ${
           position === "top" 
             ? "bottom-full mb-2 left-0" 
             : "top-full mt-2 right-0"
         }`}>
           {children}
         </div>
       )}
    </div>
  );
};

const DropdownItem = ({ children, onClick, className = "" }) => {
  return (
    <div
      className={cn(
        "px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 transition-colors",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const DropdownSeparator = () => {
  return <div className="border-t border-gray-200 my-1" />;
};

const DropdownLabel = ({ children, className = "" }) => {
  return (
    <div className={cn("px-3 py-2 text-sm font-medium text-gray-700", className)}>
      {children}
    </div>
  );
};

export { CustomDropdown, DropdownItem, DropdownSeparator, DropdownLabel }; 
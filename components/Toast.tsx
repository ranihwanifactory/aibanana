import React, { useEffect } from 'react';
import { ToastMessage } from '../types';

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const bgColors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  return (
    <div className={`${bgColors[toast.type]} text-white px-6 py-3 rounded-lg shadow-lg mb-3 flex items-center justify-between min-w-[300px] animate-fade-in-up transition-all`}>
      <span>{toast.message}</span>
      <button 
        onClick={() => onClose(toast.id)} 
        className="ml-4 hover:text-gray-200 focus:outline-none"
      >
        ✕
      </button>
    </div>
  );
};

import { useEffect } from 'react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : 
                  type === 'error' ? 'bg-red-50 border-red-200' : 
                  'bg-blue-50 border-blue-200';
  
  const iconColor = type === 'success' ? 'text-green-600' : 
                    type === 'error' ? 'text-red-600' : 
                    'text-blue-600';
  
  const textColor = type === 'success' ? 'text-green-800' : 
                    type === 'error' ? 'text-red-800' : 
                    'text-blue-800';

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg border ${bgColor} shadow-lg animate-slide-up max-w-sm z-50`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckCircleIcon className={`h-5 w-5 ${iconColor}`} />
          <p className={`text-sm font-medium ${textColor}`}>
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className={`ml-4 ${iconColor} hover:opacity-70 transition-opacity`}
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../services/api';
import { XMarkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../LoadingSpinner';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Password validation
  const passwordRequirements = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    digit: /[0-9]/.test(formData.password),
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);
  const doPasswordsMatch = formData.password === formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Password does not meet requirements');
      return;
    }

    if (!doPasswordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.email, formData.username, formData.password);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.response.message || 'Registration failed');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="input-field"
              required
              disabled={isLoading}
              pattern="[a-zA-Z0-9_]+"
              title="Username can only contain letters, numbers, and underscores"
            />
            <p className="text-xs text-gray-500 mt-1">
              Letters, numbers, and underscores only
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              required
              disabled={isLoading}
            />
            
            {formData.password && (
              <div className="mt-2 space-y-1">
                <div className={`flex items-center text-xs ${passwordRequirements.length ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordRequirements.length ? <CheckCircleIcon className="h-4 w-4 mr-1" /> : <XCircleIcon className="h-4 w-4 mr-1" />}
                  At least 8 characters
                </div>
                <div className={`flex items-center text-xs ${passwordRequirements.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordRequirements.uppercase ? <CheckCircleIcon className="h-4 w-4 mr-1" /> : <XCircleIcon className="h-4 w-4 mr-1" />}
                  One uppercase letter
                </div>
                <div className={`flex items-center text-xs ${passwordRequirements.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordRequirements.lowercase ? <CheckCircleIcon className="h-4 w-4 mr-1" /> : <XCircleIcon className="h-4 w-4 mr-1" />}
                  One lowercase letter
                </div>
                <div className={`flex items-center text-xs ${passwordRequirements.digit ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordRequirements.digit ? <CheckCircleIcon className="h-4 w-4 mr-1" /> : <XCircleIcon className="h-4 w-4 mr-1" />}
                  One digit
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input-field"
              required
              disabled={isLoading}
            />
            {formData.confirmPassword && !doPasswordsMatch && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !isPasswordValid || !doPasswordsMatch}
            className="w-full btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Creating account...</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpinner,
  faChartLine, // Changed from faGraduationCap
  faEnvelope,
  faArrowLeft,
  faCheck,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim()) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      await resetPassword(email);
      setSuccess(true);
      setEmailSent(true);
    } catch (error: unknown) {
  if (error instanceof Error) {
    setError(error.message);
  } else {
    setError('An unexpected error occurred');
  }
}  finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setError('');
    setLoading(true);
    
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (error: unknown) {
  if (error instanceof Error) {
    setError(error.message);
  } else {
    setError('An unexpected error occurred');
  }
} finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <FontAwesomeIcon icon={faChartLine} className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {emailSent ? 'Check Your Email' : 'Reset Password'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {emailSent 
              ? 'We\'ve sent password reset instructions to your email'
              : 'Enter your email to receive reset instructions'
            }
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg">
          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faEnvelope} className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter your email address"
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Enter the email address associated with your TaycaroView account
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Sending reset link...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                      Send Reset Link
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onBackToLogin}
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 text-center">
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faCheck} className="h-8 w-8 text-green-600" />
              </div>

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                  <p className="font-medium">Email sent successfully!</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Reset link sent to:
                  </h3>
                  <p className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg font-mono">
                    {email}
                  </p>
                </div>

                <div className="text-left space-y-2">
                  <h4 className="font-medium text-gray-900 text-sm">Next steps:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-start">
                      <span className="font-bold mr-2 text-purple-600">1.</span>
                      Check your email inbox (and spam folder)
                    </li>
                    <li className="flex items-start">
                      <span className="font-bold mr-2 text-purple-600">2.</span>
                      Click the reset link in the email
                    </li>
                    <li className="flex items-start">
                      <span className="font-bold mr-2 text-purple-600">3.</span>
                      Create a new password
                    </li>
                    <li className="flex items-start">
                      <span className="font-bold mr-2 text-purple-600">4.</span>
                      Sign in with your new password
                    </li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
                    The reset link will expire in 1 hour for security reasons.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <button
                  onClick={handleResendEmail}
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-purple-300 text-sm font-medium rounded-lg text-purple-600 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Resending...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                      Resend Email
                    </>
                  )}
                </button>

                <button
                  onClick={onBackToLogin}
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                  Back to Sign In
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Having trouble?</p>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>• Check your spam/junk folder</p>
                  <p>• Make sure you entered the correct email</p>
                  <p>• Contact your system administrator if issues persist</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {!emailSent && (
          <div className="text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Need help?</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• Make sure to use your registered email address</p>
                <p>• Contact your system administrator if you continue having issues</p>
                <p>• The reset process may take a few minutes</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
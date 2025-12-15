import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dkkdAuthService, DkkdInitState, DkkdLoginRequest } from '@/services/dkkdAuthService';
import { API_BASE_URL } from '@/services/api';

declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaLoad: () => void;
    onRecaptchaSuccess: (token: string) => void;
    onRecaptchaExpired: () => void;
  }
}

import DkkdLoginIframe from './DkkdLoginIframe';

export default function DkkdLogin() {
  const navigate = useNavigate();
  const [useIframe, setUseIframe] = useState(false);
  const [recaptchaFailed, setRecaptchaFailed] = useState(false);
  const [initState, setInitState] = useState<DkkdInitState | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [recaptchaLoadTimeout, setRecaptchaLoadTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeLogin();
    loadRecaptchaScript();
    
    // Cleanup function
    return () => {
      if (recaptchaLoadTimeout) {
        clearTimeout(recaptchaLoadTimeout);
      }
    };
  }, []);

  // Re-render reCAPTCHA when site key is available
  useEffect(() => {
    if (initState?.recaptchaSiteKey && recaptchaLoaded && window.grecaptcha) {
      console.log('Rendering reCAPTCHA with site key:', initState.recaptchaSiteKey);
      
      // Use requestAnimationFrame for better timing
      const renderRecaptcha = () => {
        try {
          const container = document.getElementById('recaptcha-container');
          if (container) {
            // Clear any existing reCAPTCHA
            container.innerHTML = '';
            
            // Render new reCAPTCHA
            const widgetId = window.grecaptcha.render('recaptcha-container', {
              'sitekey': initState.recaptchaSiteKey,
              'callback': window.onRecaptchaSuccess,
              'expired-callback': window.onRecaptchaExpired,
              'theme': 'light'
            });
            
            console.log('reCAPTCHA rendered successfully, widget ID:', widgetId);
            setRecaptchaFailed(false);
          } else {
            console.error('reCAPTCHA container not found');
            setRecaptchaFailed(true);
          }
        } catch (error) {
          console.error('Error rendering reCAPTCHA:', error);
          setRecaptchaFailed(true);
          // Don't retry automatically, let user choose fallback
        }
      };
      
      // Use requestAnimationFrame for better DOM timing
      requestAnimationFrame(renderRecaptcha);
    }
  }, [initState?.recaptchaSiteKey, recaptchaLoaded]);

  const loadRecaptchaScript = () => {
    if (document.getElementById('recaptcha-script')) {
      return;
    }

    // Define global callbacks BEFORE loading the script
    window.onRecaptchaSuccess = (token: string) => {
      setRecaptchaToken(token);
      setError(''); // Clear any previous errors
    };
    
    window.onRecaptchaExpired = () => {
      setRecaptchaToken('');
    };
    
    window.onRecaptchaLoad = () => {
      setRecaptchaLoaded(true);
      // Clear timeout if script loads successfully
      if (recaptchaLoadTimeout) {
        clearTimeout(recaptchaLoadTimeout);
        setRecaptchaLoadTimeout(null);
      }
    };

    const script = document.createElement('script');
    script.id = 'recaptcha-script';
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      setError('Không thể tải reCAPTCHA. Vui lòng thử lại.');
      setRecaptchaFailed(true);
      // Clear timeout on error
      if (recaptchaLoadTimeout) {
        clearTimeout(recaptchaLoadTimeout);
        setRecaptchaLoadTimeout(null);
      }
    };
    
    document.head.appendChild(script);
    
    // Set timeout to detect if reCAPTCHA fails to load
    const timeout = setTimeout(() => {
      if (!window.grecaptcha) {
        setRecaptchaFailed(true);
        setError('reCAPTCHA không tải được. Vui lòng thử lại hoặc sử dụng chế độ khác.');
      }
    }, 10000); // 10 second timeout
    
    setRecaptchaLoadTimeout(timeout);
  };

  const initializeLogin = async () => {
    try {
      setIsLoading(true);
      const state = await dkkdAuthService.initializeLogin();
      setInitState(state);
      setError('');
    } catch (err) {
      setError('Không thể kết nối đến hệ thống DKKD. Vui lòng thử lại sau.');
      // If backend fails, enable fallback
      setRecaptchaFailed(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initState) return;

    if (!username || !password) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (initState?.useRecaptcha && !recaptchaToken) {
      setError('Vui lòng xác thực reCAPTCHA');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const loginRequest: DkkdLoginRequest = {
        username,
        password,
        recaptchaToken,
        sessionId: initState.sessionCookie || '', // Use sessionCookie from init state
      };

      const response = await dkkdAuthService.login(loginRequest);

      if (response.success) {
        // Cross-check credentials against DKKD by using workflow LOGIN_STEP
        try {
          const initResp = await fetch(`${API_BASE_URL}/api/BusinessRegistrationWorkflow/initialize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: response.authToken })
          });
          const initData = await initResp.json();
          const workflowId = initData.workflowId;

          const verifyPayload = {
            workflowId,
            sectionCode: 'LOGIN_STEP',
            fieldValues: {
              'ctl00$C$W1$UserName': username,
              'ctl00$C$W1$Password': password
            },
            actionName: 'ctl00$C$W1$btnStep1_Login'
          };
          const verifyResp = await fetch(`${API_BASE_URL}/api/BusinessRegistrationWorkflow/section/fill`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(verifyPayload)
          });
          const verifyData = await verifyResp.json();

          if (verifyData.success) {
            setIsLoggedIn(true);
            localStorage.setItem('sessionId', response.authToken!);
            setError('');
          } else {
            setError(verifyData.message || 'Đăng nhập DKKD không hợp lệ');
            if (window.grecaptcha) {
              window.grecaptcha.reset();
              setRecaptchaToken('');
            }
            return;
          }
        } catch (e) {
          setError('Không thể xác thực với DKKD. Vui lòng thử lại.');
          if (window.grecaptcha) {
            window.grecaptcha.reset();
            setRecaptchaToken('');
          }
          return;
        }
      } else {
        setError(response.message);
        // Reset reCAPTCHA on failed login
        if (window.grecaptcha) {
          window.grecaptcha.reset();
          setRecaptchaToken('');
        }
        
        // If the error is about reCAPTCHA requiring direct browser interaction, 
        // suggest using iframe mode
        if (response.message.includes('iframe') || response.message.includes('trình duyệt')) {
          setTimeout(() => {
            if (confirm('reCAPTCHA yêu cầu xác thực trong trình duyệt. Bạn có muốn chuyển sang chế độ đăng nhập trực tiếp không?')) {
              setUseIframe(true);
            }
          }, 1000);
        }
      }
    } catch (err) {
      setError('Đăng nhập thất bại. Vui lòng thử lại.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      try {
        await dkkdAuthService.logout(sessionId);
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    localStorage.removeItem('sessionId');
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setRecaptchaToken('');
    setUseIframe(false);
    initializeLogin();
  };

  if (useIframe) {
    return <DkkdLoginIframe />;
  }

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng nhập thành công!</h2>
            <p className="text-gray-600">Bạn đã đăng nhập thành công vào hệ thống DKKD qua SaaS.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Đi tới Dashboard
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-900 transition-colors"
            >
              Về Trang chủ
            </button>
            <button
              onClick={() => navigate('/workflow')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Tiến độ Workflow
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng nhập DKKD</h1>
          <p className="text-gray-600">Sử dụng tài khoản DKKD của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Tên đăng nhập
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập tên đăng nhập"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập mật khẩu"
              disabled={isLoading}
            />
          </div>

          <fieldset className="border border-gray-300 rounded-lg p-4 mb-4">
            <legend className="text-sm font-medium text-gray-700 px-2">
              Mã Captcha
            </legend>
            {initState?.useRecaptcha && initState.recaptchaSiteKey && (
              <div className="mb-4">
                {!recaptchaLoaded && !recaptchaFailed && (
                  <div className="text-sm text-gray-500 mb-2 text-center">Đang tải reCAPTCHA...</div>
                )}
                
                {recaptchaFailed ? (
                  <div className="text-center">
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
                      <p className="text-red-600 text-sm mb-2">
                        Không thể tải reCAPTCHA. Vui lòng thử lại hoặc sử dụng chế độ khác.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setRecaptchaFailed(false);
                          setRecaptchaLoaded(false);
                          loadRecaptchaScript();
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Thử tải lại reCAPTCHA
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded p-4 bg-gray-50 flex justify-center">
                    <div 
                      id="recaptcha-container"
                      className="g-recaptcha"
                      data-sitekey={initState.recaptchaSiteKey}
                      data-callback="onRecaptchaSuccess"
                      data-expired-callback="onRecaptchaExpired"
                    ></div>
                  </div>
                )}
                
                {recaptchaToken && !recaptchaFailed && (
                  <div className="text-xs text-green-600 mt-2 text-center">
                    ✅ reCAPTCHA đã xác thực thành công
                  </div>
                )}
              </div>
            )}
          </fieldset>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !initState}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>

          <button
            type="button"
            onClick={() => {
              initializeLogin();
              if (window.grecaptcha) {
                window.grecaptcha.reset();
                setRecaptchaToken('');
              }
            }}
            disabled={isLoading}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Làm mới trang đăng nhập
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-gray-500">
              Hệ thống tích hợp với cổng đăng ký kinh doanh qua mạng
            </p>
            <button
              type="button"
              onClick={() => setUseIframe(true)}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              {recaptchaFailed ? 'Sử dụng chế độ đăng nhập trực tiếp' : 'Gặp lỗi reCAPTCHA? Sử dụng chế độ đăng nhập trực tiếp'}
            </button>
          </div>
      </div>
    </div>
  );
}

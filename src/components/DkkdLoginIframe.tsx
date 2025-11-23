import { useState, useEffect } from 'react';

export default function DkkdLoginIframe() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Listen for messages from the iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://dangkyquamang.dkkd.gov.vn') return;
      
      if (event.data.type === 'login-success') {
        setIsLoggedIn(true);
        localStorage.setItem('dkkd-session', event.data.sessionId);
      } else if (event.data.type === 'login-error') {
        setError(event.data.message);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('dkkd-session');
    setIsLoggedIn(false);
    setError('');
  };

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
            <p className="text-gray-600">Bạn đã đăng nhập thành công vào hệ thống DKKD.</p>
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
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng nhập DKKD</h1>
          <p className="text-gray-600">Sử dụng tài khoản DKKD của bạn</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">Hướng dẫn đăng nhập:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Điền tên đăng nhập và mật khẩu của bạn</li>
              <li>2. Hoàn thành xác thực reCAPTCHA</li>
              <li>3. Click "Đăng nhập" để tiếp tục</li>
            </ol>
          </div>
        </div>

        <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
          <iframe
            src="https://dangkyquamang.dkkd.gov.vn/auth/Public/LogOnOld.aspx"
            width="100%"
            height="600"
            frameBorder="0"
            title="DKKD Login"
            className="w-full"
          />
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Hệ thống tích hợp trực tiếp với cổng đăng ký kinh doanh qua mạng
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Nếu gặp lỗi, vui lòng thử lại hoặc liên hệ hỗ trợ
          </p>
        </div>
      </div>
    </div>
  );
}
export interface DkkdInitState {
  viewState: string;
  eventValidation: string;
  recaptchaSiteKey: string;
  sessionCookie: string;
  useRecaptcha: boolean;
}

export interface DkkdLoginRequest {
  username: string;
  password: string;
  recaptchaToken: string;
  sessionId: string; // This will be mapped to SessionId in the API call
}

export interface DkkdLoginResponse {
  success: boolean;
  message: string;
  authToken?: string;
}

const API_BASE_URL = 'http://localhost:5364/api';

class DkkdAuthService {
  async initializeLogin(): Promise<DkkdInitState> {
    const response = await fetch(`${API_BASE_URL}/dkkdauth/initialize`);
    if (!response.ok) {
      throw new Error('Failed to initialize login');
    }
    return response.json();
  }

  async login(request: DkkdLoginRequest): Promise<DkkdLoginResponse> {
    // Map frontend field names to backend expectations
    const backendRequest = {
      username: request.username,
      password: request.password,
      recaptchaToken: request.recaptchaToken,
      sessionId: request.sessionId // Backend expects SessionId but we'll send as sessionId and let ASP.NET handle it
    };
    
    const response = await fetch(`${API_BASE_URL}/dkkdauth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendRequest),
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    return response.json();
  }

  async logout(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/dkkdauth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionId),
    });
    
    if (!response.ok) {
      throw new Error('Logout failed');
    }
  }

  async validateSession(sessionId: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/dkkdauth/session/${sessionId}`);
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.isValid;
  }
}

export const dkkdAuthService = new DkkdAuthService();
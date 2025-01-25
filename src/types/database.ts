export interface UserProfile {
  id: string;
  email: string;
  name: string;
  last_login: string;
  last_activity: string;
  status: 'active' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface AuthError {
  message: string;
}
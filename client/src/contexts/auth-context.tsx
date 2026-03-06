import { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/axios";

interface User {
  id: number;
  email: string;
  username: string;
  company_id?: number;
  account_type: "work" | "personal";
  is_company_admin: boolean;
  needs_password_change: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  changePassword: (password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        const response = await api.get("/users/me");
        setUser(response.data);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("access_token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post("/users/login", formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });
    
    // Store token in localStorage
    localStorage.setItem("access_token", response.data.access_token);
    
    // Fetch the user information
    await checkAuth();
  };

  const register = async (userData: any) => {
    const response = await api.post("/users/register", userData);
    setUser(response.data);
    // After registering, force a login to get the JWT token
    await login(userData.username, userData.password);
  };

  const changePassword = async (password: string) => {
    await api.post("/users/change-password", { password, username: user?.username, email: user?.email });
    await checkAuth(); // Refresh user state
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, changePassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { authApi } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("kavach_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("kavach_token"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem("kavach_token", token);
    } else {
      localStorage.removeItem("kavach_token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("kavach_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("kavach_user");
    }
  }, [user]);

  const login = async (payload) => {
    setLoading(true);

    try {
      const response = await authApi.login(payload);
      const { token: nextToken, user: nextUser } = response.data.data;
      setToken(nextToken);
      setUser(nextUser);
      toast.success("Welcome to kavach_workflow Management.");
      return nextUser;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);

    try {
      const response = await authApi.register(payload);
      const { token: nextToken, user: nextUser } = response.data.data;
      setToken(nextToken);
      setUser(nextUser);
      toast.success("Account created successfully.");
      return nextUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    toast.success("You have been signed out.");
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      setUser,
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
};

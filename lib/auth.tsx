'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  showLoginDialog: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('dashboard_auth');
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true);
    }
    setChecking(false);
  }, []);

  const login = async (enteredPassword: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: enteredPassword }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('dashboard_auth', 'authenticated');
        setLoginDialogOpen(false);
        setPassword('');
        setError('');
        return true;
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid password');
        return false;
      }
    } catch (err) {
      setError('Failed to authenticate. Please try again.');
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('dashboard_auth');
  };

  const showLoginDialog = () => {
    setLoginDialogOpen(true);
    setError('');
    setPassword('');
  };

  const handleLogin = async () => {
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }
    await login(password);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  if (checking) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, showLoginDialog }}>
      {children}
      <Dialog
        open={loginDialogOpen}
        onClose={() => {
          setLoginDialogOpen(false);
          setError('');
          setPassword('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockIcon />
          Admin Authentication Required
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            You need to authenticate to make changes to requests. Viewing is available to everyone.
          </Alert>
          <TextField
            autoFocus
            fullWidth
            type="password"
            label="Admin Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            onKeyPress={handleKeyPress}
            error={!!error}
            helperText={error}
            variant="outlined"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setLoginDialogOpen(false);
            setError('');
            setPassword('');
          }}>
            Cancel
          </Button>
          <Button onClick={handleLogin} variant="contained" disabled={!password.trim()}>
            Login
          </Button>
        </DialogActions>
      </Dialog>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


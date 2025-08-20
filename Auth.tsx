
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Permission, UserProfile, AppSettings } from './types';
import * as db from './services/db';

interface AuthContextType {
    session: UserProfile | null; // Session is now just the user profile
    currentUser: UserProfile | null;
    appSettings: AppSettings | null;
    login: (email: string, password_raw: string) => Promise<{ error: { message: string } | null }>;
    logout: () => Promise<{ error: any | null }>;
    hasPermission: (permission: Permission) => boolean;
    loading: boolean;
    setAppSettingsState: (settings: AppSettings | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const SESSION_KEY = 'ehs-session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<UserProfile | null>(null);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeApp = async () => {
            setLoading(true);
            try {
                // Initialize the mock database
                await db.initialize();

                // Check for a session in local storage
                const storedSession = localStorage.getItem(SESSION_KEY);
                if (storedSession) {
                    const user = JSON.parse(storedSession);
                    setSession(user);
                    setCurrentUser(user);
                }

                // Fetch app settings
                const settings = await db.getSettings();
                setAppSettings(settings);

            } catch (error) {
                console.error("Error initializing app:", error);
            } finally {
                setLoading(false);
            }
        };
        initializeApp();
    }, []);

    const setAppSettingsState = (settings: AppSettings | null) => {
        setAppSettings(settings);
    }

    const login = async (email: string, password_raw: string): Promise<{ error: { message: string } | null }> => {
        setLoading(true);
        const { user, error } = await db.loginWithEmailPassword(email, password_raw);
        setLoading(false);
        if (error) {
            return { error: { message: error } };
        }
        if (user) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(user));
            setSession(user);
            setCurrentUser(user);
            return { error: null };
        }
        return { error: { message: 'Unknown error during login.' } };
    };

    const logout = async (): Promise<{ error: any | null }> => {
        localStorage.removeItem(SESSION_KEY);
        setSession(null);
        setCurrentUser(null);
        return Promise.resolve({ error: null });
    };
    
    const hasPermission = useCallback((permission: Permission): boolean => {
        if (!currentUser) return false;
        if (currentUser.level === 'Administrador') return true; // Admins have all permissions
        return (currentUser.permissions || []).includes(permission);
    }, [currentUser]);

    const value = { session, currentUser, appSettings, setAppSettingsState, login, logout, hasPermission, loading };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
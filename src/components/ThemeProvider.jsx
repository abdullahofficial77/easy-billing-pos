import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

/**
 * ThemeProvider - Manages light/dark theme state
 * 
 * Features:
 * - Persists theme choice to localStorage
 * - Respects system preference (prefers-color-scheme) as default
 * - Syncs with system changes when no manual override
 */
export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        // Check localStorage first
        const stored = localStorage.getItem('theme');
        if (stored === 'light' || stored === 'dark') {
            return stored;
        }
        // Fall back to system preference
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    });

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Update meta theme-color for mobile browsers
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', theme === 'light' ? '#f7f8fa' : '#0f0f1a');
        }
    }, [theme]);

    // Listen for system preference changes (only if no manual selection)
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: light)');
        const handler = (e) => {
            // Only auto-switch if user hasn't manually selected a theme
            const manual = localStorage.getItem('theme-manual');
            if (!manual) {
                setTheme(e.matches ? 'light' : 'dark');
            }
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const toggle = () => {
        setTheme(t => {
            const newTheme = t === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme-manual', 'true'); // Mark as manually selected
            return newTheme;
        });
    };

    const resetToSystem = () => {
        localStorage.removeItem('theme-manual');
        const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        setTheme(systemTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggle, resetToSystem }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeProvider;

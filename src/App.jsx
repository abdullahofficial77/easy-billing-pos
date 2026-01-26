import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PinLock from './components/Auth/PinLock';
import AppShell from './components/Layout/AppShell';
import NewBill from './pages/NewBill';
import AllItems from './pages/AllItems';
import Drafts from './pages/Drafts';
import Records from './pages/Records';
import Settings from './pages/Settings';
import Categories from './pages/Categories';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { initializeApp } from './db/database';

export default function App() {
    const [isLocked, setIsLocked] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Initialize DB
        async function init() {
            await initializeApp();
            setIsLoading(false);
        }
        init();

        // Capacitor Logic
        const initCapacitor = async () => {
            try {
                // Status Bar
                await StatusBar.setStyle({ style: Style.Dark });
                await StatusBar.setBackgroundColor({ color: '#0f0f1a' });
            } catch (e) {
                // Ignore in web browser
            }
        };
        initCapacitor();

        // Hardware Back Button
        const backHandler = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
            if (!canGoBack) {
                CapacitorApp.exitApp();
            } else {
                window.history.back();
            }
        });

        return () => {
            backHandler.then(h => h.remove());
        };
    }, []);

    if (isLoading) {
        return (
            <div className="pin-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    if (isLocked) {
        return <PinLock onUnlock={() => setIsLocked(false)} />;
    }

    return (
        <BrowserRouter>
            <AppShell>
                <Routes>
                    <Route path="/" element={<NewBill />} />
                    <Route path="/drafts" element={<Drafts />} />
                    <Route path="/records" element={<Records />} />
                    <Route path="/items" element={<AllItems />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </AppShell>
        </BrowserRouter>
    );
}

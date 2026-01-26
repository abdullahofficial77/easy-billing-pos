import BottomNav from './BottomNav';

export default function AppShell({ children }) {
    return (
        <div className="app-container">
            <main className="main-content">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}

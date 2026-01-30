import BottomNav from './BottomNav';
import Header from './Header';

export default function AppShell({ children }) {
    return (
        <div className="app-container">
            {/* Header removed to allow pages to control their own headers */}
            <main className="main-content">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}

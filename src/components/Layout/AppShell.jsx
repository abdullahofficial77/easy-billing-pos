import BottomNav from './BottomNav';
import Header from './Header';

export default function AppShell({ children }) {
    return (
        <div className="app-container">
            <Header />
            <main className="main-content">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}

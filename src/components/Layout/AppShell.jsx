import BottomNav from './BottomNav';
import Sidebar from './Sidebar';

export default function AppShell({ children }) {
    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}

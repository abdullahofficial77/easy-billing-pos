import { useLocation } from 'react-router-dom';

// Map routes to page titles
const pageTitles = {
    '/': 'New Bill',
    '/drafts': 'Drafts',
    '/records': 'Records',
    '/items': 'All Items',
    '/categories': 'Categories',
    '/settings': 'Settings'
};

export default function Header() {
    const location = useLocation();
    const title = pageTitles[location.pathname] || 'Bazaar POS';

    return (
        <header className="app-header">
            <h1 className="header-title">{title}</h1>
        </header>
    );
}

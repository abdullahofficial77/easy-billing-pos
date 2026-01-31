import { useState, useEffect } from 'react';
import { getAllSettings, saveSettings, addCategory, addItem, getAllCategories, getAllItems, clearAllItems, clearAllCategories, clearAllBills, clearAllDrafts } from '../db/database';
import { generateReceiptText } from '../utils/printer';
import { printReceiptMobile } from '../utils/mobilePrinter';
import { INITIAL_DATA } from '../utils/initialData';
import { useTheme } from '../components/ThemeProvider';

import { DEFAULT_SETTINGS } from '../utils/defaultSettings';

export default function Settings() {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [saved, setSaved] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [populating, setPopulating] = useState(false);
    const { theme, toggle: toggleTheme } = useTheme();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const data = await getAllSettings();
        if (data) {
            setSettings(prev => {
                const merged = { ...prev, ...data };
                // Deep merge receiptConfig
                if (data.receiptConfig) {
                    const sections = { ...prev.receiptConfig.sections, ...data.receiptConfig.sections };
                    let order = data.receiptConfig.order || prev.receiptConfig.order;

                    // Migration: If legacy 'billInfo' exists OR we are missing new sections
                    if (order.includes('billInfo') || !order.includes('discount')) {
                        const idx = order.indexOf('billInfo');
                        if (idx !== -1) {
                            order.splice(idx, 1, 'customerName', 'dateTime', 'billNumber');
                        }

                        // Ensure all granular sections exist
                        // Ensure all granular sections exist
                        if (!order.includes('phone')) order.splice(1, 0, 'phone');
                        if (!order.includes('totalItemsCount')) order.splice(4, 0, 'totalItemsCount');
                        if (!order.includes('discount')) order.splice(order.length - 1, 0, 'discount', 'netTotal');

                        // Ensure newly added sections are enabled by default
                        sections.customerName = sections.customerName || { enabled: true, title: 'Customer Name' };
                        sections.dateTime = sections.dateTime || { enabled: true, title: 'Date & Time' };
                        sections.billNumber = sections.billNumber || { enabled: true, title: 'Bill Number' };
                        sections.phone = sections.phone || { enabled: true, title: 'Phone Number' };
                        sections.totalItemsCount = sections.totalItemsCount || { enabled: true, title: 'Total Items Count' };
                        sections.discount = sections.discount || { enabled: true, title: 'Discount' };
                        sections.netTotal = sections.netTotal || { enabled: true, title: 'Net Total' };

                        // Fix spacing if title/label is compacted
                        if (sections.netTotal.title === 'NetTotal') sections.netTotal.title = 'Net Total';

                        // Force label update if needed (accessing merged labels would require re-structuring, but we can rely on defaults or user edit)

                        // Rename totals to "Subtotal" if useful? Or keep as Totals.
                        // sections.totals.title = 'Subtotal';

                        // Update default section titles for consistency
                        sections.shopInfo = sections.shopInfo || { enabled: true, title: 'Shop Info' };
                    }
                    // Filter duplicates
                    order = [...new Set(order)];

                    merged.receiptConfig = {
                        ...prev.receiptConfig,
                        ...data.receiptConfig,
                        labels: { ...prev.receiptConfig.labels, ...data.receiptConfig.labels },
                        sections: sections,
                        order: order
                    };
                }
                // Force table layout
                merged.receiptConfig.itemLayout = merged.receiptConfig.itemLayout || 'table';
                return merged;
            });
        }
    };

    const handleSave = async (key, value) => {
        const newSettings = { ...settings };
        if (typeof key === 'string') {
            newSettings[key] = value;
        } else if (typeof key === 'object') {
            Object.assign(newSettings, key);
        } else {
            // If handling button click where no key/value passed, save current state
        }

        setSettings(newSettings);
        await saveSettings(newSettings);

        if (!key || typeof key !== 'string') {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    // Explicit save handler for the "Save Settings" button
    const handleSaveButton = async () => {
        await saveSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handlePopulateData = async () => {
        if (!confirm('This will add default categories and items. Existing data will be kept. Continue?')) {
            return;
        }

        setPopulating(true);
        try {
            // 1. Get existing data to avoid duplicates
            const [existingCats, existingItems] = await Promise.all([
                getAllCategories(),
                getAllItems()
            ]);

            const existingCatNames = new Set(existingCats.map(c => c.name.toLowerCase()));
            const existingItemNames = new Set(existingItems.map(i => i.name.toLowerCase()));

            // 2. Add Categories
            let catsAdded = 0;
            for (const cat of INITIAL_DATA.categories) {
                if (!existingCatNames.has(cat.name.toLowerCase())) {
                    await addCategory(cat.name);
                    catsAdded++;
                }
            }

            // 3. Add Items
            let itemsAdded = 0;
            for (const item of INITIAL_DATA.items) {
                if (!existingItemNames.has(item.name.toLowerCase())) {
                    await addItem({
                        ...item,
                        customUnit: '',
                        notes: '',
                        isFavorite: false
                    });
                    itemsAdded++;
                }
            }

            alert(`Successfully added ${catsAdded} categories and ${itemsAdded} items!`);
        } catch (error) {
            console.error(error);
            alert('Error populating data: ' + error.message);
        } finally {
            setPopulating(false);
        }
    };

    const handleClearData = async (type) => {
        if (type === 'items') {
            if (confirm('⚠️ Are you sure you want to delete ALL items? This action cannot be undone.')) {
                await clearAllItems();
                alert('All items have been deleted.');
            }
        } else if (type === 'categories') {
            if (confirm('⚠️ Are you sure you want to delete ALL categories? This will also affect items organized by these categories. This action cannot be undone.')) {
                await clearAllCategories();
                alert('All categories have been deleted.');
            }
        } else if (type === 'bills') {
            if (confirm('⚠️ Are you sure you want to delete ALL sales records? This action cannot be undone.')) {
                await clearAllBills();
                alert('All sales records have been deleted.');
            }
        } else if (type === 'drafts') {
            if (confirm('⚠️ Are you sure you want to delete ALL drafts? This action cannot be undone.')) {
                await clearAllDrafts();
                alert('All drafts have been deleted.');
            }
        }
    };

    const previewReceipt = () => {
        const testBill = {
            id: 123,
            billNumber: 123,
            date: new Date().getTime(),
            customerName: 'Test Customer',
            items: [
                { name: 'Sugar', quantity: 2, unitType: 'kg', price: 150, total: 300 },
                { name: 'Tea', quantity: 1, unitType: 'piece', price: 50, total: 50 }
            ],
            total: 350,
            discount: 50,
            finalTotal: 300
        };
        const previewSettings = {
            storeName: settings.storeName,
            address: settings.address,
            phone: settings.phone,
            footerText: settings.footerText
        };
        const itemLayout = settings.receiptConfig?.itemLayout || 'table';
        const labels = settings.receiptConfig?.labels || {};
        const options = {
            showDiscount: settings.receiptConfig?.showDiscount !== false,
            showNetTotal: settings.receiptConfig?.showNetTotal !== false,
            showTotalItems: settings.showTotalItems,
            showPhone: settings.showPhone,
            order: settings.receiptConfig?.order,
            sections: settings.receiptConfig?.sections
        };
        return generateReceiptText(testBill, previewSettings, settings.printWidth, itemLayout, labels, options);
    };

    const handleTestPrint = async () => {
        setPrinting(true);
        try {
            const content = previewReceipt();
            await printReceiptMobile(content, settings.printWidth);
        } catch (error) {
            console.error('Print failed:', error);
            alert('Print failed. Please try again.');
        } finally {
            setPrinting(false);
        }
    };

    return (
        <div>
            <div className="sticky-header page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                </div>
            </div>

            <div className="settings-container">
                {/* LEFT COLUMN: Settings Forms */}
                <div className="settings-main">
                    {/* Theme Toggle Card */}
                    <div className="card mb-md" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '1.5rem' }}>{theme === 'dark' ? '🌙' : '☀️'}</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Appearance</h3>
                                <span className="text-muted" style={{ fontSize: '0.85rem' }}>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                            </div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="btn ripple"
                            style={{
                                minWidth: '80px',
                                padding: '10px 16px',
                                background: theme === 'dark' ? '#FFFFFF' : '#000000',
                                color: theme === 'dark' ? '#000000' : '#FFFFFF',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: theme === 'dark' ? '0 2px 8px rgba(255,255,255,0.2)' : '0 2px 8px rgba(0,0,0,0.2)'
                            }}
                        >
                            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                        </button>
                    </div>

                    <div className="card mb-md">
                        <h2 className="text-lg font-bold mb-md">Store Information</h2>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="input-group mb-md" style={{ flex: '0 0 65%' }}>
                                <label className="input-label">Store Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={settings.storeName}
                                    onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                                />
                            </div>
                            <div className="input-group mb-md" style={{ flex: '1' }}>
                                <label className="input-label">Phone</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={settings.phone}
                                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="input-group mb-md">
                            <label className="input-label">Address</label>
                            <input
                                type="text"
                                className="input"
                                value={settings.address}
                                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                            />
                        </div>

                        <hr style={{ margin: '20px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

                        <div className="mb-md">
                            <label className="input-label mb-sm">Edit Labels (Names on Receipt)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {Object.entries(settings.receiptConfig?.labels || {})
                                    .filter(([key]) => key !== 'footerBranding')
                                    .map(([key, value]) => (
                                        <div key={key} className="input-group">
                                            <label style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</label>
                                            <input
                                                type="text"
                                                className="input input-sm"
                                                value={value}
                                                style={{ padding: '5px 8px', fontSize: '0.85rem' }}
                                                onChange={(e) => {
                                                    const newConfig = { ...settings.receiptConfig };
                                                    newConfig.labels[key] = e.target.value;
                                                    setSettings({ ...settings, receiptConfig: newConfig });
                                                }}
                                            />
                                        </div>
                                    ))}

                                <div className="input-group">
                                    <label style={{ fontSize: '0.7rem', opacity: 0.7 }}>Receipt Footer Message</label>
                                    <input
                                        type="text"
                                        className="input input-sm"
                                        value={settings.footerText}
                                        style={{ padding: '5px 8px', fontSize: '0.85rem' }}
                                        onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                                    />
                                </div>

                                <div className="input-group">
                                    <label style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'capitalize' }}>Footer Branding</label>
                                    <input
                                        type="text"
                                        className="input input-sm"
                                        value={settings.receiptConfig?.labels?.footerBranding || ''}
                                        style={{ padding: '5px 8px', fontSize: '0.85rem' }}
                                        onChange={(e) => {
                                            const newConfig = { ...settings.receiptConfig };
                                            newConfig.labels.footerBranding = e.target.value;
                                            setSettings({ ...settings, receiptConfig: newConfig });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="card mb-md">
                        <h2 className="text-lg font-bold mb-md">Receipt Customization</h2>





                        <hr style={{ margin: '20px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

                        <div className="mb-md">
                            <label className="input-label mb-sm">Section Order & Toggles</label>
                            <div className="section-list">
                                {(settings.receiptConfig?.order || ['shopInfo', 'customerName', 'dateTime', 'billNumber', 'totalItemsCount', 'itemsTable', 'totals', 'footer']).map((key, index, arr) => {
                                    const section = settings.receiptConfig?.sections?.[key] || { enabled: true, title: key };
                                    return (
                                        <div key={key} className="section-item" style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            background: 'rgba(255,255,255,0.05)',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            marginBottom: '8px'
                                        }}>
                                            <span style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>
                                                {section.title || key.replace(/([A-Z])/g, ' $1')}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div className={`toggle ${section.enabled ? 'active' : ''}`}
                                                    onClick={() => {
                                                        const newConfig = { ...settings.receiptConfig };
                                                        if (!newConfig.sections) newConfig.sections = {};
                                                        if (!newConfig.sections[key]) newConfig.sections[key] = { enabled: true, title: key };
                                                        newConfig.sections[key].enabled = !section.enabled;
                                                        setSettings({ ...settings, receiptConfig: newConfig });
                                                    }}
                                                />
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <button
                                                        disabled={index === 0}
                                                        onClick={() => {
                                                            const newOrder = [...arr];
                                                            [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
                                                            setSettings({ ...settings, receiptConfig: { ...settings.receiptConfig, order: newOrder } });
                                                        }}
                                                        className="btn btn-move"
                                                        aria-label="Move up"
                                                    >
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="12" y1="19" x2="12" y2="5"></line>
                                                            <polyline points="5 12 12 5 19 12"></polyline>
                                                        </svg>
                                                    </button>
                                                    <button
                                                        disabled={index === arr.length - 1}
                                                        onClick={() => {
                                                            const newOrder = [...arr];
                                                            [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
                                                            setSettings({ ...settings, receiptConfig: { ...settings.receiptConfig, order: newOrder } });
                                                        }}
                                                        className="btn btn-move"
                                                        aria-label="Move down"
                                                    >
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                                            <polyline points="19 12 12 19 5 12"></polyline>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>




                    </div>

                    <div className="card mb-md" style={{ borderColor: 'var(--color-primary)', borderWidth: '1px' }}>
                        <h2 className="text-lg font-bold mb-md" style={{ color: 'var(--color-primary)' }}>Data Management</h2>
                        <p className="text-secondary mb-md">
                            Quickly populate your store with common grocery categories and items.
                            This will not delete your existing data.
                        </p>
                        <button
                            className="btn btn-secondary w-full"
                            onClick={handlePopulateData}
                            disabled={populating}
                        >
                            {populating ? 'Populating...' : '📂 Load Default Items & Categories'}
                        </button>
                    </div>

                    {/* Save button moved to right column */}
                </div>

                {/* RIGHT COLUMN: Sticky Preview */}
                <div className="settings-sidebar">
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
                    }}>
                        <div style={{ width: '100%', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Receipt Width</span>
                                <select
                                    className="input input-sm"
                                    style={{ width: '100%', padding: '6px', fontSize: '0.85rem' }}
                                    value={settings.printWidth}
                                    onChange={(e) => setSettings({ ...settings, printWidth: e.target.value })}
                                >
                                    <option value="58mm">58mm (Standard)</option>
                                    <option value="80mm">80mm (Wide)</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Item Row Layout</span>
                                <select
                                    className="input input-sm"
                                    style={{ width: '100%', padding: '6px', fontSize: '0.85rem' }}
                                    value={settings.receiptConfig?.itemLayout || 'standard'}
                                    onChange={(e) => {
                                        const newConfig = { ...settings.receiptConfig, itemLayout: e.target.value };
                                        setSettings({ ...settings, receiptConfig: newConfig });
                                    }}
                                >
                                    <option value="standard">Standard (Compact)</option>
                                    <option value="table">Table (Name | Qty | Total)</option>
                                </select>
                            </div>
                        </div>

                        <h4 className="text-sm font-bold text-secondary uppercase tracking-wider mb-xs">Live Preview</h4>

                        <div style={{ position: 'relative', background: 'white', color: 'black', padding: '10px', borderRadius: '4px' }}>
                            {/* HTML Preview */}
                            <div
                                className={`receipt-preview receipt-preview-${settings.printWidth}`}
                                style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: '12px' }}
                                dangerouslySetInnerHTML={{ __html: previewReceipt() }}
                            />
                            {/* Paper Tear Effect Bottom */}
                            <div style={{
                                position: 'absolute',
                                bottom: '-4px',
                                left: '0',
                                right: '0',
                                height: '4px',
                                background: `radial-gradient(circle, transparent 70%, white 75%)`,
                                backgroundSize: '8px 4px',
                            }}></div>
                        </div>

                        <button
                            className="btn btn-primary btn-test-print"
                            onClick={handleTestPrint}
                        >
                            <span>🖨️</span> Test Print
                        </button>
                    </div>

                    <div className="danger-zone-card">
                        <h4 style={{
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: '#ff4444',
                            marginBottom: '4px',
                            textAlign: 'center'
                        }}>Danger Zone</h4>

                        <button
                            className="btn btn-danger-zone"
                            onClick={() => handleClearData('items')}
                        >
                            <span style={{ marginRight: '8px', fontSize: '1.1em' }}>📦</span> Clear Items
                        </button>

                        <button
                            className="btn btn-danger-zone"
                            onClick={() => handleClearData('drafts')}
                        >
                            <span style={{ marginRight: '8px', fontSize: '1.1em' }}>📝</span> Clear Drafts
                        </button>

                        <button
                            className="btn btn-danger-zone"
                            onClick={() => handleClearData('bills')}
                        >
                            <span style={{ marginRight: '8px', fontSize: '1.1em' }}>📜</span> Clear Records
                        </button>

                        <button
                            className="btn btn-danger-zone"
                            onClick={() => handleClearData('categories')}
                        >
                            <span style={{ marginRight: '8px', fontSize: '1.1em' }}>📂</span> Clear Categories
                        </button>
                    </div>

                    <button
                        className="btn btn-primary btn-save-settings"
                        onClick={handleSaveButton}
                    >
                        {saved ? 'Saved!' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}

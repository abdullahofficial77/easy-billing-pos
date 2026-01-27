import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllItems, getFavoriteItems, addBill, addDraft, getAllSettings, getPendingPayments, updateBill, getDraft, deleteDraft, updateDraft } from '../db/database';
import { formatCurrency, formatUnitType, calculateBillTotal, formatUnitShort } from '../utils/formatters';
import { generateReceiptText, printReceipt } from '../utils/printer';
import Modal from '../components/UI/Modal';

export default function NewBill() {
    const navigate = useNavigate();
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [billItems, setBillItems] = useState([]);
    const [paidAmount, setPaidAmount] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [allItems, setAllItems] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [settings, setSettings] = useState({});
    const [showSearch, setShowSearch] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ open: false, action: null });
    const [expandedWeightItem, setExpandedWeightItem] = useState(null);
    const [billStarted, setBillStarted] = useState(false);
    const [pendingPayments, setPendingPayments] = useState([]);
    const [editingPayment, setEditingPayment] = useState(null);
    const [customItemModal, setCustomItemModal] = useState(false);
    const [customItemData, setCustomItemData] = useState({ name: '', price: '' });
    const [activeDraftId, setActiveDraftId] = useState(null); // Track if we are editing a draft
    const [isSavedOrCancelled, setIsSavedOrCancelled] = useState(false); // Track if we should skip auto-save

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const items = await getAllItems();
        setAllItems(items);
        const favs = await getFavoriteItems();
        setFavorites(favs);
        const sets = await getAllSettings();
        setSettings(sets);
        const pending = await getPendingPayments();
        setPendingPayments(pending);

        // Check for draft to continue
        const draftId = sessionStorage.getItem('continueDraft');
        if (draftId) {
            try {
                const draft = await getDraft(draftId);
                if (draft) {
                    setCustomerName(draft.customerName || '');
                    setCustomerPhone(draft.customerPhone || '');
                    setBillItems(draft.items || []);
                    setBillStarted(true);

                    // Optional: Delete draft after loading it to prevent duplicates?
                    // For now, let's keep it until they save, or just clear the flag.
                    // A better UX might be to delete the old draft when saving the new bill/draft.
                    // But for this "Edit" flow, we usually treat it as resuming.
                }
            } catch (error) {
                console.error("Error loading draft:", error);
            } finally {
                sessionStorage.removeItem('continueDraft');
            }
        }
    };

    // Auto-save draft on unmount or refresh
    useEffect(() => {
        const handleBeforeUnload = async (e) => {
            if (billItems.length > 0 && !isSavedOrCancelled) {
                // We can't await here reliably, but we can try to save synchronously or indicate data loss
                // Better approach: Save on visibility change or component unmount
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // Auto-save on unmount if not saved/cancelled
            // Note: This runs on navigation away too
        };
    }, [billItems, isSavedOrCancelled, customerName, customerPhone, paidAmount, activeDraftId]);

    // Save draft when bill details change (debounced or on effect cleanup)
    useEffect(() => {
        // Return early if no items or already saved/cancelled
        if (billItems.length === 0 || isSavedOrCancelled) return;

        const saveTimer = setTimeout(async () => {
            const draft = {
                id: activeDraftId, // If null, addDraft will generate one. BUT we need to track it.
                customerName: customerName.trim() || 'Walk-in Customer',
                customerPhone: customerPhone.trim(),
                items: billItems,
                totalAmount,
                paidAmount: paid,
                date: Date.now()
            };

            if (activeDraftId) {
                // Update existing
                await updateDraft(draft);
            } else {
                // Create new and set ID so we update it next time
                const newDraft = await addDraft(draft);
                setActiveDraftId(newDraft.id);
            }
        }, 1000); // Debounce 1s

        return () => clearTimeout(saveTimer);
    }, [billItems, customerName, customerPhone, paidAmount, isSavedOrCancelled]);

    // When loading data, if we loaded a draft, set the activeDraftId
    useEffect(() => {
        const draftId = sessionStorage.getItem('continueDraft');
        if (draftId) setActiveDraftId(draftId);
    }, []);

    // Search results - show 5 items on focus, filter when typing
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) {
            // Show more items (50) for browsing inventory
            return allItems.slice(0, 50);
        }
        const query = searchQuery.toLowerCase();
        return allItems.filter(item =>
            item.name.toLowerCase().includes(query) ||
            (item.category && item.category.toLowerCase().includes(query))
        ).slice(0, 50);
    }, [searchQuery, allItems]);

    // Calculate totals
    const totalAmount = calculateBillTotal(billItems);
    const paid = parseFloat(paidAmount) || 0;
    const remainingAmount = Math.max(0, totalAmount - paid);

    const addToBill = (item) => {
        const existing = billItems.find(bi => bi.id === item.id);
        if (existing) {
            updateQuantity(item.id, existing.quantity + 1);
        } else {
            setBillItems([...billItems, { ...item, quantity: 1, overridePrice: null }]);
        }
        setSearchQuery('');
        setShowSearch(false);
    };

    const updateQuantity = (itemId, newQty) => {
        if (newQty < 0.05) return; // Allow chitang (0.0625)
        setBillItems(billItems.map(item =>
            item.id === itemId ? { ...item, quantity: newQty } : item
        ));
    };

    const updatePrice = (itemId, newPrice) => {
        setBillItems(billItems.map(item =>
            item.id === itemId ? { ...item, overridePrice: parseFloat(newPrice) || null } : item
        ));
    };

    const removeItem = (itemId) => {
        setBillItems(billItems.filter(item => item.id !== itemId));
    };

    const handleCancelBill = () => {
        setConfirmModal({
            open: true,
            action: 'cancel',
            title: 'Cancel Bill?',
            message: 'Are you sure you want to cancel? This will discard all current changes.'
        });
    };

    const confirmCancel = async () => {
        setIsSavedOrCancelled(true); // Prevent auto-save
        resetBill();
        navigate('/'); // Go back to landing
        setConfirmModal({ open: false });
    };

    const handleSaveBill = async () => {
        if (billItems.length === 0) {
            alert('Please add at least one item');
            return;
        }

        setIsSavedOrCancelled(true); // Prevent auto-save

        const bill = {
            customerName: customerName.trim() || 'Walk-in Customer',
            customerPhone: customerPhone.trim(),
            items: billItems,
            totalAmount,
            paidAmount: paid,
            remainingAmount
        };

        const savedBill = await addBill(bill);

        // If this was a draft, delete it now that it's a real bill
        if (activeDraftId) {
            await deleteDraft(activeDraftId);
        }

        setConfirmModal({ open: true, action: 'saved', bill: savedBill });
    };

    const handleSaveDraft = async () => {
        setIsSavedOrCancelled(true); // Prevent auto-save (we are saving manually)
        const draft = {
            id: activeDraftId, // Update if exists
            customerName: customerName.trim() || 'Walk-in Customer',
            customerPhone: customerPhone.trim(),
            items: billItems,
            totalAmount,
            paidAmount: paid
        };

        if (activeDraftId) {
            await updateDraft(draft);
        } else {
            await addDraft(draft);
        }

        resetBill();
        navigate('/drafts');
    };

    const handlePrint = async () => {
        const receiptText = generateReceiptText(confirmModal.bill, settings, settings.printerSize || '58');
        printReceipt(receiptText);
        resetBill();
        setConfirmModal({ open: false });
    };

    const resetBill = () => {
        setCustomerName('');
        setCustomerPhone('');
        setBillItems([]);
        setPaidAmount('');
        setBillStarted(false);
        setActiveDraftId(null);
        setIsSavedOrCancelled(false);
        loadData(); // Refresh pending payments and other data
    };

    // Handle payment update
    const handleUpdatePayment = async (newPaidAmount) => {
        if (editingPayment) {
            const updatedBill = {
                ...editingPayment,
                paidAmount: parseFloat(newPaidAmount) || 0,
                remainingAmount: Math.max(0, editingPayment.totalAmount - (parseFloat(newPaidAmount) || 0))
            };
            await updateBill(updatedBill);
            setEditingPayment(null);
            loadData();
        }
    };

    const handleAddCustomItem = () => {
        if (!customItemData.name || !customItemData.price) return;

        const newItem = {
            id: 'custom-' + Date.now(),
            name: customItemData.name,
            price: parseFloat(customItemData.price),
            unitType: 'piece',
            isCustom: true,
            quantity: 1
        };

        addToBill(newItem);
        setCustomItemModal(false);
        setCustomItemData({ name: '', price: '' });
    };

    // Landing screen - shown before starting a bill
    if (!billStarted) {
        return (
            <div className="new-bill-page" style={{
                padding: '16px',
                /* Ensure strictly safe top padding (Status Bar is usually 24px-48px) */
                /* Parent has 16px padding, so we add more to clear the ~40px status bar area */
                paddingTop: '32px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden' // Prevent outer scroll
            }}>
                {/* Pending Payments Section - Now on Top */}
                {pendingPayments.length > 0 && (
                    <div style={{
                        background: 'var(--color-warning-light)',
                        border: '1px solid var(--color-warning)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px',
                        marginBottom: '10px',
                        flexShrink: 1, // Allow shrinking
                        minHeight: 0, // Enable flex scrolling
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden' // Contain child scroll
                    }}>
                        <h3 style={{
                            color: 'var(--color-warning)',
                            fontSize: '0.9rem',
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexShrink: 0
                        }}>
                            ⚠️ Pending Payments ({pendingPayments.length})
                        </h3>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            overflowY: 'auto', // Scrollable content
                            paddingRight: '4px', // Space for scrollbar
                            flex: 1, // Take available height
                            minHeight: 0 // Allow shrinking
                        }}>
                            {pendingPayments.map(bill => (
                                <div key={bill.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'var(--color-bg-card)',
                                    padding: '12px',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.85rem',
                                    flexShrink: 0 // Prevent squishing
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>{bill.customerName}</div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                                            Total: {formatCurrency(bill.totalAmount)} | Paid: {formatCurrency(bill.paidAmount)}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ color: 'var(--color-warning)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                            {formatCurrency(bill.remainingAmount)}
                                        </span>
                                        <button
                                            onClick={() => setEditingPayment(bill)}
                                            style={{
                                                padding: '6px 12px',
                                                fontSize: '0.75rem',
                                                background: 'var(--color-accent)',
                                                border: 'none',
                                                borderRadius: '6px',
                                                color: 'white',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Start New Bill Section - Now at Bottom */}
                {/* Start New Bill Section - Now at Bottom */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: '10px',
                    marginTop: 'auto', // Push to bottom (redundant with flex:1 above but good backup)
                    marginBottom: '10px',
                    flexShrink: 0 // Don't shrink buttons
                }}>
                    <div className="action-buttons-group">
                        <button
                            className="btn btn-primary"
                            onClick={() => setBillStarted(true)}
                        >
                            + Start New Bill
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setBillStarted(true);
                                setCustomItemModal(true);
                            }}
                        >
                            + Add Custom Item
                        </button>
                    </div>
                </div>

                {/* Edit Payment Modal */}
                <Modal
                    isOpen={!!editingPayment}
                    onClose={() => setEditingPayment(null)}
                    title="Update Payment"
                    footer={
                        <>
                            <button className="btn btn-secondary" onClick={() => setEditingPayment(null)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleUpdatePayment(document.getElementById('edit-paid-amount').value)}
                            >
                                Save
                            </button>
                        </>
                    }
                >
                    {editingPayment && (
                        <div>
                            <p style={{ marginBottom: '8px' }}><strong>{editingPayment.customerName}</strong></p>
                            <p style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
                                Total: {formatCurrency(editingPayment.totalAmount)} |
                                Due: <span style={{ color: 'var(--color-warning)' }}>{formatCurrency(editingPayment.remainingAmount)}</span>
                            </p>
                            <div className="input-group">
                                <label className="input-label">Paid Amount</label>
                                <input
                                    id="edit-paid-amount"
                                    type="number"
                                    className="input"
                                    defaultValue={editingPayment.paidAmount}
                                    style={{ fontSize: '1rem' }}
                                />
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        );
    }

    return (
        <div className="new-bill-page" style={{ paddingBottom: '100px' }}>
            {/* Custom Item Modal */}
            <Modal
                isOpen={customItemModal}
                onClose={() => setCustomItemModal(false)}
                title="Add Custom Item"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setCustomItemModal(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleAddCustomItem}>Add to Bill</button>
                    </>
                }
            >
                <div className="input-group mb-md">
                    <label className="input-label">Item Name</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="e.g. Service Charge"
                        value={customItemData.name}
                        onChange={(e) => setCustomItemData({ ...customItemData, name: e.target.value })}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">Price</label>
                    <input
                        type="number"
                        className="input"
                        placeholder="0"
                        value={customItemData.price}
                        onChange={(e) => setCustomItemData({ ...customItemData, price: e.target.value })}
                    />
                </div>
            </Modal>

            {/* Header with Draft/Save buttons */}
            <div className="page-header sticky-header" style={{
                position: 'sticky',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                minHeight: '60px',
                minHeight: '60px',
            }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '1.25rem', margin: 0 }}>New Bill</h1>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-danger btn-sm" onClick={handleCancelBill} style={{ padding: '6px 10px' }}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleSaveDraft}
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                        Draft
                    </button>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleSaveBill}
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                        Save
                    </button>
                </div>
            </div>

            {/* Totals Bar - Compact Grid */}
            <div className="bill-summary-bar" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                padding: '10px 12px',
                background: 'var(--color-bg-card)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '12px',
                fontSize: '0.85rem'
            }
            }>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-muted">Total</span>
                    <span className="font-bold text-success">{formatCurrency(totalAmount)}</span>
                </div>
                <div
                    onClick={() => document.getElementById('paid-amount-input').focus()}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-muted">Items</span>
                    <span className="font-bold">{billItems.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-muted">Remaining</span>
                    <span className={`font-bold ${remainingAmount > 0 ? 'text-warning' : ''}`}>{formatCurrency(remainingAmount)}</span>
                </div>
                <div
                    onClick={() => document.getElementById('paid-amount-input').focus()}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '4px 8px',
                        cursor: 'text'
                    }}
                >
                    <span className="text-muted">Paid</span>
                    <input
                        id="paid-amount-input"
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        placeholder="0"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-success)',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            textAlign: 'right',
                            width: '100%',
                            outline: 'none',
                            marginLeft: '8px'
                        }}
                    />
                </div>
            </div >

            {/* Customer Info - Compact Row */}
            < div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                    type="text"
                    className="input"
                    placeholder="Customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
                />
                <input
                    type="tel"
                    className="input"
                    placeholder="Phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    style={{ width: '35%', padding: '6px 10px', fontSize: '0.85rem' }}
                />
            </div >

            {/* Favorites */}
            {
                favorites.length > 0 && (
                    <div className="favorites-bar">
                        {favorites.map(item => (
                            <button
                                key={item.id}
                                className="favorite-chip"
                                onClick={() => addToBill(item)}
                            >
                                ⭐ {item.name}
                            </button>
                        ))}
                    </div>
                )
            }

            {/* Search Items */}
            <div className="input-group mb-md" style={{ position: 'relative' }}>
                <input
                    type="text"
                    className="input input-search"
                    placeholder="Search items... (click to see all)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSearch(true)}
                    onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                    style={{ paddingRight: '140px' }} // Make room for the button
                />

                {/* Custom Item Button - Quick Access */}
                <button
                    className="btn btn-primary btn-sm"
                    style={{
                        position: 'absolute',
                        right: '4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        zIndex: 10,
                        boxShadow: 'none',
                        borderRadius: 'var(--radius-sm)',
                        whiteSpace: 'nowrap',
                        background: 'var(--color-accent)',
                        border: 'none',
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault(); // Prevent input blur
                        setCustomItemModal(true);
                    }}
                >
                    + Custom Item
                </button>

                {showSearch && (
                    <div className="search-results" style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        marginTop: '4px',
                        maxHeight: '250px',
                        overflowY: 'auto',
                        zIndex: 100, // Ensure it floats above content
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        {searchResults.length > 0 ? (
                            searchResults.map(item => (
                                <div
                                    key={item.id}
                                    className="search-item"
                                    onClick={() => addToBill(item)}
                                    style={{
                                        padding: '8px 12px',
                                        borderBottom: '1px solid var(--color-border-light)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div className="search-item-name" style={{ fontWeight: 500 }}>{item.name}</div>
                                        <div className="search-item-info" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {formatUnitType(item.unitType, item.customUnit)}
                                            {item.category && ` • ${item.category}`}
                                        </div>
                                    </div>
                                    <div className="search-item-price" style={{ fontWeight: 'bold', color: 'var(--color-accent)' }}>
                                        {formatCurrency(item.price)}
                                    </div>
                                </div>
                            ))
                        ) : searchQuery ? (
                            <div className="empty-state" style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                <p>No items found for "{searchQuery}"</p>
                            </div>
                        ) : allItems.length === 0 ? (
                            <div className="empty-state" style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                <p>No items yet. Add items first.</p>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            {/* Bill Items */}
            {
                billItems.length === 0 ? (
                    <div className="empty-state">
                        <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6" />
                            <path d="M12 18v-6" />
                            <path d="M9 15h6" />
                        </svg>
                        <p className="empty-state-title">No items added</p>
                        <p>Search and add items to create a bill</p>
                    </div>
                ) : (
                    <div className="bill-items">
                        {billItems.map(item => {
                            const price = item.overridePrice ?? item.price;
                            const itemTotal = price * item.quantity;
                            const unit = formatUnitShort(item.unitType, item.customUnit);

                            return (
                                <div key={item.id} className="bill-item">
                                    <div className="bill-item-header">
                                        <div>
                                            <div className="bill-item-name">{item.name}</div>
                                            <div className="bill-item-price">
                                                {formatCurrency(item.price)}/{unit || 'unit'}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {item.unitType === 'kg' && (
                                                <button
                                                    onClick={() => setExpandedWeightItem(
                                                        expandedWeightItem === item.id ? null : item.id
                                                    )}
                                                    style={{
                                                        padding: '4px 8px',
                                                        fontSize: '0.7rem',
                                                        background: expandedWeightItem === item.id ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                                                        border: '1px solid var(--color-border)',
                                                        borderRadius: '4px',
                                                        color: 'var(--color-text-primary)',
                                                        cursor: 'pointer'
                                                    }}
                                                    title="Weight options"
                                                >
                                                    ⚖️
                                                </button>
                                            )}
                                            <button
                                                className="bill-item-remove"
                                                onClick={() => removeItem(item.id)}
                                                style={{ padding: '4px 8px' }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>

                                    {/* Weight unit quick buttons - collapsible */}
                                    {item.unitType === 'kg' && expandedWeightItem === item.id && (
                                        <div className="weight-units" style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '4px',
                                            marginBottom: '8px',
                                            padding: '6px',
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: '6px'
                                        }}>
                                            {[
                                                { label: 'چٹانگ', value: 0.0625 },
                                                { label: 'آدھا پاؤ', value: 0.125 },
                                                { label: 'ایک پاؤ', value: 0.25 },
                                                { label: 'آدھا کلو', value: 0.5 },
                                                { label: 'تین پاؤ', value: 0.75 },
                                                { label: '1 کلو', value: 1 },
                                                { label: '1.5 کلو', value: 1.5 },
                                                { label: '2 کلو', value: 2 },
                                            ].map(w => (
                                                <button
                                                    key={w.value}
                                                    onClick={() => {
                                                        updateQuantity(item.id, w.value);
                                                        setExpandedWeightItem(null);
                                                    }}
                                                    style={{
                                                        padding: '4px 6px',
                                                        fontSize: '0.7rem',
                                                        background: item.quantity === w.value ? 'var(--color-accent)' : 'var(--color-bg-card)',
                                                        border: '1px solid var(--color-border)',
                                                        borderRadius: '4px',
                                                        color: 'var(--color-text-primary)',
                                                        cursor: 'pointer',
                                                        fontFamily: 'var(--font-urdu), sans-serif',
                                                        direction: 'rtl'
                                                    }}
                                                >
                                                    {w.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="bill-item-controls">
                                        <div className="qty-control">
                                            <button
                                                className="qty-btn"
                                                onClick={() => {
                                                    if (item.unitType === 'kg') {
                                                        const WEIGHT_UNITS = [0.0625, 0.125, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5];
                                                        const current = item.quantity;
                                                        // Find closest value
                                                        let closestIndex = -1;
                                                        let minDiff = Infinity;

                                                        WEIGHT_UNITS.forEach((val, idx) => {
                                                            const diff = Math.abs(val - current);
                                                            if (diff < minDiff) {
                                                                minDiff = diff;
                                                                closestIndex = idx;
                                                            }
                                                        });

                                                        // If we are exactly on a unit, move back. If we are "between" units or slightly off, 
                                                        // we usually want to snap to the previous one, unless we are extremely close to one.
                                                        // But simplified: just find closest and decrement index.

                                                        // Exception: if current is > max, just subtract 0.5 or 1? Let's stick to the list or simple substraction above list.
                                                        if (closestIndex > 0) {
                                                            updateQuantity(item.id, WEIGHT_UNITS[closestIndex - 1]);
                                                        } else {
                                                            // If at bottom, stay or go smaller? 
                                                            // The list starts at 0.0625. Let's simplpy stop there or allow smaller steps if manually entered.
                                                            // User said "switch between these items", so we stick to the items.
                                                            updateQuantity(item.id, WEIGHT_UNITS[0]);
                                                        }
                                                    } else {
                                                        updateQuantity(item.id, item.quantity - 1);
                                                    }
                                                }}
                                            >
                                                −
                                            </button>
                                            <input
                                                type="number"
                                                className="qty-value"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 1)}
                                                min="0.0625"
                                                step={item.unitType === 'kg' ? '0.25' : '1'}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'inherit',
                                                    width: '60px',
                                                    textAlign: 'center'
                                                }}
                                            />
                                            <button
                                                className="qty-btn"
                                                onClick={() => {
                                                    if (item.unitType === 'kg') {
                                                        const WEIGHT_UNITS = [0.0625, 0.125, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5];
                                                        const current = item.quantity;
                                                        let closestIndex = -1;
                                                        let minDiff = Infinity;

                                                        WEIGHT_UNITS.forEach((val, idx) => {
                                                            const diff = Math.abs(val - current);
                                                            if (diff < minDiff) {
                                                                minDiff = diff;
                                                                closestIndex = idx;
                                                            }
                                                        });

                                                        if (closestIndex < WEIGHT_UNITS.length - 1) {
                                                            updateQuantity(item.id, WEIGHT_UNITS[closestIndex + 1]);
                                                        } else {
                                                            // If at end of list implementation, just add 1
                                                            updateQuantity(item.id, current + 1);
                                                        }
                                                    } else {
                                                        updateQuantity(item.id, item.quantity + 1);
                                                    }
                                                }}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-sm">
                                            <input
                                                type="number"
                                                placeholder="Override"
                                                value={item.overridePrice ?? ''}
                                                onChange={(e) => updatePrice(item.id, e.target.value)}
                                                style={{
                                                    width: '70px',
                                                    padding: '6px',
                                                    background: 'var(--color-bg-secondary)',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: '6px',
                                                    color: 'inherit',
                                                    fontSize: '0.875rem'
                                                }}
                                            />
                                            <span className="bill-item-total">{formatCurrency(itemTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            }

            {/* Removed bill-footer - now at top */}

            {/* Confirmation Modal */}
            <Modal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal({ ...confirmModal, open: false })}
                title={confirmModal.title || "Bill Saved"}
                footer={
                    confirmModal.action === 'saved' ? (
                        <>
                            <button className="btn btn-secondary" onClick={() => {
                                resetBill();
                                setConfirmModal({ open: false });
                            }}>
                                Close
                            </button>
                            <button className="btn btn-primary" onClick={handlePrint}>
                                🖨️ Print Receipt
                            </button>
                        </>
                    ) : confirmModal.action === 'cancel' ? (
                        <>
                            <button className="btn btn-secondary" onClick={() => setConfirmModal({ open: false })}>
                                Go Back
                            </button>
                            <button className="btn btn-danger" onClick={confirmCancel}>
                                Discard Changes
                            </button>
                        </>
                    ) : null
                }
            >
                {confirmModal.action === 'saved' ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
                        <p className="text-success font-bold" style={{ fontSize: '1.2rem' }}>Bill Saved Successfully!</p>
                        <p style={{ marginTop: '8px' }}>Total Amount: {formatCurrency(confirmModal.bill?.totalAmount || 0)}</p>
                    </div>
                ) : (
                    <p>{confirmModal.message}</p>
                )}
            </Modal>
        </div >
    );
}

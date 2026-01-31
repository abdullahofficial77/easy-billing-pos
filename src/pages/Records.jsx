import { useState, useEffect } from 'react';
import { getAllBills, getBillsByDateRange, getBillsByCustomer, getBill, getAllSettings } from '../db/database';
import { formatDateTime, formatDate, formatCurrency, formatBillNumber, getStartOfDay, getEndOfDay, getYesterdayRange, formatUnitShort } from '../utils/formatters';
import { generateReceiptText, printReceipt } from '../utils/printer';
import { generateModernReceiptHTML } from '../utils/receiptTemplates';
import { shareReceiptAsPDF } from '../utils/pdf';
import { DEFAULT_SETTINGS } from '../utils/defaultSettings';

// ...

const handleShare = async () => {
    if (selectedBill) {
        try {
            const width = settings.printWidth || '58mm';
            // Use Modern Template for PDF
            const receiptText = generateModernReceiptHTML(selectedBill, settings, width);
            await shareReceiptAsPDF(receiptText, width);
        } catch (error) {
            console.error('Share failed:', error);
            alert('Failed to share PDF');
        }
    }
};
import Modal from '../components/UI/Modal';

const RECORDS_PER_PAGE = 15;

export default function Records() {
    const [bills, setBills] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [selectedBill, setSelectedBill] = useState(null);
    const [settings, setSettings] = useState({});

    useEffect(() => {
        loadSettings();
        loadBills();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filter, dateFrom, dateTo, customerSearch]);

    const loadSettings = async () => {
        const sets = await getAllSettings();
        setSettings({ ...DEFAULT_SETTINGS, ...sets });
    };

    const loadBills = async () => {
        const allBills = await getAllBills();
        setBills(allBills);
    };

    const applyFilters = async () => {
        let filtered;

        if (filter === 'today') {
            filtered = await getBillsByDateRange(getStartOfDay(), getEndOfDay());
        } else if (filter === 'yesterday') {
            const { start, end } = getYesterdayRange();
            filtered = await getBillsByDateRange(start, end);
        } else if (filter === 'custom' && dateFrom && dateTo) {
            const start = getStartOfDay(new Date(dateFrom));
            const end = getEndOfDay(new Date(dateTo));
            filtered = await getBillsByDateRange(start, end);
        } else if (customerSearch.trim()) {
            filtered = await getBillsByCustomer(customerSearch);
        } else {
            filtered = await getAllBills();
        }

        setBills(filtered);
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(bills.length / RECORDS_PER_PAGE);
    const paginatedBills = bills.slice(
        (currentPage - 1) * RECORDS_PER_PAGE,
        currentPage * RECORDS_PER_PAGE
    );

    const handlePrint = () => {
        if (selectedBill) {
            const width = settings.printWidth || '58mm';

            // Pass full config to printer to ensure all sections (like Shop Info) render correctly
            const config = settings.receiptConfig || {};
            const receiptText = generateReceiptText(
                selectedBill,
                settings,
                width,
                config.itemLayout || 'table',
                config.labels || {},
                config // content/sections config
            );
            printReceipt(receiptText, width);
        }
    };

    const handleShare = async () => {
        if (selectedBill) {
            try {
                const width = settings.printWidth || '58mm';
                const receiptText = generateReceiptText(selectedBill, settings, width);
                await shareReceiptAsPDF(receiptText, width);
            } catch (error) {
                console.error('Share failed:', error);
                alert('Failed to share PDF');
            }
        }
    };



    return (
        <div>
            <div className="page-header sticky-header">
                <div>
                    <h1 className="page-title">Records</h1>
                    <p className="page-subtitle">{bills.length} bills</p>
                </div>
            </div>



            {/* Filters */}
            <div className="filter-bar">
                <button
                    className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => { setFilter('all'); setCustomerSearch(''); }}
                >
                    All
                </button>
                <button
                    className={`filter-chip ${filter === 'today' ? 'active' : ''}`}
                    onClick={() => { setFilter('today'); setCustomerSearch(''); }}
                >
                    Today
                </button>
                <button
                    className={`filter-chip ${filter === 'yesterday' ? 'active' : ''}`}
                    onClick={() => { setFilter('yesterday'); setCustomerSearch(''); }}
                >
                    Yesterday
                </button>
                <button
                    className={`filter-chip ${filter === 'custom' ? 'active' : ''}`}
                    onClick={() => setFilter('custom')}
                >
                    Date Range
                </button>
            </div>

            {/* Date Range Picker */}
            {filter === 'custom' && (
                <div className="flex gap-sm mb-md">
                    <input
                        type="date"
                        className="input"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                    />
                    <input
                        type="date"
                        className="input"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                    />
                </div>
            )}

            {/* Customer Search */}
            <div className="input-group mb-md">
                <input
                    type="text"
                    className="input input-search"
                    placeholder="Search by customer name..."
                    value={customerSearch}
                    onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        if (e.target.value) setFilter('');
                    }}
                />
            </div>

            {/* Bills List */}
            {paginatedBills.length === 0 ? (
                <div className="empty-state">
                    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 3v18h18" />
                        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                    </svg>
                    <p className="empty-state-title">No records found</p>
                    <p>Bills will appear here after saving</p>
                </div>
            ) : (
                <div>
                    {paginatedBills.map(bill => (
                        <div
                            key={bill.id}
                            className="record-card"
                            onClick={() => setSelectedBill(bill)}
                        >
                            <div className="record-header">
                                <span className="record-date">{formatDateTime(bill.date)}</span>
                                <span className="record-bill-no">#{formatBillNumber(bill.billNumber)}</span>
                            </div>
                            <div className="record-customer">{bill.customerName}</div>
                            <div className="record-amounts">
                                <span className="record-amount">
                                    <span className="record-amount-label">Total:</span>
                                    <span className="font-semibold">{formatCurrency(bill.totalAmount)}</span>
                                </span>
                                <span className="record-amount">
                                    <span className="record-amount-label">Paid:</span>
                                    <span>{formatCurrency(bill.paidAmount)}</span>
                                </span>
                                {bill.remainingAmount > 0 && (
                                    <span className="record-amount">
                                        <span className="record-amount-label">Due:</span>
                                        <span className="record-amount-value remaining">{formatCurrency(bill.remainingAmount)}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-sm mt-lg">
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                            >
                                Previous
                            </button>
                            <span className="flex items-center text-secondary">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Bill Detail Modal */}
            <Modal
                isOpen={!!selectedBill}
                onClose={() => setSelectedBill(null)}
                title={`Bill #${formatBillNumber(selectedBill?.billNumber || 0)}`}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={handleShare}>
                            📄 Save/Share PDF
                        </button>
                        <button className="btn btn-primary" onClick={handlePrint}>
                            🖨️ Thermal Print
                        </button>
                    </>
                }
            >
                {selectedBill && (
                    <div>
                        <div className="mb-md">
                            <div className="text-secondary text-sm">{formatDateTime(selectedBill.date)}</div>
                            <div className="font-bold text-lg">{selectedBill.customerName}</div>
                        </div>

                        <div className="mb-md">
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px dashed var(--color-border)' }}>
                                        <th style={{ textAlign: 'left', padding: '4px 0', width: '45%' }}>Items</th>
                                        <th style={{ textAlign: 'center', padding: '4px 0', width: '25%' }}>Qty</th>
                                        <th style={{ textAlign: 'right', padding: '4px 0', width: '30%' }}>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedBill.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={{ textAlign: 'left', padding: '4px 0' }}>{item.name}</td>
                                            <td style={{ textAlign: 'center', padding: '4px 0' }}>
                                                {item.quantity}{formatUnitShort(item.unitType, item.customUnit)}
                                            </td>
                                            <td style={{ textAlign: 'right', padding: '4px 0' }}>
                                                {formatCurrency((item.overridePrice ?? item.price) * item.quantity)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                            <div className="flex justify-between mb-sm">
                                <span>Total</span>
                                <span className="font-bold">{formatCurrency(selectedBill.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between mb-sm">
                                <span>Paid</span>
                                <span>{formatCurrency(selectedBill.paidAmount)}</span>
                            </div>
                            {selectedBill.remainingAmount > 0 && (
                                <div className="flex justify-between text-warning font-bold">
                                    <span>Remaining</span>
                                    <span>{formatCurrency(selectedBill.remainingAmount)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

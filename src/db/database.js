import { openDB } from 'idb';

const DB_NAME = 'easy-billing-pos';
const DB_VERSION = 2;

// Initialize database
export async function initDB() {
    const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Settings store
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }

            // Items store
            if (!db.objectStoreNames.contains('items')) {
                const itemStore = db.createObjectStore('items', { keyPath: 'id' });
                itemStore.createIndex('name', 'name');
                itemStore.createIndex('category', 'category');
                itemStore.createIndex('isFavorite', 'isFavorite');
            }

            // Categories store
            if (!db.objectStoreNames.contains('categories')) {
                const categoryStore = db.createObjectStore('categories', { keyPath: 'id' });
                categoryStore.createIndex('name', 'name', { unique: true });
            }

            // Bills store
            if (!db.objectStoreNames.contains('bills')) {
                const billStore = db.createObjectStore('bills', { keyPath: 'id' });
                billStore.createIndex('date', 'date');
                billStore.createIndex('customerName', 'customerName');
            }

            // Drafts store
            if (!db.objectStoreNames.contains('drafts')) {
                const draftStore = db.createObjectStore('drafts', { keyPath: 'id' });
                draftStore.createIndex('date', 'date');
            }
        }
    });
    return db;
}

// Generate unique ID
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ============================================
// Settings Operations
// ============================================

export async function getSetting(key) {
    const db = await initDB();
    const result = await db.get('settings', key);
    return result?.value;
}

export async function setSetting(key, value) {
    const db = await initDB();
    await db.put('settings', { key, value });
}

export async function getAllSettings() {
    const db = await initDB();
    const settings = await db.getAll('settings');
    return settings.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
    }, {});
}

export async function saveSettings(settings) {
    const db = await initDB();
    const tx = db.transaction('settings', 'readwrite');
    for (const [key, value] of Object.entries(settings)) {
        await tx.store.put({ key, value });
    }
    await tx.done;
}

// ============================================
// Categories Operations
// ============================================

export async function getAllCategories() {
    const db = await initDB();
    return db.getAll('categories');
}

export async function addCategory(name) {
    const db = await initDB();
    const id = name.toLowerCase().replace(/\s+/g, '-');
    const newCategory = {
        id,
        name: name.trim(),
        createdAt: Date.now()
    };
    await db.add('categories', newCategory);
    return newCategory;
}

export async function updateCategory(id, newName) {
    const db = await initDB();
    const category = await db.get('categories', id);
    if (!category) throw new Error('Category not found');

    const updated = {
        ...category,
        name: newName.trim(),
        updatedAt: Date.now()
    };
    await db.put('categories', updated);
    return updated;
}

export async function deleteCategory(id) {
    const db = await initDB();
    await db.delete('categories', id);
}

// ============================================
// Items Operations
// ============================================

export async function getAllItems() {
    const db = await initDB();
    return db.getAll('items');
}

export async function getItem(id) {
    const db = await initDB();
    return db.get('items', id);
}

export async function addItem(item) {
    const db = await initDB();
    const newItem = {
        ...item,
        id: generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    await db.add('items', newItem);
    return newItem;
}

export async function updateItem(item) {
    const db = await initDB();
    const updated = {
        ...item,
        updatedAt: Date.now()
    };
    await db.put('items', updated);
    return updated;
}

export async function deleteItem(id) {
    const db = await initDB();
    await db.delete('items', id);
}

export async function getFavoriteItems() {
    const db = await initDB();
    const items = await db.getAll('items');
    return items.filter(item => item.isFavorite);
}

export async function searchItems(query) {
    const db = await initDB();
    const items = await db.getAll('items');
    const lowerQuery = query.toLowerCase();
    return items.filter(item =>
        item.name.toLowerCase().includes(lowerQuery) ||
        (item.category && item.category.toLowerCase().includes(lowerQuery))
    );
}

// ============================================
// Bills Operations
// ============================================

export async function getAllBills() {
    const db = await initDB();
    const bills = await db.getAll('bills');
    return bills.sort((a, b) => b.date - a.date);
}

export async function getBill(id) {
    const db = await initDB();
    return db.get('bills', id);
}

export async function addBill(bill) {
    const db = await initDB();
    const billNumber = await getNextBillNumber();
    const newBill = {
        ...bill,
        id: generateId(),
        billNumber,
        date: Date.now()
    };
    await db.add('bills', newBill);
    return newBill;
}

export async function updateBill(bill) {
    const db = await initDB();
    await db.put('bills', bill);
    return bill;
}

export async function deleteBill(id) {
    const db = await initDB();
    await db.delete('bills', id);
}

export async function getNextBillNumber() {
    const db = await initDB();
    const bills = await db.getAll('bills');
    if (bills.length === 0) return 1;
    const maxNumber = Math.max(...bills.map(b => b.billNumber || 0));
    return maxNumber + 1;
}

export async function getBillsByDateRange(startDate, endDate) {
    const db = await initDB();
    const bills = await db.getAll('bills');
    return bills.filter(bill =>
        bill.date >= startDate && bill.date <= endDate
    ).sort((a, b) => b.date - a.date);
}

export async function getBillsByCustomer(customerName) {
    const db = await initDB();
    const bills = await db.getAll('bills');
    const lowerName = customerName.toLowerCase();
    return bills.filter(bill =>
        bill.customerName.toLowerCase().includes(lowerName)
    ).sort((a, b) => b.date - a.date);
}

export async function getPendingPayments() {
    const db = await initDB();
    const bills = await db.getAll('bills');
    return bills.filter(bill => bill.remainingAmount > 0).sort((a, b) => b.date - a.date);
}

export async function deleteBillsOlderThan(days) {
    const db = await initDB();
    const bills = await db.getAll('bills');
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

    const tx = db.transaction('bills', 'readwrite');
    for (const bill of bills) {
        if (bill.date < cutoff) {
            await tx.store.delete(bill.id);
        }
    }
    await tx.done;
}

export async function deleteBillsByDateRange(startDate, endDate) {
    const db = await initDB();
    const bills = await db.getAll('bills');

    const tx = db.transaction('bills', 'readwrite');
    for (const bill of bills) {
        if (bill.date >= startDate && bill.date <= endDate) {
            await tx.store.delete(bill.id);
        }
    }
    await tx.done;
}

// ============================================
// Drafts Operations
// ============================================

export async function getAllDrafts() {
    const db = await initDB();
    const drafts = await db.getAll('drafts');
    return drafts.sort((a, b) => b.date - a.date);
}

export async function getDraft(id) {
    const db = await initDB();
    return db.get('drafts', id);
}

export async function addDraft(draft) {
    const db = await initDB();
    const newDraft = {
        ...draft,
        id: generateId(),
        date: Date.now()
    };
    await db.add('drafts', newDraft);
    return newDraft;
}

export async function updateDraft(draft) {
    const db = await initDB();
    await db.put('drafts', { ...draft, date: Date.now() });
    return draft;
}

export async function deleteDraft(id) {
    const db = await initDB();
    await db.delete('drafts', id);
}

export async function clearAllDrafts() {
    const db = await initDB();
    const tx = db.transaction('drafts', 'readwrite');
    await tx.store.clear();
    await tx.done;
}

export async function clearAllBills() {
    const db = await initDB();
    const tx = db.transaction('bills', 'readwrite');
    await tx.store.clear();
    await tx.done;
}

export async function clearAllCategories() {
    const db = await initDB();
    const tx = db.transaction('categories', 'readwrite');
    await tx.store.clear();
    await tx.done;
}

export async function clearAllItems() {
    const db = await initDB();
    const tx = db.transaction('items', 'readwrite');
    await tx.store.clear();
    await tx.done;
}

// ============================================
// PIN Operations
// ============================================

const PIN_KEY = 'app_pin';
const DEFAULT_PIN = '1234';

export async function getPIN() {
    const pin = await getSetting(PIN_KEY);
    return pin || DEFAULT_PIN;
}

export async function setPIN(newPin) {
    await setSetting(PIN_KEY, newPin);
}

export async function verifyPIN(inputPin) {
    const storedPin = await getPIN();
    return inputPin === storedPin;
}

// ============================================
// App Initialization
// ============================================

export async function initializeApp() {
    const db = await initDB();

    // Set default settings if not exists
    const settings = await getAllSettings();

    if (!settings.shopName) {
        await setSetting('shopName', 'My Shop');
    }
    if (!settings.shopNameUrdu) {
        await setSetting('shopNameUrdu', 'میری دکان');
    }
    if (!settings.shopPhone) {
        await setSetting('shopPhone', '');
    }
    if (!settings.printerSize) {
        await setSetting('printerSize', '58');
    }
    if (!settings.receiptFooter) {
        await setSetting('receiptFooter', 'Thank You! شکریہ');
    }
    if (!settings.showBillNo) {
        await setSetting('showBillNo', true);
    }
    if (!settings.showTime) {
        await setSetting('showTime', true);
    }
    if (!settings.showTotalItems) {
        await setSetting('showTotalItems', true);
    }

    if (!settings.receiptConfig) {
        await setSetting('receiptConfig', {
            order: ['shopInfo', 'phone', 'customerName', 'dateTime', 'billNumber', 'totalItemsCount', 'itemsTable', 'totals', 'discount', 'netTotal', 'footer'],
            labels: {
                date: 'Date',
                billNo: 'Bill #',
                customer: 'Customer',
                item: 'Item',
                qty: 'Qty',
                total: 'Total',
                discount: 'Discount',
                netTotal: 'Net Total',
                totalItems: 'Total Items',
                footerBranding: 'Designed by Easy Billing POS'
            },
            itemLayout: 'standard', // 'standard', 'table'
            showDiscount: true,
            showNetTotal: true,
            sections: {
                shopInfo: { enabled: true, title: 'Shop Info' },
                phone: { enabled: true, title: 'Phone Number' },
                customerName: { enabled: true, title: 'Customer Name' },
                dateTime: { enabled: true, title: 'Date & Time' },
                billNumber: { enabled: true, title: 'Bill Number' },
                totalItemsCount: { enabled: true, title: 'Total Items Count' },
                itemsTable: { enabled: true, title: 'Items Table' },
                totals: { enabled: true, title: 'Subtotal' },
                discount: { enabled: true, title: 'Discount' },
                netTotal: { enabled: true, title: 'Net Total' },
                footer: { enabled: true, title: 'Footer' }
            }
        });
    }

    return settings;
}

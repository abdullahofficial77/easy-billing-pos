// Format currency (PKR)
export function formatCurrency(amount) {
    return `Rs.${Number(amount).toLocaleString('en-PK', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })}`;
}

// Format date
export function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Format time
export function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Format date and time
export function formatDateTime(timestamp) {
    return `${formatDate(timestamp)}, ${formatTime(timestamp)}`;
}

// Format date for input (YYYY-MM-DD)
export function formatDateForInput(timestamp) {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
}

// Get start of day
export function getStartOfDay(date = new Date()) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start.getTime();
}

// Get end of day
export function getEndOfDay(date = new Date()) {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end.getTime();
}

// Get yesterday's date range
export function getYesterdayRange() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return {
        start: getStartOfDay(yesterday),
        end: getEndOfDay(yesterday)
    };
}

// Format unit type display
export function formatUnitType(unitType, customUnit) {
    const unitLabels = {
        'kg': 'per Kg',
        'packet': 'per Packet',
        'piece': 'per Piece',
        'box': 'per Box',
        'custom': customUnit || 'per Unit'
    };
    return unitLabels[unitType] || unitType;
}

// Format unit short
export function formatUnitShort(unitType, customUnit) {
    const unitLabels = {
        'kg': 'kg',
        'packet': 'pkt',
        'piece': 'pc',
        'box': 'box',
        'custom': customUnit || ''
    };
    return unitLabels[unitType] || '';
}

// Calculate bill total
export function calculateBillTotal(items) {
    return items.reduce((total, item) => {
        const price = item.overridePrice ?? item.price;
        return total + (price * item.quantity);
    }, 0);
}

// Format bill number
export function formatBillNumber(number) {
    return String(number).padStart(4, '0');
}

// Debounce function
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Check if online
export function isOnline() {
    return navigator.onLine;
}

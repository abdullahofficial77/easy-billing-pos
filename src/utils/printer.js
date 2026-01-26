import { formatCurrency } from './formatters';

// Unicode directional marks to fix RTL/LTR mixing
const LTR = '\u200E'; // Left-to-Right mark

export const generateReceiptText = (bill, settings, width = '58mm', itemLayout = 'table', labels = {}, options = {}) => {
    const is58mm = width === '58mm';
    const lineLength = is58mm ? 32 : 48;
    const divider = '-'.repeat(lineLength);

    // Default labels
    const l = {
        customer: labels.customer || 'Customer',
        date: labels.date || 'Date',
        billNo: labels.billNo || 'Bill #',
        totalItems: labels.totalItems || 'Total Items',
        item: labels.item || 'Items',
        qty: labels.qty || 'Qty',
        price: labels.price || 'Price',
        total: labels.total || 'Total',
        discount: labels.discount || 'Discount',
        netTotal: labels.netTotal || 'Net Total',
        footerBranding: labels.footerBranding || ''
    };

    let lines = [];

    // Helper functions
    const center = (str) => {
        // Use Math.round to favor 1 space padding for odd-length near-full strings (e.g. 31/32)
        const padding = Math.max(0, Math.round((lineLength - str.length) / 2));
        return ' '.repeat(padding) + str;
    };

    const leftRight = (left, right) => {
        const space = Math.max(1, lineLength - left.length - right.length);
        return left + ' '.repeat(space) + right;
    };

    const threeCol = (c1, c2, c3) => {
        // Items: 60%, Qty: 20%, Total: 20%
        const col1Width = Math.floor(lineLength * 0.60);
        const col2Width = Math.floor(lineLength * 0.20);
        const col3Width = lineLength - col1Width - col2Width;

        // Truncate and pad columns for alignment
        const col1 = c1.substring(0, col1Width).padEnd(col1Width);
        const col2 = c2.substring(0, col2Width).padEnd(col2Width);
        const col3 = c3.padStart(col3Width);

        // Wrap in LTR mark to prevent RTL reordering
        return LTR + col1 + col2 + col3;
    };

    // Section Renderers
    const renderers = {
        shopInfo: () => {
            // Basic Shop Details (Name + Address)
            if (settings.storeName) lines.push(center(settings.storeName));
            if (settings.address) lines.push(center(settings.address));
        },
        phone: () => {
            // Separate Phone Section
            if (settings.phone) {
                lines.push(center(settings.phone));
                lines.push(''); // Spacing after phone
            }
        },
        customerName: () => {
            if (bill.customerName) lines.push(`${l.customer}: ${bill.customerName}`);
        },
        dateTime: () => {
            lines.push(`${l.date}: ${new Date(bill.date).toLocaleString()}`);
            lines.push(''); // Line space after date
        },
        billNumber: () => {
            lines.push(`${l.billNo}: ${bill.billNumber || bill.id}`);
        },
        totalItemsCount: () => {
            lines.push(`${l.totalItems}: ${bill.items.length}`);
        },
        itemsTable: () => {
            lines.push(divider);
            if (itemLayout === 'table') {
                lines.push(threeCol(l.item, l.qty, l.price));
                lines.push(divider);

                bill.items.forEach(item => {
                    const itemTotal = item.total || (item.price * item.quantity);
                    const qtyStr = item.unitType === 'kg' ? `${item.quantity}kg` :
                        item.unitType === 'gram' ? `${item.quantity}g` :
                            `${item.quantity}pc`;
                    lines.push(threeCol(item.name, qtyStr, String(itemTotal)));
                });
            } else if (itemLayout === '3line') {
                lines.push(center('Items'));
                lines.push(divider);

                bill.items.forEach(item => {
                    const itemTotal = formatCurrency(item.total || (item.price * item.quantity));
                    const qtyStr = item.unitType === 'kg' ? `${item.quantity} kg` :
                        item.unitType === 'gram' ? `${item.quantity} g` :
                            `${item.quantity} pc`;

                    lines.push(LTR + item.name);
                    lines.push(LTR + `  Qty: ${qtyStr} x R.${item.price}`);
                    lines.push(leftRight('  Total:', itemTotal));
                    lines.push('');
                });
            } else {
                bill.items.forEach(item => {
                    const itemTotal = formatCurrency(item.total || (item.price * item.quantity));
                    const qtyStr = item.unitType === 'kg' ? `${item.quantity} kg` :
                        item.unitType === 'gram' ? `${item.quantity} g` :
                            `${item.quantity} pc`;

                    lines.push(LTR + item.name);
                    lines.push(leftRight(`  ${qtyStr} x R.${item.price}`, itemTotal));
                });
            }
            lines.push(divider);
        },
        totals: () => {
            lines.push(leftRight(l.total + ':', 'R.' + bill.total));
        },
        discount: () => {
            if (bill.discount > 0) {
                lines.push(leftRight(l.discount + ':', 'R.' + bill.discount));
            }
        },
        netTotal: () => {
            lines.push(leftRight(l.netTotal + ':', 'R.' + (bill.finalTotal || (bill.total - bill.discount))));
            lines.push(''); // Spacing after net total
        },
        footer: () => {
            lines.push(''); // One line space
            if (settings.footerText) {
                // Ensure text is centered
                lines.push(center(settings.footerText.trim()));
            }
            if (l.footerBranding) {
                lines.push(center(l.footerBranding.trim()));
            }
        }
    };

    // Execute renderers in order
    // Updated default order to include separate Phone, Discount, NetTotal sections
    const defaultOrder = ['shopInfo', 'phone', 'customerName', 'dateTime', 'billNumber', 'totalItemsCount', 'itemsTable', 'totals', 'discount', 'netTotal', 'footer'];
    const order = options.order || defaultOrder;
    const sections = options.sections || {};

    for (let i = 0; i < order.length; i++) {
        const key = order[i];

        // Skip disabled sections
        if (sections[key] && !sections[key].enabled) continue;

        // Special Handling: Smart Merge for Bill Number + Total Items on same line
        // If "Bill Number" is followed immediately by "Total Items Count", merge them.
        if (key === 'billNumber') {
            const nextKey = order[i + 1];
            if (nextKey === 'totalItemsCount' && (!sections[nextKey] || sections[nextKey].enabled)) {

                const billText = `${l.billNo}: ${bill.billNumber || bill.id}`;
                const itemsText = `${l.totalItems}: ${bill.items.length}`;
                lines.push(leftRight(billText, itemsText));

                i++; // Skip separate rendering of Total Items
                continue;
            }
        }

        // Execute standard renderer
        if (renderers[key]) {
            renderers[key]();
        }
    }

    return lines.join('\n');
};

export const printReceipt = (content) => {
    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    // Write content to iframe
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt</title>
            <style>
                @page { margin: 0; size: auto; }
                body {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 12px;
                    line-height: 1.2;
                    padding: 0;
                    margin: 5px;
                    white-space: pre;
                    direction: ltr;
                    width: 100%;
                    color: black;
                }
                @media print {
                    body { padding: 0; margin: 0; }
                    html, body { height: auto; }
                }
            </style>
        </head>
        <body>${content}</body>
        </html>
    `);
    doc.close();

    // Print and cleanup
    iframe.contentWindow.focus();
    setTimeout(() => {
        try {
            iframe.contentWindow.print();
        } catch (e) {
            console.error('Printing failed', e);
        }
        // Remove iframe after sufficient time (1s to allow print dialog to engage)
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    }, 500);
};

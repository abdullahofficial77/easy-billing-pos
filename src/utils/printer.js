import { formatCurrency } from './formatters';

export const generateReceiptText = (bill, settings, width = '58mm', itemLayout = 'table', labels = {}, options = {}) => {
    // Labels
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

    let html = '';

    // Styles handled in printReceipt, here we just structure content
    const centerStyle = 'text-align: center;';
    const leftStyle = 'text-align: left;';
    const rightStyle = 'text-align: right;';
    const rowStyle = 'display: flex; justify-content: space-between; margin-bottom: 2px;';

    // 1. Header Sections
    // Shop Info
    if ((!options.sections?.shopInfo || options.sections.shopInfo.enabled)) {
        if (settings.storeName) html += `<div style="${centerStyle} font-weight: bold; font-size: 1.1em;">${settings.storeName}</div>`;
        if (settings.address) html += `<div style="${centerStyle}">${settings.address}</div>`;
    }
    // Phone
    if ((!options.sections?.phone || options.sections.phone.enabled) && settings.phone) {
        html += `<div style="${centerStyle}">${settings.phone}</div>`;
    }

    html += '<div style="margin-bottom: 8px;"></div>'; // Spacer

    // Customer & Date
    if (!options.sections?.customerName || options.sections.customerName.enabled) {
        if (bill.customerName) html += `<div style="${leftStyle}"><b>${l.customer}:</b> ${bill.customerName}</div>`;
    }
    if (!options.sections?.dateTime || options.sections.dateTime.enabled) {
        const dateStr = bill.date ? new Date(bill.date).toLocaleString() : new Date().toLocaleString();
        html += `<div style="${leftStyle}"><b>${l.date}:</b> ${dateStr}</div>`;
        html += '<div style="margin-bottom: 6px;"></div>'; // Line space
    }

    // Bill # & Total Items (Merged if possible like before, or separate lines)
    // Using simple divs
    // Bill # & Total Items (Merged)
    const showBillNo = !options.sections?.billNumber || options.sections.billNumber.enabled;
    const showItemsCount = !options.sections?.totalItemsCount || options.sections.totalItemsCount.enabled;

    if (showBillNo || showItemsCount) {
        let leftPart = '';
        let rightPart = '';

        if (showBillNo) {
            leftPart = `<b>${l.billNo}:</b> ${bill.billNumber || bill.id || '-'}`;
        }
        if (showItemsCount) {
            rightPart = `<b>${l.totalItems}:</b> ${bill.items ? bill.items.length : 0}`;
        }

        if (showBillNo && showItemsCount) {
            html += `<div style="${rowStyle}"><span>${leftPart}</span><span>${rightPart}</span></div>`;
        } else if (showBillNo) {
            html += `<div style="${leftStyle}">${leftPart}</div>`;
        } else if (showItemsCount) {
            html += `<div style="${rightStyle}">${rightPart}</div>`;
        }
    }

    html += '<hr style="border-top: 1px dashed black; margin: 4px 0;">';

    // 2. Items Table
    if (!options.sections?.itemsTable || options.sections.itemsTable.enabled) {
        html += `<table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
            <thead>
                <tr style="">
                    <th style="${leftStyle} width: 45%; padding-bottom: 4px;">${l.item}</th>
                    <th style="${centerStyle} width: 25%; padding-bottom: 4px;">${l.qty}</th>
                    <th style="${rightStyle} width: 30%; padding-bottom: 4px;">${l.price}</th>
                </tr>
            </thead>
            <tbody>`;

        if (bill.items) {
            bill.items.forEach(item => {
                const itemTotal = item.total || (item.price * item.quantity);
                const qtyStr = item.unitType === 'kg' ? `${item.quantity}kg` :
                    item.unitType === 'gram' ? `${item.quantity}g` :
                        `${item.quantity}`;

                html += `<tr>
                    <td style="${leftStyle} padding: 2px 0;">${item.name}</td>
                    <td style="${centerStyle} padding: 2px 0;">${qtyStr}</td>
                    <td style="${rightStyle} padding: 2px 0;">${itemTotal}</td>
                </tr>`;
            });
        }
        html += `</tbody></table>`;
        html += '<hr style="border-top: 1px dashed black; margin: 4px 0 8px 0;">';
    }

    // 3. Totals
    if (!options.sections?.totals || options.sections.totals.enabled) {
        const total = bill.total !== undefined ? bill.total : bill.totalAmount;
        html += `<div style="${rowStyle}"><b>${l.total}:</b> <span>${formatCurrency(total || 0).replace('Rs ', '')}</span></div>`;
    }
    if ((!options.sections?.discount || options.sections.discount.enabled) && bill.discount > 0) {
        html += `<div style="${rowStyle}"><span>${l.discount}:</span> <span>${formatCurrency(bill.discount).replace('Rs ', '')}</span></div>`;
    }

    // Net Total
    if (!options.sections?.netTotal || options.sections.netTotal.enabled) {
        const total = bill.total !== undefined ? bill.total : bill.totalAmount;
        const final = bill.finalTotal !== undefined ? bill.finalTotal : (bill.remainingAmount !== undefined ? (total - bill.discount) : total);
        const displayTotal = final || (total - (bill.discount || 0)) || 0;

        html += `<div style="${rowStyle} font-weight: bold; font-size: 1.1em; margin-top: 4px;">
            <span>${l.netTotal}:</span> <span>${formatCurrency(displayTotal).replace('Rs ', '')}</span>
        </div>`;
    }

    // 4. Footer
    if (!options.sections?.footer || options.sections.footer.enabled) {
        html += '<br>';
        if (settings.footerText) {
            html += `<div style="${centerStyle} font-size: 0.9em;">${settings.footerText}</div>`;
        }
        if (l.footerBranding) {
            html += `<div style="${centerStyle} font-size: 0.7em; margin-top: 8px; opacity: 0.7;">${l.footerBranding}</div>`;
        }
    }

    return html;
};

export const printReceipt = (content, width = '58mm') => {
    return new Promise((resolve, reject) => {
        try {
            // 1. Create the overlay container
            const overlayId = 'receipt-print-overlay';
            const styleId = 'receipt-print-style';

            // Cleanup existing if any
            const existingOverlay = document.getElementById(overlayId);
            const existingStyle = document.getElementById(styleId);
            if (existingOverlay) existingOverlay.remove();
            if (existingStyle) existingStyle.remove();

            // 2. Create Print Styles
            const cssWidth = width.includes('mm') ? width : `${width}mm`;
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                @media print {
                    body > *:not(#${overlayId}) {
                        display: none !important;
                    }
                    #${overlayId} {
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: ${cssWidth};
                        margin: 0;
                        padding: 0;
                        background: white;
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 12px;
                    }
                    @page {
                        size: ${cssWidth} auto;
                        margin: 0;
                    }
                }
                @media screen {
                    #${overlayId} {
                        display: none; /* Hide on screen */
                    }
                }
            `;
            document.head.appendChild(style);

            // 3. Create Receipt Content Overlay
            const overlay = document.createElement('div');
            overlay.id = overlayId;
            overlay.innerHTML = content;
            document.body.appendChild(overlay);

            // 4. Trigger Print
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                window.print();

                // 5. Cleanup (after print dialog closes)
                // Note: onafterprint support varies, so we use a generous timeout as fallback 
                // or just leave it hidden (display: none on screen)

                // We resolve immediately because window.print() blocks on some browsers but not others
                resolve();

                // Optional: Cleanup after delay
                setTimeout(() => {
                    // We don't remove it immediately to ensure mobile browsers catch it
                    // But we can remove the style and div eventually
                    // document.head.removeChild(style);
                    // document.body.removeChild(overlay);
                }, 2000);
            }, 100);

        } catch (e) {
            console.error('Print error:', e);
            reject(e);
        }
    });
};

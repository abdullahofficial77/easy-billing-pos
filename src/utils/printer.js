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
    return new Promise((resolve) => {
        // Create a hidden iframe
        let iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        // Move strictly off-screen
        iframe.style.top = '-10000px';
        iframe.style.left = '-10000px';
        // Keep non-zero size to ensure render engine acknowledges it (required for some browsers to print)
        iframe.style.width = '1px';
        iframe.style.height = '1px';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        // Ensure width is a valid CSS string
        const cssWidth = width.includes('mm') ? width : `${width}mm`;

        // Write content to iframe
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt</title>
                <style>
                    @page { margin: 0; size: ${cssWidth} auto; }
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 12px;
                        line-height: 1.2;
                        padding: 0 2mm;
                        margin: 0;
                        color: black;
                        background: white;
                        width: ${cssWidth};
                        max-width: ${cssWidth};
                    }
                    table { width: 100%; table-layout: fixed; }
                    /* Force content to fit */
                    * {
                        box-sizing: border-box;
                    }
                    @media print {
                        body { margin: 0; padding: 0 2mm; }
                    }
                </style>
            </head>
            <body>${content}</body>
            </html>
        `);
        doc.close();

        // Print and cleanup
        iframe.onload = () => {
            iframe.contentWindow.focus();
            setTimeout(() => {
                try {
                    iframe.contentWindow.print();
                } catch (e) {
                    console.error('Printing failed', e);
                } finally {
                    resolve();
                    // Remove iframe after a longer delay to ensure print dialog is done
                    setTimeout(() => {
                        if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                        }
                    }, 5000);
                }
            }, 500);
        };

        if (iframe.contentDocument.readyState === 'complete') {
            iframe.onload();
        }
    });
};

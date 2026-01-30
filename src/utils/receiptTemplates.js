import { formatDateTime, formatCurrency, formatBillNumber, formatUnitShort } from './formatters';

export const generateModernReceiptHTML = (bill, settings, width = '58mm') => {
    // Styles matching the Modal UI
    const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const cssWidth = width === '80mm' ? '80mm' : '58mm';

    // Calculate totals
    const total = bill.total !== undefined ? bill.total : bill.totalAmount;
    const final = bill.finalTotal !== undefined ? bill.finalTotal : (bill.remainingAmount !== undefined ? (total - bill.discount) : total);
    const displayTotal = final || (total - (bill.discount || 0)) || 0;

    return `
    <div style="
        font-family: ${fontFamily};
        width: 100%;
        color: #1f2937;
        line-height: 1.5;
        font-size: 14px;
        background: white;
        padding: 16px;
        box-sizing: border-box;
    ">
        <!-- Store Header (Optional) -->
        ${settings.storeName ? `
            <div style="text-align: center; margin-bottom: 4px;">
                <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #111827;">${settings.storeName}</h2>
                ${settings.address ? `<div style="font-size: 12px; color: #4b5563;">${settings.address}</div>` : ''}
                ${settings.phone ? `<div style="font-size: 12px; color: #4b5563;">${settings.phone}</div>` : ''}
            </div>
            <div style="border-bottom: 1px dashed #e5e7eb; margin: 12px 0;"></div>
        ` : ''}

        <!-- Bill Header -->
        <div style="margin-bottom: 16px;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">
                ${formatDateTime(bill.date)}
            </div>
            <div style="font-size: 16px; font-weight: 700; color: #111827;">
                ${bill.customerName || 'Walk-in Customer'}
            </div>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 2px;">
                Bill #${formatBillNumber(bill.billNumber || bill.id || 0)}
            </div>
        </div>

        <!-- Items Table -->
        <div style="margin-bottom: 16px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                    <tr style="border-bottom: 1px dashed #e5e7eb;">
                        <th style="text-align: left; padding: 8px 0; color: #4b5563; font-weight: 600; width: 45%;">Items</th>
                        <th style="text-align: center; padding: 8px 0; color: #4b5563; font-weight: 600; width: 25%;">Qty</th>
                        <th style="text-align: right; padding: 8px 0; color: #4b5563; font-weight: 600; width: 30%;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${bill.items.map(item => `
                        <tr style="border-bottom: 1px solid #f3f4f6;">
                            <td style="text-align: left; padding: 8px 0;">
                                <div style="font-weight: 500; color: #111827;">${item.name}</div>
                            </td>
                            <td style="text-align: center; padding: 8px 0; color: #4b5563;">
                                ${item.quantity}${formatUnitShort(item.unitType, item.customUnit)}
                            </td>
                            <td style="text-align: right; padding: 8px 0; font-weight: 500; color: #111827;">
                                ${formatCurrency((item.overridePrice ?? item.price) * item.quantity)}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Totals Section -->
        <div style="border-top: 2px solid #e5e7eb; padding-top: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #4b5563;">Total</span>
                <span style="font-weight: 700; color: #111827;">${formatCurrency(total)}</span>
            </div>
            
            ${bill.discount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #059669;">
                    <span>Discount</span>
                    <span>-${formatCurrency(bill.discount)}</span>
                </div>
            ` : ''}

            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #4b5563;">Paid</span>
                <span>${formatCurrency(bill.paidAmount)}</span>
            </div>

            ${bill.remainingAmount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-top: 8px; font-weight: 700; color: #d97706;">
                    <span>Remaining</span>
                    <span>${formatCurrency(bill.remainingAmount)}</span>
                </div>
            ` : ''}
        </div>

        <!-- Footer -->
        <div style="margin-top: 24px; text-align: center;">
            <div style="color: #059669; font-weight: 700; font-size: 16px; margin-bottom: 4px;">Thank You!</div>
            ${settings.footerText ? `<div style="font-size: 12px; color: #6b7280;">${settings.footerText}</div>` : ''}
            <div style="font-size: 10px; color: #9ca3af; margin-top: 12px;">Generated via Bazaar POS</div>
        </div>
    </div>
    `;
};

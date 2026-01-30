export const DEFAULT_SETTINGS = {
    storeName: 'My Store',
    address: '',
    phone: '',
    defaultUnit: 'kg',
    showUrdu: true,
    printWidth: '58mm',
    headerText: '',
    footerText: 'Thank you for shopping with us!',
    showLogo: false,
    showTotalItems: true,
    showPhone: true,
    receiptFooter: '',
    receiptConfig: {
        order: ['shopInfo', 'customerName', 'dateTime', 'billNumber', 'totalItemsCount', 'itemsTable', 'totals', 'footer'],
        labels: {
            date: 'Date', billNo: 'Bill #', customer: 'Customer', item: 'Items',
            qty: 'Qty', price: 'Price', total: 'Total', discount: 'Discount', netTotal: 'Net Total',
            totalItems: 'Total Items', footerBranding: 'Designed by Easy Billing POS'
        },
        itemLayout: 'table',
        showDiscount: true,
        showNetTotal: true,
        sections: {
            shopInfo: { enabled: true, title: 'Shop Info' },
            customerName: { enabled: true, title: 'Customer Name' },
            dateTime: { enabled: true, title: 'Date & Time' },
            billNumber: { enabled: true, title: 'Bill Number' },
            phone: { enabled: true, title: 'Phone Number' },
            totalItemsCount: { enabled: true, title: 'Total Items Count' },
            itemsTable: { enabled: true, title: 'Items Table' },
            totals: { enabled: true, title: 'Totals Section' },
            discount: { enabled: true, title: 'Discount' },
            netTotal: { enabled: true, title: 'Net Total' },
            footer: { enabled: true, title: 'Footer' }
        }
    }
};

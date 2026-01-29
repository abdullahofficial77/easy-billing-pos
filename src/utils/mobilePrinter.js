import { printReceipt } from './printer';

/**
 * Mobile-friendly printing utility
 * Now completely simplified to use the main window overlay method
 * which works universally on Web, Android, and iOS.
 */
export const printReceiptMobile = async (htmlContent, width = '58mm') => {
    // The new overlay method in printer.js is robust enough for all platforms.
    // It avoids iframes and external browser calls which cause freezes.
    return printReceipt(htmlContent, width);
};

export const isBrowserPluginAvailable = async () => {
    return true; // Always true effectively since we don't need the plugin anymore
};

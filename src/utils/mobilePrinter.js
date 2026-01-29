import { Capacitor } from '@capacitor/core';
import { printReceipt } from './printer';

/**
 * Mobile-friendly printing utility
 * Opens receipt in native browser for Android/iOS to prevent WebView freezes
 * Falls back to iframe printing on web
 */
export const printReceiptMobile = async (htmlContent, width = '58mm') => {
    const platform = Capacitor.getPlatform();

    // On web, use existing iframe method
    if (platform === 'web') {
        return printReceipt(htmlContent, width);
    }

    // For mobile platforms (Android/iOS)
    try {
        // Dynamically import Browser plugin only when needed (mobile)
        const { Browser } = await import('@capacitor/browser');

        // Ensure width is valid CSS
        const cssWidth = width.includes('mm') ? width : `${width}mm`;

        // Create complete HTML document with proper styling
        const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt</title>
    <style>
        @page { 
            margin: 0; 
            size: ${cssWidth} auto; 
        }
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
        table { 
            width: 100%; 
            table-layout: fixed; 
        }
        * {
            box-sizing: border-box;
        }
        @media print {
            body { 
                margin: 0; 
                padding: 0 2mm; 
            }
        }
        /* Mobile-friendly styles */
        @media screen and (max-width: 600px) {
            body {
                width: 100%;
                max-width: 100%;
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    ${htmlContent}
    <script>
        // Auto-print when page loads (optional)
        window.onload = function() {
            // Give browser time to render
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>`;

        // Create data URL (more reliable than blob URLs on some Android devices)
        const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(fullHtml);

        // Open in native browser
        await Browser.open({
            url: dataUrl,
            presentationStyle: 'popover', // iOS: opens as popover
            toolbarColor: '#000000' // Android: toolbar color
        });

    } catch (error) {
        console.error('Mobile print failed:', error);

        // Fallback: try iframe method even on mobile
        console.warn('Falling back to iframe printing method');
        return printReceipt(htmlContent, width);
    }
};

/**
 * Check if Capacitor Browser plugin is available
 */
export const isBrowserPluginAvailable = async () => {
    try {
        const { Browser } = await import('@capacitor/browser');
        return !!Browser;
    } catch {
        return false;
    }
};

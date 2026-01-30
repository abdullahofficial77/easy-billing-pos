import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

/**
 * Generates a PDF from HTML content and shares it via the native share sheet.
 * On browser, it downloads the file instead.
 * 
 * @param {string} htmlContent - The HTML string of the receipt
 * @param {string} width - Receipt width (e.g., '58mm' or '80mm')
 * @returns {Promise<void>}
 */
export const shareReceiptAsPDF = async (htmlContent, width = '58mm') => {
    // 1. Create a temporary container for the HTML
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = width === '80mm' ? '80mm' : '58mm';
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#000000';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    // Apply basic print styles to the container content
    const style = document.createElement('style');
    style.innerHTML = `
        body { font-family: 'Inter', sans-serif; }
        .receipt-container { padding: 10px; width: 100%; box-sizing: border-box; }
        img { max-width: 100%; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 4px 0; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .border-bottom { border-bottom: 1px dashed #000; }
        .border-top { border-top: 1px dashed #000; }
        .bold { font-weight: bold; }
    `;
    container.appendChild(style);

    try {
        // 2. Generate Canvas from HTML
        const canvas = await html2canvas(container, {
            scale: 2, // Higher scale for better quality
            logging: false,
            useCORS: true,
            backgroundColor: '#ffffff' // Ensure white background
        });

        // 3. Create PDF
        // Standard continuous receipt size simulation
        // We use the canvas dimensions to determine PDF height
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = width === '80mm' ? 80 : 58; // mm
        const pageHeight = (canvas.height * imgWidth) / canvas.width;

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [imgWidth, pageHeight]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, pageHeight);

        // 4. Save and Share
        const fileName = `receipt-${Date.now()}.pdf`;

        if (Capacitor.isNativePlatform()) {
            // Native: Write to filesystem then share
            const pdfBase64 = pdf.output('datauristring').split(',')[1];

            const savedFile = await Filesystem.writeFile({
                path: fileName,
                data: pdfBase64,
                directory: Directory.Cache
            });

            await Share.share({
                title: 'Receipt PDF',
                text: 'Here is your receipt',
                files: [savedFile.uri], // Use 'files' for actual file attachment
                dialogTitle: 'Share Receipt PDF'
            });
        } else {
            // Browser: Just download
            pdf.save(fileName);
        }

    } catch (error) {
        console.error('Error sharing PDF:', error);
        throw error;
    } finally {
        // Cleanup
        document.body.removeChild(container);
    }
};

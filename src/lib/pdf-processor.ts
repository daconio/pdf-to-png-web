import type { PDFDocumentProxy } from 'pdfjs-dist';

// Helper to load pdfjs-dist dynamically
const getPdfJs = async () => {
    // @ts-ignore
    const pdfjs = await import('pdfjs-dist');
    if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }
    return pdfjs;
};

export const loadPDF = async (file: File): Promise<PDFDocumentProxy> => {
    const pdfjs = await getPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    return loadingTask.promise;
};

export const renderPageToBlob = async (
    pdf: PDFDocumentProxy,
    pageNumber: number
): Promise<Blob | null> => {
    const page = await pdf.getPage(pageNumber);

    // Scale 2.0 provides good quality for PNGs
    const scale = 2.0;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) return null;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
        canvasContext: context,
        viewport: viewport,
    };

    // @ts-ignore - Types might be mismatched for RenderParameters
    await page.render(renderContext).promise;

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/png');
    });
};

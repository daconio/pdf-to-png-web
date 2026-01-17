'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { loadPDF, renderPageToBlob, imagesToPDF } from '@/lib/pdf-processor';
import {
  Layout, Images, FileText, CheckCircle, ArrowRight, Download, Github,
  UploadCloud, FileType, FileInput, Cog
} from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

// --- Types ---
type ConversionMode = 'PDF_TO_PNG' | 'PNG_TO_PDF';
type ProcessStatus = 'IDLE' | 'PROCESSING' | 'COMPLETED' | 'ERROR';

interface ProcessedFile {
  name: string;
  url: string;
  blob?: Blob;
}

// --- Components ---

const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const baseStyles = "font-bold border-2 border-black px-6 py-2 transition-all active:translate-y-1 active:shadow-none flex items-center gap-2";
  const variants = {
    primary: "bg-primary text-white shadow-neo hover:-translate-y-1 hover:shadow-neo-lg",
    secondary: "bg-white text-black shadow-neo-sm hover:bg-gray-50"
  };

  return (
    <button className={`${baseStyles} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Card = ({ title, children, className = '' }: any) => (
  <div className={`bg-white border-2 border-black shadow-neo p-0 overflow-hidden ${className}`}>
    <div className="border-b-2 border-black bg-gray-50 px-4 py-2 flex items-center justify-between">
      <span className="font-bold uppercase tracking-wider text-sm">{title}</span>
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full border border-black bg-red-400"></div>
        <div className="w-2 h-2 rounded-full border border-black bg-yellow-400"></div>
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

const Pipeline = ({ status }: { status: ProcessStatus }) => {
  const isProcessing = status === 'PROCESSING';
  const isCompleted = status === 'COMPLETED';

  const steps = [
    { label: 'Input', icon: FileInput, active: true },
    { label: 'Engine', icon: Cog, active: isProcessing || isCompleted, animate: isProcessing },
    { label: 'Result', icon: Download, active: isCompleted },
  ];

  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-300 -z-10 transform -translate-y-1/2"></div>
        <div
          className="absolute top-1/2 left-0 h-1 bg-black -z-10 transform -translate-y-1/2 transition-all duration-700 ease-in-out"
          style={{ width: isCompleted ? '100%' : isProcessing ? '50%' : '0%' }}
        ></div>

        {steps.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center bg-transparent">
            <div className={`
                w-16 h-16 rounded-full border-2 border-black flex items-center justify-center z-10 transition-all duration-300
                ${step.active ? 'bg-primary text-white shadow-neo' : 'bg-white text-gray-400'}
            `}>
              <step.icon className={`w-8 h-8 ${step.animate ? 'animate-spin' : ''}`} />
            </div>
            <span className={`mt-2 font-bold bg-white px-2 border border-black ${step.active ? 'text-black' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Page ---

export default function Home() {
  const [mode, setMode] = useState<ConversionMode>('PDF_TO_PNG');
  const [status, setStatus] = useState<ProcessStatus>('IDLE');
  const [currentProgress, setCurrentProgress] = useState(0);
  const [generatedFiles, setGeneratedFiles] = useState<ProcessedFile[]>([]);

  // Clean up ObjectURLs
  useEffect(() => {
    return () => {
      generatedFiles.forEach(f => URL.revokeObjectURL(f.url));
    };
  }, [generatedFiles]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setStatus('PROCESSING');
    setCurrentProgress(0);
    setGeneratedFiles([]);

    try {
      if (mode === 'PDF_TO_PNG') {
        const file = acceptedFiles[0];
        if (file.type !== 'application/pdf') throw new Error('Invalid file type');

        const pdf = await loadPDF(file);
        const numPages = pdf.numPages;
        const newFiles: ProcessedFile[] = [];

        for (let i = 1; i <= numPages; i++) {
          const blob = await renderPageToBlob(pdf, i);
          if (blob) {
            newFiles.push({
              name: `${file.name.replace('.pdf', '')}_page_${i}.png`,
              url: URL.createObjectURL(blob),
              blob
            });
          }
          setCurrentProgress((i / numPages) * 100);
        }
        setGeneratedFiles(newFiles);
        setStatus('COMPLETED');

      } else { // PNG_TO_PDF
        const validImages = acceptedFiles.filter(f => f.type.startsWith('image/'));
        if (validImages.length === 0) throw new Error('No valid images');

        // Simulate progress
        const interval = setInterval(() => {
          setCurrentProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        const pdfBlob = await imagesToPDF(validImages);
        clearInterval(interval);
        setCurrentProgress(100);

        setGeneratedFiles([{
          name: 'merged_images.pdf',
          url: URL.createObjectURL(pdfBlob),
          blob: pdfBlob
        }]);
        setStatus('COMPLETED');
      }
    } catch (err) {
      console.error(err);
      setStatus('ERROR');
      alert('Error processing files. See console.');
    }
  }, [mode]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: mode === 'PDF_TO_PNG'
      ? { 'application/pdf': ['.pdf'] }
      : { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: mode === 'PNG_TO_PDF',
    disabled: status === 'PROCESSING'
  });

  const handleDownload = (file: ProcessedFile) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen font-sans pb-20">
      {/* Navbar */}
      <nav className="border-b-2 border-black bg-white py-4 px-6 mb-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-white p-1 border-2 border-black shadow-neo-sm">
              <Layout size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tight">ParsePDF</span>
          </div>
          <div className="flex gap-4">
            <a href="https://github.com/daconio/PDF2PNG" target="_blank" rel="noreferrer" className="flex items-center gap-2 font-bold hover:underline">
              <Github size={20} /> GitHub
            </a>
            <div className="hidden md:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 border border-black"></span>
              <span className="text-sm font-bold">Client-Side Only</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero Section */}
        <div className="relative mb-16 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 z-10">
              <div className="inline-block bg-[#FFD700] border-2 border-black px-3 py-1 font-bold text-sm transform -rotate-1 shadow-neo-sm">
                Local Processing • No Uploads
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold leading-none tracking-tight text-gray-900">
                Master Your Documents with <span className="text-primary">Privacy</span>
              </h1>
              <p className="text-xl text-gray-700 font-medium max-w-lg leading-relaxed">
                Convert PDFs to high-quality images or merge photos into documents.
                Everything happens in your browser—your data never leaves your device.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  onClick={() => { setMode('PDF_TO_PNG'); setStatus('IDLE'); setGeneratedFiles([]); }}
                  variant={mode === 'PDF_TO_PNG' ? 'primary' : 'secondary'}
                >
                  <FileText className="w-5 h-5" /> PDF to PNG
                </Button>
                <Button
                  onClick={() => { setMode('PNG_TO_PDF'); setStatus('IDLE'); setGeneratedFiles([]); }}
                  variant={mode === 'PNG_TO_PDF' ? 'primary' : 'secondary'}
                >
                  <Images className="w-5 h-5" /> PNG to PDF
                </Button>
              </div>
            </div>

            {/* Visual Decoration */}
            <div className="relative h-[300px] md:h-[400px] w-full border-2 border-black bg-white shadow-neo-lg overflow-hidden hidden md:block">
              <div className="absolute inset-0 bg-grid-pattern opacity-50"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 text-center">
                <div className="bg-white border-2 border-black p-6 shadow-neo mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400 border border-black"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400 border border-black"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400 border border-black"></div>
                    </div>
                    <div className="font-mono text-xs font-bold">PROCESSOR_V1</div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-100 w-5/6 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex justify-center gap-4">
                  <span className="animate-bounce delay-100 bg-blue-100 border border-black p-2 rounded shadow-neo-sm">📄</span>
                  <span className="animate-bounce delay-200 bg-pink-100 border border-black p-2 rounded shadow-neo-sm">🔄</span>
                  <span className="animate-bounce delay-300 bg-green-100 border border-black p-2 rounded shadow-neo-sm">🖼️</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature/Workspace Area */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-3xl font-bold bg-white inline-block border-2 border-black px-4 py-2 shadow-neo">
              Workspace
            </h2>
            <div className="h-0.5 flex-grow bg-black"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Input Area */}
            <div className="lg:col-span-2">
              <Card title="Input Source">
                {(status === 'IDLE' || status === 'ERROR') ? (
                  <div
                    {...getRootProps()}
                    className={`
                       border-4 border-dashed border-black bg-white p-12 text-center cursor-pointer transition-all
                       hover:bg-gray-50 flex flex-col items-center justify-center h-64
                       ${isDragActive ? 'bg-blue-50 border-primary' : ''}
                     `}
                  >
                    <input {...getInputProps()} />
                    <div className="bg-[#FFDEE2] p-4 rounded-full border-2 border-black mb-4 shadow-neo-sm">
                      {isDragActive ? <FileType className="w-10 h-10 animate-bounce" /> : <UploadCloud className="w-10 h-10" />}
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      {isDragActive ? 'Drop it like it\'s hot!' : 'Drag & Drop files here'}
                    </h3>
                    <p className="text-gray-500 max-w-sm mx-auto font-medium">
                      {mode === 'PDF_TO_PNG'
                        ? 'Upload a single PDF to extract pages as images.'
                        : 'Upload multiple images to merge into a single PDF.'}
                    </p>
                    <span className="mt-4 inline-block bg-black text-white px-3 py-1 text-sm font-bold shadow-neo-sm transform hover:-translate-y-0.5 transition-transform">
                      BROWSE FILES
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 border-4 border-dotted border-gray-300 bg-gray-50">
                    <div className="text-center w-full max-w-xs">
                      <div className="text-4xl mb-4 animate-spin text-center w-full flex justify-center">⚙️</div>
                      <h3 className="text-xl font-bold">Processing Files...</h3>
                      <p className="text-gray-500 font-medium">Crunching data locally.</p>
                      <div className="mt-4 w-full h-4 bg-white border-2 border-black rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${currentProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Pipeline Visualization */}
              <div className="mt-8">
                <Pipeline status={status} />
              </div>
            </div>

            {/* Output List */}
            <div className="lg:col-span-1">
              <Card title="Output Results" className="h-full min-h-[400px]">
                {generatedFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                    <Download size={48} className="mb-4 opacity-20" />
                    <p className="text-center font-medium">Converted files will<br />appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm bg-yellow-200 px-2 border border-black">{generatedFiles.length} File(s) Ready</span>
                      <span className="text-green-600 font-bold flex items-center gap-1 text-sm">
                        <CheckCircle size={14} /> Done
                      </span>
                    </div>

                    {generatedFiles.map((file, idx) => (
                      <div key={idx} className="group flex items-center justify-between p-3 border-2 border-black bg-white hover:bg-gray-50 transition-colors shadow-neo-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 bg-gray-100 border border-black flex items-center justify-center flex-shrink-0 font-mono text-xl">
                            {mode === 'PDF_TO_PNG' ? '🖼️' : '📄'}
                          </div>
                          <div className="flex-col overflow-hidden">
                            <p className="font-bold text-sm truncate w-32 md:w-24 lg:w-32" title={file.name}>{file.name}</p>
                            <p className="text-xs text-gray-500 font-medium">Ready to save</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDownload(file)}
                          className="!px-2 !py-2 !shadow-none hover:bg-gray-200"
                          variant="secondary"
                          title="Download"
                        >
                          <Download size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black bg-white py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="font-bold text-xl mb-2">ParsePDF</p>
          <p className="text-gray-600 font-medium">Built for privacy. Designed for speed.</p>
        </div>
      </footer>
    </div>
  );
}

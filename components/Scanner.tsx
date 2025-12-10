import React, { useState, useRef, useCallback } from 'react';
import { Upload, Scan, AlertTriangle, ShieldCheck, Loader2, Globe, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { analyzeScreenshot } from '../services/geminiService';
import { ScanSession } from '../types';

interface ScannerProps {
  onScanComplete: (session: ScanSession) => void;
}

type ScanMode = 'upload' | 'url';

const Scanner: React.FC<ScannerProps> = ({ onScanComplete }) => {
  const [mode, setMode] = useState<ScanMode>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Shared Analysis Logic ---

  const runAnalysis = async (imageUrl: string, base64Data: string, sourceUrl?: string) => {
     setLoadingStep('Detecting dark patterns...');
     const newSession: ScanSession = {
        id: crypto.randomUUID(),
        imageUrl,
        sourceUrl,
        status: 'analyzing',
        result: null,
        timestamp: Date.now(),
      };

      try {
        const result = await analyzeScreenshot(base64Data);
        
        const completedSession: ScanSession = {
          ...newSession,
          status: 'complete',
          result,
        };
        
        onScanComplete(completedSession);
      } catch (err) {
        console.error(err);
        setError('Analysis failed. The AI could not process this image. Please try again.');
        setIsAnalyzing(false);
        setLoadingStep('');
      }
  };

  // --- File Handling Logic ---

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setLoadingStep('Processing image...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const imageUrl = reader.result as string;
        await runAnalysis(imageUrl, base64Data);
      };
      reader.onerror = () => {
        throw new Error('Failed to read file');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error reading file. Please try another image.');
      setIsAnalyzing(false);
    }
  }, [onScanComplete]);

  // --- URL Handling Logic ---

  const handleUrlScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;

    // Robust URL validation
    let validUrl = urlInput.trim();
    // Remove trailing slash for consistency
    if (validUrl.endsWith('/')) validUrl = validUrl.slice(0, -1);
    
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    try {
      new URL(validUrl);
    } catch (_) {
      setError('Please enter a valid URL (e.g., example.com).');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setLoadingStep('Connecting to website...');

    // Setup AbortController for timeout (20 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      // Use a public screenshot API to get the image blob from the URL
      const screenshotServiceUrl = `https://image.thum.io/get/width/1200/crop/900/noanimate/${validUrl}`;
      
      setLoadingStep('Capturing viewport...');
      
      const response = await fetch(screenshotServiceUrl, { 
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Service returned status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Check for empty or invalid blobs (e.g., 0-byte response)
      if (blob.size < 500) {
        throw new Error('Captured image is too small or invalid.');
      }
      
      setLoadingStep('Analyzing patterns...');

      // Convert Blob to Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          const base64data = reader.result.split(',')[1];
          const imageUrl = reader.result;
          
          await runAnalysis(imageUrl, base64data, validUrl);
        }
      };
      reader.onerror = () => {
         throw new Error('Failed to process captured image.');
      };
      reader.readAsDataURL(blob);

    } catch (err: any) {
      console.error('URL Capture Error:', err);
      setIsAnalyzing(false);
      setLoadingStep('');
      clearTimeout(timeoutId); // Ensure timeout is cleared on error

      // Specific User-Friendly Error Messages
      if (err.name === 'AbortError') {
        setError('The scan timed out. The website is taking too long to load.');
      } else if (!window.navigator.onLine) {
        setError('No internet connection. Please check your network.');
      } else if (err.message.includes('too small') || err.message.includes('invalid')) {
        setError('The website blocked the automated capture or loaded an empty page. Please try uploading a screenshot manually.');
      } else {
        // Fallback for generic fetch errors (CORS, DNS, etc.)
        setError(`Could not access "${new URL(validUrl).hostname}". The site might be private, geo-blocked, or protected. Please use "Upload Screenshot" instead.`);
      }
    }
  };

  // --- UI Handlers ---

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (mode === 'upload' && e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Analyze Interface for Dark Patterns</h2>
        <p className="text-slate-500">Detect behavioral manipulation in screenshots or live websites.</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-6">
        <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
          <button
            onClick={() => { setMode('upload'); setError(null); }}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'upload' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Upload Screenshot</span>
          </button>
          <button
            onClick={() => { setMode('url'); setError(null); }}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'url' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Live URL</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[320px] flex flex-col relative">
        {/* Loading Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <h3 className="text-xl font-bold text-slate-800">{loadingStep}</h3>
            <p className="text-slate-500 mt-1">Our AI is auditing the interface...</p>
          </div>
        )}

        {/* Upload Mode */}
        {mode === 'upload' && (
          <div
            className={`flex-1 flex flex-col items-center justify-center p-12 transition-colors duration-300 ease-in-out cursor-pointer ${
              isDragging ? 'bg-indigo-50 border-2 border-indigo-500 border-dashed' : 'hover:bg-slate-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
             <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileInput}
            />
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <Upload className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Click or drag screenshot here
            </h3>
            <p className="text-slate-400 text-sm max-w-xs text-center">
              Supports PNG, JPG, WebP. Max file size 5MB.
            </p>
          </div>
        )}

        {/* URL Mode */}
        {mode === 'url' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/50">
             <div className="w-full max-w-md">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Scan a Live Website</h3>
                  <p className="text-slate-500 text-sm">We'll capture the viewport and analyze it.</p>
                </div>

                <form onSubmit={handleUrlScan} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LinkIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                    placeholder="example.com/checkout"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!urlInput}
                    className="mt-4 w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    Scan URL
                  </button>
                </form>
             </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-800">Scan Failed</h4>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {!isAnalyzing && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex items-center space-x-2 text-slate-800 font-medium mb-2">
               <ShieldCheck className="w-5 h-5 text-teal-500" />
               <span>Compliance Check</span>
             </div>
             <p className="text-xs text-slate-500">Checks against GDPR, CCPA, and FTC guidelines for deceptive practices.</p>
           </div>
           <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex items-center space-x-2 text-slate-800 font-medium mb-2">
               <AlertTriangle className="w-5 h-5 text-amber-500" />
               <span>Bias Detection</span>
             </div>
             <p className="text-xs text-slate-500">Identifies exploited cognitive biases like scarcity, urgency, and social proof.</p>
           </div>
           <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex items-center space-x-2 text-slate-800 font-medium mb-2">
               <Scan className="w-5 h-5 text-indigo-500" />
               <span>Ethical Redesign</span>
             </div>
             <p className="text-xs text-slate-500">Generates AI-powered suggestions to improve trust without hurting metrics.</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
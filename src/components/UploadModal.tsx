import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  X, 
  FileSpreadsheet, 
  AlertCircle, 
  Download,
  Info,
  Loader2
} from 'lucide-react';
import { parseSalesCsv } from '../utils/csvParser';
import { SaleRecord } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (records: SaleRecord[], fileName: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onDataLoaded,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
      setErrorMsg('Please select a valid CSV file (.csv format).');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const text = await file.text();
      const result = await parseSalesCsv(text);

      if (result.records.length === 0) {
        setErrorMsg('The CSV file appears to be empty or missing recognized sales columns.');
        setLoading(false);
        return;
      }

      onDataLoaded(result.records, file.name);
      setLoading(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(`Failed to parse CSV file: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const downloadSampleTemplate = () => {
    const header = 'Year,Month,Week,Day,Date,Order Number,Customer name,Bar Code,Product name,Color,PRODUCT CATEGORY,QTY,MRP,MRP Value,Scoobies Margin,Retailers Margin,EX-GST Scoobies Margin,Delivery Place,State,Website,Status,Received Payment,Back To School,Zone,Sale Value\n2026,Aug,Week1,1,1/8/2026,16542,Ekta Gupta,SC0000190,Wrapping Sheets (Assorted),Multi,Wrapping Sheets,1,89,89,20,0,16.95,North Delhi,Delhi,Office Website,Dispatched,,With out B2S,North,20';
    const blob = new Blob([header], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sales_report_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-[#2D2A26]/60 backdrop-blur-xs p-4 flex items-start sm:items-center justify-center min-h-screen py-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-[32px] max-w-xl w-full p-7 shadow-2xl border border-[#EBE5D9] relative animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-[#8C8376] hover:text-[#2D2A26] hover:bg-[#F1EDE5] rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-[#E9EFEA] text-[#5F7161] flex items-center justify-center border border-[#C5D5C7]">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#2D2A26] tracking-tight">
              Import Sales Data
            </h3>
            <p className="text-xs text-[#8C8376] font-medium">
              Seamlessly sync your latest CSV.
            </p>
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-[24px] p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-[#5F7161] bg-[#E9EFEA]/60 scale-[0.99]'
              : 'border-[#CEC4B5] hover:border-[#5F7161] bg-[#F9F7F2]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={(e) => e.target.files?.[0] && handleFileProcess(e.target.files[0])}
            className="hidden"
          />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="w-8 h-8 text-[#5F7161] animate-spin mb-2" />
              <p className="text-sm font-bold text-[#2D2A26]">Analyzing & Parsing Sales Data...</p>
              <p className="text-xs text-[#8C8376] mt-1 font-medium">Computing revenue, margins, and trends</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#E9EFEA] text-[#5F7161] flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <p className="text-sm font-extrabold text-[#2D2A26]">
                Drop CSV Here or Click to Browse
              </p>
              <p className="text-xs text-[#8C8376] font-medium mt-1">
                Supports standard comma-separated .csv reports with flexible columns
              </p>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#FAF0E6] border border-[#E8D2C2] text-[#AF8260] text-xs flex items-start gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-[#AF8260] shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Helpful instructions & sample */}
        <div className="mt-5 pt-4 border-t border-[#EBE5D9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#8C8376] font-medium">
          <div className="flex items-center gap-1.5 text-[#433E37]">
            <Info className="w-3.5 h-3.5 text-[#5F7161]" />
            <span>Auto-detects columns.</span>
          </div>
          <button
            onClick={downloadSampleTemplate}
            className="inline-flex items-center gap-1 text-[#AF8260] hover:underline font-bold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Sample CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};

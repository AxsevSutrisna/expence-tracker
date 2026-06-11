import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui';
import { compressImage } from '../../services/imageService';
import { uploadReceiptImage } from '../../services/storageService';
import { supabase } from '../../lib/supabase';

export function ReceiptScanner({ onScanSuccess }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Clean up object URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Create a local preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
    setError(null);
    setSuccess(false);
  };

  const handleProcessWithAI = async () => {
    if (!selectedFile) return;

    setIsScanning(true);
    setError(null);

    try {
      // 1. Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Anda harus login untuk menggunakan fitur ini');

      // 2. Compress image
      const { file: compressedFile, base64, mimeType } = await compressImage(selectedFile, 1200, 1200, 0.7);

      // 3. Process concurrently: Upload to storage & Call AI Edge Function
      const uploadPromise = uploadReceiptImage(compressedFile, user.id).catch(err => {
        console.error("Failed to upload image:", err);
        return null; // Don't fail the whole process if upload fails
      });

      const aiPromise = supabase.functions.invoke('process-receipt', {
        body: { imageBase64: base64, mimeType }
      });

      const [receiptUrl, { data: aiData, error: aiError }] = await Promise.all([uploadPromise, aiPromise]);

      if (aiError) throw new Error(aiError.message || 'Gagal menganalisis setruk');
      if (aiData?.error) throw new Error(aiData.error);

      // 4. Send data back to parent component
      onScanSuccess({
        ...aiData,
        receiptUrl
      });

      setSuccess(true);
      setPreviewUrl(null); // Hide preview after success
      setSelectedFile(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Scanning error:", err);
      setError(err.message || 'Terjadi kesalahan saat memproses setruk');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancelPreview = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full mb-4">
      <input 
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      {!previewUrl ? (
        <Button 
          type="button" 
          onClick={handleClick}
          disabled={isScanning}
          className="w-full flex items-center justify-center gap-2"
          style={{ 
            height: '48px',
            backgroundColor: success ? '#A7F3D0' : '#86EFAC', // Brutalist vibrant green
            color: '#064E3B',
            border: '3px solid #000000',
            boxShadow: '4px 4px 0px #000000',
            borderRadius: '4px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
          }}
        >
          {success ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Berhasil Di-scan!</span>
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              <span className="font-bold">Scan Setruk (AI)</span>
            </>
          )}
        </Button>
      ) : (
        <div className="preview-container border-3 border-black p-3 bg-[#fdfaf6] rounded-md" style={{ border: '3px solid black', boxShadow: '4px 4px 0px black' }}>
          <p className="text-sm font-bold mb-2 text-center">Evaluasi Foto Setruk</p>
          <img 
            src={previewUrl} 
            alt="Preview Setruk" 
            className="w-full h-48 object-contain bg-gray-100 border-2 border-black mb-3 rounded"
          />
          <div className="flex gap-2">
            <Button 
              type="button" 
              onClick={handleClick}
              disabled={isScanning}
              className="flex-1 flex items-center justify-center gap-1"
              style={{
                backgroundColor: '#f3f4f6',
                border: '2px solid black',
                boxShadow: isScanning ? 'none' : '2px 2px 0px black',
                color: 'black',
                fontWeight: 'bold',
                transform: isScanning ? 'translate(2px, 2px)' : 'none'
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Ganti
            </Button>
            <Button 
              type="button" 
              onClick={handleProcessWithAI}
              disabled={isScanning}
              className="flex-[2] flex items-center justify-center gap-1"
              style={{
                backgroundColor: isScanning ? '#f3f4f6' : '#86EFAC',
                border: '2px solid black',
                boxShadow: isScanning ? 'none' : '2px 2px 0px black',
                color: isScanning ? '#9ca3af' : '#064E3B',
                fontWeight: 'bold',
                transform: isScanning ? 'translate(2px, 2px)' : 'none'
              }}
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Proses AI
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center gap-1 p-2 bg-red-50 border-2 border-black rounded" style={{ boxShadow: '2px 2px 0px black' }}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

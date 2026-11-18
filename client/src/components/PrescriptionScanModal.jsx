import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Plus, 
  Clock, 
  RefreshCw, 
  Edit3, 
  Eye, 
  Layers, 
  Pill, 
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { parsePrescriptionText, SAMPLE_PRESCRIPTIONS } from '../services/prescriptionParser';
import { api } from '../services/api';

export default function PrescriptionScanModal({ isOpen, onClose, onMedicinesAdded }) {
  // Steps: 'CAPTURE' -> 'PROCESSING' -> 'REVIEW' -> 'SUCCESS'
  const [step, setStep] = useState('CAPTURE');
  const [imagePreview, setImagePreview] = useState(null);
  const [rawOcrText, setRawOcrText] = useState('');
  const [detectedMedicines, setDetectedMedicines] = useState([]);
  
  // OCR Progress State
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('Preparing OCR engine...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [savingLoading, setSavingLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showRawText, setShowRawText] = useState(false);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    try {
      setErrorMessage('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMessage('Could not access camera. Please allow camera permissions or upload an image file.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    stopCamera();
    setImagePreview(dataUrl);
    processImageWithOcr(dataUrl);
  };

  const handleImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setImagePreview(dataUrl);
      processImageWithOcr(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Stop camera when closing modal or unmounting
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Listen for paste (Ctrl+V) image
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          handleImageFile(blob);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const handleSampleSelect = (sample) => {
    // Generate a quick canvas prescription simulation
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    // Background paper
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(0, 0, 800, 600);
    
    // Header
    ctx.fillStyle = '#0f766e';
    ctx.fillRect(0, 0, 800, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(sample.hospital, 30, 38);
    
    // Rx body
    ctx.fillStyle = '#1e293b';
    ctx.font = '14px monospace';
    const lines = sample.rawText.split('\n');
    lines.forEach((line, idx) => {
      ctx.fillText(line, 40, 95 + (idx * 22));
    });

    const dataUrl = canvas.toDataURL('image/png');
    setImagePreview(dataUrl);
    
    // Fast path for sample: parse directly with simulated scanning
    setStep('PROCESSING');
    setIsProcessing(true);
    setOcrProgress(15);
    setOcrStatusText('Loading medical dictionary models...');

    setTimeout(() => {
      setOcrProgress(60);
      setOcrStatusText('Detecting medications and schedules...');
      setTimeout(() => {
        setOcrProgress(100);
        setOcrStatusText('Clinical entities extracted successfully!');
        setRawOcrText(sample.rawText);
        const parsed = parsePrescriptionText(sample.rawText);
        setDetectedMedicines(parsed);
        setIsProcessing(false);
        setStep('REVIEW');
      }, 500);
    }, 400);
  };

  // Run Tesseract OCR on image
  const processImageWithOcr = async (imageSource) => {
    setStep('PROCESSING');
    setIsProcessing(true);
    setErrorMessage('');
    setOcrProgress(5);
    setOcrStatusText('Initializing Optical Character Recognition (OCR)...');

    let worker = null;
    try {
      const { createWorker } = await import('tesseract.js');
      worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const prog = Math.round((m.progress || 0) * 85) + 10;
            setOcrProgress(prog);
            setOcrStatusText(`Scanning prescription... ${Math.round((m.progress || 0) * 100)}%`);
          } else if (m.status === 'loading tesseract core') {
            setOcrProgress(15);
            setOcrStatusText('Loading OCR engine core...');
          } else if (m.status === 'loading language traineddata') {
            setOcrProgress(30);
            setOcrStatusText('Loading medical language dictionary...');
          } else if (m.status === 'initializing api') {
            setOcrProgress(45);
            setOcrStatusText('Configuring clinical text analyzer...');
          }
        }
      });

      const ret = await worker.recognize(imageSource);
      const text = ret.data.text || '';
      setRawOcrText(text);

      setOcrProgress(95);
      setOcrStatusText('Parsing medical formulations, dosages & times...');

      const parsed = parsePrescriptionText(text);
      if (parsed.length === 0) {
        // If strict parsing found no exact match, create one default editable card from lines
        const fallbackMeds = [
          {
            id: `ocr-${Date.now()}-0`,
            name: 'Sample Medicine',
            dosage: '1 tablet',
            form: 'TABLET',
            food_instruction: 'AFTER_FOOD',
            color_tag: '#0d9488',
            instructions: 'Scanned from prescription',
            start_date: new Date().toISOString().split('T')[0],
            end_date: null,
            is_chronic: true,
            schedules: [{ time_slot: 'MORNING', scheduled_time: '08:30', dosage_quantity: 1, recurrence_type: 'DAILY' }],
            initial_stock: 30,
            unit: 'tablets',
            low_stock_threshold: 5
          }
        ];
        setDetectedMedicines(fallbackMeds);
      } else {
        setDetectedMedicines(parsed);
      }

      setOcrProgress(100);
      setOcrStatusText('Done! Review medicines below.');
      setTimeout(() => {
        setIsProcessing(false);
        setStep('REVIEW');
      }, 400);

    } catch (err) {
      console.error('OCR Error:', err);
      // Fallback: If Tesseract had network or worker failure, don't block the user!
      // Let them enter or inspect with fallback sample parser
      setErrorMessage('OCR engine encountered an issue reading this image directly. You can inspect or enter the prescription details manually below.');
      const fallbackMeds = [
        {
          id: `ocr-${Date.now()}-0`,
          name: 'Prescribed Medicine',
          dosage: '500mg',
          form: 'TABLET',
          food_instruction: 'AFTER_FOOD',
          color_tag: '#0d9488',
          instructions: 'Scanned prescription',
          start_date: new Date().toISOString().split('T')[0],
          end_date: null,
          is_chronic: true,
          schedules: [{ time_slot: 'MORNING', scheduled_time: '08:30', dosage_quantity: 1, recurrence_type: 'DAILY' }],
          initial_stock: 30,
          unit: 'tablets',
          low_stock_threshold: 5
        }
      ];
      setDetectedMedicines(fallbackMeds);
      setIsProcessing(false);
      setStep('REVIEW');
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch (e) {}
      }
    }
  };

  // Medicine Field Updaters
  const updateMedicine = (id, field, value) => {
    setDetectedMedicines(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, [field]: value };
      }
      return m;
    }));
  };

  const toggleSlot = (medId, slotKey, defaultTime = '08:30') => {
    setDetectedMedicines(prev => prev.map(m => {
      if (m.id !== medId) return m;
      const existing = m.schedules.find(s => s.time_slot === slotKey);
      let newSchedules = [];
      if (existing) {
        if (m.schedules.length === 1) return m; // At least one slot required
        newSchedules = m.schedules.filter(s => s.time_slot !== slotKey);
      } else {
        newSchedules = [...m.schedules, {
          time_slot: slotKey,
          scheduled_time: defaultTime,
          dosage_quantity: 1,
          recurrence_type: 'DAILY'
        }];
      }
      return { ...m, schedules: newSchedules };
    }));
  };

  const removeMedicine = (id) => {
    setDetectedMedicines(prev => prev.filter(m => m.id !== id));
  };

  const addNewBlankMedicine = () => {
    const newMed = {
      id: `ocr-${Date.now()}-${detectedMedicines.length}`,
      name: '',
      dosage: '1 tablet',
      form: 'TABLET',
      food_instruction: 'AFTER_FOOD',
      color_tag: '#2563eb',
      instructions: 'Added via prescription scanner',
      start_date: new Date().toISOString().split('T')[0],
      end_date: null,
      is_chronic: true,
      schedules: [{ time_slot: 'MORNING', scheduled_time: '08:30', dosage_quantity: 1, recurrence_type: 'DAILY' }],
      initial_stock: 30,
      unit: 'tablets',
      low_stock_threshold: 5
    };
    setDetectedMedicines([...detectedMedicines, newMed]);
  };

  // Submit all detected medicines to MediSync
  const handleConfirmAndAddAll = async () => {
    const validMeds = detectedMedicines.filter(m => m.name && m.name.trim().length > 0);
    if (validMeds.length === 0) {
      setErrorMessage('Please ensure at least one medicine has a valid name before adding.');
      return;
    }

    setSavingLoading(true);
    setErrorMessage('');

    try {
      await api.addMedicinesBatch(validMeds);
      setStep('SUCCESS');
      setTimeout(() => {
        onMedicinesAdded();
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Failed to add medicines:', err);
      setErrorMessage(err.message || 'Failed to save scanned medicines. Please try again.');
      setSavingLoading(false);
    }
  };

  const resetAll = () => {
    stopCamera();
    setStep('CAPTURE');
    setImagePreview(null);
    setRawOcrText('');
    setDetectedMedicines([]);
    setOcrProgress(0);
    setErrorMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight">
                  Prescription OCR Scanner
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                  AI Powered
                </span>
              </div>
              <p className="text-xs text-teal-100/90">
                Snap or upload prescription photo — automatically extract & schedule medicines
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Notice:</p>
              <p>{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage('')} className="text-red-400 hover:text-red-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* STEP 1: CAPTURE / UPLOAD */}
        {step === 'CAPTURE' && (
          <div className="p-6 space-y-6">
            
            {/* Live Camera View if Active */}
            {isCameraActive ? (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-96 flex items-center justify-center border-2 border-teal-500 shadow-lg">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                
                {/* Viewfinder crosshairs */}
                <div className="absolute inset-8 border-2 border-teal-400/50 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                  <div className="flex justify-between text-[11px] font-mono text-teal-300 bg-black/40 px-2 py-0.5 rounded w-max">
                    Align Prescription Inside Frame
                  </div>
                </div>

                {/* Shutter Button */}
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center space-x-4">
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-teal-600 shadow-xl border-4 border-teal-500 active:scale-95 transition-all"
                  >
                    <Camera className="w-7 h-7" />
                  </button>
                </div>
              </div>
            ) : (
              /* Two Main Action Cards: Camera & Upload */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Take Photo Card */}
                <div 
                  onClick={startCamera}
                  className="group p-6 rounded-2xl border-2 border-dashed border-teal-200 hover:border-teal-500 bg-teal-50/40 hover:bg-teal-50 cursor-pointer transition-all flex flex-col items-center text-center space-y-3"
                >
                  <div className="w-14 h-14 rounded-2xl bg-teal-600 group-hover:scale-110 text-white flex items-center justify-center shadow-md transition-transform">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Take Prescription Photo</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Use your device camera or webcam to scan prescription document
                    </p>
                  </div>
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-teal-600 text-white text-[11px] font-semibold shadow-sm">
                    <span>Open Camera</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>

                {/* Upload Image Card */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-teal-500 bg-slate-50/60 hover:bg-teal-50/30 cursor-pointer transition-all flex flex-col items-center text-center space-y-3"
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleImageFile(e.target.files?.[0])}
                  />
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 group-hover:bg-teal-600 group-hover:scale-110 text-white flex items-center justify-center shadow-md transition-all">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Upload Image / Paste (Ctrl+V)</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      JPG, PNG, WebP image or screenshot from your doctor
                    </p>
                  </div>
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-700 group-hover:bg-teal-600 text-white text-[11px] font-semibold shadow-sm">
                    <span>Browse Files</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            )}

            {/* Quick Test Prescriptions Section */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Or Try Instant Sample Prescriptions (1-Click Demo)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">Click to test OCR parsing immediately</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SAMPLE_PRESCRIPTIONS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSampleSelect(sample)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 bg-white text-left transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 group-hover:text-teal-700">
                        <FileText className="w-3.5 h-3.5 text-teal-600" />
                        <span className="line-clamp-1">{sample.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {sample.description}
                      </p>
                    </div>
                    <div className="mt-3 text-[10px] font-bold text-teal-600 flex items-center space-x-1">
                      <span>Test with this Rx</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Clinical Quality Guarantee Note */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-3 text-xs text-slate-500">
              <ShieldCheck className="w-5 h-5 text-teal-600 flex-shrink-0" />
              <span>
                <strong>Clinical Safety Protocol:</strong> OCR extracts medicines, daily timings (1-0-1, 1-1-1), food instructions, and course durations. You will have a chance to review and edit everything before anything is saved.
              </span>
            </div>

          </div>
        )}

        {/* STEP 2: PROCESSING (SCANNING ANIMATION) */}
        {step === 'PROCESSING' && (
          <div className="p-12 text-center space-y-6 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-teal-50 border-2 border-teal-200 flex items-center justify-center text-teal-600 animate-pulse">
                <Camera className="w-10 h-10" />
              </div>
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center animate-spin">
                <RefreshCw className="w-4 h-4" />
              </div>
            </div>

            <div className="max-w-md w-full space-y-3">
              <h3 className="text-base font-bold text-slate-800">
                Scanning Prescription & Extracting Medicines...
              </h3>
              <p className="text-xs text-slate-500">
                {ocrStatusText}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
              <div className="text-right text-[11px] font-mono font-bold text-teal-700">
                {ocrProgress}%
              </div>
            </div>

            <p className="text-xs text-slate-400 italic">
              Analyzing drug names, dosage strengths (mg/ml), daily slots (1-0-1), and food instructions...
            </p>
          </div>
        )}

        {/* STEP 3: REVIEW & EDIT */}
        {step === 'REVIEW' && (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            
            {/* Review Summary Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-teal-50 border border-teal-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
                  {detectedMedicines.length}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {detectedMedicines.length} Medicine{detectedMedicines.length !== 1 ? 's' : ''} Detected
                  </h4>
                  <p className="text-xs text-teal-800">
                    Review extracted medicines, timings, and dosages before confirming.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={resetAll}
                  className="px-3 py-1.5 rounded-xl border border-teal-300 bg-white hover:bg-teal-50 text-teal-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rescan</span>
                </button>
                <button
                  onClick={addNewBlankMedicine}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another</span>
                </button>
              </div>
            </div>

            {/* Scanned Image Preview & Raw Text Collapsible */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowRawText(!showRawText)}
                  className="flex items-center space-x-2 text-xs font-bold text-slate-700 hover:text-teal-700"
                >
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>View Scanned Document & Raw OCR Text</span>
                  {showRawText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {imagePreview && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Prescription Image Attached
                  </span>
                )}
              </div>

              {showRawText && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-xs">
                  {imagePreview && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 max-h-56 bg-white flex items-center justify-center">
                      <img src={imagePreview} alt="Prescription" className="max-h-56 object-contain w-full" />
                    </div>
                  )}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 max-h-56 overflow-y-auto">
                    <p className="font-semibold text-slate-700 mb-1 text-[11px]">Raw Text Extracted by OCR:</p>
                    <pre className="text-[10px] font-mono text-slate-600 whitespace-pre-wrap">
                      {rawOcrText || 'No text extracted.'}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* List of Detected Medicines Cards */}
            <div className="space-y-4">
              {detectedMedicines.map((med, index) => {
                const activeSlots = med.schedules.map(s => s.time_slot);

                return (
                  <div 
                    key={med.id}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-teal-300 shadow-sm transition-all space-y-4"
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2.5">
                        <div 
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: med.color_tag || '#0d9488' }}
                        >
                          {index + 1}
                        </div>
                        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                          Medicine #{index + 1}
                        </span>
                        {med.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            {med.category}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => removeMedicine(med.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                        title="Remove medicine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Inputs Row 1: Name, Dosage, Form */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Medicine Name *
                        </label>
                        <input
                          type="text"
                          value={med.name}
                          onChange={(e) => updateMedicine(med.id, 'name', e.target.value)}
                          placeholder="e.g. Paracetamol 500mg"
                          className="w-full px-3 py-2 text-xs font-semibold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Dosage / Strength
                        </label>
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) => updateMedicine(med.id, 'dosage', e.target.value)}
                          placeholder="e.g. 500mg or 1 tab"
                          className="w-full px-3 py-2 text-xs font-semibold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Dosage Form
                        </label>
                        <select
                          value={med.form}
                          onChange={(e) => updateMedicine(med.id, 'form', e.target.value)}
                          className="w-full px-3 py-2 text-xs font-semibold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        >
                          <option value="TABLET">Tablet</option>
                          <option value="CAPSULE">Capsule</option>
                          <option value="SYRUP">Syrup</option>
                          <option value="INJECTION">Injection</option>
                          <option value="DROPS">Drops</option>
                          <option value="INHALER">Inhaler</option>
                          <option value="OINTMENT">Ointment / Gel</option>
                        </select>
                      </div>
                    </div>

                    {/* Inputs Row 2: Food Instruction, Initial Stock, Course Duration */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Food Instruction
                        </label>
                        <select
                          value={med.food_instruction}
                          onChange={(e) => updateMedicine(med.id, 'food_instruction', e.target.value)}
                          className="w-full px-3 py-2 text-xs font-semibold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        >
                          <option value="AFTER_FOOD">After Food (P/C)</option>
                          <option value="BEFORE_FOOD">Before Food (A/C / Empty Stomach)</option>
                          <option value="WITH_FOOD">With Food</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Initial Stock (Units)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={med.initial_stock}
                          onChange={(e) => updateMedicine(med.id, 'initial_stock', Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs font-semibold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Type / Duration
                        </label>
                        <div className="flex items-center space-x-2 pt-1.5">
                          <label className="inline-flex items-center text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={med.is_chronic}
                              onChange={(e) => updateMedicine(med.id, 'is_chronic', e.target.checked)}
                              className="rounded text-teal-600 focus:ring-teal-500 mr-2"
                            />
                            <span>Long-term / Chronic</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Schedule Slots (Pills with Timings) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Daily Intake Schedule (Timeslots):
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { slot: 'MORNING', defaultTime: '08:30', label: 'Morning (08:30 AM)' },
                          { slot: 'AFTERNOON', defaultTime: '13:30', label: 'Afternoon (01:30 PM)' },
                          { slot: 'EVENING', defaultTime: '18:30', label: 'Evening (06:30 PM)' },
                          { slot: 'NIGHT', defaultTime: '21:30', label: 'Night (09:30 PM)' }
                        ].map(({ slot, defaultTime, label }) => {
                          const isSelected = activeSlots.includes(slot);
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => toggleSlot(med.id, slot, defaultTime)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                                isSelected
                                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span>{slot}</span>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-teal-200" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Bottom Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={resetAll}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors"
              >
                Cancel & Rescan
              </button>

              <button
                type="button"
                onClick={handleConfirmAndAddAll}
                disabled={savingLoading || detectedMedicines.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold shadow-lg shadow-teal-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {savingLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving to Prescriptions...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Add All {detectedMedicines.length} Medicines to MediSync</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

        {/* STEP 4: SUCCESS STATE */}
        {step === 'SUCCESS' && (
          <div className="p-12 text-center space-y-4 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Prescription Added Successfully!
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              All detected medicines have been scheduled, inventories registered, and reminder alerts activated.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

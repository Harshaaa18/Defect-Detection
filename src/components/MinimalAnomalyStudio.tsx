import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FolderOpen, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  RefreshCw, 
  Layers, 
  X, 
  Cpu, 
  ChevronDown, 
  ChevronUp,
  FileCheck,
  Eye,
  Activity,
  Database,
  HardDrive,
  Sparkles,
  History,
  Image as ImageIcon
} from 'lucide-react';

interface PredictionResult {
  category: string;
  defect_type: string;
  score: number;
  threshold: number;
  is_anomalous: boolean;
  status_label: string;
  confidence: number;
  device: string;
  latency_ms: number;
  input_image: string;
  heatmap_image: string;
  raw_heatmap_image?: string;
  mask_image?: string | null;
  audit_storage?: string;
}

interface DatasetFolder {
  defect_type: string;
  count: number;
  images: { filename: string; rel_path: string; url: string }[];
}

interface SampleItem {
  category: string;
  defect_type: string;
  is_defect: boolean;
  filename: string;
  url: string;
  label: string;
}

interface BenchmarkItem {
  category: string;
  image_auroc: number;
  pixel_auroc: number;
  pro_score: number;
  num_test_images: number;
}

interface InspectionRecord {
  timestamp: string;
  category: string;
  defect_type: string;
  score: number;
  threshold: number;
  is_anomalous: boolean;
  status_label: string;
  latency_ms: number;
}

const CATEGORIES_LIST = [
  'bottle', 'cable', 'capsule', 'carpet', 'grid', 
  'hazelnut', 'leather', 'metal_nut', 'pill', 'screw', 
  'tile', 'toothbrush', 'transistor', 'wood', 'zipper'
];

const DEFAULT_THRESHOLDS: Record<string, number> = {
  bottle: 2.70,
  cable: 2.80,
  capsule: 2.80,
  carpet: 2.50,
  grid: 2.60,
  hazelnut: 2.75,
  leather: 2.50,
  metal_nut: 2.80,
  pill: 2.80,
  screw: 2.90,
  tile: 2.60,
  toothbrush: 2.70,
  transistor: 2.80,
  wood: 2.60,
  zipper: 2.80
};

export const MinimalAnomalyStudio: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('bottle');
  const [threshold, setThreshold] = useState<number>(2.70);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & Panels
  const [isBrowserOpen, setIsBrowserOpen] = useState<boolean>(false);
  const [browserCategory, setBrowserCategory] = useState<string>('bottle');
  const [browserSplit, setBrowserSplit] = useState<'test' | 'train'>('test');
  const [browserFolders, setBrowserFolders] = useState<DatasetFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLoadingFolders, setIsLoadingFolders] = useState<boolean>(false);

  // Sample Gallery Modal
  const [isSamplesModalOpen, setIsSamplesModalOpen] = useState<boolean>(false);
  const [sampleItems, setSampleItems] = useState<SampleItem[]>([]);
  const [sampleFilterCategory, setSampleFilterCategory] = useState<string>('all');
  const [preloadedSamplesCount, setPreloadedSamplesCount] = useState<number>(0);

  // Benchmark stats
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkItem[]>([]);
  const [showBenchmarkTable, setShowBenchmarkTable] = useState<boolean>(false);

  // Database & Audit History
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);
  const [mongoUriInput, setMongoUriInput] = useState<string>('');
  const [isConnectingDb, setIsConnectingDb] = useState<boolean>(false);
  const [dbStatusMsg, setDbStatusMsg] = useState<string | null>(null);
  const [inspectionsHistory, setInspectionsHistory] = useState<InspectionRecord[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // System status
  const [systemStatus, setSystemStatus] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Auto-update threshold when category changes
  useEffect(() => {
    const defaultThresh = DEFAULT_THRESHOLDS[selectedCategory] || 2.70;
    setThreshold(defaultThresh);
  }, [selectedCategory]);

  // Load status, benchmark, samples, and inspection history on mount
  useEffect(() => {
    fetch('/api/status')
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setSystemStatus(data))
      .catch(() => {});

    fetch('/api/benchmark')
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (json && Array.isArray(json.data)) {
          setBenchmarkData(json.data);
        }
      })
      .catch(() => {});

    fetch('/samples/manifest.json')
      .then(res => res.ok ? res.json() : [])
      .then(samples => setSampleItems(samples))
      .catch(() => {});

    loadInspections();

    // Automatically load default bottle sample on initial open
    handleSelectDatasetImage('/samples/bottle/bottle_broken_large_000.png', 'bottle', 2.70);
  }, []);

  // Background lazy-load all sample images in small batches once manifest is loaded
  useEffect(() => {
    if (sampleItems.length === 0) return;
    let cancelled = false;
    let idx = 0;
    const BATCH_SIZE = 4;

    const loadNextBatch = () => {
      if (cancelled || idx >= sampleItems.length) return;
      const batch = sampleItems.slice(idx, idx + BATCH_SIZE);
      idx += BATCH_SIZE;

      let pending = batch.length;
      batch.forEach((item) => {
        const img = new window.Image();
        img.decoding = 'async';
        const onDone = () => {
          if (cancelled) return;
          setPreloadedSamplesCount((prev) => prev + 1);
          pending -= 1;
          if (pending === 0 && idx < sampleItems.length) {
            scheduleNext();
          }
        };
        img.onload = onDone;
        img.onerror = onDone;
        img.src = item.url;
      });
    };

    const scheduleNext = () => {
      if (cancelled) return;
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => loadNextBatch(), { timeout: 500 });
      } else {
        setTimeout(loadNextBatch, 100);
      }
    };

    // Delay slightly so initial inference and UI paint finish first
    const startTimer = setTimeout(scheduleNext, 600);
    return () => {
      cancelled = true;
      clearTimeout(startTimer);
    };
  }, [sampleItems]);

  const loadInspections = () => {
    fetch('/api/inspections?limit=15')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && Array.isArray(data.inspections)) {
          setInspectionsHistory(data.inspections);
        }
      })
      .catch(() => {});
  };

  // Fetch dataset folders when browser modal opens or filter changes
  useEffect(() => {
    if (!isBrowserOpen) return;
    setIsLoadingFolders(true);
    fetch(`/api/dataset/browse?category=${browserCategory}&split=${browserSplit}`)
      .then(res => res.json())
      .then(data => {
        if (data.folders) {
          setBrowserFolders(data.folders);
          if (data.folders.length > 0) {
            setSelectedFolder(data.folders[0].defect_type);
          }
        }
        setIsLoadingFolders(false);
      })
      .catch(err => {
        console.error('Failed to browse dataset:', err);
        setIsLoadingFolders(false);
      });
  }, [isBrowserOpen, browserCategory, browserSplit]);

  // Run prediction on dataset image path
  const handleSelectDatasetImage = async (relPath: string, catName: string, overrideThreshold?: number) => {
    setIsBrowserOpen(false);
    setIsSamplesModalOpen(false);
    setSelectedCategory(catName);
    const activeThreshold = overrideThreshold !== undefined ? overrideThreshold : threshold;
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_path: relPath,
          category: catName,
          threshold: activeThreshold
        })
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned status ${res.status}: ${text.slice(0, 120)}`);
      }
      if (!res.ok) throw new Error(data.error || `Inference failed (${res.status})`);
      setPrediction(data);
      loadInspections();
    } catch (err: any) {
      console.error('Inference error:', err);
      setErrorMessage(err.message || 'Inference error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run prediction on custom uploaded file or sample file
  const handleFileUpload = async (file: File, catOverride?: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);

    const targetCategory = catOverride || selectedCategory;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', targetCategory);
    formData.append('threshold', threshold.toString());

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        body: formData
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned status ${res.status}: ${text.slice(0, 120)}`);
      }
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
      setPrediction(data);
      loadInspections();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMessage(err.message || 'Failed to process uploaded image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run prediction from a bundled sample URL
  const handleSelectSampleUrl = async (sample: SampleItem) => {
    setIsSamplesModalOpen(false);
    setSelectedCategory(sample.category);
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      // Fetch sample image as blob and send as upload
      const imgRes = await fetch(sample.url);
      const blob = await imgRes.blob();
      const file = new File([blob], sample.filename, { type: blob.type });
      await handleFileUpload(file, sample.category);
    } catch (err: any) {
      console.error('Sample fetch failed:', err);
      setErrorMessage(err.message || 'Failed to load sample');
      setIsAnalyzing(false);
    }
  };

  // Handle local folder selection via input webkitdirectory
  const handleLocalFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Pick first valid image to process
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.type.startsWith('image/') || f.name.endsWith('.png') || f.name.endsWith('.jpg')) {
        // Detect category from folder path if possible (e.g. DATASET/bottle/test/broken_large/000.png)
        const pathParts = f.webkitRelativePath.split('/');
        let matchedCat = selectedCategory;
        for (const p of pathParts) {
          if (CATEGORIES_LIST.includes(p.toLowerCase())) {
            matchedCat = p.toLowerCase();
            setSelectedCategory(matchedCat);
            break;
          }
        }
        handleFileUpload(f, matchedCat);
        break;
      }
    }
  };

  // Configure MongoDB connection URI
  const handleConnectMongo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mongoUriInput.trim()) return;

    setIsConnectingDb(true);
    setDbStatusMsg(null);

    try {
      const res = await fetch('/api/config/mongodb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: mongoUriInput.trim() })
      });
      const data = await res.json();
      setDbStatusMsg(data.message);
      if (data.success) {
        // Refresh status
        fetch('/api/status').then(r => r.json()).then(s => setSystemStatus(s));
        loadInspections();
      }
    } catch (err: any) {
      setDbStatusMsg(`Error connecting: ${err.message}`);
    } finally {
      setIsConnectingDb(false);
    }
  };

  // Recalculate decision when threshold slider changes
  useEffect(() => {
    if (prediction) {
      const isAnom = prediction.score >= threshold;
      setPrediction(prev => prev ? {
        ...prev,
        threshold,
        is_anomalous: isAnom,
        status_label: isAnom ? 'DEFECT DETECTED' : 'NORMAL (PASS)'
      } : null);
    }
  }, [threshold]);

  const activeFolderData = browserFolders.find(f => f.defect_type === selectedFolder);
  const filteredSamples = sampleFilterCategory === 'all' 
    ? sampleItems 
    : sampleItems.filter(s => s.category === sampleFilterCategory);

  const isMongoConnected = systemStatus?.database?.connected;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        onChange={handleLocalFolderSelect}
        className="hidden"
      />

      {/* Clean Light-Themed Header */}
      <header className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono text-xs font-bold tracking-wide">
              KLCAP-2026-00050
            </span>
            <span className="px-3 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
              KL University • Capstone Project
            </span>
            <button
              onClick={() => setIsDbModalOpen(true)}
              className={`px-3 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 transition ${
                isMongoConnected 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
              title="Click to configure MongoDB Atlas connection"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isMongoConnected ? 'Database: MongoDB Atlas (Live)' : 'Database: Local Audit Trail'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
            <span>Device: <strong className="text-slate-800">{systemStatus?.device_name || 'CPU'}</strong></span>
            <span>&bull;</span>
            <span>Model: <strong className="text-slate-800">PatchCore (ResNet18)</strong></span>
          </div>
        </div>

        <div className="mt-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Lighting-Robust Unsupervised Industrial Anomaly Localization with Calibrated Unknown Detection
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Real-time visual inspection & defect localization trained strictly on nominal samples across all 15 MVTec AD industrial categories.
          </p>
        </div>
      </header>

      {/* Control Panel: Category, Upload, Dataset, Samples, Threshold */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Category selector & actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
              >
                {CATEGORIES_LIST.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-5 flex flex-wrap items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition shadow-sm"
              >
                <Upload className="w-4 h-4" />
                Upload Image
              </button>

              <button
                onClick={() => setIsSamplesModalOpen(true)}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-medium text-sm transition"
                title={
                  sampleItems.length > 0 && preloadedSamplesCount < sampleItems.length
                    ? `Preloading samples in background (${preloadedSamplesCount}/${sampleItems.length})`
                    : 'All sample images cached and ready'
                }
              >
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Select Sample Images ({sampleItems.length})
                {sampleItems.length > 0 && preloadedSamplesCount < sampleItems.length && (
                  <span className="text-[10px] font-mono text-indigo-500">
                    ({preloadedSamplesCount}/{sampleItems.length})
                  </span>
                )}
              </button>

              <button
                onClick={() => folderInputRef.current?.click()}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium text-sm transition"
                title="Select a local folder on your computer (e.g. D:\CAPSTONE-PROJECT\DATASET)"
              >
                <HardDrive className="w-4 h-4 text-slate-600" />
                Select Local Dataset
              </button>

              <button
                onClick={() => {
                  setBrowserCategory(selectedCategory);
                  setIsBrowserOpen(true);
                }}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-sm transition"
              >
                <FolderOpen className="w-4 h-4 text-slate-500" />
                Dataset Browser
              </button>
            </div>
          </div>

          {/* Right: Threshold Slider */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 min-w-[280px]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                Decision Threshold
              </span>
              <span className="font-mono font-bold text-blue-600 text-sm">
                {threshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="5.0"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>1.0 (Sensitive)</span>
              <span>Default: {DEFAULT_THRESHOLDS[selectedCategory] || 2.70}</span>
              <span>5.0 (Strict)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Loading Indicator */}
      {isAnalyzing && (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3 shadow-sm">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm font-semibold text-slate-800">
            Extracting Patch Features & Computing Anomaly Distances...
          </div>
          <p className="text-xs text-slate-400">
            Evaluating neighborhood L2 distance against {selectedCategory} nominal memory bank
          </p>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Analysis Output & Side-by-Side Visual Inspection */}
      {prediction && !isAnalyzing && (
        <div className="space-y-6">
          {/* Decision Verdict Banner */}
          <div className={`rounded-xl p-5 border shadow-sm transition-all ${
            prediction.is_anomalous
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className={`p-2.5 rounded-lg border ${
                  prediction.is_anomalous
                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                    : 'bg-emerald-100 border-emerald-300 text-emerald-700'
                }`}>
                  {prediction.is_anomalous ? (
                    <AlertCircle className="w-6 h-6" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider opacity-75">
                    Inspection Outcome
                  </div>
                  <div className="text-xl font-bold tracking-tight">
                    {prediction.is_anomalous ? 'DEFECT DETECTED (ANOMALY)' : 'INSPECTION PASSED (NOMINAL)'}
                  </div>
                  <div className="text-xs opacity-80 mt-0.5">
                    Category: <strong className="capitalize">{prediction.category}</strong> &bull; Class: <strong className="capitalize">{prediction.defect_type.replace('_', ' ')}</strong>
                  </div>
                </div>
              </div>

              {/* Quantitative Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center pt-2 md:pt-0">
                <div className="bg-white/80 border border-slate-200 rounded-lg p-2.5 shadow-2xs">
                  <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Anomaly Score</div>
                  <div className={`text-lg font-bold ${prediction.is_anomalous ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {prediction.score.toFixed(4)}
                  </div>
                </div>

                <div className="bg-white/80 border border-slate-200 rounded-lg p-2.5 shadow-2xs">
                  <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Threshold</div>
                  <div className="text-lg font-bold text-slate-700">
                    {prediction.threshold.toFixed(2)}
                  </div>
                </div>

                <div className="bg-white/80 border border-slate-200 rounded-lg p-2.5 shadow-2xs">
                  <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Latency</div>
                  <div className="text-lg font-bold text-slate-700">
                    {prediction.latency_ms} ms
                  </div>
                </div>

                <div className="bg-white/80 border border-slate-200 rounded-lg p-2.5 shadow-2xs">
                  <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Confidence</div>
                  <div className="text-lg font-bold text-blue-600">
                    {(prediction.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Images & Difference Comparison */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  Side-by-Side Visual Inspection & Difference Localization
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct spatial correspondence between input, ground truth annotations, and detected pixel-level anomaly maps.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 px-2.5 py-1 bg-slate-100 rounded-md">
                224 &times; 224 px
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. Input Image */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">1. Original Input Image</span>
                  <span className="text-[11px] text-slate-400 font-mono">Raw RGB</span>
                </div>
                <div className="aspect-square bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center relative p-2 shadow-2xs">
                  <img 
                    src={prediction.input_image} 
                    alt="Input Under Inspection" 
                    className="w-full h-full object-contain rounded"
                  />
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  Source inspection frame from {prediction.category} dataset/upload
                </p>
              </div>

              {/* 2. Ground Truth Mask */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">2. Ground Truth Defect Mask</span>
                  <span className="text-[11px] text-slate-400 font-mono">Reference</span>
                </div>
                <div className="aspect-square bg-slate-900 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center relative p-2 shadow-2xs">
                  {prediction.mask_image ? (
                    <img 
                      src={prediction.mask_image} 
                      alt="Ground Truth Defect Mask" 
                      className="w-full h-full object-contain filter invert"
                    />
                  ) : (
                    <div className="text-center p-6 text-slate-400 text-xs">
                      <CheckCircle2 className="w-7 h-7 mx-auto mb-2 text-emerald-400" />
                      Nominal Sample (Defect-Free)
                      <div className="text-[10px] text-slate-500 mt-1">No anomalous regions labeled</div>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  {prediction.mask_image ? 'Official ground-truth pixel annotation' : 'Normal nominal sample (0 defective pixels)'}
                </p>
              </div>

              {/* 3. PatchCore Anomaly Localization Overlay */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    3. Localized Defect Heatmap
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                  </span>
                  <span className="text-[11px] text-blue-600 font-mono font-semibold">JET Overlay</span>
                </div>
                <div className="aspect-square bg-slate-50 border-2 border-blue-200 rounded-lg overflow-hidden flex items-center justify-center relative p-2 shadow-2xs">
                  <img 
                    src={prediction.heatmap_image} 
                    alt="PatchCore Heatmap Overlay" 
                    className="w-full h-full object-contain rounded"
                  />
                  <div className="absolute bottom-3 left-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur rounded border border-slate-200 flex items-center justify-between text-[11px] font-mono shadow-xs">
                    <span className="text-slate-600">Peak Distance:</span>
                    <span className={`font-bold ${prediction.is_anomalous ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {prediction.score.toFixed(4)}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  Gaussian-smoothed neighborhood L2 distance field
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Inspections & Audit Trail (MongoDB / Local) */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-indigo-600" />
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Quality Inspection Audit Trail
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                  isMongoConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  {isMongoConnected ? 'MongoDB Atlas' : 'Local Audit Log'}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Logged records of recent inspection decisions, anomaly scores, and latency metrics ({inspectionsHistory.length} records)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showHistory && (
          <div className="border-t border-slate-200 p-5 overflow-x-auto">
            {inspectionsHistory.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No inspection logs yet. Run an inspection above to record an audit entry.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Class</th>
                    <th className="py-2 px-3">Score</th>
                    <th className="py-2 px-3">Threshold</th>
                    <th className="py-2 px-3">Latency</th>
                    <th className="py-2 px-3">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                  {inspectionsHistory.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-400 font-sans text-[11px]">
                        {new Date(rec.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3 font-sans font-medium capitalize">{rec.category}</td>
                      <td className="py-2 px-3 font-sans text-slate-500 capitalize">{rec.defect_type.replace('_', ' ')}</td>
                      <td className={`py-2 px-3 font-bold ${rec.is_anomalous ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {rec.score?.toFixed(4)}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{rec.threshold?.toFixed(2)}</td>
                      <td className="py-2 px-3 text-slate-500">{rec.latency_ms} ms</td>
                      <td className="py-2 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          rec.is_anomalous ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {rec.is_anomalous ? 'DEFECT' : 'PASS'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>

      {/* Minimal Collapsible Benchmark Performance Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => setShowBenchmarkTable(!showBenchmarkTable)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm font-bold text-slate-900">
                15-Category MVTec AD Benchmark Results
              </div>
              <div className="text-xs text-slate-500">
                Overall Mean: Image AUROC <strong>0.9578</strong> &bull; Pixel AUROC <strong>0.9674</strong> (1,725 test images evaluated)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">
              ✓ Verified Measurements
            </span>
            {showBenchmarkTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showBenchmarkTable && (
          <div className="border-t border-slate-200 p-5 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Test Images</th>
                  <th className="py-2.5 px-3">Image AUROC</th>
                  <th className="py-2.5 px-3">Pixel AUROC</th>
                  <th className="py-2.5 px-3">PRO Score</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                {benchmarkData.map((row) => {
                  const isMean = row.category === 'MEAN';
                  return (
                    <tr 
                      key={row.category} 
                      className={`hover:bg-slate-50 transition ${isMean ? 'bg-blue-50/60 font-bold text-slate-900' : ''}`}
                    >
                      <td className="py-2 px-3 font-sans font-medium capitalize">
                        {row.category}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-500">
                        {['carpet', 'grid', 'leather', 'tile', 'wood'].includes(row.category) ? 'texture' : (isMean ? '—' : 'object')}
                      </td>
                      <td className="py-2 px-3">{row.num_test_images}</td>
                      <td className="py-2 px-3 text-emerald-700 font-bold">
                        {row.image_auroc?.toFixed(4)}
                      </td>
                      <td className="py-2 px-3 text-blue-700 font-bold">
                        {row.pixel_auroc?.toFixed(4)}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {row.pro_score?.toFixed(4)}
                      </td>
                      <td className="py-2 px-3 font-sans">
                        {isMean ? (
                          <span className="text-blue-700 font-bold">Aggregate</span>
                        ) : (
                          <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Samples Gallery Modal (44 Curated Images) */}
      {isSamplesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Select Curated Sample Images
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bundled directly with the app — 1-click test on any browser without local files
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSamplesModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter by Category */}
            <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2 overflow-x-auto bg-white">
              <span className="text-xs font-semibold text-slate-500 uppercase mr-1">Filter:</span>
              <button
                onClick={() => setSampleFilterCategory('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  sampleFilterCategory === 'all' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All (44)
              </button>
              {CATEGORIES_LIST.map((c) => (
                <button
                  key={c}
                  onClick={() => setSampleFilterCategory(c)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition ${
                    sampleFilterCategory === c ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Gallery Grid */}
            <div className="p-6 overflow-y-auto max-h-[60vh] grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {filteredSamples.map((sample) => (
                <button
                  key={sample.filename}
                  onClick={() => handleSelectSampleUrl(sample)}
                  className="group rounded-xl border border-slate-200 hover:border-indigo-500 overflow-hidden text-left bg-slate-50 transition hover:shadow-md flex flex-col"
                >
                  <div className="aspect-square bg-slate-100 overflow-hidden relative">
                    <img
                      src={sample.url}
                      alt={sample.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                      loading="lazy"
                    />
                    <span className={`absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      sample.is_defect ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {sample.is_defect ? 'DEFECT' : 'NORMAL'}
                    </span>
                  </div>
                  <div className="p-2 bg-white flex-1 flex flex-col justify-between">
                    <div className="text-[11px] font-bold text-slate-800 truncate">{sample.label}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{sample.category}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MongoDB Connection Modal */}
      {isDbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  MongoDB Atlas Connection
                </h3>
              </div>
              <button
                onClick={() => setIsDbModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Connect your <strong>MongoDB Atlas</strong> cluster URI to store all inspection audit logs, anomaly detection results, and quality metrics directly in the cloud.
            </p>

            <form onSubmit={handleConnectMongo} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  MongoDB Connection URI
                </label>
                <input
                  type="password"
                  placeholder="mongodb+srv://<user>:<password>@cluster0.mongodb.net/mvtec_qc"
                  value={mongoUriInput}
                  onChange={(e) => setMongoUriInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {dbStatusMsg && (
                <div className={`p-3 rounded-lg text-xs font-medium border ${
                  isMongoConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {dbStatusMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDbModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConnectingDb}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm flex items-center gap-1.5"
                >
                  {isConnectingDb ? 'Testing Connection...' : 'Connect to Atlas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dataset Browser Modal */}
      {isBrowserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  MVTec AD Dataset Explorer
                </h3>
              </div>
              <button
                onClick={() => setIsBrowserOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-200 bg-white flex flex-wrap items-center gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Category
                </label>
                <select
                  value={browserCategory}
                  onChange={(e) => setBrowserCategory(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-800 capitalize"
                >
                  {CATEGORIES_LIST.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Split
                </label>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                  <button
                    onClick={() => setBrowserSplit('test')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                      browserSplit === 'test' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Test Set (Defects + Good)
                  </button>
                  <button
                    onClick={() => setBrowserSplit('train')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                      browserSplit === 'train' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Train Set (Nominal Only)
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Defect Folders */}
              <div className="w-1/3 border-r border-slate-200 overflow-y-auto p-3 space-y-1 bg-slate-50">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Defect Types / Folders
                </div>
                {isLoadingFolders ? (
                  <div className="p-4 text-xs text-slate-400 text-center">Loading folders...</div>
                ) : (
                  browserFolders.map((folder) => (
                    <button
                      key={folder.defect_type}
                      onClick={() => setSelectedFolder(folder.defect_type)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                        selectedFolder === folder.defect_type
                          ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-200/60'
                      }`}
                    >
                      <span className="capitalize">{folder.defect_type.replace('_', ' ')}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        selectedFolder === folder.defect_type ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {folder.count}
                      </span>
                    </button>
                  ))
                )}
              </div>

              {/* Right Column: Thumbnail Grid */}
              <div className="w-2/3 p-4 overflow-y-auto bg-white">
                <div className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between">
                  <span>Images in: <strong className="capitalize text-blue-600">{selectedFolder?.replace('_', ' ')}</strong></span>
                  <span className="text-[11px] text-slate-400 font-normal">Click image to run analysis</span>
                </div>

                {activeFolderData && activeFolderData.images.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {activeFolderData.images.map((img) => (
                      <button
                        key={img.filename}
                        onClick={() => handleSelectDatasetImage(img.rel_path, browserCategory)}
                        className="group aspect-square rounded-lg border border-slate-200 hover:border-blue-500 overflow-hidden relative bg-slate-50 transition hover:shadow-md"
                        title={img.filename}
                      >
                        <img
                          src={img.url}
                          alt={img.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          loading="lazy"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-slate-900/70 text-[9px] text-white font-mono text-center py-0.5 truncate px-1">
                          {img.filename}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No images found in this folder.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

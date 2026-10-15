 "use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Car, AlertTriangle, Wrench, FileText, ShieldCheck, CheckCircle2,
  DollarSign, MapPin, Camera, Upload, RefreshCw, ExternalLink,
  ChevronRight, TrendingDown, Sparkles, Info, Award, KeyRound,
  ShoppingCart, Tag, HelpCircle, Check, Globe, LogOut, History,
  ClipboardList, Calendar, AlertCircle, Database
} from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SAMPLE_VEHICLES = [
  { id: "alto", name: "Suzuki Alto 660cc (Severe Collision)", file: "sample_images/severe/real_suzuki_alto_heavy_crash.jpg", category: "Severe" },
  { id: "corolla", name: "Toyota Corolla (Front Bumper & Hood)", file: "sample_images/severe/severe_corolla_front_crash.jpg", category: "Severe" },
  { id: "civic_side", name: "Honda Civic (Side T-Bone Collision)", file: "sample_images/severe/severe_civic_side_collision.jpg", category: "Severe" },
  { id: "mehran", name: "Suzuki Mehran (Fender & Bumper Dent)", file: "sample_images/suzuki_mehran_fender_dent.jpg", category: "Moderate" },
  { id: "civic_door", name: "Honda Civic (Door Scratch / Ding)", file: "sample_images/honda_civic_door_damage.jpg", category: "Minor" }
];

export default function DashboardPage() {
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem('autodamage_token');
      if (!token) {
        window.location.href = '/login';
        return;
      }
      setAuthChecked(true);
    }
  }, []);

  const [activeTab, setActiveTab] = useState("inspection");
  const [city, setCity] = useState("Rawalpindi");
  const [apiKey, setApiKey] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [confidence, setConfidence] = useState(0.35);
  const [manualCarName, setManualCarName] = useState("");
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("/sample_images/severe/real_suzuki_alto_heavy_crash.jpg");
  const [selectedSamplePath, setSelectedSamplePath] = useState("sample_images/severe/real_suzuki_alto_heavy_crash.jpg");
  
  const [loading, setLoading] = useState(false);
  const [inspectionResult, setInspectionResult] = useState(null);
  const [estimationResult, setEstimationResult] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [selectedMarketPart, setSelectedMarketPart] = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [workshops, setWorkshops] = useState([]);
  
  const [benchLoading, setBenchLoading] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState(null);

  // My Inspections state
  const [myInspections, setMyInspections] = useState([]);
  const [inspectionsLoading, setInspectionsLoading] = useState(false);
  const [inspectionsError, setInspectionsError] = useState(null);
  const [inspectionDetail, setInspectionDetail] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/workshops?city=${encodeURIComponent(city)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.workshops) setWorkshops(data.workshops);
      })
      .catch((err) => console.error("Error loading workshops:", err));
  }, [city]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedSamplePath(null);
      setPreviewUrl(URL.createObjectURL(file));
      setInspectionResult(null);
    }
  };

  const handleSampleSelect = (sample) => {
    setSelectedFile(null);
    setSelectedSamplePath(sample.file);
    setPreviewUrl(sample.file);
    setInspectionResult(null);
  };

  const loadMarketDataForPart = async (vName, pName) => {
    setMarketLoading(true);
    try {
      const v = vName || (inspectionResult?.vehicle ? (inspectionResult.vehicle.make + " " + inspectionResult.vehicle.model) : "Toyota Corolla");
      const url = BACKEND_URL + "/api/market-data?vehicle=" + encodeURIComponent(v) + "&part=" + encodeURIComponent(pName);
      const res = await fetch(url);
      const data = await res.json();
      setMarketData(data);
      setSelectedMarketPart(pName);
    } catch (err) {
      console.error("Error loading market data:", err);
    } finally {
      setMarketLoading(false);
    }
  };

  // Safe JSON parser — prevents "Unexpected end of JSON input" crashes
  const safeJson = async (res) => {
    const text = await res.text();
    if (!text || text.trim() === "") {
      throw new Error(`Server returned empty response (HTTP ${res.status})`);
    }
    try {
      return JSON.parse(text);
    } catch {
      // Show first 300 chars of raw response for debugging
      throw new Error(`Server returned invalid JSON (HTTP ${res.status}): ${text.slice(0, 300)}`);
    }
  };

  const runFullPipeline = async () => {
    setLoading(true);
    setInspectionResult(null);
    setEstimationResult(null);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile);
      } else if (selectedSamplePath) {
        formData.append("sample_path", selectedSamplePath);
      }
      formData.append("confidence", confidence.toString());

      // Pass user-entered car name so backend uses it for pricing/scraping
      if (manualCarName.trim()) {
        formData.append("car_model", manualCarName.trim());
      }

      const detRes = await fetch(`${BACKEND_URL}/api/detect`, {
        method: "POST",
        body: formData,
      });
      const detData = await safeJson(detRes);
      if (!detRes.ok) throw new Error(detData.detail || `Detection failed (HTTP ${detRes.status})`);
      setInspectionResult(detData);

      const estRes = await fetch(`${BACKEND_URL}/api/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle: detData.vehicle,
          detections: detData.detections || [],
          internal_damages: detData.internal_damages || [],
          city: city,
          gemini_api_key: apiKey || null,
        }),
      });
      const estData = await safeJson(estRes);
      if (!estRes.ok) throw new Error(estData.detail || `Estimation failed (HTTP ${estRes.status})`);
      setEstimationResult(estData);

      // Only search market parts if real damage exists
      if (detData.detections && detData.detections.length > 0) {
        const primaryPart = detData.detections[0].part || "Front Bumper";
        const make = detData.vehicle?.make || "Toyota";
        const model = detData.vehicle?.model || "Corolla";
        const vehicleName = manualCarName.trim()
          ? manualCarName.trim()
          : (make === "Unknown") ? "Toyota Corolla" : `${make} ${model}`;
        setSelectedMarketPart(primaryPart);
        await loadMarketDataForPart(vehicleName, primaryPart);
      } else {
        setMarketData(null);
      }

      // Automatically save full inspection assessment to MongoDB Atlas
      try {
        const token = localStorage.getItem("autodamage_token");
        if (token) {
          await fetch(`${BACKEND_URL}/api/auth/save-inspection`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              vehicle: detData.vehicle,
              detections: detData.detections || [],
              internal_damages: detData.internal_damages || [],
              overall_severity: detData.overall_severity || "Moderate",
              total_damages: detData.total_damages || 0,
              city: city,
              consensus_estimate: estData?.consensus || null,
              annotated_image_base64: detData.annotated_image_base64 || null,
              image_filename: selectedFile?.name || selectedSamplePath || "vehicle.jpg"
            })
          });
        }
      } catch (dbErr) {
        console.warn("Auto-saving inspection to DB:", dbErr);
      }
    } catch (err) {
      // Show error inline, not as a disruptive alert
      const msg = err.message || "Unknown error";
      if (msg.includes("Image Rejected") || msg.includes("not appear to be a vehicle")) {
        alert(`🚫 ${msg}`);
      } else {
        alert(`⚠️ Analysis Error:\n\n${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const runUnseenBenchmark = async () => {
    setBenchLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/evaluate/unseen?confidence=0.15`);
      const data = await res.json();
      setBenchmarkResult(data);
    } catch (err) {
      alert(`Error running benchmark: ${err.message}`);
    } finally {
      setBenchLoading(false);
    }
  };

  const fetchMyInspections = useCallback(async () => {
    setInspectionsLoading(true);
    setInspectionsError(null);
    try {
      const token = localStorage.getItem("autodamage_token");
      if (!token) {
        setInspectionsError("Please log in to view your inspection history.");
        return;
      }
      const res = await fetch(`${BACKEND_URL}/api/auth/my-inspections`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 503) {
        setInspectionsError("Database not connected. Please configure MongoDB Atlas and whitelist your IP.");
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setInspectionsError(errData.detail || `Error ${res.status}`);
        return;
      }
      const data = await res.json();
      setMyInspections(data.inspections || []);
    } catch (err) {
      setInspectionsError(`Failed to load inspections: ${err.message}`);
    } finally {
      setInspectionsLoading(false);
    }
  }, []);

  // Load inspections when switching to that tab
  useEffect(() => {
    if (activeTab === "my_inspections") {
      fetchMyInspections();
    }
  }, [activeTab, fetchMyInspections]);



  const downloadPDFReport = async () => {
    if (!inspectionResult || !estimationResult) return;
    try {
      const payload = {
        survey_id: `PK-SURV-${Date.now().toString().slice(-6)}`,
        vehicle: inspectionResult.vehicle,
        detections: inspectionResult.detections,
        internal_damages: inspectionResult.internal_damages || [],
        overall_severity: inspectionResult.overall_severity,
        total_damages: inspectionResult.total_damages,
        city: city,
        consensus_estimate: estimationResult.consensus_estimate,
        workshops: workshops,
        annotated_image_base64: inspectionResult.annotated_image_base64,
      };

      const res = await fetch(`${BACKEND_URL}/api/report/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Damage_Inspection_Report_${city}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(`PDF download failed: ${err.message}`);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-700 text-white p-2 rounded-xl shadow-sm">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">AutoDamage AI</span>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                  Pakistan Market
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">YOLOv11 Damage Localization & Multi-LLM Repair Estimator</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-transparent border-none outline-none font-semibold cursor-pointer"
              >
                <option value="Rawalpindi">Rawalpindi</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Lahore">Lahore</option>
                <option value="Karachi">Karachi</option>
                <option value="Peshawar">Peshawar</option>
                <option value="Faisalabad">Faisalabad</option>
                <option value="Multan">Multan</option>
                <option value="Gujranwala">Gujranwala</option>
                <option value="Sialkot">Sialkot</option>
                <option value="Quetta">Quetta</option>
                <option value="Abbottabad">Abbottabad</option>
                <option value="Hyderabad">Hyderabad</option>
              </select>
            </div>

            <button
              onClick={() => setShowKeyModal(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-sm transition"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>{apiKey ? "Gemini Key (Active)" : "Add Gemini Key"}</span>
            </button>

            <button
              onClick={() => {
                localStorage.removeItem('autodamage_token');
                localStorage.removeItem('autodamage_user');
                window.location.href = '/';
              }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-xs font-medium text-red-700 shadow-sm transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-2 text-emerald-800 mb-3">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold text-lg">Google Gemini API Key</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Enter your free Google Gemini API key to enable live Multi-LLM consensus inference (Gemini 2.5/2.0 Flash).
              If left blank, the system automatically uses the <b>Pakistani Calibrated Automotive Fallback Engine</b> with zero downtime.
            </p>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 shadow"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 overflow-x-auto py-3">
            {[
              { id: "inspection", label: "Damage Detection & Inspection", icon: Car },
              { id: "cost_estimation", label: "Multi-LLM Cost Estimation", icon: DollarSign },
              { id: "market_data", label: "PakWheels & OLX Market Data", icon: TrendingDown },
              { id: "workshops", label: "Nearby 3S Workshops", icon: Wrench },
              { id: "my_inspections", label: "My Inspection History", icon: History },
              { id: "unseen_lab", label: "Unseen Data Testing Lab", icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
                    isActive
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-700" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: INSPECTION & DETECTION */}
        {activeTab === "inspection" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Upload className="w-4 h-4 text-emerald-700" />
                  <span>1. Select Damaged Vehicle Image</span>
                </h2>

                <label className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50 hover:bg-emerald-50/40">
                  <Camera className="w-7 h-7 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-700">Upload Crash Photo</span>
                  <span className="text-[10px] text-slate-500">JPG, PNG, WEBP</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">Or Choose Real Pakistani Crash Sample:</label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {SAMPLE_VEHICLES.map((sample) => (
                      <button
                        key={sample.id}
                        onClick={() => handleSampleSelect(sample)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-between border ${
                          selectedSamplePath === sample.file
                            ? "bg-emerald-100/70 border-emerald-400 text-emerald-900 font-bold"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{sample.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            sample.category === "Severe"
                              ? "bg-red-100 text-red-700"
                              : sample.category === "Moderate"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {sample.category}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Detection Confidence:</span>
                    <span className="text-emerald-800 font-bold">{Math.round(confidence * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="0.80"
                    step="0.05"
                    value={confidence}
                    onChange={(e) => setConfidence(parseFloat(e.target.value))}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Higher = fewer false alarms. Lower = catch more damage.
                  </p>
                </div>

                {/* Car Name Manual Input */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center space-x-1">
                    <Car className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Car Name (Optional — for accurate pricing)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Toyota Corolla, Honda Civic, Suzuki Alto"
                    value={manualCarName}
                    onChange={(e) => setManualCarName(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 bg-white placeholder-slate-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Aap ka diya naam market scraping aur pricing mein use hoga.
                  </p>
                </div>

                <button
                  onClick={runFullPipeline}
                  disabled={loading}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analyzing with YOLOv11 & LLM...</span>
                    </>
                  ) : (
                    <>
                      <Wrench className="w-4 h-4" />
                      <span>Run AI Inspection & Cost Analysis</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <Car className="w-4 h-4 text-emerald-700" />
                      <span>
                        {inspectionResult ? "YOLOv11 Annotated Bounding Box Visualizer" : "Uploaded Image Preview"}
                      </span>
                    </h2>
                    {inspectionResult && (
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                          inspectionResult.overall_severity === "High"
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-amber-100 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {inspectionResult.overall_severity} Collision
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center min-h-[360px] max-h-[460px] border border-slate-800">
                    {inspectionResult?.annotated_image_base64 ? (
                      <img
                        src={inspectionResult.annotated_image_base64}
                        alt="Annotated Damage"
                        className="w-full h-full object-contain max-h-[450px]"
                      />
                    ) : previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Vehicle Preview"
                        className="w-full h-full object-contain max-h-[450px]"
                      />
                    ) : (
                      <div className="text-slate-500 text-xs">No image selected</div>
                    )}
                  </div>
                </div>

                {inspectionResult && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    {/* ── Vehicle Identity Card ── */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <div className="bg-emerald-100 p-2.5 rounded-xl border border-emerald-200 flex-shrink-0">
                          <Car className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div>
                          <div className="flex items-center flex-wrap gap-2 mb-0.5">
                            <h3 className="font-extrabold text-lg text-slate-900 leading-tight">
                              {inspectionResult.vehicle?.make} {inspectionResult.vehicle?.model}
                              {inspectionResult.vehicle?.year && (
                                <span className="ml-2 text-emerald-700 font-bold text-base">
                                  ({inspectionResult.vehicle.year})
                                </span>
                              )}
                            </h3>
                            {/* Badge: User Input, Gemini AI, or Keyword */}
                            {inspectionResult.vehicle?.identified_by === "user_input" ? (
                              <span className="flex items-center space-x-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span>User Specified Model</span>
                              </span>
                            ) : inspectionResult.vehicle?.identified_by === "gemini_vision" ? (
                              <span className="flex items-center space-x-1 bg-violet-100 text-violet-800 border border-violet-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <Sparkles className="w-3 h-3" />
                                <span>AI Identified</span>
                              </span>
                            ) : inspectionResult.vehicle?.identified_by === "filename_keyword" ? (
                              <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Filename Match
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                ⚠ Unknown — Enter Model
                              </span>
                            )}
                          </div>
                          {inspectionResult.vehicle?.generation && (
                            <p className="text-xs text-slate-500 font-medium">
                              {inspectionResult.vehicle.generation}
                            </p>
                          )}
                          {inspectionResult.vehicle?.confidence > 0 && (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Identification Confidence:{" "}
                              <span className="font-bold text-emerald-700">
                                {Math.round(inspectionResult.vehicle.confidence)}%
                              </span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Damaged Parts</p>
                          <p className={`text-2xl font-extrabold ${inspectionResult.total_damages === 0 ? "text-emerald-600" : "text-slate-900"}`}>
                            {inspectionResult.total_damages}
                          </p>
                        </div>
                        {estimationResult && (
                          <button
                            onClick={downloadPDFReport}
                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow transition"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Export PDF</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* DAMAGE BREAKDOWN OR PRISTINE NO-DAMAGE STATE */}
                    {inspectionResult.total_damages === 0 ? (
                      <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 text-center space-y-3 my-2">
                        <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                          <CheckCircle2 className="w-8 h-8 text-emerald-700" />
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold text-emerald-950">
                            ✅ No Damage Detected — Vehicle in Pristine Condition
                          </h4>
                          <p className="text-xs text-emerald-800 max-w-lg mx-auto mt-1 leading-relaxed">
                            Gaari mukammal tor par saaf aur theek hai! Body panels, bumpers, lights aur glass par koi dent ya physical crash damage nahi mila. Light reflections aur surface glare ko AI ne verify kar ke filter out kar diya hai.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-2">
                          <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-sm">
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">Damaged Parts</span>
                            <span className="text-lg font-black text-emerald-700">0 Parts</span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-sm">
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">Repair Required</span>
                            <span className="text-lg font-black text-emerald-700">PKR 0</span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-sm">
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">Body Rating</span>
                            <span className="text-lg font-black text-emerald-700">10 / 10 Original</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Detected Damage Breakdown ({inspectionResult.total_damages} parts)
                        </p>
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">#</th>
                              <th className="py-2.5 px-3">Damaged Part</th>
                              <th className="py-2.5 px-3">Severity</th>
                              <th className="py-2.5 px-3">Confidence</th>
                              <th className="py-2.5 px-3">Recommended Repair Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {inspectionResult.detections.map((det, index) => (
                              <tr key={det.id} className="hover:bg-slate-50/70">
                                <td className="py-2.5 px-3 text-slate-400 font-bold">{index + 1}</td>
                                <td className="py-2.5 px-3 font-bold text-slate-800">{det.part}</td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                      det.severity === "High"
                                        ? "bg-red-100 text-red-700"
                                        : det.severity === "Moderate"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-emerald-100 text-emerald-700"
                                    }`}
                                  >
                                    {det.severity}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 font-medium">{det.confidence}%</td>
                                <td className="py-2.5 px-3 text-slate-700">{det.severity_info?.action}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* INTERNAL & STRUCTURAL DAMAGE ASSESSMENT */}
                    {inspectionResult.internal_damages && inspectionResult.internal_damages.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-slate-900">
                            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Internal & Structural Collision Impact Assessment
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                Secondary internal collision damage correlated with external impact velocity
                              </p>
                            </div>
                          </div>
                          <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {inspectionResult.internal_damages.length} Potential Issues
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {inspectionResult.internal_damages.map((item) => (
                            <div
                              key={item.id}
                              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-amber-300 transition shadow-sm space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                                    {item.system}
                                  </span>
                                  <h5 className="font-bold text-xs text-slate-900 mt-1">
                                    {item.part}
                                  </h5>
                                </div>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded font-bold whitespace-nowrap ${
                                    item.severity === "High"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {item.severity} Risk
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                <b>Issue:</b> {item.damage_nature}
                              </p>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px]">
                                <span className="text-amber-800 font-semibold truncate max-w-[200px]" title={item.urgency}>
                                  ⚠ {item.urgency}
                                </span>
                                <button
                                  onClick={() => {
                                    const make = inspectionResult.vehicle?.make || "Toyota";
                                    const model = inspectionResult.vehicle?.model || "Corolla";
                                    const vName = manualCarName.trim()
                                      ? manualCarName.trim()
                                      : (make === "Unknown") ? "Toyota Corolla" : `${make} ${model}`;
                                    loadMarketDataForPart(vName, item.part);
                                    setActiveTab("market_data");
                                  }}
                                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center space-x-0.5"
                                >
                                  <span>Check Prices</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MULTI-LLM COST ESTIMATION */}
        {activeTab === "cost_estimation" && (
          <div className="space-y-6">
            {!estimationResult ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Cost Estimation Generated Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Please upload a vehicle crash photograph and click "Run AI Inspection" in the first tab.
                </p>
                <button
                  onClick={() => setActiveTab("inspection")}
                  className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow hover:bg-emerald-800"
                >
                  Go to Inspection Tab
                </button>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span>Multi-Agent Consensus Repair Estimate ({city}, Pakistan)</span>
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight">
                      {estimationResult.consensus_estimate?.cost_range_display}
                    </h2>
                    <p className="text-xs text-emerald-100/90 mt-1">
                      {estimationResult.consensus_estimate?.recommended_cost_pkr === 0 ? (
                        <span>✅ <b>Pristine Vehicle:</b> Gaari mukammal tor par saaf hai, kisi qisam ki repair ya kharche ki zaroorat nahi.</span>
                      ) : (
                        <span>Most Recommended Consensus: <b>PKR {estimationResult.consensus_estimate?.recommended_cost_pkr?.toLocaleString()}</b></span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={downloadPDFReport}
                      className="px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl font-bold text-xs shadow transition flex items-center space-x-1.5"
                    >
                      <FileText className="w-4 h-4 text-emerald-700" />
                      <span>Download PDF Report</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2 text-emerald-800 mb-2">
                        <Wrench className="w-4 h-4" />
                        <h4 className="font-bold text-sm">{estimationResult.personas?.ustad_rafiq?.persona}</h4>
                      </div>
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border">
                        {estimationResult.personas?.ustad_rafiq?.market_view}
                      </span>
                      <div className="my-3">
                        <span className="text-xs text-slate-500">Estimated Cost:</span>
                        <div className="text-xl font-extrabold text-slate-900">
                          PKR {estimationResult.personas?.ustad_rafiq?.estimated_cost_pkr?.toLocaleString()}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                        <b>Parts Strategy:</b> {estimationResult.personas?.ustad_rafiq?.parts_strategy}
                      </p>
                    </div>
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 mt-2">
                      <b>Ustad Advice:</b> {estimationResult.personas?.ustad_rafiq?.recommendation}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2 text-blue-800 mb-2">
                        <ShieldCheck className="w-4 h-4" />
                        <h4 className="font-bold text-sm">{estimationResult.personas?.engr_salman?.persona}</h4>
                      </div>
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border">
                        {estimationResult.personas?.engr_salman?.market_view}
                      </span>
                      <div className="my-3">
                        <span className="text-xs text-slate-500">Survey Assessment:</span>
                        <div className="text-xl font-extrabold text-slate-900">
                          PKR {estimationResult.personas?.engr_salman?.estimated_cost_pkr?.toLocaleString()}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                        <b>Depreciation & Terms:</b> {estimationResult.personas?.engr_salman?.parts_strategy}
                      </p>
                    </div>
                    <div className="text-[11px] text-blue-800 bg-blue-50 p-2.5 rounded-lg border border-blue-100 mt-2">
                      <b>Surveyor Note:</b> {estimationResult.personas?.engr_salman?.recommendation}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2 text-amber-800 mb-2">
                        <Award className="w-4 h-4" />
                        <h4 className="font-bold text-sm">{estimationResult.personas?.pakwheels_inspector?.persona}</h4>
                      </div>
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border">
                        {estimationResult.personas?.pakwheels_inspector?.market_view}
                      </span>
                      <div className="my-3">
                        <span className="text-xs text-slate-500">Inspection Standard:</span>
                        <div className="text-xl font-extrabold text-slate-900">
                          PKR {estimationResult.personas?.pakwheels_inspector?.estimated_cost_pkr?.toLocaleString()}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                        <b>Resale Retention:</b> {estimationResult.personas?.pakwheels_inspector?.parts_strategy}
                      </p>
                    </div>
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-100 mt-2">
                      <b>Inspection Tip:</b> {estimationResult.personas?.pakwheels_inspector?.recommendation}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-base text-slate-900 mb-3">Itemized Repair Quotation Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Part</th>
                          <th className="py-2.5 px-3">Severity</th>
                          <th className="py-2.5 px-3">Action</th>
                          <th className="py-2.5 px-3">Denting Labor</th>
                          <th className="py-2.5 px-3">Oven Paint</th>
                          <th className="py-2.5 px-3">Fitting</th>
                          <th className="py-2.5 px-3">Part Cost</th>
                          <th className="py-2.5 px-3 font-bold text-emerald-800">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {estimationResult.itemized_breakdown?.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-bold text-slate-800">{item.part}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  item.severity === "High"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {item.severity}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{item.action}</td>
                            <td className="py-2.5 px-3">PKR {item.denting_labor_pkr?.toLocaleString()}</td>
                            <td className="py-2.5 px-3">PKR {item.painting_labor_pkr?.toLocaleString()}</td>
                            <td className="py-2.5 px-3">PKR {item.fitting_labor_pkr?.toLocaleString()}</td>
                            <td className="py-2.5 px-3">
                              {item.replace_needed ? `PKR ${item.part_cost_recommended?.toLocaleString()}` : "N/A (Repaired)"}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-emerald-800">
                              PKR {item.subtotal_pkr?.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: PAKWHEELS & OLX MARKET DATA */}
        {activeTab === "market_data" && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-emerald-700/40">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
                    <TrendingDown className="w-4 h-4" />
                    <span>Pakistani & Global Automotive Spare Parts Intelligence</span>
                  </div>
                  <h3 className="text-xl font-black">
                    Multi-Platform Price Comparison & Purchase Decision Engine
                  </h3>
                  <p className="text-xs text-emerald-100/90 mt-1 max-w-2xl">
                    Live price tracking & verified catalog across <b>OLX Pakistan</b>, <b>PakWheels</b>, <b>Auto Axis</b>, <b>Daraz</b>, <b>AliExpress Global</b>, <b>eBay Motors</b>, and <b>Local Wholesale Markets (Sultan Ka Khoo / Bilal Ganj / Shershah)</b>.
                  </p>
                </div>
                <div className="flex items-center space-x-2 bg-emerald-950/70 p-3 rounded-xl border border-emerald-600/40">
                  <Globe className="w-5 h-5 text-emerald-400" />
                  <div className="text-right">
                    <div className="text-[10px] text-emerald-300 uppercase font-semibold">7 Platforms Tracked</div>
                    <div className="text-xs font-bold text-white">Local + Global Matrix</div>
                  </div>
                </div>
              </div>
            </div>

            {/* PART SELECTOR BAR */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Select Damaged Part to Compare Across All 7 Local & International Platforms
                  </h4>
                  <p className="text-xs text-slate-500">
                    Click any detected damaged component to view live prices, platform comparison, and purchase guidance.
                  </p>
                </div>
                {marketLoading && (
                  <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-700">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Fetching platform prices...</span>
                  </div>
                )}
              </div>

              {/* Detected Parts Pills */}
              <div className="flex flex-wrap gap-2">
                {inspectionResult?.detections && inspectionResult.detections.length > 0 ? (
                  inspectionResult.detections.map((det) => {
                    const isSelected = (selectedMarketPart || "").toLowerCase().includes(det.part.toLowerCase()) || (det.part.toLowerCase().includes((selectedMarketPart || "").toLowerCase()));
                    const sevColor = det.severity === "High" ? "bg-red-100 text-red-700 border-red-300" : det.severity === "Moderate" ? "bg-amber-100 text-amber-700 border-amber-300" : "bg-emerald-100 text-emerald-700 border-emerald-300";
                    return (
                      <button
                        key={det.id}
                        onClick={() => {
                          const make = inspectionResult.vehicle?.make || "Toyota";
                          const model = inspectionResult.vehicle?.model || "Corolla";
                          const vName = manualCarName.trim()
                            ? manualCarName.trim()
                            : (make === "Unknown") ? "Toyota Corolla" : `${make} ${model}`;
                          loadMarketDataForPart(vName, det.part);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 border ${
                          isSelected
                            ? "bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <span>{det.part}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${isSelected ? "bg-white/20 text-white border-white/30" : sevColor}`}>
                          {det.severity}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  ["Front Bumper", "Headlight", "Bonnet (Hood)", "Front Fender", "Door Outer Panel", "Side Mirror", "Rear Bumper"].map((pName) => {
                    const isSelected = selectedMarketPart === pName;
                    return (
                      <button
                        key={pName}
                        onClick={() => {
                          const vName = manualCarName.trim() ? manualCarName.trim() : "Toyota Corolla";
                          loadMarketDataForPart(vName, pName);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                          isSelected
                            ? "bg-emerald-700 text-white border-emerald-700 shadow"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {pName}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* 5-PLATFORM DETAILED COMPARISON GRID */}
            {marketData?.pricing && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">
                        5-Platform Price Comparison: <span className="text-emerald-800">{marketData.pricing.part}</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Vehicle: <b>{marketData.pricing.vehicle}</b> in Pakistani Automotive Market
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 1. OLX PAKISTAN */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-amber-500 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                            OLX Pakistan
                          </span>
                          <span className="text-[11px] font-bold text-slate-400">Used / Kabli</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mt-2">Classifieds & Scrapyard</h4>
                        <div className="my-2.5 p-3 bg-amber-50/70 rounded-xl border border-amber-100">
                          <div className="text-[11px] text-slate-500 font-medium">Average Market Price:</div>
                          <div className="text-2xl font-black text-slate-900">
                            PKR {marketData.pricing.platforms?.olx_pakistan?.avg_pkr?.toLocaleString() || marketData.pricing.tiers?.used_kabli?.avg_pkr?.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Range: PKR {marketData.pricing.platforms?.olx_pakistan?.min_pkr?.toLocaleString() || marketData.pricing.tiers?.used_kabli?.min_pkr?.toLocaleString()} - {marketData.pricing.platforms?.olx_pakistan?.max_pkr?.toLocaleString() || marketData.pricing.tiers?.used_kabli?.max_pkr?.toLocaleString()}
                          </div>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <div><b>Condition:</b> Used / Kabli Original (Salvage)</div>
                          <div><b>Best For:</b> Doors, Bonnets, Trunks (Original metal)</div>
                          <div className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-100">
                            <b>Verdict:</b> Sasta option for original factory sheet metal. Always check for hidden putty.
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <a
                          href={marketData.pricing.platforms?.olx_pakistan?.url || marketData.pricing.marketplace_links?.olx_search}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Search on OLX Pakistan</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    </div>

                    {/* 2. PAKWHEELS AUTOSTORE (RECOMMENDED) */}
                    <div className="bg-white p-5 rounded-2xl border-2 border-emerald-500 shadow-md border-t-4 border-t-emerald-600 flex flex-col justify-between relative">
                      <div className="absolute -top-3 right-4 bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow">
                        ⭐ BEST OVERALL VALUE
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 px-2 py-0.5 rounded-md border border-red-200">
                            PakWheels AutoStore
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700">Verified New</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mt-2">Certified Automotive Store</h4>
                        <div className="my-2.5 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                          <div className="text-[11px] text-emerald-700 font-medium">Average Market Price:</div>
                          <div className="text-2xl font-black text-emerald-900">
                            PKR {marketData.pricing.platforms?.pakwheels?.avg_pkr?.toLocaleString() || marketData.pricing.tiers?.aftermarket?.avg_pkr?.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-emerald-700 mt-0.5">
                            Range: PKR {marketData.pricing.platforms?.pakwheels?.min_pkr?.toLocaleString() || marketData.pricing.tiers?.aftermarket?.min_pkr?.toLocaleString()} - {marketData.pricing.platforms?.pakwheels?.max_pkr?.toLocaleString() || marketData.pricing.tiers?.aftermarket?.max_pkr?.toLocaleString()}
                          </div>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <div><b>Condition:</b> Brand New (Taiwanese / Depo / OEM)</div>
                          <div><b>Delivery:</b> Nationwide Doorstep Delivery</div>
                          <div className="text-[11px] text-emerald-950 bg-emerald-50 p-2 rounded-lg border border-emerald-200 font-medium">
                            <b>Verdict:</b> ⭐ Most Recommended! Standardized pricing, easy return policy, 95% fitment accuracy.
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <a
                          href={marketData.pricing.platforms?.pakwheels?.url || marketData.pricing.marketplace_links?.pakwheels_search}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 px-3 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Search on PakWheels</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    </div>

                    {/* 3. AUTO AXIS PAKISTAN */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-purple-600 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200">
                            Auto Axis Pakistan
                          </span>
                          <span className="text-[11px] font-bold text-purple-700">Body Specialist</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mt-2">Auto Body & Collision Parts</h4>
                        <div className="my-2.5 p-3 bg-purple-50/70 rounded-xl border border-purple-100">
                          <div className="text-[11px] text-purple-700 font-medium">Average Market Price:</div>
                          <div className="text-2xl font-black text-purple-950">
                            PKR {marketData.pricing.platforms?.auto_axis?.avg_pkr?.toLocaleString() || Math.round((marketData.pricing.tiers?.aftermarket?.avg_pkr || 18000) * 1.06).toLocaleString()}
                          </div>
                          <div className="text-[11px] text-purple-700 mt-0.5">
                            Range: PKR {marketData.pricing.platforms?.auto_axis?.min_pkr?.toLocaleString() || Math.round((marketData.pricing.tiers?.aftermarket?.min_pkr || 14000) * 1.05).toLocaleString()} - {marketData.pricing.platforms?.auto_axis?.max_pkr?.toLocaleString() || Math.round((marketData.pricing.tiers?.aftermarket?.max_pkr || 22000) * 1.08).toLocaleString()}
                          </div>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <div><b>Condition:</b> Imported Taiwanese / Premium Replicas</div>
                          <div><b>Delivery:</b> Lahore Hub + Intercity Courier</div>
                          <div className="text-[11px] text-purple-950 bg-purple-50 p-2 rounded-lg border border-purple-100">
                            <b>Verdict:</b> Excellent for Bumpers, Headlights, Fenders & Body Kits with precise gap alignment.
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <a
                          href={marketData.pricing.platforms?.auto_axis?.url || `https://autoaxis.pk/?s=${encodeURIComponent(marketData.pricing.part)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 px-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Search on Auto Axis</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    </div>

                    {/* 4. DARAZ PAKISTAN */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-orange-500 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 px-2 py-0.5 rounded-md border border-orange-200">
                            Daraz Pakistan
                          </span>
                          <span className="text-[11px] font-bold text-orange-700">Online Direct</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mt-2">Daraz Automotive Mall</h4>
                        <div className="my-2.5 p-3 bg-orange-50/70 rounded-xl border border-orange-100">
                          <div className="text-[11px] text-orange-700 font-medium">Average Market Price:</div>
                          <div className="text-2xl font-black text-orange-950">
                            PKR {marketData.pricing.platforms?.daraz_pk?.avg_pkr?.toLocaleString() || Math.round((marketData.pricing.tiers?.aftermarket?.avg_pkr || 18000) * 0.97).toLocaleString()}
                          </div>
                          <div className="text-[11px] text-orange-700 mt-0.5">
                            Range: PKR {marketData.pricing.platforms?.daraz_pk?.min_pkr?.toLocaleString() || Math.round((marketData.pricing.tiers?.aftermarket?.min_pkr || 14000) * 0.95).toLocaleString()} - {marketData.pricing.platforms?.daraz_pk?.max_pkr?.toLocaleString() || (marketData.pricing.tiers?.aftermarket?.max_pkr || 22000).toLocaleString()}
                          </div>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <div><b>Condition:</b> Brand New (Depo, Taiwanese & Chinese)</div>
                          <div><b>Delivery:</b> Cash on Delivery across Pakistan</div>
                          <div className="text-[11px] text-orange-950 bg-orange-50 p-2 rounded-lg border border-orange-100">
                            <b>Verdict:</b> Best for Side Mirrors, Tail Lights, Door Handles, Clips & Small Trim with home delivery.
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <a
                          href={marketData.pricing.platforms?.daraz_pk?.url || `https://www.daraz.pk/catalog/?q=${encodeURIComponent(marketData.pricing.vehicle + " " + marketData.pricing.part)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Search on Daraz.pk</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    </div>

                    {/* 5. ALIEXPRESS GLOBAL AUTOMOTIVE */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-rose-500 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md border border-rose-200">
                            AliExpress Global
                          </span>
                          <span className="text-[11px] font-bold text-rose-700">International Direct</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mt-2">Worldwide Direct Factory Parts</h4>
                        <div className="my-2.5 p-3 bg-rose-50/70 rounded-xl border border-rose-100">
                          <div className="text-[11px] text-rose-700 font-medium">Estimated PKR Equivalent:</div>
                          <div className="text-2xl font-black text-rose-950">
                            PKR {marketData.pricing.platforms?.aliexpress_global?.avg_pkr?.toLocaleString() || Math.round((marketData.pricing.tiers?.aftermarket?.avg_pkr || 18000) * 0.90).toLocaleString()}
                          </div>
                          <div className="text-[11px] text-rose-700 mt-0.5">
                            Range: PKR {marketData.pricing.platforms?.aliexpress_global?.min_pkr?.toLocaleString() || Math.round((marketData.pricing.tiers?.aftermarket?.min_pkr || 14000) * 0.85).toLocaleString()} - {marketData.pricing.platforms?.aliexpress_global?.max_pkr?.toLocaleString() || Math.round((marketData.pricing.tiers?.aftermarket?.max_pkr || 22000) * 1.15).toLocaleString()}
                          </div>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <div><b>Condition:</b> Brand New Factory Direct (Global)</div>
                          <div><b>Delivery:</b> Direct Shipping to Pakistan (7-18 Days)</div>
                          <div className="text-[11px] text-rose-950 bg-rose-50 p-2 rounded-lg border border-rose-100">
                            <b>Verdict:</b> 🌍 Best for hard-to-find Japanese / Korean imported car parts, sensors & LEDs if unavailable locally.
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <a
                          href={marketData.pricing.platforms?.aliexpress_global?.url || marketData.pricing.marketplace_links?.aliexpress_search}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Search on AliExpress Global</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    </div>

                    {/* 6. EBAY MOTORS GLOBAL */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-blue-600 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">
                            eBay Motors Global
                          </span>
                          <span className="text-[11px] font-bold text-blue-700">Worldwide Salvage</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mt-2">Global Dismantling & OEM Hub</h4>
                        <div className="my-2.5 p-3 bg-blue-50/70 rounded-xl border border-blue-100">
                          <div className="text-[11px] text-blue-700 font-medium">Estimated Global OEM Price:</div>
                          <div className="text-2xl font-black text-blue-950">
                            PKR {marketData.pricing.platforms?.ebay_motors?.avg_pkr?.toLocaleString() || marketData.pricing.tiers?.oem_genuine?.avg_pkr?.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-blue-700 mt-0.5">
                            Range: PKR {marketData.pricing.platforms?.ebay_motors?.min_pkr?.toLocaleString() || marketData.pricing.tiers?.oem_genuine?.min_pkr?.toLocaleString()} - {marketData.pricing.platforms?.ebay_motors?.max_pkr?.toLocaleString() || marketData.pricing.tiers?.oem_genuine?.max_pkr?.toLocaleString()}
                          </div>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <div><b>Condition:</b> OEM Authentic / Surplus Dismantling</div>
                          <div><b>Delivery:</b> International DHL / Global Courier</div>
                          <div className="text-[11px] text-blue-950 bg-blue-50 p-2 rounded-lg border border-blue-100">
                            <b>Verdict:</b> 🌍 Universal global catalog for all international vehicles, Japanese, German, American, Korean.
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <a
                          href={marketData.pricing.platforms?.ebay_motors?.url || marketData.pricing.marketplace_links?.ebay_search}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Search on eBay Motors Global</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    </div>

                    {/* 7. LOCAL WORKSHOPS & PHYSICAL MARKETS */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-slate-800 flex flex-col justify-between md:col-span-2 lg:col-span-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
                            Local Scrap Markets & 3S Workshops
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">Physical Wholesale</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mt-2">
                          Direct Walk-In Wholesale Hubs (Bargaining & Immediate Fitment)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2.5">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="text-[11px] text-slate-500 font-medium">Kabli Wholesale Range:</div>
                            <div className="text-xl font-black text-slate-900">
                              PKR {((marketData.pricing.tiers?.used_kabli?.min_pkr || 12000) - 1000).toLocaleString()} - {marketData.pricing.tiers?.used_kabli?.max_pkr?.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-500">Bilal Ganj / Shershah counter bargaining</div>
                          </div>
                          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="text-[11px] text-blue-700 font-medium">OEM Dealership Counter:</div>
                            <div className="text-xl font-black text-blue-950">
                              PKR {marketData.pricing.tiers?.oem_genuine?.min_pkr?.toLocaleString()} - {marketData.pricing.tiers?.oem_genuine?.max_pkr?.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-blue-600">Authorized 3S Parts Counter (Indus/Atlas/Pak Suzuki)</div>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs text-slate-600">
                          <div><b>Wholesale Hubs:</b> Lahore (Bilal Ganj & Montgomery Rd), Karachi (Shershah & Plaza), Rawalpindi (Sultan Ka Khoo)</div>
                          <div className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <b>Verdict:</b> Best if you want your denter to physically inspect the alignment and color code before paying cash.
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-500">Walk-in inspection & fitting available</span>
                        <button
                          onClick={() => setActiveTab("workshops")}
                          className="py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>View Nearby 3S Workshops</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PURCHASE DECISION & BUYER GUIDE */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-slate-900">
                        Which Platform Should You Purchase From? (Decision Guide)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Smart recommendation based on budget, part type, and quality requirements.
                      </p>
                    </div>
                  </div>

                  {/* Recommendation Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200">
                      <div className="font-bold text-amber-900 mb-1 flex items-center space-x-1">
                        <span>🛒 Buy on OLX / Bilal Ganj When:</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        You need <b>Door Panels, Bonnets, or Boot Lids</b>. Original factory Kabli sheet metal from scrap cars retains standard factory gauge thickness and passes paint meter inspections.
                      </p>
                    </div>

                    <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-300 ring-1 ring-emerald-400">
                      <div className="font-bold text-emerald-950 mb-1 flex items-center space-x-1">
                        <span>⭐ Buy on PakWheels / Auto Axis When:</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        You need <b>Bumpers, Fenders, Grills, or Mirrors</b>. Taiwanese Depo parts fit 95% accurately, arrive brand new in box, and save you 45% compared to OEM dealerships.
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200">
                      <div className="font-bold text-blue-900 mb-1 flex items-center space-x-1">
                        <span>🛡️ Buy OEM at 3S Dealerships When:</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        You need <b>Headlights, Taillights, or Windshields</b>, or are filing an <b>Insurance Claim</b>. Cheap replica headlights turn yellow in 6 months; OEM maintains crystal clarity and resale value.
                      </p>
                    </div>
                  </div>
                </div>

                {/* LIVE SCRAPED MARKETPLACE LISTINGS (PAKWHEELS & OLX) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-red-100 text-red-700 rounded-xl">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-base text-slate-900">
                            Live Scraped PakWheels AutoStore Listings
                          </h4>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            <span>Live Scraper Active</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {marketData.live_scraper?.status_message || "Real-time scraped replacement parts from PakWheels and Pakistani automotive classifieds."}
                        </p>
                      </div>
                    </div>

                    {marketData.live_scraper?.live_stats?.live_avg_pkr && (
                      <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-right">
                        <div className="text-[10px] text-slate-500 font-semibold uppercase">Scraped Live Average</div>
                        <div className="text-base font-black text-emerald-700">
                          PKR {marketData.live_scraper.live_stats.live_avg_pkr.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Listings Grid */}
                  {marketData.live_scraper?.listings && marketData.live_scraper.listings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {marketData.live_scraper.listings.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-emerald-400 rounded-xl p-4 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-black px-2 py-0.5 rounded-md">
                                {item.source}
                              </span>
                              <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-[120px]">{item.location || "Pakistan"}</span>
                              </span>
                            </div>

                            {item.image && (
                              <div className="w-full h-32 bg-slate-200 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              </div>
                            )}

                            <h5 className="font-bold text-xs text-slate-900 line-clamp-2 leading-relaxed mb-2">
                              {item.title}
                            </h5>
                          </div>

                          <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between mt-2">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-semibold">Price:</span>
                              <span className="text-sm font-black text-emerald-800">
                                {item.price}
                              </span>
                            </div>

                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-sm"
                            >
                              <span>View Ad</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <ShoppingCart className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700 mb-1">
                        No direct scraped listings returned for this specific term.
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-md mx-auto mb-4">
                        You can search directly on PakWheels or OLX with one click using the direct search links below:
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {marketData.live_scraper?.direct_search_links && (
                          <>
                            <a
                              href={marketData.live_scraper.direct_search_links.pakwheels}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-lg shadow flex items-center space-x-1.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>{marketData.live_scraper.direct_search_links.pakwheels_label}</span>
                            </a>
                            <a
                              href={marketData.live_scraper.direct_search_links.olx}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow flex items-center space-x-1.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>{marketData.live_scraper.direct_search_links.olx_label}</span>
                            </a>
                            {marketData.live_scraper.direct_search_links.aliexpress && (
                              <a
                                href={marketData.live_scraper.direct_search_links.aliexpress}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow flex items-center space-x-1.5"
                              >
                                <Globe className="w-3.5 h-3.5" />
                                <span>Search AliExpress (Global)</span>
                              </a>
                            )}
                            {marketData.live_scraper.direct_search_links.ebay && (
                              <a
                                href={marketData.live_scraper.direct_search_links.ebay}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow flex items-center space-x-1.5"
                              >
                                <Globe className="w-3.5 h-3.5" />
                                <span>Search eBay Motors (Global)</span>
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 4: WORKSHOPS */}
        {activeTab === "workshops" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Recommended 3S Dealerships & Collision Repair Workshops ({city})
                </h3>
                <p className="text-xs text-slate-500">
                  Real registered collision facilities equipped with computerized paint booths, frame alignment, and certified denters.
                </p>
              </div>
              <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 shadow-sm self-start sm:self-auto">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-slate-500 font-semibold">City:</span>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-transparent border-none outline-none font-bold text-emerald-800 cursor-pointer"
                >
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Karachi">Karachi</option>
                  <option value="Peshawar">Peshawar</option>
                  <option value="Faisalabad">Faisalabad</option>
                  <option value="Multan">Multan</option>
                  <option value="Gujranwala">Gujranwala</option>
                  <option value="Sialkot">Sialkot</option>
                  <option value="Quetta">Quetta</option>
                  <option value="Abbottabad">Abbottabad</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {workshops.map((w) => (
                <div key={w.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {w.type}
                      </span>
                      <span className="text-xs font-bold text-amber-600">★ {w.rating} ({w.reviews_count})</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 leading-snug">{w.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{w.address}</p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {w.specialties?.map((s, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">{w.phone}</span>
                    <a
                      href={w.google_maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1"
                    >
                      <span>Directions</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: UNSEEN DATA TESTING LAB */}
        {activeTab === "unseen_lab" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Generalization on Unseen Crash Data</span>
                </div>
                <h3 className="font-extrabold text-lg text-slate-900">Unseen Dataset Benchmark Suite</h3>
                <p className="text-xs text-slate-600 max-w-xl mt-1 leading-relaxed">
                  Evaluates the trained YOLOv11 model on completely unseen real-world vehicle crash photographs
                  that were held out from training. Computes Precision, Recall, F1-Score, and mAP@0.5.
                </p>
              </div>

              <button
                onClick={runUnseenBenchmark}
                disabled={benchLoading}
                className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center space-x-2 whitespace-nowrap disabled:opacity-50"
              >
                {benchLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Evaluating Test Images...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    <span>Run Unseen Benchmark (All Test Images)</span>
                  </>
                )}
              </button>
            </div>

            {benchmarkResult && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Precision</span>
                    <div className="text-2xl font-black text-emerald-700 mt-1">
                      {benchmarkResult.summary_metrics?.precision}%
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Recall</span>
                    <div className="text-2xl font-black text-blue-700 mt-1">
                      {benchmarkResult.summary_metrics?.recall}%
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500">F1-Score</span>
                    <div className="text-2xl font-black text-purple-700 mt-1">
                      {benchmarkResult.summary_metrics?.f1_score}%
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500">mAP@0.5</span>
                    <div className="text-2xl font-black text-amber-700 mt-1">
                      {benchmarkResult.summary_metrics?.map_50}%
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Avg Confidence</span>
                    <div className="text-2xl font-black text-slate-800 mt-1">
                      {benchmarkResult.summary_metrics?.avg_confidence}%
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Latency / Img</span>
                    <div className="text-2xl font-black text-slate-800 mt-1">
                      {benchmarkResult.summary_metrics?.avg_inference_latency_ms}ms
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h4 className="font-bold text-base text-slate-900">
                    Unseen Test Cases: Ground Truth vs Model Predictions
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {benchmarkResult.unseen_test_cases?.map((tc) => (
                      <div key={tc.test_id} className="p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-slate-900">{tc.name}</span>
                            <span className="text-[10px] font-bold text-slate-500">{tc.inference_time_ms} ms</span>
                          </div>
                          <span className="text-xs text-slate-500">Vehicle: {tc.vehicle}</span>

                          <div className="mt-3 space-y-1.5 text-xs">
                            <div className="p-2 rounded bg-slate-50 border border-slate-200">
                              <span className="font-bold text-slate-700 block mb-1">Ground Truth Damaged Parts:</span>
                              <div className="flex flex-wrap gap-1">
                                {tc.ground_truth_parts?.map((gt, i) => (
                                  <span key={i} className="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.5 rounded font-medium">
                                    {gt}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                              <span className="font-bold text-emerald-900 block mb-1">YOLOv11 Detected Parts:</span>
                              <div className="flex flex-wrap gap-1">
                                {tc.detected_parts?.map((det, i) => (
                                  <span key={i} className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                                    {det}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {tc.annotated_image_base64 && (
                          <div className="bg-slate-950 rounded-lg overflow-hidden h-36 flex items-center justify-center">
                            <img src={tc.annotated_image_base64} alt={tc.name} className="h-full object-contain" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB: MY INSPECTION HISTORY */}
        {activeTab === "my_inspections" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-emerald-100 p-2.5 rounded-xl">
                    <ClipboardList className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">My Inspection History</h2>
                    <p className="text-xs text-slate-500">All vehicle damage assessments saved to your account</p>
                  </div>
                </div>
                <button
                  onClick={fetchMyInspections}
                  disabled={inspectionsLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-xl hover:bg-emerald-800 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${inspectionsLoading ? "animate-spin" : ""}`} />
                  <span>{inspectionsLoading ? "Loading..." : "Refresh"}</span>
                </button>
              </div>
            </div>

            {/* DB not configured warning */}
            {inspectionsError && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800 text-sm">History Unavailable</p>
                  <p className="text-xs text-amber-700 mt-1">{inspectionsError}</p>
                  {inspectionsError.includes("MongoDB") || inspectionsError.includes("Database") ? (
                    <div className="mt-3 p-3 bg-white border border-amber-200 rounded-xl text-xs text-slate-700 space-y-1.5">
                      <p className="font-bold text-amber-800">🔧 How to fix MongoDB Atlas connection:</p>
                      <ol className="list-decimal ml-4 space-y-1">
                        <li>Go to <a href="https://cloud.mongodb.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">cloud.mongodb.com</a></li>
                        <li>Select your cluster → <strong>Security → Network Access</strong></li>
                        <li>Click <strong>"ADD IP ADDRESS"</strong></li>
                        <li>Click <strong>"ALLOW ACCESS FROM ANYWHERE"</strong> (adds <code>0.0.0.0/0</code>)</li>
                        <li>Confirm and wait 60 seconds</li>
                        <li>Restart your backend server</li>
                      </ol>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {inspectionsLoading && !inspectionsError && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-2/3 mb-2" />
                    <div className="h-8 bg-slate-100 rounded-lg mt-4" />
                  </div>
                ))}
              </div>
            )}

            {/* No inspections yet */}
            {!inspectionsLoading && !inspectionsError && myInspections.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <div className="inline-flex bg-slate-100 p-4 rounded-2xl mb-4">
                  <ClipboardList className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-slate-700 font-semibold text-lg mb-1">No Inspections Yet</h3>
                <p className="text-slate-500 text-sm mb-4">
                  Run a vehicle damage inspection and it will automatically be saved here.
                </p>
                <button
                  onClick={() => setActiveTab("inspection")}
                  className="px-5 py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-xl hover:bg-emerald-800 transition"
                >
                  Start Inspection
                </button>
              </div>
            )}

            {/* Inspection cards grid */}
            {!inspectionsLoading && !inspectionsError && myInspections.length > 0 && (
              <>
                <p className="text-xs text-slate-500 font-medium">
                  Showing {myInspections.length} most recent inspection{myInspections.length !== 1 ? "s" : ""}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {myInspections.map((insp) => {
                    const veh = insp.vehicle || {};
                    const vehicleName = [veh.make, veh.model].filter(Boolean).join(" ") || "Unknown Vehicle";
                    const severity = insp.overall_severity || "Unknown";
                    const severityColor = {
                      "Severe": "bg-red-100 text-red-800 border-red-200",
                      "Moderate": "bg-amber-100 text-amber-800 border-amber-200",
                      "Minor": "bg-blue-100 text-blue-800 border-blue-200",
                      "Pristine": "bg-emerald-100 text-emerald-800 border-emerald-200",
                    }[severity] || "bg-slate-100 text-slate-700 border-slate-200";
                    const dateStr = insp.created_at
                      ? new Date(insp.created_at).toLocaleString("en-PK", {
                          dateStyle: "medium", timeStyle: "short"
                        })
                      : "Unknown date";

                    return (
                      <div
                        key={insp.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden"
                      >
                        {/* Card Header */}
                        <div className="p-4 border-b border-slate-100">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center space-x-2 min-w-0">
                              <div className="bg-emerald-100 p-1.5 rounded-lg flex-shrink-0">
                                <Car className="w-4 h-4 text-emerald-700" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-sm truncate">{vehicleName}</p>
                                <p className="text-[10px] text-slate-500 truncate">{insp.city || "Unknown City"}</p>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full border flex-shrink-0 ${severityColor}`}>
                              {severity}
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 space-y-3">
                          {/* Date */}
                          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{dateStr}</span>
                          </div>

                          {/* Damage count */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">Damages Detected</span>
                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                              {insp.total_damages || 0}
                            </span>
                          </div>

                          {/* Estimate */}
                          {insp.consensus_estimate && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600">Repair Estimate</span>
                              <span className="font-bold text-emerald-700">
                                PKR {(insp.consensus_estimate?.min_pkr || 0).toLocaleString()} –{" "}
                                {(insp.consensus_estimate?.max_pkr || 0).toLocaleString()}
                              </span>
                            </div>
                          )}

                          {/* Detected parts */}
                          {insp.detections && insp.detections.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {insp.detections.slice(0, 3).map((det, i) => (
                                <span key={i} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-medium">
                                  {det.part || det.label || "Part"}
                                </span>
                              ))}
                              {insp.detections.length > 3 && (
                                <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">
                                  +{insp.detections.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* View detail toggle */}
                          <button
                            onClick={() => setInspectionDetail(inspectionDetail?.id === insp.id ? null : insp)}
                            className="w-full mt-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl py-2 transition"
                          >
                            {inspectionDetail?.id === insp.id ? "Hide Details ▲" : "View Full Details ▼"}
                          </button>

                          {/* Expanded details */}
                          {inspectionDetail?.id === insp.id && (
                            <div className="mt-2 space-y-2 text-xs border-t border-slate-100 pt-3">
                              {insp.internal_damages && insp.internal_damages.length > 0 && (
                                <div>
                                  <p className="font-semibold text-slate-700 mb-1">Internal Damages:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {insp.internal_damages.map((d, i) => (
                                      <span key={i} className="bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-[10px] border border-red-200">
                                        {typeof d === "object" && d !== null ? (d.name || d.part || d.damage_nature || d.description || "Internal Damage") : String(d ?? "Internal Damage")}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {insp.image_filename && (
                                <div className="flex items-center space-x-1.5 text-slate-500">
                                  <Camera className="w-3 h-3" />
                                  <span className="truncate">{insp.image_filename}</span>
                                </div>
                              )}
                              {insp.id && (
                                <div className="font-mono text-[9px] text-slate-400 break-all">
                                  ID: {insp.id}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        AutoDamage AI Pakistan — Engineered with YOLOv11 & Google Gemini Multi-Agent Layer
      </footer>
    </div>
  );
}

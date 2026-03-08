"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

// Constants
const ANALYSIS_DURATION = 3000;
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Components
const ImagePreview = ({ src, alt }) => (
  <div className="relative w-20 h-20 border-2 border-green-400 rounded-lg overflow-hidden shadow-sm">
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes="80px"
    />
  </div>
);

const ResultsSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="h-16 bg-gray-200 rounded"></div>
        <div className="h-16 bg-gray-200 rounded"></div>
      </div>
      <div className="h-12 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const StatusIndicator = ({ status }) => {
  const config = {
    idle: { color: 'bg-gray-400', text: 'Ready' },
    processing: { color: 'bg-blue-500', text: 'Processing' },
    complete: { color: 'bg-green-500', text: 'Complete' }
  };

  const { color, text } = config[status];

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${color} animate-pulse`}></div>
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
};

const UploadSection = ({ 
  selectedImage, 
  uploadError, 
  isProcessing, 
  onImageUpload, 
  onResetAnalysis,
  onDrop,
  onDragOver 
}) => {
  const handleFileInputChange = (event) => {
    onImageUpload(event);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <span className="text-green-600 font-bold">↑</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Upload CT Scan</h2>
      </div>

      <div 
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 transition-all cursor-pointer bg-gray-50/50"
        onDrop={onDrop}
        onDragOver={onDragOver}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && document.getElementById('image-upload')?.click()}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          id="image-upload"
          disabled={isProcessing}
        />
        <label htmlFor="image-upload" className="cursor-pointer block">
          <div className="text-4xl mb-3 text-gray-400">📁</div>
          <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
          <p className="text-sm text-gray-400 mt-1">Supports JPG, PNG formats (Max 10MB)</p>
          <div className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg inline-block text-sm font-medium hover:bg-blue-600 transition-colors">
            Choose File
          </div>
        </label>
      </div>

      {uploadError && (
        <div className="bg-red-50 rounded-xl p-4 border border-red-200 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <p className="text-red-700 font-semibold">Upload Error</p>
          </div>
          <p className="text-red-600 text-sm mt-1">{uploadError}</p>
        </div>
      )}

      {selectedImage && (
        <div className="bg-green-50 rounded-xl p-4 border border-green-200 mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <p className="text-green-700 font-semibold">Image Ready for Analysis</p>
            </div>
            <button
              onClick={onResetAnalysis}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Remove
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <ImagePreview src={selectedImage} alt="Uploaded CT Scan" />
            <div className="text-sm text-gray-600">
              <p>CT scan loaded successfully</p>
              <p className="text-green-600 font-medium">Ready to analyze</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ResultsSection = ({ result, isProcessing }) => {
  if (isProcessing) {
    return <ResultsSkeleton />;
  }

  if (!result) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <span className="text-orange-600 font-bold">📊</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Diagnosis Results</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Diagnosis</p>
          <p
            className={`text-xl font-bold ${
              result.diagnosis === "Malignant" ? "text-red-600" : "text-green-600"
            }`}
          >
            {result.diagnosis}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Confidence</p>
          <p className="text-xl font-bold text-blue-600">{result.confidence}%</p>
        </div>
      </div>
      
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Analysis Explanation</h3>
        <p className="text-blue-700 leading-relaxed">{result.explanation}</p>
      </div>

      <div className="mt-4 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-1">Next Steps</h3>
        <p className="text-yellow-700 text-sm leading-relaxed">
          {result.diagnosis === "Malignant" 
            ? "Schedule an appointment with an oncologist for further evaluation and discuss potential biopsy options."
            : "Continue with regular monitoring and follow your healthcare provider's recommended screening schedule."
          }
        </p>
      </div>
    </div>
  );
};

const VisualizationSection = ({ isProcessing, result, selectedImage }) => {
  if (isProcessing) {
    return (
      <div className="text-center">
        <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-blue-600 font-semibold mb-2">Analyzing CT Scan...</p>
        <p className="text-gray-500 text-sm">This may take a few moments</p>
        <div className="mt-4 w-48 bg-gray-200 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full animate-pulse w-3/4"></div>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="text-center">
        <div className={`text-6xl mb-4 ${result.diagnosis === "Malignant" ? "text-red-500" : "text-green-500"}`}>
          {result.diagnosis === "Malignant" ? "⚠️" : "✅"}
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Analysis Complete</h3>
        <p className="text-gray-600">
          The AI model has finished processing your CT scan.
        </p>
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-500">Confidence Level</p>
          <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${result.confidence}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">{result.confidence}%</p>
        </div>
      </div>
    );
  }

  // Show nothing initially - clean empty state
  return (
    <div className="text-center text-gray-400">
      <div className="text-6xl mb-4">🔬</div>
      <p className="text-lg">Upload a CT scan to begin analysis</p>
    </div>
  );
};

export default function Main() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const handleImageUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate file type
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      setUploadError('Please upload a valid image file (JPEG or PNG)');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File size too large. Please upload an image under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result);
      setResult(null);
    };
    reader.onerror = () => {
      setUploadError('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
  }, []);

  const runModel = useCallback(async () => {
    if (!selectedImage) {
      alert("Please upload an image first.");
      return;
    }

    setIsProcessing(true);
    setResult(null);
    setUploadError(null);

    try {
      // Simulated API call - replace with actual API integration
      const analysisResult = await new Promise((resolve) => {
        setTimeout(() => {
          const randomResult = Math.random() > 0.5 ? "Malignant" : "Benign";
          const confidence = (Math.random() * 30 + 70).toFixed(2);

          resolve({
            diagnosis: randomResult,
            confidence: confidence,
            explanation:
              randomResult === "Malignant"
                ? "The model detected patterns consistent with malignant tissue. Further medical evaluation and biopsy are recommended. Please consult with an oncologist for proper diagnosis and treatment planning."
                : "The model detected patterns consistent with benign tissue. Regular follow-up and monitoring are advised. Continue with routine screenings as recommended by your healthcare provider.",
          });
        }, ANALYSIS_DURATION);
      });

      setResult(analysisResult);
    } catch (error) {
      setUploadError('Analysis failed. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedImage]);

  const resetAnalysis = useCallback(() => {
    setSelectedImage(null);
    setResult(null);
    setUploadError(null);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = document.getElementById('image-upload');
      if (input) {
        input.files = e.dataTransfer.files;
        const event = { target: { files: e.dataTransfer.files } };
        handleImageUpload(event);
      }
    }
  }, [handleImageUpload]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-bold">AI</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LungCancerDetect AI
              </h1>
              <p className="text-sm text-gray-500">Medical Imaging Analysis</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <StatusIndicator status={isProcessing ? 'processing' : result ? 'complete' : 'idle'} />
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Powered by EfficientNet-B0
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left Section */}
        <div className="space-y-6">
          {/* About Model */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">i</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">About the Model</h2>
            </div>
            <div className="space-y-3">
              <p className="text-gray-600 leading-relaxed">
                This AI model uses <span className="text-blue-600 font-semibold">EfficientNet-B0</span> architecture,
                trained on lung CT scans to detect possible cancerous tissues with high accuracy.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">Important Disclaimer</h3>
                <p className="text-blue-700 text-sm leading-relaxed">
                  This tool is for research and educational purposes only. It should not be used as a substitute for professional medical diagnosis. Always consult qualified healthcare providers for medical decisions.
                </p>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <UploadSection
            selectedImage={selectedImage}
            uploadError={uploadError}
            isProcessing={isProcessing}
            onImageUpload={handleImageUpload}
            onResetAnalysis={resetAnalysis}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          />

          {/* Controls */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold">▶</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Analysis Controls</h2>
            </div>
            <button
              onClick={runModel}
              disabled={isProcessing || !selectedImage}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none shadow-lg disabled:shadow-none disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing CT Scan...</span>
                </div>
              ) : (
                "Run Cancer Detection Analysis"
              )}
            </button>
          </div>

          {/* Results */}
          <ResultsSection result={result} isProcessing={isProcessing} />
        </div>

        {/* Right Section (Processing visualization) */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center min-h-[400px]">
          <VisualizationSection 
            isProcessing={isProcessing} 
            result={result} 
            selectedImage={selectedImage}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2024 LungCancerDetect AI. For research and educational purposes only.</p>
            <p className="mt-2">Always consult healthcare professionals for medical diagnosis and treatment.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
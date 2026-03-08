"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setExplanation(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
      setResult(null);
      setExplanation(null);
    }
  };

  // Get AI explanation from backend
  const getAIExplanation = async (diagnosis, confidence) => {
    setExplanationLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          diagnosis: diagnosis,
          confidence: confidence
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setExplanation(data.explanation);
    } catch (error) {
      console.error("Error getting AI explanation:", error);
      // Fallback explanation
      setExplanation({
        features: ["Cellular morphology analysis", "Tissue architecture assessment", "Nuclear characteristics evaluation"],
        reasoning: `Based on the AI analysis, the image shows features consistent with ${result?.type_description?.toLowerCase() || diagnosis?.toLowerCase()}. The model is ${(confidence * 100).toFixed(1)}% confident in this classification.`,
        recommendations: ["Consult with a pathologist for confirmation", "Consider additional imaging if clinically indicated", "Follow standard clinical protocols for this finding"],
        clinical_correlations: "This finding should be interpreted in the context of clinical presentation and other diagnostic tests."
      });
    }
    setExplanationLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please upload an image");

    setLoading(true);
    setResult(null);
    setExplanation(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Get prediction from backend
      const res = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Backend error: ${res.status}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);

      // Get AI explanation from backend
      await getAIExplanation(data.type, data.confidence);
    } catch (err) {
      console.error("Error:", err);
      alert(`Failed to analyze image: ${err.message}`);
    }

    setLoading(false);
  };

  const getResultColor = (type) => {
    switch (type?.toUpperCase()) {
      case "SCC":
      case "ACA":
        return "text-red-600 bg-red-50 border-red-200";
      case "N":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const getResultBadgeColor = (type) => {
    switch (type?.toUpperCase()) {
      case "SCC":
      case "ACA":
        return "bg-red-100 text-red-800";
      case "N":
        return "bg-green-100 text-green-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getResultDisplayName = (type) => {
    switch (type?.toUpperCase()) {
      case "N":
        return "Normal";
      case "SCC":
        return "Squamous Cell Carcinoma";
      case "ACA":
        return "Adenocarcinoma";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col p-6">
      {/* Header */}
      <div className="text-center mb-8 relative overflow-visible">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating particles */}
          <div className="absolute top-10 left-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-float"></div>
          <div className="absolute top-5 right-1/3 w-1 h-1 bg-indigo-400 rounded-full opacity-40 animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-10 left-1/3 w-3 h-3 bg-cyan-400 rounded-full opacity-50 animate-float" style={{ animationDelay: '2s' }}></div>

          {/* Pulsing rings */}
          {/* <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <div className="w-64 h-64 border-2 border-blue-200 rounded-full opacity-20 animate-pulse-slow"></div>
      <div className="w-80 h-80 border-2 border-indigo-200 rounded-full opacity-15 animate-pulse-slow" style={{animationDelay: '1.5s'}}></div>
    </div> */}
        </div>

        {/* Main Header Content */}
        <div className="relative z-10">


          {/* Main Title with Advanced Effects */}
          <div className="mb-4">
            <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent animate-gradient-x">
                Lung Cancer Detection
              </span>
            </h1>

            {/* Subtitle with Model Name */}
            <div className="flex items-center justify-center space-x-4 mb-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-400"></div>
              <p className="text-lg font-semibold text-gray-700 bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-2 rounded-full border border-blue-200 shadow-sm">
                Powered by <span className="text-blue-600 font-bold">EfficientNet-B0</span>
              </p>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-indigo-400"></div>
            </div>
          </div>


        </div>
      </div>

      {/* Main Content - Landscape Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full">
        {/* Left Panel - Upload & Preview */}
        <div className="flex-1 bg-white rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 flex-1 flex flex-col ${dragActive
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center space-y-4 h-full">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-md font-semibold text-gray-700">
                    Drag & drop your image
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    or click to browse files
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium text-sm"
                >
                  Choose File
                </label>
                <p className="text-xs text-gray-400">
                  Supports JPG, PNG, DICOM • Max 10MB
                </p>
              </div>
            </div>

            {/* Image Preview */}
            {preview && (
              <div className="mt-4 space-y-2">
                <h3 className="text-md font-semibold text-gray-800">Image Preview</h3>
                <div className="border rounded-xl overflow-hidden bg-gray-50">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-32 object-contain"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !file}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg mt-4"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing Image...</span>
                </div>
              ) : (
                "Analyze Image"
              )}
            </button>
          </form>
        </div>

        {/* Right Panel - Results & Explainable AI */}
        <div className="flex-1 bg-white rounded-2xl shadow-xl p-6">
          {result ? (
            <div className="h-full flex flex-col">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Analysis Results</h3>

              {/* Diagnosis Result */}
              <div className={`border-2 rounded-xl p-4 mb-4 ${getResultColor(result.type)}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-md font-semibold">Diagnosis</span>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getResultBadgeColor(result.type)}`}>
                    {getResultDisplayName(result.type)}
                  </div>
                </div>

                {result.type_description && (
                  <p className="text-sm text-gray-600 mb-3">{result.type_description}</p>
                )}

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Confidence Level</span>
                      <span>{(result.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ${result.type?.toUpperCase() === "N"
                            ? "bg-green-500"
                            : "bg-red-500"
                          }`}
                        style={{ width: `${result.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* All Predictions */}
                {result.all_predictions && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-2">All Predictions:</p>
                    <div className="space-y-1">
                      {Object.entries(result.all_predictions).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-gray-600">{key.replace(/_/g, ' ')}:</span>
                          <span className="font-medium">{(value * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Explainable AI Section */}
              <div className="flex-1 border-2 border-gray-200 rounded-xl p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  AI Explanation
                  {explanationLoading && (
                    <span className="text-sm text-gray-500 ml-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block mr-1"></div>
                      Generating...
                    </span>
                  )}
                </h4>

                {explanation && !explanationLoading ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <h5 className="font-medium text-blue-800 text-sm mb-1">📊 Key Features Identified</h5>
                      <div className="text-xs text-blue-700">
                        {Array.isArray(explanation.features) ? (
                          <ul className="list-disc list-inside space-y-1">
                            {explanation.features.map((feature, index) => (
                              <li key={index}>{feature}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>{explanation.features}</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-3">
                      <h5 className="font-medium text-green-800 text-sm mb-1">🔍 Medical Reasoning</h5>
                      <p className="text-xs text-green-700">{explanation.reasoning}</p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-3">
                      <h5 className="font-medium text-purple-800 text-sm mb-1">💡 Clinical Recommendations</h5>
                      <div className="text-xs text-purple-700">
                        {Array.isArray(explanation.recommendations) ? (
                          <ul className="list-disc list-inside space-y-1">
                            {explanation.recommendations.map((rec, index) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>{explanation.recommendations}</p>
                        )}
                      </div>
                    </div>

                    {explanation.clinical_correlations && (
                      <div className="bg-orange-50 rounded-lg p-3">
                        <h5 className="font-medium text-orange-800 text-sm mb-1">⚕️ Clinical Correlations</h5>
                        <p className="text-xs text-orange-700">{explanation.clinical_correlations}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  !explanationLoading && (
                    <div className="text-center text-gray-500 text-sm py-8">
                      Generating AI-powered explanation...
                    </div>
                  )
                )}
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 rounded-xl p-3 mt-4">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-gray-600">
                    <strong>Note:</strong> AI explanations powered by Google Gemini. This analysis is for assistance only.
                    Always consult with a healthcare professional for medical diagnosis.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 p-8">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-400 mb-2">No Analysis Yet</h3>
              <p className="text-sm text-gray-400">
                Upload and analyze an image to see detailed results with AI-powered explanations.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-gray-500 text-xs">
        <p>Powered by AI • Google Gemini Explanations • Medical Grade Analysis</p>
      </div>
    </div>
  );
}
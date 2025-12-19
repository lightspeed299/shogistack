import React, { useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverUrl: string;
  setServerUrl: (url: string) => void;
  useGemini: boolean;
  setUseGemini: (val: boolean) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, serverUrl, setServerUrl, useGemini, setUseGemini 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gray-800 p-4 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg">Server Configuration</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Engine Backend</label>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setUseGemini(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  useGemini ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Gemini Cloud
              </button>
              <button 
                onClick={() => setUseGemini(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  !useGemini ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Home Server
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {useGemini 
                ? "Simulates a powerful AI using Google's Gemini models." 
                : "Connects to your local machine running USI engines (e.g. YaneuraOu)."
              }
            </p>
          </div>

          {/* Server URL Input */}
          <div className={`transition-opacity duration-200 ${useGemini ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Local Server URL</label>
            <input 
              type="text" 
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://192.168.1.15:5000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button 
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg shadow-sm transition-colors"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

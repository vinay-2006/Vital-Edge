import React from 'react';
import { Mode } from '../lib/types';

interface AmbulanceModeToggleProps {
  mode: Mode;
  etaMinutes: number;
  onModeChange: (mode: Mode) => void;
  onEtaChange: (eta: number) => void;
}

export function AmbulanceModeToggle({
  mode,
  etaMinutes,
  onModeChange,
  onEtaChange,
}: AmbulanceModeToggleProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-2 border-blue-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Triage Mode</h3>

      <div className="flex gap-4 mb-4">
        <button
          type="button"
          onClick={() => onModeChange('HOSPITAL')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            mode === 'HOSPITAL'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🏥</span>
            <span>Hospital Mode</span>
          </div>
          <p className="text-xs mt-1 opacity-80">
            Complete patient assessment
          </p>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('AMBULANCE')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            mode === 'AMBULANCE'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🚑</span>
            <span>Ambulance Mode</span>
          </div>
          <p className="text-xs mt-1 opacity-80">
            Fast-track emergency pre-triage
          </p>
        </button>
      </div>

      {mode === 'AMBULANCE' && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <span>⏱️</span>
              <span>Estimated Time of Arrival (ETA)</span>
            </span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="300"
              value={etaMinutes}
              onChange={(e) => onEtaChange(parseInt(e.target.value) || 0)}
              className="flex-1 px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter ETA in minutes"
            />
            <span className="text-gray-600 font-medium">minutes</span>
          </div>
          <p className="text-xs text-red-600 mt-2">
            Hospital will be alerted for immediate preparation
          </p>
        </div>
      )}
    </div>
  );
}

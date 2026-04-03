import React from 'react';
import { ExplainabilityData } from '../lib/types';

interface ExplainabilityPanelProps {
  explainability: ExplainabilityData;
  priority: 'CRITICAL' | 'MODERATE' | 'STABLE';
}

export function ExplainabilityPanel({ explainability, priority }: ExplainabilityPanelProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-2 border-purple-200">
      <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        <span>🧠</span>
        <span>AI Decision Transparency</span>
      </h3>

      {/* Main Reasoning */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="text-lg">💡</span>
          <span>Why this priority?</span>
        </h4>
        <ul className="space-y-2">
          {explainability.reasoning.map((reason, index) => (
            <li key={index} className="flex gap-2">
              <span className="text-purple-600 font-bold">•</span>
              <span className="text-gray-700">{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Why Not Critical Section */}
      {priority !== 'CRITICAL' && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
            <span className="text-lg">🔴</span>
            <span>Why not CRITICAL?</span>
          </h4>
          <p className="text-gray-700 text-sm">{explainability.whyNotRed}</p>
        </div>
      )}

      {/* Why Not Stable Section */}
      {priority !== 'STABLE' && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
            <span className="text-lg">🟢</span>
            <span>Why not STABLE?</span>
          </h4>
          <p className="text-gray-700 text-sm">{explainability.whyNotGreen}</p>
        </div>
      )}

      {/* Ethics & Bias Transparency */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
          <span className="text-lg">⚖️</span>
          <span>Ethics & Fairness Statement</span>
        </h4>
        <p className="text-gray-700 text-sm italic">{explainability.biasNote}</p>
      </div>
    </div>
  );
}

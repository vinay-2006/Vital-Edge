import React from 'react';
import { RiskAssessment, DeteriorationRisk } from '../lib/types';

interface RiskAssessmentCardProps {
  riskAssessment: RiskAssessment;
}

function getRiskBadgeColor(risk: DeteriorationRisk): string {
  switch (risk) {
    case 'HIGH':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'MEDIUM':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'LOW':
      return 'bg-green-100 text-green-800 border-green-300';
  }
}

function getRiskIcon(risk: DeteriorationRisk): string {
  switch (risk) {
    case 'HIGH':
      return '🚨';
    case 'MEDIUM':
      return '⚠️';
    case 'LOW':
      return '✅';
  }
}

export function RiskAssessmentCard({ riskAssessment }: RiskAssessmentCardProps) {
  const { deteriorationRisk, riskTimeframe, riskIndicators, preparationNotes } = riskAssessment;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-2 border-orange-200">
      <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        <span>📊</span>
        <span>Risk Assessment & Preparation</span>
      </h3>

      {/* Deterioration Risk Badge */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Deterioration Risk Level</h4>
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-bold text-lg ${getRiskBadgeColor(
            deteriorationRisk
          )}`}
        >
          <span className="text-2xl">{getRiskIcon(deteriorationRisk)}</span>
          <span>{deteriorationRisk} RISK</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          <span className="font-semibold">Expected timeframe:</span> {riskTimeframe}
        </p>
      </div>

      {/* Risk Indicators */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span>Risk Indicators</span>
        </h4>
        <ul className="space-y-2">
          {riskIndicators.map((indicator, index) => (
            <li key={index} className="flex gap-2">
              <span className="text-orange-600 font-bold">▸</span>
              <span className="text-gray-700 text-sm">{indicator}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Preparation Notes */}
      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-300">
        <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
          <span className="text-lg">📋</span>
          <span>Hospital Preparation Checklist</span>
        </h4>
        <ul className="space-y-2">
          {preparationNotes.map((note, index) => (
            <li key={index} className="flex gap-2">
              <span className="text-yellow-700">✓</span>
              <span className="text-gray-700 text-sm">{note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

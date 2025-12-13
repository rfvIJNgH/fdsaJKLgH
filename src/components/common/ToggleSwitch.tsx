import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: () => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange }) => (
  <button
    onClick={onChange}
    className={`w-12 h-6 rounded-full transition-colors ${
      enabled ? "bg-purple-600" : "bg-gray-600"
    }`}
  >
    <div
      className={`w-5 h-5 bg-white rounded-full transition-transform ${
        enabled ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);
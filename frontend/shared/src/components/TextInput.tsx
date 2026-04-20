import React from "react";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const TextInput: React.FC<TextInputProps> = ({ label, className = "", ...props }) => {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium">{label}</label>}
      <input
        {...props}
        className={`border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${className}`}
      />
    </div>
  );
};
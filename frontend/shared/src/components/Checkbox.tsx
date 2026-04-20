import React from "react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, className = "", ...props }) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" {...props} className={`h-4 w-4 ${className}`} />
      <span>{label}</span>
    </label>
  );
};
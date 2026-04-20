import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select: React.FC<SelectProps> = ({ label, children, className = "", ...props }) => {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium">{label}</label>}
      <select
        {...props}
        className={`border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${className}`}
      >
        {children}
      </select>
    </div>
  );
};
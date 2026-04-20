import React from "react";

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  loading = false,
  className = "",
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 transition ${className}`}
    >
      {loading ? "Loading..." : children}
    </button>
  );
};
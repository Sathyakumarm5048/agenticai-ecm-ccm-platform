import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
}

export const Modal: React.FC<React.PropsWithChildren<ModalProps>> = ({
  open,
  onClose,
  title,
  children,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[400px]">
        {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
        {children}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
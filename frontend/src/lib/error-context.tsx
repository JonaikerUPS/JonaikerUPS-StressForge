"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { GlobalErrorModal } from "@/components/GlobalErrorModal";

interface ErrorContextType {
  showError: (title: string, message: string) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
  const [error, setError] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const showError = (title: string, message: string) => {
    setError({ isOpen: true, title, message });
  };

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      <GlobalErrorModal
        isOpen={error.isOpen}
        title={error.title}
        message={error.message}
        onClose={() => setError({ ...error, isOpen: false })}
      />
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) throw new Error("useError must be used within an ErrorProvider");
  return context;
};

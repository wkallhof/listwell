"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

interface NewListingState {
  photos: File[];
  previewUrls: string[];
  description: string;
}

interface NewListingContextValue extends NewListingState {
  addPhotos: (files: File[]) => void;
  removePhoto: (index: number) => void;
  setDescription: (description: string) => void;
  reset: () => void;
}

const NewListingContext = createContext<NewListingContextValue | null>(null);

interface NewListingProviderProps {
  children: ReactNode;
}

export function NewListingProvider({ children }: NewListingProviderProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const addPhotos = useCallback(
    (files: File[]) => {
      const remaining = 5 - photos.length;
      const newFiles = files.slice(0, remaining);

      setPhotos((prev) => [...prev, ...newFiles]);

      const newUrls = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newUrls]);
    },
    [photos.length],
  );

  const removePhoto = useCallback(
    (index: number) => {
      URL.revokeObjectURL(previewUrls[index]);
      setPhotos((prev) => prev.filter((_, i) => i !== index));
      setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    },
    [previewUrls],
  );

  const reset = useCallback(() => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPhotos([]);
    setPreviewUrls([]);
    setDescription("");
  }, [previewUrls]);

  const value = useMemo(
    () => ({
      photos,
      previewUrls,
      description,
      addPhotos,
      removePhoto,
      setDescription,
      reset,
    }),
    [photos, previewUrls, description, addPhotos, removePhoto, reset],
  );

  return (
    <NewListingContext.Provider value={value}>
      {children}
    </NewListingContext.Provider>
  );
}

export function useNewListing(): NewListingContextValue {
  const context = useContext(NewListingContext);
  if (!context) {
    throw new Error("useNewListing must be used within NewListingProvider");
  }
  return context;
}

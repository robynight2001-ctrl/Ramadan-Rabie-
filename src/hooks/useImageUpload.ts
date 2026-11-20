import {useCallback, useEffect, useRef, useState} from 'react';
import {validateImageFile} from '../lib/api.ts';

export interface StagedPreview {
  file: File;
  previewUrl: string;
  slotKey: string;
}

export interface UploadJobState {
  slotKey: string;
  uploading: boolean;
  progress: number;
  stage: string;
  error: string;
  successMessage: string;
  failedFile: File | null;
}

export function useImageUploadState() {
  const [staged, setStaged] = useState<StagedPreview | null>(null);
  const [job, setJob] = useState<UploadJobState>({
    slotKey: '',
    uploading: false,
    progress: 0,
    stage: '',
    error: '',
    successMessage: '',
    failedFile: null,
  });

  const stagedUrlRef = useRef<string | null>(null);

  const revokeStaged = useCallback(() => {
    if (stagedUrlRef.current) {
      URL.revokeObjectURL(stagedUrlRef.current);
      stagedUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      revokeStaged();
    };
  }, [revokeStaged]);

  const stageFile = useCallback(
    (slotKey: string, file?: File): boolean => {
      if (!file) return false;
      const err = validateImageFile(file);
      if (err) {
        setJob({
          slotKey,
          uploading: false,
          progress: 0,
          stage: '',
          error: err,
          successMessage: '',
          failedFile: null,
        });
        return false;
      }

      revokeStaged();
      const previewUrl = URL.createObjectURL(file);
      stagedUrlRef.current = previewUrl;
      setStaged({file, previewUrl, slotKey});
      setJob({
        slotKey,
        uploading: false,
        progress: 0,
        stage: '',
        error: '',
        successMessage: '',
        failedFile: null,
      });
      return true;
    },
    [revokeStaged]
  );

  const cancelStaged = useCallback(() => {
    revokeStaged();
    setStaged(null);
  }, [revokeStaged]);

  const startUpload = useCallback((slotKey: string) => {
    setJob({
      slotKey,
      uploading: true,
      progress: 5,
      stage: 'Preparing upload...',
      error: '',
      successMessage: '',
      failedFile: null,
    });
  }, []);

  const updateProgress = useCallback((slotKey: string, percent: number, stage: string) => {
    setJob((prev) => ({
      ...prev,
      slotKey,
      uploading: true,
      progress: percent,
      stage,
    }));
  }, []);

  const finishSuccess = useCallback(
    (slotKey: string, message: string) => {
      revokeStaged();
      setStaged(null);
      setJob({
        slotKey,
        uploading: false,
        progress: 100,
        stage: 'Completed',
        error: '',
        successMessage: message,
        failedFile: null,
      });
    },
    [revokeStaged]
  );

  const finishError = useCallback((slotKey: string, message: string, file: File) => {
    setJob({
      slotKey,
      uploading: false,
      progress: 0,
      stage: '',
      error: message,
      successMessage: '',
      failedFile: file,
    });
  }, []);

  const clearFeedback = useCallback(() => {
    setJob((prev) => ({
      ...prev,
      error: '',
      successMessage: '',
      failedFile: null,
    }));
  }, []);

  return {
    staged,
    job,
    stageFile,
    cancelStaged,
    startUpload,
    updateProgress,
    finishSuccess,
    finishError,
    clearFeedback,
  };
}

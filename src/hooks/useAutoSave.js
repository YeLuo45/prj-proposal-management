import { useEffect, useRef, useCallback } from 'react';
import { saveDraft, getDraftKey, getNewDraftKey, clearDraft, loadDraft, listNewDrafts } from '../utils/draftService';
import { saveVersion } from '../utils/versionService';

/**
 * Auto-save hook for proposal form
 * Triggers save every 30 seconds and on page leave
 * 
 * @param {Object} formData - Current form data
 * @param {string|null} proposalId - Proposal ID (null for new proposals)
 * @param {Function} onDraftFound - Callback when draft is found
 * @param {boolean} enabled - Whether auto-save is enabled
 */
export const useAutoSave = (formData, proposalId, onDraftFound, enabled = true) => {
  const timerRef = useRef(null);
  const lastSavedRef = useRef(null);
  const draftKeyRef = useRef(null);

  // Determine draft key
  useEffect(() => {
    if (proposalId) {
      draftKeyRef.current = getDraftKey(proposalId);
    } else {
      draftKeyRef.current = getNewDraftKey();
    }
  }, [proposalId]);

  // Save function
  const save = useCallback(() => {
    if (!enabled || !draftKeyRef.current) return;
    
    const dataToSave = { ...formData };
    const serialized = JSON.stringify(dataToSave);
    
    // Only save if data changed
    if (serialized !== lastSavedRef.current) {
      saveDraft(draftKeyRef.current, dataToSave);
      lastSavedRef.current = serialized;
    }
  }, [formData, enabled]);

  // Save version on formal save (called externally)
  const saveVersionSnapshot = useCallback((label = null) => {
    if (proposalId && formData) {
      saveVersion(proposalId, formData, label);
    }
  }, [proposalId, formData]);

  // 30-second interval save
  useEffect(() => {
    if (!enabled) return;
    
    timerRef.current = setInterval(() => {
      save();
    }, 30000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [enabled, save]);

  // Page leave save (beforeunload)
  useEffect(() => {
    if (!enabled) return;
    
    const handleBeforeUnload = () => {
      save();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, save]);

  // Check for existing draft on mount
  useEffect(() => {
    if (!enabled || !draftKeyRef.current) return;
    
    const existingDraft = loadDraft(draftKeyRef.current);
    if (existingDraft && onDraftFound) {
      onDraftFound(existingDraft, draftKeyRef.current);
    }
  }, [enabled, onDraftFound]);

  // Also check for new proposal drafts
  useEffect(() => {
    if (!enabled || proposalId || !onDraftFound) return;
    
    const newDrafts = listNewDrafts();
    if (newDrafts.length > 0 && onDraftFound) {
      onDraftFound(newDrafts[0], newDrafts[0].key);
    }
  }, [enabled, proposalId, onDraftFound]);

  // Clear draft (call when form is successfully submitted)
  const clearCurrentDraft = useCallback(() => {
    if (draftKeyRef.current) {
      clearDraft(draftKeyRef.current);
    }
  }, []);

  return {
    save,
    saveVersionSnapshot,
    clearCurrentDraft
  };
};

export default useAutoSave;

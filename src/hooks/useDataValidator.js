import { useState, useEffect, useCallback } from 'react';
import { validateProjects } from '../utils/dataValidator';

export function useValidation(projects, milestones) {
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);

  const validate = useCallback(() => {
    if (projects.length > 0) {
      const result = validateProjects(projects, milestones);
      setErrors(result.errors);
      setWarnings(result.warnings);
      return result;
    }
    return { valid: true, errors: [], warnings: [] };
  }, [projects, milestones]);

  useEffect(() => {
    validate();
  }, [validate]);

  return {
    errors,
    warnings,
    validateProjects: validate,
  };
}

import { useState, useEffect } from 'react';
import { getTemplates, saveTemplate, deleteTemplate } from '../utils/filterTemplateStore';

function useFilterTemplate() {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    setTemplates(getTemplates());
  }, []);

  const save = (name, filters) => {
    const result = saveTemplate(name, filters);
    if (result.templates) {
      setTemplates(result.templates);
    }
    return result;
  };

  const remove = (id) => {
    const result = deleteTemplate(id);
    if (result.templates) {
      setTemplates(result.templates);
    }
    return result;
  };

  return { templates, save, remove };
}

export default useFilterTemplate;

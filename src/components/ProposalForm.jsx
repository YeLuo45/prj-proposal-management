import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getAPIKey } from '../utils/aiService';
import { isRTL } from '../i18n';
import MarkdownRenderer from './MarkdownRenderer';
import { useAutoSave } from '../hooks/useAutoSave';
import VersionHistoryDrawer from './VersionHistoryDrawer';

function ProposalForm({
  proposal,
  onSave,
  onClose,
  aiRecommendations,
  setAiRecommendations,
  duplicateWarnings,
  setDuplicateWarnings,
  loadingAI,
  handleAIClassify
}) {
  const { t, i18n } = useTranslation();
  const [activeLangTab, setActiveLangTab] = useState(i18n.language || 'en');
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    nameHe: '',
    description: '',
    descriptionAr: '',
    descriptionHe: '',
    type: 'web',
    status: 'active',
    url: '',
    packageUrl: '',
    tags: [],
    deadline: '',
  });
  const [tagsInput, setTagsInput] = useState('');
  const [descriptionMode, setDescriptionMode] = useState('edit');
  
  // Draft recovery state
  const [showDraftToast, setShowDraftToast] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [draftKey, setDraftKey] = useState(null);
  
  // Version history state
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Language tabs config
  const langTabs = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'zh', label: '中', name: '中文' },
    { code: 'ar', label: 'ع', name: 'العربية', rtl: true },
    { code: 'he', label: 'ע', name: 'עברית', rtl: true },
  ];

  // Auto-save hook
  const handleDraftFound = useCallback((draft, key) => {
    setPendingDraft(draft);
    setDraftKey(key);
    setShowDraftToast(true);
  }, []);

  const { save, saveVersionSnapshot, clearCurrentDraft } = useAutoSave(
    formData,
    proposal?.id || null,
    handleDraftFound,
    true
  );

  useEffect(() => {
    if (proposal) {
      setFormData({
        name: proposal.name || '',
        nameAr: proposal.nameAr || '',
        nameHe: proposal.nameHe || '',
        description: proposal.description || '',
        descriptionAr: proposal.descriptionAr || '',
        descriptionHe: proposal.descriptionHe || '',
        type: proposal.type || 'web',
        status: proposal.status || 'active',
        url: proposal.url || '',
        packageUrl: proposal.packageUrl || '',
        tags: proposal.tags || [],
        deadline: proposal.deadline || '',
      });
      setTagsInput(proposal.tags?.join(', ') || '');
    }
  }, [proposal]);

  // Reset tab when language changes
  useEffect(() => {
    const lang = i18n.language?.split('-')[0] || 'en';
    if (!langTabs.find(t => t.code === lang)) {
      setActiveLangTab('en');
    }
  }, [i18n.language]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNameChange = (e) => {
    const { value } = e.target;
    const nameField = activeLangTab === 'en' ? 'name' :
                      activeLangTab === 'zh' ? 'name' :
                      activeLangTab === 'ar' ? 'nameAr' : 'nameHe';
    setFormData((prev) => ({ ...prev, [nameField]: value }));
  };

  const handleDescriptionChange = (e) => {
    const { value } = e.target;
    const descField = activeLangTab === 'en' ? 'description' :
                      activeLangTab === 'zh' ? 'description' :
                      activeLangTab === 'ar' ? 'descriptionAr' : 'descriptionHe';
    setFormData((prev) => ({ ...prev, [descField]: value }));
  };

  const getCurrentName = () => {
    return activeLangTab === 'en' ? formData.name :
           activeLangTab === 'zh' ? formData.name :
           activeLangTab === 'ar' ? formData.nameAr :
           formData.nameHe;
  };

  const getCurrentDescription = () => {
    return activeLangTab === 'en' ? formData.description :
           activeLangTab === 'zh' ? formData.description :
           activeLangTab === 'ar' ? formData.descriptionAr :
           formData.descriptionHe;
  };

  const handleTagsChange = (e) => {
    setTagsInput(e.target.value);
  };

  // Handle draft recovery
  const handleRestoreDraft = () => {
    if (pendingDraft) {
      setFormData({
        name: pendingDraft.name || '',
        nameAr: pendingDraft.nameAr || '',
        nameHe: pendingDraft.nameHe || '',
        description: pendingDraft.description || '',
        descriptionAr: pendingDraft.descriptionAr || '',
        descriptionHe: pendingDraft.descriptionHe || '',
        type: pendingDraft.type || 'web',
        status: pendingDraft.status || 'active',
        url: pendingDraft.url || '',
        packageUrl: pendingDraft.packageUrl || '',
        tags: pendingDraft.tags || [],
        deadline: pendingDraft.deadline || '',
      });
      setTagsInput(pendingDraft.tags?.join(', ') || '');
    }
    setShowDraftToast(false);
    setPendingDraft(null);
  };

  // Handle dismiss draft
  const handleDismissDraft = () => {
    setShowDraftToast(false);
    setPendingDraft(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);
    const dataToSave = { ...formData, tags };
    
    // Save version snapshot before saving (only for existing proposals)
    if (proposal?.id) {
      saveVersionSnapshot();
    }
    
    // Clear draft after successful save
    clearCurrentDraft();
    onSave(dataToSave);
  };

  const handleForceSave = () => {
    setDuplicateWarnings([]);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);
    const dataToSave = { ...formData, tags };
    
    // Save version snapshot before saving (only for existing proposals)
    if (proposal?.id) {
      saveVersionSnapshot();
    }
    
    // Clear draft after successful save
    clearCurrentDraft();
    onSave(dataToSave);
  };

  // Handle restore from version history
  const handleRestoreFromVersion = (versionData) => {
    setFormData({
      name: versionData.name || '',
      nameAr: versionData.nameAr || '',
      nameHe: versionData.nameHe || '',
      description: versionData.description || '',
      descriptionAr: versionData.descriptionAr || '',
      descriptionHe: versionData.descriptionHe || '',
      type: versionData.type || 'web',
      status: versionData.status || 'active',
      url: versionData.url || '',
      packageUrl: versionData.packageUrl || '',
      tags: versionData.tags || [],
      deadline: versionData.deadline || '',
    });
    setTagsInput(versionData.tags?.join(', ') || '');
  };

  const apiKey = getAPIKey();
  const isRtlMode = isRTL(activeLangTab);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {proposal ? t('proposalForm.editProposal') : t('proposalForm.addProposal')}
            </h2>
            {/* Version History Button - only for existing proposals */}
            {proposal?.id && (
              <button
                onClick={() => setShowVersionHistory(true)}
                className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 px-2 py-1 rounded border border-blue-200 dark:border-blue-700"
                title={t('versionHistory.title') || 'Version History'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('versionHistory.title') || 'History'}
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl">
            &times;
          </button>
        </div>

        {/* Draft Recovery Toast */}
        {showDraftToast && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📝</span>
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                {t('draft.recovered') || 'Draft recovered. Would you like to restore it?'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRestoreDraft}
                className="text-xs bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
              >
                {t('draft.restore') || 'Restore'}
              </button>
              <button
                onClick={handleDismissDraft}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {t('draft.dismiss') || 'Dismiss'}
              </button>
            </div>
          </div>
        )}

        {/* Language Tabs for multi-language fields */}
        <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1">
            {langTabs.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setActiveLangTab(lang.code)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeLangTab === lang.code
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                } ${lang.rtl ? 'rtl-lang-tab-rtl' : ''}`}
              >
                <span className={lang.rtl ? 'rtl-font-arabic' : ''}>{lang.label}</span>
                {lang.rtl && <span className="ml-1 text-xs text-yellow-500">RTL</span>}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name field with language indicator */}
          <div>
            <label className="flex items-center gap-2 block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span>{t('proposalForm.name')}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                activeLangTab === 'ar' || activeLangTab === 'he' 
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {langTabs.find(l => l.code === activeLangTab)?.name}
              </span>
            </label>
            <input
              type="text"
              name="name"
              value={getCurrentName()}
              onChange={handleNameChange}
              required
              dir={isRtlMode ? 'rtl' : 'ltr'}
              lang={activeLangTab}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                isRtlMode ? 'rtl-input-field' : ''
              }`}
              placeholder={activeLangTab === 'ar' ? 'أدخل الاسم بالعربية...' : 
                           activeLangTab === 'he' ? 'הזן שם בעברית...' : ''}
            />
            {/* Show available translations */}
            {(formData.nameAr || formData.nameHe) && (
              <div className="mt-1 text-xs text-gray-500 flex gap-2 flex-wrap">
                {formData.nameAr && activeLangTab !== 'ar' && (
                  <span className="bg-gray-100 dark:bg-gray-700 px-1 rounded">ع: {formData.nameAr}</span>
                )}
                {formData.nameHe && activeLangTab !== 'he' && (
                  <span className="bg-gray-100 dark:bg-gray-700 px-1 rounded">ע: {formData.nameHe}</span>
                )}
              </div>
            )}
          </div>

          {/* Description field with language indicator */}
          <div>
            <label className="flex items-center gap-2 block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span>{t('proposalForm.description')}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                activeLangTab === 'ar' || activeLangTab === 'he' 
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {langTabs.find(l => l.code === activeLangTab)?.name}
              </span>
            </label>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">{t('proposalForm.markdownSupport')}</span>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDescriptionMode('edit')}
                  className={`text-xs px-3 py-1 ${descriptionMode === 'edit' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}
                >
                  {t('proposalForm.source')}
                </button>
                <button
                  type="button"
                  onClick={() => setDescriptionMode('preview')}
                  className={`text-xs px-3 py-1 ${descriptionMode === 'preview' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}
                >
                  {t('proposalForm.preview')}
                </button>
              </div>
            </div>

            {descriptionMode === 'edit' ? (
              <textarea
                name="description"
                value={getCurrentDescription()}
                onChange={handleDescriptionChange}
                rows="6"
                dir={isRtlMode ? 'rtl' : 'ltr'}
                lang={activeLangTab}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 font-mono text-sm ${
                  isRtlMode ? 'rtl-textarea-field' : ''
                }`}
                placeholder={activeLangTab === 'ar' ? 'أدخل الوصف بالعربية...' : 
                             activeLangTab === 'he' ? 'הזן תיאור בעברית...' : ''}
              />
            ) : (
              <div 
                className="border rounded p-3 min-h-[120px] bg-gray-50 dark:bg-gray-800 rtl-markdown-preview"
                dir={isRtlMode ? 'rtl' : 'ltr'}
                lang={activeLangTab}
              >
                <MarkdownRenderer content={getCurrentDescription()} />
              </div>
            )}

            {/* Show available translations */}
            {(formData.descriptionAr || formData.descriptionHe) && (
              <div className="mt-1 text-xs text-gray-500">
                {formData.descriptionAr && activeLangTab !== 'ar' && (
                  <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded mb-1 rtl-content-container">
                    <span className="font-semibold">ع:</span> {formData.descriptionAr.substring(0, 100)}...
                  </div>
                )}
                {formData.descriptionHe && activeLangTab !== 'he' && (
                  <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded rtl-content-container">
                    <span className="font-semibold">ע:</span> {formData.descriptionHe.substring(0, 100)}...
                  </div>
                )}
              </div>
            )}

            {apiKey && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => handleAIClassify(getCurrentDescription())}
                  disabled={loadingAI || !getCurrentDescription()}
                  className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                >
                  {loadingAI ? `🤖 ${t('proposalForm.aiAnalyzing')}` : `🤖 ${t('proposalForm.aiRecommend')}`}
                </button>
              </div>
            )}

            {aiRecommendations.type && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span>{t('proposalForm.aiRecommendType')}：</span>
                  <button
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, type: aiRecommendations.type }))}
                    className="bg-blue-500 text-white px-2 py-0.5 rounded"
                  >
                    {aiRecommendations.type}
                  </button>
                  <span className="text-gray-400">（{t('proposalForm.clickToApply')}）</span>
                </div>
                {aiRecommendations.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>{t('proposalForm.aiRecommendTags')}：</span>
                    {aiRecommendations.tags.map(tag => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => setFormData(f => ({ ...f, tags: [...new Set([...f.tags, tag])] }))}
                        className="bg-green-100 text-green-700 px-2 py-0.5 rounded hover:bg-green-200"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {duplicateWarnings.length > 0 && (
              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded text-xs">
                <div className="font-medium text-yellow-700 mb-2">⚠️ {t('proposalForm.duplicateDetected')}</div>
                {duplicateWarnings.slice(0, 3).map(d => (
                  <div key={d.proposal.id} className="mb-1">
                    <span className="font-mono">{d.proposal.id}</span>
                    <span className="mx-1">"</span>
                    <span>{d.proposal.name}</span>
                    <span className="ml-1 text-yellow-600">（{t('proposalForm.similarity')} {d.similarity}%）</span>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleForceSave}
                    className="text-xs bg-yellow-500 text-white px-3 py-1 rounded"
                  >
                    {t('proposalForm.saveAnyway')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateWarnings([])}
                    className="text-xs text-gray-500"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('proposalForm.type')}</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="web">{t('type.web')}</option>
                <option value="app">{t('type.app')}</option>
                <option value="package">{t('type.package')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('proposalForm.status')}</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="active">{t('status.active')}</option>
                <option value="in_dev">{t('status.in_dev')}</option>
                <option value="archived">{t('status.archived')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('proposalForm.url')}</label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://..."
              dir="ltr"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('proposalForm.packageUrl')}</label>
            <input
              type="url"
              name="packageUrl"
              value={formData.packageUrl}
              onChange={handleChange}
              placeholder="https://..."
              dir="ltr"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('proposalForm.deadline') || 'Deadline'}</label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('proposalForm.tags')}</label>
            <input
              type="text"
              value={tagsInput}
              onChange={handleTagsChange}
              placeholder={t('proposalForm.tagsPlaceholder')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {t('proposalForm.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
            >
              {t('proposalForm.save')}
            </button>
          </div>
        </form>
      </div>

      {/* Version History Drawer */}
      <VersionHistoryDrawer
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        proposalId={proposal?.id}
        currentData={formData}
        onRestore={handleRestoreFromVersion}
      />
    </div>
  );
}

export default ProposalForm;

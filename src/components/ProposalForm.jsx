import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getAPIKey } from '../utils/aiService';
import MarkdownRenderer from './MarkdownRenderer';

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
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'web',
    status: 'active',
    url: '',
    packageUrl: '',
    tags: [],
    deadline: '',
  });
  const [tagsInput, setTagsInput] = useState('');
  const [descriptionMode, setDescriptionMode] = useState('edit');

  useEffect(() => {
    if (proposal) {
      setFormData(proposal);
      setTagsInput(proposal.tags?.join(', ') || '');
    }
  }, [proposal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e) => {
    setTagsInput(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);
    onSave({ ...formData, tags });
  };

  const handleForceSave = () => {
    setDuplicateWarnings([]);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);
    onSave({ ...formData, tags });
  };

  const apiKey = getAPIKey();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {proposal ? t('proposalForm.editProposal') : t('proposalForm.addProposal')}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('proposalForm.name')}</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('proposalForm.description')}</label>
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
                value={formData.description}
                onChange={handleChange}
                rows="6"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 font-mono text-sm"
                placeholder={t('proposalForm.markdownSupport')}
              />
            ) : (
              <div className="border rounded p-3 min-h-[120px] bg-gray-50 dark:bg-gray-800">
                <MarkdownRenderer content={formData.description} />
              </div>
            )}

            {apiKey && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => handleAIClassify(formData.description)}
                  disabled={loadingAI || !formData.description}
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
    </div>
  );
}

export default ProposalForm;

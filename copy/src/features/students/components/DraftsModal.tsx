import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FiList, FiX, FiEdit, FiTrash2, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import draftManager, { type SavedDraft } from '../services/draftManager';

interface DraftsModalProps {
  onClose: () => void;
  onLoadDraft: (draft: SavedDraft) => void;
}

const DraftsModal: React.FC<DraftsModalProps> = ({ onClose, onLoadDraft }) => {
  const { t } = useTranslation();
  const [drafts, setDrafts] = React.useState<SavedDraft[]>(draftManager.getAllDrafts());

  React.useEffect(() => {
    const handler = () => setDrafts(draftManager.getAllDrafts());
    window.addEventListener('draftsUpdated', handler as EventListener);
    return () => window.removeEventListener('draftsUpdated', handler as EventListener);
  }, []);

  const handleDeleteDraft = (draftId: string) => {
    if (window.confirm(t('draftsModal.deleteConfirmation'))) {
      draftManager.deleteDraft(draftId);
      setDrafts(draftManager.getAllDrafts()); // immediate refresh from cache
    }
  };

  return createPortal(
    <div className="fixed inset-0 backdrop-blur-xs bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 99999 }} onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e)=> e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-lg">
              <FiList className="text-gray-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{t('draftsModal.title')}</h2>
              <p className="text-sm text-gray-500">{t('draftsModal.count', { count: drafts.length })}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiX className="text-2xl" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {drafts.length === 0 ? (
            <div className="text-center py-12">
              <FiAlertCircle className="text-gray-400 text-5xl mx-auto mb-4" />
              <p className="text-gray-600">{t('draftsModal.noDrafts')}</p>
              <p className="text-sm text-gray-500 mt-2">{t('draftsModal.startNew')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <div
                  key={draft.metadata.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {draft.metadata.studentName}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                            <FiClock className="text-gray-400" />
                            <span>{t('draftsModal.updated')} {new Date(draft.metadata.updatedAt).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FiCheckCircle className="text-gray-400" />
                            <span>{t('draftsModal.step', { current: draft.metadata.currentStep })}</span>
                          </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${draft.metadata.completionPercentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-600">
                            {draft.metadata.completionPercentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                         onClick={() => onLoadDraft(draft)}
                         className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                       >
                         <FiEdit />
                         {t('draftsModal.continue')}
                       </button>
                       <button
                         onClick={() => handleDeleteDraft(draft.metadata.id)}
                         className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
                       >
                         <FiTrash2 />
                         {t('draftsModal.delete')}
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    , document.body
  );
};

export default DraftsModal;

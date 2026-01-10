import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FiSearch, FiUser, FiPhone, FiMail, FiCheck, FiX } from "react-icons/fi";
import secureApiService from "../../../services/secureApiService";

interface Parent {
  id: string;
  user: {
    id: string;
    uuid: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    status: string;
    avatar?: string;
  };
  _count: {
    students: number;
  };
}

interface ParentSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectParent: (parent: Parent) => void;
  parentType: "father" | "mother";
}

const ParentSearchModal: React.FC<ParentSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectParent,
  parentType,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);

  console.log('ParentSearchModal props:', { isOpen, parentType, searchQuery });

  const searchParents = useCallback(async (query: string) => {
    if (!query.trim()) {
      setParents([]);
      return;
    }

    setLoading(true);
    try {
      const response = await secureApiService.get(`/api/parents?search=${encodeURIComponent(query)}&limit=10`);
      if (response.success && Array.isArray(response.data)) {
        setParents(response.data as Parent[]);
      } else {
        console.error("Failed to search parents:", response);
        setParents([]);
      }
    } catch (error) {
      console.error("Error searching parents:", error);
      setParents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchParents(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchParents]);

  const handleSelectParent = (parent: Parent) => {
    setSelectedParent(parent);
  };

  const handleConfirmSelection = () => {
    if (selectedParent) {
      onSelectParent(selectedParent);
      onClose();
      resetForm();
    }
  };

  const resetForm = () => {
    setSearchQuery("");
    setParents([]);
    setSelectedParent(null);
    setLoading(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  console.log('ParentSearchModal rendering with isOpen:', isOpen, 'parentType:', parentType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl border-4 border-red-500">
        {/* Test Content */}
        <div className="p-6 bg-red-100">
          <h1 className="text-2xl font-bold text-red-600">TEST MODAL IS VISIBLE!</h1>
          <p>ParentType: {parentType}</p>
          <p>IsOpen: {isOpen.toString()}</p>
        </div>
        {/* Header */}
        <div className="border-b px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {t("studentForm.parents.assignParent", { 
                parentType: t(`studentForm.parents.${parentType}Tab`, parentType) 
              }) || `Assign ${parentType}`}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX className="text-xl" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 border-b flex-shrink-0">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t("studentForm.parents.searchPlaceholder", "Search parents by name...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">{t("common.searching")}</p>
            </div>
          ) : parents.length === 0 && searchQuery ? (
            <div className="text-center py-8">
              <FiUser className="text-4xl text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">{t("studentForm.parents.noParentsFound")}</p>
            </div>
          ) : parents.length === 0 && !searchQuery ? (
            <div className="text-center py-8">
              <FiSearch className="text-4xl text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">{t("studentForm.parents.startTyping")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {parents.map((parent) => (
                <div
                  key={parent.id}
                  onClick={() => handleSelectParent(parent)}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedParent?.id === parent.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {parent.user.avatar ? (
                        <img
                          src={parent.user.avatar}
                          alt={`${parent.user.firstName} ${parent.user.lastName}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <FiUser className="text-gray-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {parent.user.firstName} {parent.user.lastName}
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          {parent.user.phone && (
                            <div className="flex items-center gap-1">
                              <FiPhone className="text-xs" />
                              {parent.user.phone}
                            </div>
                          )}
                          {parent.user.email && (
                            <div className="flex items-center gap-1">
                              <FiMail className="text-xs" />
                              {parent.user.email}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              parent.user.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {t(`common.status.${parent.user.status}`)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {parent._count.students} {t("studentForm.parents.childrenCount")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {selectedParent?.id === parent.id && (
                      <FiCheck className="text-blue-600 text-xl" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 flex-shrink-0">
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleConfirmSelection}
              disabled={!selectedParent}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedParent
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {t("studentForm.parents.assignSelected")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentSearchModal;

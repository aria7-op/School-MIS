import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const CardManagement = () => {
  const { user, hasPermission } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    holderName: '',
    expiryDate: '',
    status: 'active'
  });

  useEffect(() => {
    // Simulate loading cards data
    const loadCards = async () => {
      try {
        setLoading(true);
        // Mock data - replace with actual API call
        const mockCards = [
          {
            id: 1,
            cardNumber: '****-****-****-1234',
            holderName: 'احمد محمدی',
            expiryDate: '2025-12',
            status: 'active',
            balance: 50000,
            lastUsed: '2024-01-15'
          },
          {
            id: 2,
            cardNumber: '****-****-****-5678',
            holderName: 'فاطمه احمدی',
            expiryDate: '2024-06',
            status: 'inactive',
            balance: 25000,
            lastUsed: '2024-01-10'
          }
        ];
        
        setTimeout(() => {
          setCards(mockCards);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('خطا در بارگذاری کارت‌ها');
        setLoading(false);
      }
    };

    loadCards();
  }, []);

  const handleAddCard = () => {
    setFormData({
      cardNumber: '',
      holderName: '',
      expiryDate: '',
      status: 'active'
    });
    setSelectedCard(null);
    setShowModal(true);
  };

  const handleEditCard = (card) => {
    setSelectedCard(card);
    setFormData({
      cardNumber: card.cardNumber,
      holderName: card.holderName,
      expiryDate: card.expiryDate,
      status: card.status
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedCard) {
      // Update existing card
      setCards(cards.map(card => 
        card.id === selectedCard.id 
          ? { ...card, ...formData }
          : card
      ));
    } else {
      // Add new card
      const newCard = {
        id: Date.now(),
        ...formData,
        balance: 0,
        lastUsed: new Date().toISOString().split('T')[0]
      };
      setCards([...cards, newCard]);
    }
    
    setShowModal(false);
  };

  const handleDeleteCard = (cardId) => {
    if (window.confirm('آیا از حذف این کارت اطمینان دارید؟')) {
      setCards(cards.filter(card => card.id !== cardId));
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      suspended: 'bg-yellow-100 text-yellow-800'
    };
    
    const statusText = {
      active: 'فعال',
      inactive: 'غیرفعال',
      suspended: 'معلق'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[status]}`}>
        {statusText[status]}
      </span>
    );
  };

  if (!hasPermission('card.manage')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">دسترسی محدود</h3>
          <p className="text-gray-600">شما مجوز مدیریت کارت‌ها را ندارید</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">مدیریت کارت‌ها</h2>
          <p className="text-gray-600 mt-1">مدیریت کارت‌های پارکینگ و دسترسی</p>
        </div>
        <button
          onClick={handleAddCard}
          className="btn-primary"
        >
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          افزودن کارت جدید
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="mr-3">
              <h3 className="text-sm font-medium text-red-800">خطا</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.id} className="card hover:shadow-md transition-shadow duration-200">
            <div className="card-header">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{card.holderName}</h3>
                  <p className="text-sm text-gray-500 mt-1">{card.cardNumber}</p>
                </div>
                {getStatusBadge(card.status)}
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">موجودی:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {card.balance.toLocaleString()} تومان
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">تاریخ انقضا:</span>
                  <span className="text-sm font-medium text-gray-900">{card.expiryDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">آخرین استفاده:</span>
                  <span className="text-sm font-medium text-gray-900">{card.lastUsed}</span>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEditCard(card)}
                  className="flex-1 btn-secondary text-xs"
                >
                  ویرایش
                </button>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="flex-1 btn-danger text-xs"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {cards.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">💳</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ کارتی یافت نشد</h3>
          <p className="text-gray-600 mb-4">برای شروع، کارت جدیدی اضافه کنید</p>
          <button
            onClick={handleAddCard}
            className="btn-primary"
          >
            افزودن کارت جدید
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedCard ? 'ویرایش کارت' : 'افزودن کارت جدید'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    شماره کارت
                  </label>
                  <input
                    type="text"
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                    className="input"
                    placeholder="****-****-****-****"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    نام صاحب کارت
                  </label>
                  <input
                    type="text"
                    value={formData.holderName}
                    onChange={(e) => setFormData({...formData, holderName: e.target.value})}
                    className="input"
                    placeholder="نام و نام خانوادگی"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تاریخ انقضا
                  </label>
                  <input
                    type="month"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    className="input"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    وضعیت
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="input"
                  >
                    <option value="active">فعال</option>
                    <option value="inactive">غیرفعال</option>
                    <option value="suspended">معلق</option>
                  </select>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    {selectedCard ? 'ویرایش' : 'افزودن'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardManagement; 
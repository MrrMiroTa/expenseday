import React, { useState, useEffect } from 'react';

const ExpenseTracker = () => {
  // --- State គ្របដណ្ដប់ទិន្នន័យ ---
  const [expenses, setExpenses] = useState(() => {
    const savedData = localStorage.getItem('my_expenses');
    if (!savedData) return [];
    try {
      const parsedData = JSON.parse(savedData);
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      return parsedData.filter(item => new Date(item.id) > twoMonthsAgo);
    } catch (e) { return []; }
  });

  const [formData, setFormData] = useState({ item: '', price: '', currency: 'USD' });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [editingId, setEditingId] = useState(null);

  // --- State សម្រាប់ Custom Notification ---
  const [showModal, setShowModal] = useState({ show: false, id: null });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    localStorage.setItem('my_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // បង្ហាញការជូនដំណឹង (Toast)
  const showToast = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.item || !formData.price) return;

    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    const formattedDate = `${d}/${m}/${y}`;
    const formattedTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (editingId) {
      setExpenses(expenses.map(ex => 
        ex.id === editingId 
          ? { ...ex, ...formData, price: parseFloat(formData.price), isEdited: true, updatedAt: `${formattedDate} ${formattedTime}` } 
          : ex
      ));
      setEditingId(null);
      showToast("កែប្រែទិន្នន័យបានជោគជ័យ!", "success");
    } else {
      const newEntry = {
        id: Date.now(),
        item: formData.item,
        price: parseFloat(formData.price),
        currency: formData.currency,
        createdAt: formattedDate,
        createdAtFull: `${formattedDate} ${formattedTime}`,
        isEdited: false
      };
      setExpenses([newEntry, ...expenses]);
      showToast("បានបញ្ចូលទិន្នន័យថ្មី!", "success");
    }
    setFormData({ item: '', price: '', currency: 'USD' });
  };

  const confirmDelete = (id) => {
    setShowModal({ show: true, id });
  };

  const handleDelete = () => {
    setExpenses(expenses.filter(ex => ex.id !== showModal.id));
    setShowModal({ show: false, id: null });
    showToast("ទិន្នន័យត្រូវបានលុប!", "error");
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({ item: item.item, price: item.price, currency: item.currency });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredExpenses = expenses.filter(ex => 
    ex.item.toLowerCase().includes(searchTerm.toLowerCase()) && 
    ex.createdAt.includes(searchDate)
  );

  const totalUSD = filteredExpenses
    .filter(ex => ex.currency === 'USD')
    .reduce((sum, ex) => sum + Number(ex.price || 0), 0);

  const totalKHR = filteredExpenses
    .filter(ex => ex.currency === 'KHR')
    .reduce((sum, ex) => sum + Number(ex.price || 0), 0);

  return (
    <div className="min-h-screen p-4 md:p-8 font-khmer bg-gray-50 text-gray-800 relative">
      
      {/* --- Custom Toast Notification --- */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 px-6 py-3 rounded-xl shadow-2xl text-white font-bold animate-bounce transition-all ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? '✅ ' : '🗑️ '} {toast.message}
        </div>
      )}

      {/* --- Custom Delete Modal --- */}
      {showModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in duration-200">
            <div className="text-red-500 text-5xl mb-4 text-center italic">!</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">តើអ្នកប្រាកដទេ?</h3>
            <p className="text-gray-500 mb-6 text-sm">ទិន្នន័យដែលលុបហើយ មិនអាចយកមកវិញបានទេ។</p>
            <div className="flex gap-3">
              <button onClick={() => setShowModal({ show: false, id: null })} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">បោះបង់</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200">លុបចោល</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-8 text-white text-center">
          <h2 className="text-3xl font-black italic">📊 ប្រព័ន្ធគ្រប់គ្រងការចំណាយ</h2>
          <p className="text-blue-100 mt-1 text-sm">ទិន្នន័យរក្សាទុកបាន ២ ខែក្នុងឧបករណ៍របស់អ្នក</p>
        </div>

        <div className="p-4 md:p-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-green-50 border border-green-100 p-6 rounded-3xl">
              <p className="text-green-700 font-bold text-sm">💵 សរុប (USD)</p>
              <p className="text-3xl font-black text-green-600 mt-1">${totalUSD.toFixed(2)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl">
              <p className="text-blue-700 font-bold text-sm">🇰🇭 សរុប (KHR)</p>
              <p className="text-3xl font-black text-blue-600 mt-1">{totalKHR.toLocaleString()} ៛</p>
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 bg-gray-50 p-6 rounded-3xl border border-gray-200">
            <div className="md:col-span-1">
              <label className="block text-xs font-black mb-1.5 uppercase text-gray-500 ml-1">មុខទំនិញ</label>
              <input type="text" className="w-full border-0 bg-white p-3 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500" value={formData.item} onChange={(e) => setFormData({...formData, item: e.target.value})} placeholder="ឈ្មោះទំនិញ" required />
            </div>
            <div>
              <label className="block text-xs font-black mb-1.5 uppercase text-gray-500 ml-1">តម្លៃ</label>
              <input type="number" step="any" className="w-full border-0 bg-white p-3 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="0.00" required />
            </div>
            <div>
              <label className="block text-xs font-black mb-1.5 uppercase text-gray-500 ml-1">រូបិយប័ណ្ណ</label>
              <select className="w-full border-0 bg-white p-3 rounded-xl shadow-sm cursor-pointer" value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})}>
                <option value="USD">USD ($)</option>
                <option value="KHR">KHR (៛)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className={`w-full py-3 rounded-xl text-white font-black shadow-lg transition-all active:scale-95 ${editingId ? 'bg-orange-500' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {editingId ? '💾 រក្សាទុក' : '➕ បញ្ចូល'}
              </button>
            </div>
          </form>

          {/* Search Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input type="text" placeholder="🔍 ស្វែងរកតាមឈ្មោះ..." className="flex-[2] border bg-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-yellow-400" onChange={(e) => setSearchTerm(e.target.value)} />
            <input type="date" className="flex-1 border bg-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-yellow-400" onChange={(e) => {
              if (e.target.value) {
                const [y, m, d] = e.target.value.split('-');
                setSearchDate(`${d}/${m}/${y}`);
              } else { setSearchDate(''); }
            }} />
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden border border-gray-100 rounded-2xl">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-500 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-4 font-black">កាលបរិច្ឆេទ</th>
                  <th className="p-4 font-black">មុខទំនិញ</th>
                  <th className="p-4 font-black text-right">តម្លៃ</th>
                  <th className="p-4 font-black text-center">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.map((ex) => (
                  <tr key={ex.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 text-xs font-bold text-gray-400 italic">
                      {ex.createdAtFull || ex.createdAt}
                      {ex.isEdited && <div className="text-orange-500 mt-1">✍️ កែរ: {ex.updatedAt}</div>}
                    </td>
                    <td className="p-4 font-bold text-gray-700">{ex.item}</td>
                    <td className={`p-4 text-right font-black ${ex.currency === 'USD' ? 'text-green-600' : 'text-blue-600'}`}>
                      {ex.currency === 'USD' ? `$${Number(ex.price).toFixed(2)}` : `${Number(ex.price).toLocaleString()} ៛`}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(ex)} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg">📝</button>
                        <button onClick={() => confirmDelete(ex.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredExpenses.map((ex) => (
              <div key={ex.id} className="bg-white border border-gray-200 p-5 rounded-3xl shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black text-gray-300 uppercase italic">{ex.createdAtFull || ex.createdAt}</span>
                  <span className={`text-xl font-black ${ex.currency === 'USD' ? 'text-green-600' : 'text-blue-600'}`}>
                    {ex.currency === 'USD' ? `$${Number(ex.price).toFixed(2)}` : `${Number(ex.price).toLocaleString()} ៛`}
                  </span>
                </div>
                <h4 className="font-bold text-gray-800 text-lg mb-1">{ex.item}</h4>
                {ex.isEdited && <p className="text-[10px] text-orange-500 font-bold mb-4">✍️ កែរចុងក្រោយ: {ex.updatedAt}</p>}
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(ex)} className="flex-1 py-2 bg-yellow-50 text-yellow-700 rounded-xl font-bold text-xs">កែប្រែ</button>
                  <button onClick={() => confirmDelete(ex.id)} className="flex-1 py-2 bg-red-50 text-red-700 rounded-xl font-bold text-xs">លុប</button>
                </div>
              </div>
            ))}
          </div>

          {filteredExpenses.length === 0 && (
            <div className="text-center py-20 text-gray-300 italic">មិនមានទិន្នន័យបង្ហាញ...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;
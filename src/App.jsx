import React, { useState, useEffect } from 'react';

const ExpenseTracker = () => {
  // ១. ទាញយក និង ច្រោះទិន្នន័យតាំងពីចាប់ផ្ដើម (Prevent Data Loss on Refresh)
  const [expenses, setExpenses] = useState(() => {
    const savedData = localStorage.getItem('my_expenses');
    if (!savedData) return [];

    try {
      const parsedData = JSON.parse(savedData);
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      // លុបទិន្នន័យដែលចាស់ជាង ២ ខែ (ផ្អែកលើ timestamp id ឬ date)
      return parsedData.filter(item => {
        const itemDate = new Date(item.id); // យើងប្រើ id (timestamp) ជាកាលបរិច្ឆេទបញ្ចូល
        return itemDate > twoMonthsAgo;
      });
    } catch (e) {
      return [];
    }
  });

  const [formData, setFormData] = useState({ item: '', price: '', currency: 'USD' });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [editingId, setEditingId] = useState(null);

  // ២. រក្សាទុកទៅ LocalStorage រាល់ពេលមានការផ្លាស់ប្តូរ
  useEffect(() => {
    localStorage.setItem('my_expenses', JSON.stringify(expenses));
  }, [expenses]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.item || !formData.price) return;

    const now = new Date();
    const formattedDate = now.toLocaleString('en-GB'); // ទម្រង់ DD/MM/YYYY, HH:mm:ss

    if (editingId) {
      setExpenses(expenses.map(ex => 
        ex.id === editingId 
          ? { ...ex, ...formData, isEdited: true, updatedAt: formattedDate } 
          : ex
      ));
      setEditingId(null);
    } else {
      const newEntry = {
        id: Date.now(), // ប្រើ timestamp សម្រាប់លុបក្រោយ ២ ខែ និងជា ID
        item: formData.item,
        price: parseFloat(formData.price),
        currency: formData.currency,
        createdAt: formattedDate,
        isEdited: false
      };
      setExpenses([newEntry, ...expenses]);
    }
    setFormData({ item: '', price: '', currency: 'USD' });
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({ item: item.item, price: item.price, currency: item.currency });
  };

  const filteredExpenses = expenses.filter(ex => 
    ex.item.toLowerCase().includes(searchTerm.toLowerCase()) && 
    ex.createdAt.includes(searchDate)
  );

  return (
    <div className="min-h-screen p-4 md:p-8 font-siemreab bg-gray-50">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-blue-600 p-6 text-white text-center">
          <h2 className="text-3xl font-bold italic">📊 កត់ត្រាការចំណាយ</h2>
          <p className="text-blue-100 mt-2">ទិន្នន័យនឹងត្រូវលុបស្វ័យប្រវត្តិក្រោយ ២ ខែ</p>
        </div>

        <div className="p-6">
          {/* បញ្ចូលទិន្នន័យ */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-blue-50/50 p-6 rounded-xl border border-blue-100">
            <div>
              <label className="block text-sm font-bold mb-1 text-gray-700">មុខទំនិញ</label>
              <input
                type="text"
                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.item}
                onChange={(e) => setFormData({...formData, item: e.target.value})}
                placeholder="ឈ្មោះម្ហូប ឬទំនិញ"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 text-gray-700">តម្លៃ</label>
              <input
                type="number"
                step="any"
                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 text-gray-700">រូបិយប័ណ្ណ</label>
              <select 
                className="w-full border border-gray-300 p-2.5 rounded-lg bg-white"
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
              >
                <option value="USD">ដុល្លារ ($)</option>
                <option value="KHR">រៀល (៛)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className={`w-full p-2.5 rounded-lg text-white font-bold transition-all ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {editingId ? 'រក្សាទុកការកែ' : 'បញ្ចូលទិន្នន័យ'}
              </button>
            </div>
          </form>

          {/* ស្វែងរក */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="🔍 ស្វែងរកឈ្មោះ..."
              className="flex-1 border p-3 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <input
              type="text"
              placeholder="📅 ស្វែងរកថ្ងៃ (DD/MM/YYYY)..."
              className="flex-1 border p-3 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
              onChange={(e) => setSearchDate(e.target.value)}
            />
          </div>

          {/* តារាង */}
          <div className="overflow-x-auto border rounded-xl shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-4">ល.រ</th>
                  <th className="p-4">កាលបរិច្ឆេទបញ្ចូល</th>
                  <th className="p-4">មុខទំនិញ ឬ​ ម្ហូប</th>
                  <th className="p-4 text-right">តម្លៃ</th>
                  <th className="p-4 text-center">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((ex, index) => (
                  <tr key={ex.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4 text-center">{index + 1}</td>
                    <td className="p-4">
                      <span className="text-sm font-medium">{ex.createdAt}</span>
                      {ex.isEdited && (
                        <span className="block text-[10px] text-orange-600 font-bold">
                          (កែរចុងក្រោយ: {ex.updatedAt})
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-blue-900">{ex.item}</td>
                    <td className={`p-4 text-right font-bold ${ex.currency === 'USD' ? 'text-green-600' : 'text-blue-600'}`}>
                      {ex.currency === 'USD' ? `$${ex.price.toFixed(2)}` : `${ex.price.toLocaleString()} ៛`}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleEdit(ex)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-1 rounded-lg text-xs font-bold"
                      >
                        កែប្រែ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;
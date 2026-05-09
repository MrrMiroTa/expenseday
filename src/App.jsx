import { useState, useEffect } from 'react';
import Footer from './components/footer';

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState(() => {
    const savedData = localStorage.getItem('my_expenses');
    if (!savedData) return [];
    try {
      const parsedData = JSON.parse(savedData);
      return parsedData.filter(item => item.date);
    } catch { return []; }
  });

  const [formData, setFormData] = useState({ 
    item: '', 
    price: '', 
    currency: 'USD', 
    date: new Date().toISOString().split('T')[0] 
  });
  
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(''); 
  
  const exchangeRate = 4100;

  useEffect(() => {
    localStorage.setItem('my_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // --- Search & Date Filtering Logic ---
  const filteredTransactions = expenses.filter(ex => {
    const matchesSearch = ex.item.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = filterDate === '' || ex.date === filterDate;
    return matchesSearch && matchesDate;
  });

  // --- Dynamic Dashboard Logic ---
  // This function now uses filteredTransactions so the cards update based on your search/date filter
  const getFilteredSum = (type, curr) => filteredTransactions
    .filter(ex => ex.type === type && ex.currency === curr)
    .reduce((s, ex) => s + Number(ex.price), 0);

  const totalIncomeUSD = getFilteredSum('income', 'USD') + (getFilteredSum('income', 'KHR') / exchangeRate);
  const totalExpenseUSD = getFilteredSum('expense', 'USD') + (getFilteredSum('expense', 'KHR') / exchangeRate);
  const balanceUSD = totalIncomeUSD - totalExpenseUSD;

  const handleSubmit = (e, type) => {
    e.preventDefault();
    if (!formData.item || !formData.price || !formData.date) return;

    if (editingId) {
      setExpenses(expenses.map(ex => 
        ex.id === editingId ? { ...ex, ...formData, price: parseFloat(formData.price), type } : ex
      ).sort((a, b) => new Date(b.date) - new Date(a.date)));
      setEditingId(null);
    } else {
      const newEntry = { id: Date.now(), ...formData, price: parseFloat(formData.price), type };
      setExpenses([newEntry, ...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
    setFormData({ ...formData, item: '', price: '' });
  };

  const handleEdit = (ex) => {
    setEditingId(ex.id);
    setFormData({ item: ex.item, price: ex.price, currency: ex.currency, date: ex.date });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uniqueDates = [...new Set(expenses.map(ex => ex.date))].sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      <div className="max-w-5xl mx-auto p-4">
        
        {/* Dashboard Header */}
        <div className="bg-[#111827] rounded-[2.5rem] p-8 text-white mb-8 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-xl font-black tracking-tight">EXPENSE TRACKER v2.0</h1>
            <div className="bg-white/10 px-4 py-1.5 rounded-full border border-white/10 text-[11px]">
              អត្រាប្តូរប្រាក់៖ <span className="text-blue-400">$1 = 4,100 ៛</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl">
              <p className="text-emerald-400 text-[10px] font-black uppercase mb-1">ចំណូលសរុប (INCOME)</p>
              <h2 className="text-2xl font-black">${totalIncomeUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
              <p className="text-emerald-400/50 text-[10px]">{(totalIncomeUSD * exchangeRate).toLocaleString()} ៛</p>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl">
              <p className="text-rose-400 text-[10px] font-black uppercase mb-1">ចំណាយសរុប (EXPENSE)</p>
              <h2 className="text-2xl font-black">${totalExpenseUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
              <p className="text-rose-400/50 text-[10px]">{(totalExpenseUSD * exchangeRate).toLocaleString()} ៛</p>
            </div>
            <div className="bg-blue-600 p-6 rounded-3xl shadow-lg shadow-blue-900/20">
              <p className="text-blue-100 text-[10px] font-black uppercase mb-1">សមតុល្យសរុប (NET BALANCE)</p>
              <h2 className="text-2xl font-black">${balanceUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
              <p className="text-blue-100/70 text-[10px]">≈ {(balanceUSD * exchangeRate).toLocaleString()} ៛</p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className={`bg-white p-8 rounded-[2.5rem] shadow-sm border transition-all ${editingId ? 'border-amber-300 bg-amber-50/30' : 'border-slate-100'} mb-8`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 ml-1">ថ្ងៃខែ</label>
                  <input type="date" className="p-4 rounded-2xl bg-slate-50 border-0" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 ml-1">ឈ្មោះទំនិញ / ចំណូល</label>
                  <input className="p-4 rounded-2xl bg-slate-50 border-0" placeholder="ឧ. ថ្លៃជួលផ្ទះ, ប្រាក់ខែ..." value={formData.item} onChange={e => setFormData({...formData, item: e.target.value})} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 ml-1">ចំនួនទឹកប្រាក់</label>
                  <div className="flex gap-2">
                    <input type="number" className="flex-1 p-4 rounded-2xl bg-slate-50 border-0" placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                    <select className="p-4 rounded-2xl bg-slate-100 border-0 font-bold" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                        <option value="USD">$</option>
                        <option value="KHR">៛</option>
                    </select>
                  </div>
                </div>
            </div>
            <div className="flex gap-4">
                <button onClick={(e) => handleSubmit(e, 'income')} className="flex-1 bg-[#10B981] hover:bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 transition-all">
                  {editingId ? 'Update Income' : '+ បញ្ចូលជាចំណូល'}
                </button>
                <button onClick={(e) => handleSubmit(e, 'expense')} className="flex-1 bg-[#FF1E56] hover:bg-rose-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-rose-100 transition-all">
                  {editingId ? 'Update Expense' : '- បញ្ចូលជាចំណាយ'}
                </button>
            </div>
        </div>

        {/* List Section */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h3 className="font-bold text-slate-800 text-lg">ប្រតិបត្តិការ ({filteredTransactions.length})</h3>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <input 
                type="text" 
                placeholder="ស្វែងរកឈ្មោះ..." 
                className="bg-slate-50 border-0 rounded-xl px-4 py-2 text-xs focus:ring-2 ring-blue-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select 
                className="bg-slate-50 border-0 rounded-xl px-4 py-2 text-xs font-bold text-slate-500 cursor-pointer"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              >
                <option value="">ទាំងអស់ (All Time)</option>
                {uniqueDates.map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
              
              <button className="bg-[#1F2937] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider">Export PDF</button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map(ex => (
                <div key={ex.id} className="group flex justify-between items-center p-4 rounded-[1.5rem] bg-slate-50/50 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${ex.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'}`}>
                      {ex.type === 'income' ? '↓' : '↑'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{ex.item}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{ex.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`font-black text-lg ${ex.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {ex.type === 'income' ? '+' : '-'} {ex.currency === 'USD' ? `$${ex.price.toFixed(2)}` : `${ex.price.toLocaleString()} ៛`}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(ex)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all">✎</button>
                      <button onClick={() => setExpenses(expenses.filter(i => i.id !== ex.id))} className="p-2 text-rose-400 hover:text-rose-600 transition-all">✕</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-slate-400 italic text-sm bg-slate-50/30 rounded-[2rem] border border-dashed border-slate-200">
                រកមិនឃើញទិន្នន័យសម្រាប់ថ្ងៃនេះទេ
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ExpenseTracker;
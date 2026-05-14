import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Configuration & Utils ---
const EXCHANGE_RATE = 4100;

const formatCurrency = (price, currency) => {
  if (currency === 'KHR') return `${price.toLocaleString()} ៛`;
  return `$${Number(price).toFixed(2)}`;
};

const App = () => {
  const today = new Date().toISOString().split('T')[0];

  // --- State ---
  const [expenses, setExpenses] = useState(() => {
    const savedData = localStorage.getItem('my_expenses');
    if (!savedData) return [];
    try {
      const parsedData = JSON.parse(savedData);
      return parsedData.filter(item => item.date);
    } catch { return []; }
  });

  const [formData, setFormData] = useState({ 
    item: '', price: '', currency: 'USD', date: today 
  });
  
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(''); 

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('my_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // --- Calculations ---
  const filteredTransactions = expenses.filter(ex => {
    const matchesSearch = ex.item.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = filterDate === '' || ex.date === filterDate;
    return matchesSearch && matchesDate;
  });

  const getSum = (list, type) => list
    .filter(ex => ex.type === type)
    .reduce((s, ex) => s + (ex.currency === 'USD' ? Number(ex.price) : Number(ex.price) / EXCHANGE_RATE), 0);

  const totalIncomeUSD = getSum(filteredTransactions, 'income');
  const totalExpenseUSD = getSum(filteredTransactions, 'expense');
  const netBalanceUSD = totalIncomeUSD - totalExpenseUSD;

  const uniqueDates = [...new Set(expenses.map(ex => ex.date))].sort((a, b) => new Date(b) - new Date(a));

  // --- Handlers ---
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
    setFormData({ item: '', price: '', currency: 'USD', date: today });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Expense Report", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['Date', 'Item', 'Type', 'Amount']],
      body: filteredTransactions.map(ex => [ex.date, ex.item, ex.type, formatCurrency(ex.price, ex.currency)]),
    });
    doc.save(`Report_${today}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans pb-20 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header - Styled like image_b0989c.png */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black tracking-tight text-white">EXPENSE TRACKER v2.0</h1>
          <div className="bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700 text-[12px] text-slate-300">
            $1 = 4,100 ៛
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {/* Income Box */}
          <div className="bg-[#064e3b]/30 border border-emerald-500/30 p-6 rounded-[2rem] backdrop-blur-sm">
            <p className="text-emerald-400 text-[11px] font-bold uppercase mb-2">ចំណូល (INCOME)</p>
            <h2 className="text-4xl font-black text-emerald-400 mb-1">${totalIncomeUSD.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
            <p className="text-emerald-400/60 text-xs">{(totalIncomeUSD * EXCHANGE_RATE).toLocaleString()} ៛</p>
          </div>

          {/* Expense Box */}
          <div className="bg-[#4c0519]/30 border border-rose-500/30 p-6 rounded-[2rem] backdrop-blur-sm">
            <p className="text-rose-400 text-[11px] font-bold uppercase mb-2">ចំណាយ (EXPENSE)</p>
            <h2 className="text-4xl font-black text-rose-400 mb-1">${totalExpenseUSD.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
            <p className="text-rose-400/60 text-xs">{(totalExpenseUSD * EXCHANGE_RATE).toLocaleString()} ៛</p>
          </div>

          {/* New Balance Box - High Visibility */}
          <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-xl shadow-indigo-900/40 border border-indigo-400/30">
            <p className="text-indigo-100 text-[11px] font-bold uppercase mb-2">សមតុល្យតាមការជ្រើសរើស (NET BALANCE)</p>
            <h2 className="text-4xl font-black text-white mb-1">${netBalanceUSD.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
            <p className="text-indigo-200/80 text-xs">≈ {(netBalanceUSD * EXCHANGE_RATE).toLocaleString()} ៛</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-700 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <input type="date" className="bg-slate-900 border-slate-700 rounded-xl p-4 text-white" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            <input className="bg-slate-900 border-slate-700 rounded-xl p-4 text-white" placeholder="Item Name..." value={formData.item} onChange={e => setFormData({...formData, item: e.target.value})} />
            <div className="flex gap-2">
              <input type="number" className="flex-1 bg-slate-900 border-slate-700 rounded-xl p-4 text-white" placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              <select className="bg-slate-700 rounded-xl px-4 font-bold" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                <option value="USD">$</option>
                <option value="KHR">៛</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={(e) => handleSubmit(e, 'income')} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-900/20">
              + INCOME
            </button>
            <button onClick={(e) => handleSubmit(e, 'expense')} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-rose-900/20">
              - EXPENSE
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input 
            type="text" placeholder="Search transactions..." 
            className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-6 py-3"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="bg-slate-800/50 border border-slate-700 rounded-xl px-6 py-3"
            value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
          >
            <option value="">All History</option>
            {uniqueDates.map(date => <option key={date} value={date}>{date}</option>)}
          </select>
          <button onClick={handleExportPDF} className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-xl font-bold transition-colors">
            EXPORT PDF
          </button>
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {filteredTransactions.map(ex => (
            <div key={ex.id} className="flex justify-between items-center p-5 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${ex.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {ex.type === 'income' ? '↙' : '↗'}
                </div>
                <div>
                  <div className="font-bold text-lg text-white">{ex.item}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-widest">{ex.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className={`text-xl font-black ${ex.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {ex.type === 'income' ? '+' : '-'} {formatCurrency(ex.price, ex.currency)}
                </span>
                <button onClick={() => setExpenses(expenses.filter(i => i.id !== ex.id))} className="text-slate-600 hover:text-rose-500 transition-colors text-xl">
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm italic">
          &copy; {new Date().getFullYear()} Uzita Expense Tracker • Secure Local Storage Active
        </footer>
      </div>
    </div>
  );
};

export default App;
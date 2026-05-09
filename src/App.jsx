import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Footer from './components/footer';

const ExpenseTracker = () => {
  // 1. Load data from LocalStorage
  const [expenses, setExpenses] = useState(() => {
    const savedData = localStorage.getItem('my_expenses');
    return savedData ? JSON.parse(savedData) : [];
  });

  // 2. State for form inputs
  const [formData, setFormData] = useState({ 
    item: '', 
    price: '', 
    currency: 'USD', 
    date: new Date().toISOString().split('T')[0] 
  });

  const [exportPeriod, setExportPeriod] = useState('month');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // អត្រាប្តូរប្រាក់សម្រាប់គណនា Balance រួម
  const exchangeRate = 4100; 

  // 3. Auto-save to LocalStorage
  useEffect(() => {
    localStorage.setItem('my_expenses', JSON.stringify(expenses));
  }, [expenses]);

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // --- Logic គណនាទឹកប្រាក់ ---
  const getSum = (type, curr) => expenses
    .filter(ex => ex.type === type && ex.currency === curr)
    .reduce((s, ex) => s + Number(ex.price), 0);

  const netUSD = getSum('income', 'USD') - getSum('expense', 'USD');
  const netKHR = getSum('income', 'KHR') - getSum('expense', 'KHR');

  // សាច់ប្រាក់សរុបដែលនៅសល់ (Total Balance) បំប្លែងទៅជា USD
  const grandTotalUSD = netUSD + (netKHR / exchangeRate);

  // --- Logic បញ្ចូលទិន្នន័យ ---
  const handleSubmit = (e, type) => {
    e.preventDefault();
    if (!formData.item || !formData.price || !formData.date) {
      showToast("សូមបំពេញព័ត៌មានឱ្យគ្រប់!", "error");
      return;
    }

    const newEntry = {
      id: Date.now(),
      item: formData.item,
      price: parseFloat(formData.price),
      currency: formData.currency,
      type: type,
      createdAt: formData.date
    };

    // បញ្ចូល និងតម្រៀបតាមថ្ងៃខែ
    const updated = [newEntry, ...expenses].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setExpenses(updated);
    setFormData({ ...formData, item: '', price: '' }); // Reset fields
    showToast("រក្សាទុកជោគជ័យ!");
  };

  // --- PDF Export Logic ---
  const translateToEng = (t) => {
    const dict = { 'ចំណាយ': 'Expense', 'ចំណូល': 'Income' };
    return dict[t] || t;
  };

  const handleExport = () => {
    try {
      const doc = new jsPDF();
      const now = new Date();
      let startDate = new Date();
      if (exportPeriod === 'day') startDate.setHours(0,0,0,0);
      else if (exportPeriod === 'week') startDate.setDate(now.getDate() - 7);
      else if (exportPeriod === 'month') startDate.setMonth(now.getMonth() - 1);

      const filtered = expenses.filter(ex => new Date(ex.createdAt) >= startDate);

      doc.setFontSize(18);
      doc.text('Financial Statement', 105, 20, { align: 'center' });
      
      autoTable(doc, {
        startY: 30,
        head: [['Date', 'Description', 'Amount', 'Type']],
        body: filtered.map(ex => [
          ex.createdAt, 
          ex.item, 
          ex.currency === 'USD' ? `$${ex.price.toFixed(2)}` : `${ex.price.toLocaleString()} KHR`, 
          translateToEng(ex.type === 'income' ? 'ចំណូល' : 'ចំណាយ')
        ]),
        headStyles: { fillColor: [30, 41, 59] }
      });
      doc.save(`Report_${now.toISOString().split('T')[0]}.pdf`);
      showToast("ទាញយក PDF រួចរាល់");
    } catch (e) { showToast("Export Failed", "error"); }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50 font-sans text-slate-800">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 px-6 py-3 rounded-xl shadow-2xl text-white transition-all ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Dashboard Header */}
        <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white mb-6 shadow-xl shadow-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <h1 className="text-2xl font-black tracking-tight mb-4 md:mb-0">EXPENSE TRACKER v2.0</h1>
            <div className="bg-white/10 px-4 py-2 rounded-full border border-white/10 text-sm">
              អត្រាប្តូរប្រាក់៖ $1 = {exchangeRate.toLocaleString()} ៛
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20">
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">ចំណូលសរុប (Income)</p>
              <h2 className="text-2xl font-black">${getSum('income', 'USD').toFixed(2)}</h2>
              <p className="text-sm opacity-70">{getSum('income', 'KHR').toLocaleString()} ៛</p>
            </div>
            <div className="bg-rose-500/10 p-5 rounded-2xl border border-rose-500/20">
              <p className="text-rose-400 text-xs font-bold uppercase tracking-widest mb-1">ចំណាយសរុប (Expense)</p>
              <h2 className="text-2xl font-black">${getSum('expense', 'USD').toFixed(2)}</h2>
              <p className="text-sm opacity-70">{getSum('expense', 'KHR').toLocaleString()} ៛</p>
            </div>
            <div className="bg-blue-600 p-5 rounded-2xl shadow-lg shadow-blue-500/30">
              <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">សមតុល្យសរុប (Net Balance)</p>
              <h2 className="text-2xl font-black">${grandTotalUSD.toFixed(2)}</h2>
              <p className="text-sm font-bold text-blue-200">≈ {(grandTotalUSD * exchangeRate).toLocaleString()} ៛</p>
            </div>
          </div>
        </div>

        {/* Input Form Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">ថ្ងៃខែ</label>
              <input type="date" className="w-full bg-slate-50 border-0 p-3 rounded-xl focus:ring-2 focus:ring-blue-500" 
                value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">ឈ្មោះមុខទំនិញ / ចំណូល</label>
              <input className="w-full bg-slate-50 border-0 p-3 rounded-xl focus:ring-2 focus:ring-blue-500" 
                placeholder="ឧ. ថ្លៃជួលផ្ទះ, ប្រាក់ខែ..." value={formData.item} onChange={e => setFormData({...formData, item: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">ចំនួនទឹកប្រាក់</label>
              <div className="flex gap-2">
                <input type="number" className="flex-1 bg-slate-50 border-0 p-3 rounded-xl focus:ring-2 focus:ring-blue-500" 
                  placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                <select className="bg-slate-100 border-0 rounded-xl font-bold p-3" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                  <option value="USD">$</option>
                  <option value="KHR">៛</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <button onClick={(e) => handleSubmit(e, 'income')} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-emerald-200">
              + បញ្ចូលជាចំណូល
            </button>
            <button onClick={(e) => handleSubmit(e, 'expense')} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white p-4 rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-rose-200">
              - បញ្ចូលជាចំណាយ
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-800 tracking-tight">ប្រវត្តិប្រតិបត្តិការ</h3>
            <div className="flex gap-2">
              <select className="text-xs bg-slate-100 border-0 rounded-lg p-2 font-bold" value={exportPeriod} onChange={e => setExportPeriod(e.target.value)}>
                <option value="day">ថ្ងៃនេះ</option>
                <option value="week">សប្តាហ៍នេះ</option>
                <option value="month">ខែនេះ</option>
              </select>
              <button onClick={handleExport} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-700">
                EXPORT PDF
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {expenses.length === 0 ? (
              <div className="text-center py-20 text-slate-300 font-medium italic">មិនទាន់មានទិន្នន័យនៅឡើយ...</div>
            ) : (
              expenses.map(ex => (
                <div key={ex.id} className="group flex justify-between items-center p-4 bg-slate-50 rounded-2xl hover:bg-white hover:ring-2 hover:ring-blue-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${ex.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'}`}>
                      {ex.type === 'income' ? '↓' : '↑'}
                    </div>
                    <div>
                      <div className="font-black text-slate-700 leading-tight">{ex.item}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{ex.createdAt}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-lg font-black ${ex.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {ex.type === 'income' ? '+' : '-'} {ex.currency === 'USD' ? `$${ex.price.toFixed(2)}` : `${ex.price.toLocaleString()} ៛`}
                      </div>
                    </div>
                    <button onClick={() => setExpenses(expenses.filter(i => i.id !== ex.id))} className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all">
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ExpenseTracker;
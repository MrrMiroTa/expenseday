import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Format currency based on type
 */
function formatCurrency(price, currency) {
  if (currency === 'KHR') {
    return `${price.toLocaleString()} KHR`;
  }
  return `$${price.toFixed(2)}`;
}

/**
 * Export expenses to PDF
 */
export async function exportToPDF(expenses, filterDate = null, searchTerm = '') {
  try {
    if (!expenses || expenses.length === 0) {
      alert('No expenses to export');
      return;
    }

    // Filter expenses
    let filteredExpenses = expenses;
    if (filterDate) {
      filteredExpenses = filteredExpenses.filter(ex => ex.date === filterDate);
    }
    if (searchTerm) {
      filteredExpenses = filteredExpenses.filter(ex => 
        ex.item.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filteredExpenses.length === 0) {
      alert('No matching expenses to export');
      return;
    }

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Title
    doc.setFontSize(18);
    doc.text('Expense Report', 14, 20);

    // Date generated
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    if (filterDate || searchTerm) {
      doc.setFontSize(9);
      doc.text(`Filter: ${filterDate || 'All'} ${searchTerm ? `- ${searchTerm}` : ''}`, 14, 35);
    }

    // Calculate totals
    const exchangeRate = 4100;
    const totalIncomeUSD = filteredExpenses
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + (e.currency === 'USD' ? e.price : e.price / exchangeRate), 0);
    const totalExpenseUSD = filteredExpenses
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + (e.currency === 'USD' ? e.price : e.price / exchangeRate), 0);
    const balanceUSD = totalIncomeUSD - totalExpenseUSD;

    // Summary box
    doc.setFillColor(240, 253, 244);
    doc.rect(10, 40, 190, 35, 'F');

    doc.setFontSize(11);
    doc.setTextColor(5, 150, 105);
    doc.text(`Total Income: ${formatCurrency(totalIncomeUSD, 'USD')} (${(totalIncomeUSD * exchangeRate).toLocaleString()} KHR)`, 16, 52);

    doc.setTextColor(244, 63, 94);
    doc.text(`Total Expense: ${formatCurrency(totalExpenseUSD, 'USD')} (${(totalExpenseUSD * exchangeRate).toLocaleString()} KHR)`, 16, 60);

    doc.setTextColor(37, 99, 235);
    doc.text(`Balance: ${formatCurrency(balanceUSD, 'USD')} (${(balanceUSD * exchangeRate).toLocaleString()} KHR)`, 16, 68);

    // Prepare table data
    const tableData = filteredExpenses.map(ex => [
      ex.date,
      ex.item,
      ex.type === 'income' ? 'Income' : 'Expense',
      ex.currency === 'USD' ? '$' : 'KHR',
      formatCurrency(ex.price, ex.currency)
    ]);

    // Generate table using autoTable function directly
    autoTable(doc, {
      startY: 78,
      head: [['Date', 'Item', 'Type', 'Currency', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [17, 24, 39], 
        textColor: 255, 
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 10, 
        cellPadding: 3,
        lineColor: [200, 200, 200],
        textColor: 50
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 60 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30, halign: 'right' }
      }
    });

    // Footer with page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount} - Uzita Expense Tracker`,
        14,
        doc.internal.pageSize.height - 10
      );
    }

    // Save PDF
    const fileName = `uzita_expenses_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

  } catch (error) {
    console.error('PDF export error:', error);
    console.error('Error stack:', error.stack);
    alert(`Failed to generate PDF: ${error.message || 'Please try again.'}`);
  }
}

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { TRANSACTION_TYPES } from './constants';

export const exportToExcel = async (transactions, month, year) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Laporan Expense');

  // Define Columns
  worksheet.columns = [
    { header: 'Tanggal', key: 'date', width: 15 },
    { header: 'Keterangan (Judul)', key: 'title', width: 40 },
    { header: 'Tipe (Pemasukan/Pengeluaran)', key: 'type', width: 30 },
    { header: 'Nominal', key: 'amount', width: 20 }
  ];

  // Add Data Rows and calculate total saldo
  let totalPemasukan = 0;
  let totalPengeluaran = 0;

  transactions.forEach(t => {
    const isIncome = t.type === TRANSACTION_TYPES.INCOME;
    if (isIncome) totalPemasukan += t.amount;
    else totalPengeluaran += t.amount;

    worksheet.addRow({
      date: t.date,
      title: t.title,
      type: isIncome ? 'Pemasukan' : 'Pengeluaran',
      amount: t.amount
    });
  });

  const saldo = totalPemasukan - totalPengeluaran;

  // Add Empty Row for spacing
  worksheet.addRow({});

  // Get current row count
  const totalRowsCount = transactions.length;
  const summaryStartRow = totalRowsCount + 3;

  // Add Summary Rows (Data is put in 'date' column so it sits in Col A, which will be merged to C)
  worksheet.addRow({ date: 'Total Pemasukan:', amount: totalPemasukan });
  worksheet.addRow({ date: 'Total Pengeluaran:', amount: totalPengeluaran });
  worksheet.addRow({ date: 'Saldo Akhir:', amount: saldo });

  // Merge A to C for the 3 summary rows
  worksheet.mergeCells(`A${summaryStartRow}:C${summaryStartRow}`);
  worksheet.mergeCells(`A${summaryStartRow + 1}:C${summaryStartRow + 1}`);
  worksheet.mergeCells(`A${summaryStartRow + 2}:C${summaryStartRow + 2}`);

  // Styling Header
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' } // Primary Blue
    };
    cell.font = {
      color: { argb: 'FFFFFFFF' },
      bold: true
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Styling Data Rows
  for (let i = 2; i <= totalRowsCount + 1; i++) {
    const row = worksheet.getRow(i);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { vertical: 'middle' };
    });
    
    // Format amount column as Rupiah
    const amountCell = row.getCell('amount');
    amountCell.numFmt = '"Rp" #,##0;[Red]\-"Rp" #,##0';
  }

  // Helper function for styling summary rows
  const styleSummaryRow = (rowIndex, bgColor, textColor) => {
    const row = worksheet.getRow(rowIndex);
    
    // Apply styling to all cells in the row (including merged ones)
    for (let col = 1; col <= 4; col++) {
      const cell = row.getCell(col);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.font = { color: { argb: textColor }, bold: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
    
    // Center align the merged text (Column A)
    const titleCell = row.getCell(1);
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Format and right-align the amount (Column D)
    const amountCell = row.getCell(4);
    amountCell.numFmt = '"Rp" #,##0;[Red]\-"Rp" #,##0';
    amountCell.alignment = { horizontal: 'right', vertical: 'middle' };
  };

  // Website Colors
  // Pemasukan: Light Green bg, Dark green text
  styleSummaryRow(summaryStartRow, 'FFD1FAE5', 'FF065F46'); 
  // Pengeluaran: Light Red bg, Dark red text
  styleSummaryRow(summaryStartRow + 1, 'FFFEE2E2', 'FF991B1B'); 
  // Saldo Akhir: Primary Blue bg, White text
  styleSummaryRow(summaryStartRow + 2, 'FF4F46E5', 'FFFFFFFF');

  // Generate filename
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const monthName = monthNames[month - 1] || 'All';
  const fileName = `Laporan_Expense_${monthName}_${year}.xlsx`;

  // Write file to browser
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
};

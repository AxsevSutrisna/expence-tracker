import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { TRANSACTION_TYPES, CATEGORIES } from './constants';

const getCategoryLabel = (type, categoryId, allCategories) => {
  if (!type || !allCategories || !allCategories[type]) return 'Tanpa Kategori';
  const list = allCategories[type];
  const cat = list.find(c => c.id === categoryId);
  return cat ? cat.label : 'Lainnya';
};

export const exportToExcel = async (transactions, month, year, userFullName = '', allCategories = CATEGORIES) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Laporan Keuangan');

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const monthName = monthNames[month - 1] || 'Semua Periode';

  // --- Report Header ---
  worksheet.mergeCells('A1:E1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'LAPORAN KEUANGAN TRACKER.IO';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FF000000' } };
  titleCell.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:E2');
  const periodCell = worksheet.getCell('A2');
  periodCell.value = `Periode: ${monthName} ${year}`;
  periodCell.font = { size: 12, italic: true };
  periodCell.alignment = { horizontal: 'center' };

  if (userFullName) {
    worksheet.mergeCells('A3:E3');
    const userCell = worksheet.getCell('A3');
    userCell.value = `Pemilik: ${userFullName}`;
    userCell.font = { size: 11 };
    userCell.alignment = { horizontal: 'center' };
  }

  // Add empty row
  worksheet.addRow({});

  // --- Data Table Setup ---
  // The header starts at row 5 (if userFullName is present, else row 4, but let's just force header to row 5)
  const headerRowIndex = 5;
  worksheet.getRow(headerRowIndex).values = ['Tanggal', 'Keterangan Transaksi', 'Kategori', 'Tipe', 'Nominal'];

  worksheet.columns = [
    { key: 'date', width: 15 },
    { key: 'title', width: 45 },
    { key: 'category', width: 25 },
    { key: 'type', width: 20 },
    { key: 'amount', width: 25 }
  ];

  // --- Add Data Rows ---
  let totalPemasukan = 0;
  let totalPengeluaran = 0;
  let startDataRow = headerRowIndex + 1;

  transactions.forEach(t => {
    const isIncome = t.type === TRANSACTION_TYPES.INCOME;
    if (isIncome) totalPemasukan += t.amount;
    else totalPengeluaran += t.amount;

    worksheet.addRow({
      date: t.date,
      title: t.title,
      category: getCategoryLabel(t.type, t.category, allCategories),
      type: isIncome ? 'Pemasukan' : 'Pengeluaran',
      amount: t.amount
    });
  });

  const endDataRow = worksheet.rowCount;

  // --- Summary Rows ---
  worksheet.addRow({}); // Empty row spacer
  
  const saldo = totalPemasukan - totalPengeluaran;
  const summaryStartRow = worksheet.rowCount + 1;

  worksheet.addRow({ type: 'Total Pemasukan', amount: totalPemasukan });
  worksheet.addRow({ type: 'Total Pengeluaran', amount: totalPengeluaran });
  worksheet.addRow({ type: 'Saldo Akhir', amount: saldo });

  // Merge A-C for summary rows
  for (let i = summaryStartRow; i <= summaryStartRow + 2; i++) {
    worksheet.mergeCells(`A${i}:C${i}`);
    const labelCell = worksheet.getCell(`A${i}`);
    labelCell.alignment = { horizontal: 'right', vertical: 'middle' };
    labelCell.font = { bold: true };
    // Move the 'type' value to the merged cell
    const typeValue = worksheet.getCell(`D${i}`).value;
    labelCell.value = typeValue;
    worksheet.getCell(`D${i}`).value = null; // clear old column D
  }

  // --- Styling ---
  // Header Style (Thick borders)
  const headerRow = worksheet.getRow(headerRowIndex);
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }; // Light gray
    cell.font = { bold: true, color: { argb: 'FF000000' } };
    cell.border = {
      top: { style: 'medium' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Data Rows Style
  for (let i = startDataRow; i <= endDataRow; i++) {
    const row = worksheet.getRow(i);
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { vertical: 'middle' };
      
      // Formatting amount column
      if (colNumber === 5) {
        cell.numFmt = '_-"Rp"* #,##0.00_-;\-"Rp"* #,##0.00_-;_-"Rp"* "-"??_-;_-@_-';
      }
    });
  }

  // Summary Rows Style
  const styleSummaryRow = (rowIndex, bgColor) => {
    const row = worksheet.getRow(rowIndex);
    for (let col = 1; col <= 5; col++) {
      if (col === 4) continue; // D is empty because A-C is merged
      const cell = row.getCell(col === 1 ? 1 : 5); // Merged cell is 1, Amount is 5
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'medium' }
      };
    }
    
    const amountCell = row.getCell(5);
    amountCell.numFmt = '_-"Rp"* #,##0.00_-;\-"Rp"* #,##0.00_-;_-"Rp"* "-"??_-;_-@_-';
    amountCell.font = { bold: true };
    amountCell.alignment = { horizontal: 'right' };
  };

  styleSummaryRow(summaryStartRow, 'FFD1FAE5'); // Pemasukan (Light Green)
  styleSummaryRow(summaryStartRow + 1, 'FFFEE2E2'); // Pengeluaran (Light Red)
  styleSummaryRow(summaryStartRow + 2, 'FFE0E7FF'); // Saldo (Light Blue)

  // Generate filename
  const fileName = `Laporan_Keuangan_${monthName}_${year}.xlsx`;

  // Write file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
};

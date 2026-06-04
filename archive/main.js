/**
 * ========================================================
 * Expense Tracker App — main.js
 * ========================================================
 * Tulis seluruh kode JavaScript kamu di sini.
 */

// TODO [Basic] Buat variabel array untuk menyimpan semua data transaksi, contoh: let transactions = []
let transactions = [];
let editingId = null;

// TODO [Basic] Buat fungsi untuk menghasilkan ID unik secara otomatis, contoh: gunakan +new Date()
function generateId() {
    return +new Date();
}

/**
 * ========================================================
 * Kriteria 1: Memanipulasi DOM untuk Form dan Daftar Transaksi
 * ========================================================
 */
// TODO [Basic] Ambil elemen kontainer incomeList dan expenseList dari DOM
const incomeList = document.getElementById('incomeList');
const expenseList = document.getElementById('expenseList');

const transactionForm = document.getElementById('transactionForm');
const transactionFormTitleInput = document.getElementById('transactionFormTitleInput');
const transactionFormAmountInput = document.getElementById('transactionFormAmountInput');
const transactionFormDateInput = document.getElementById('transactionFormDateInput');
const transactionFormTypeSelect = document.getElementById('transactionFormTypeSelect');

const balanceAmount = document.querySelector('.tracker-summary__balance-amount');
const incomeAmount = document.querySelector('.tracker-summary__stat-amount--income');
const expenseAmount = document.querySelector('.tracker-summary__stat-amount--expense');

const searchForm = document.getElementById('searchTransactionForm');
const searchInput = document.getElementById('searchTransactionFormTitleInput');

const formatCurrency = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
};

/**
 * TODO [Basic]:
 * Buat fungsi untuk menampilkan (render) semua transaksi ke layar:
 *  - Kosongkan kontainer terlebih dahulu sebelum mengisi ulang
 *  - Gunakan perulangan, buat setiap elemen kartu dengan document.createElement()
 *  - Pastikan setiap elemen memiliki atribut data-testid yang sesuai (lihat panduan di rubrik)
 *  - Masukkan kartu ke kontainer yang tepat: income → incomeList, expense → expenseList
 */
function renderTransactions(dataToRender = transactions) {
    incomeList.innerHTML = '';
    expenseList.innerHTML = '';

    dataToRender.forEach(transaction => {
        const transactionItem = document.createElement('div');
        transactionItem.setAttribute('data-testid', 'transactionItem');
        transactionItem.classList.add('tracker-transaction-list__item');

        const title = document.createElement('h3');
        title.setAttribute('data-testid', 'transactionItemTitle');
        title.textContent = transaction.title;

        const amount = document.createElement('p');
        amount.setAttribute('data-testid', 'transactionItemAmount');
        amount.textContent = `Nominal: Rp${transaction.amount}`;

        const date = document.createElement('p');
        date.setAttribute('data-testid', 'transactionItemDate');
        date.textContent = `Tanggal: ${transaction.date}`;

        const typeLabel = document.createElement('p');
        typeLabel.setAttribute('data-testid', 'transactionItemType');
        typeLabel.textContent = `Tipe: ${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}`;

        const actionContainer = document.createElement('div');

        const btnEditType = document.createElement('button');
        btnEditType.setAttribute('data-testid', 'transactionItemEditTypeButton');
        btnEditType.textContent = 'Ubah Tipe';
        btnEditType.addEventListener('click', () => {
            toggleTransactionType(transaction.id);
        });

        const btnEdit = document.createElement('button');
        btnEdit.textContent = 'Edit';
        btnEdit.addEventListener('click', () => {
            editTransaction(transaction.id);
        });

        const btnDelete = document.createElement('button');
        btnDelete.setAttribute('data-testid', 'transactionItemDeleteButton');
        btnDelete.textContent = 'Hapus';
        btnDelete.addEventListener('click', () => {
            deleteTransaction(transaction.id);
        });

        actionContainer.append(btnEditType, btnEdit, btnDelete);
        transactionItem.append(title, amount, date, typeLabel, actionContainer);

        if (transaction.type === 'income') {
            incomeList.append(transactionItem);
        } else {
            expenseList.append(transactionItem);
        }
    });
}

// TODO [Basic] Tambahkan event listener 'submit' pada form, panggil e.preventDefault() di dalamnya
// TODO [Basic] Di dalam handler submit, ambil nilai input lalu tambahkan sebagai objek transaksi baru ke array
transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = transactionFormTitleInput.value.trim();
    const amount = Number(transactionFormAmountInput.value);
    const date = transactionFormDateInput.value;
    const type = transactionFormTypeSelect.value;

    /**
     * TODO [Skilled]:
     * Tambahkan validasi input sebelum menyimpan data:
     *  - Tampilkan alert() dan hentikan proses jika judul kosong
     *  - Tampilkan alert() dan hentikan proses jika nominal kurang dari 1
     */
    if (!title) {
        alert('Keterangan transaksi tidak boleh kosong!');
        return;
    }
    if (amount < 1) {
        alert('Nominal transaksi harus 1 ke atas!');
        return;
    }

    if (editingId) {
        const index = transactions.findIndex(t => t.id === editingId);
        if (index !== -1) {
            transactions[index] = { id: editingId, title, amount, date, type };
        }
        editingId = null;
        transactionForm.querySelector('button[type="submit"]').textContent = 'Simpan';
    } else {
        const newTransaction = {
            id: generateId(),
            title,
            amount,
            date,
            type
        };
        transactions.push(newTransaction);
    }

    transactionForm.reset();
    saveData();
});

/**
 * TODO [Advanced]:
 * Setiap kali data transaksi berubah, perbarui Panel Dasbor:
 *  - Hitung total pemasukan, total pengeluaran, dan saldo (pemasukan - pengeluaran)
 *  - Tampilkan hasilnya ke elemen yang sesuai di HTML
 */
function updateDashboard() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentBalance = totalIncome - totalExpense;

    incomeAmount.textContent = formatCurrency(totalIncome);
    expenseAmount.textContent = formatCurrency(totalExpense);
    balanceAmount.textContent = formatCurrency(currentBalance);
}


/**
 * ========================================================
 * Kriteria 2: Mengelola Penyimpanan Data (Web Storage API)
 * ========================================================
 */
const STORAGE_KEY = 'EXPENSE_TRACKER_DATA';

/**
 * TODO [Basic]:
 * Data transaksi disimpan ke localStorage menggunakan JSON.stringify(), dan dimuat kembali saat halaman dibuka menggunakan JSON.parse().
 *  - Tombol "Hapus" berfungsi: transaksi yang dihapus langsung hilang dari layar dan dari localStorage.
 */
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    document.dispatchEvent(new Event('transaction:updated'));
}

function loadData() {
    const serializedData = localStorage.getItem(STORAGE_KEY);
    if (serializedData) {
        transactions = JSON.parse(serializedData);
    }
    document.dispatchEvent(new Event('transaction:updated'));
}

function deleteTransaction(id) {
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        transactions.splice(index, 1);
        saveData();
    }
}

/**
 * TODO [Skilled]:
 * Tombol "Edit" berfungsi: saat ditekan, formulir (#transactionForm) secara otomatis terisi dengan data transaksi yang dipilih.
 *  - Pengguna dapat mengubah data lalu menyimpan perubahan.
 *  - Formulir kembali ke mode "Tambah" setelah pembaruan selesai.
 */
function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
        editingId = transaction.id;

        transactionFormTitleInput.value = transaction.title;
        transactionFormAmountInput.value = transaction.amount;
        transactionFormDateInput.value = transaction.date;
        transactionFormTypeSelect.value = transaction.type;

        transactionForm.querySelector('button[type="submit"]').textContent = 'Simpan Perubahan';
        transactionForm.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * TODO [Advanced]:
 * Gunakan Custom Event sebagai penghubung antara perubahan data dan pembaruan tampilan:
 *  - Kirim sinyal dengan document.dispatchEvent(new Event('transaction:updated')) setiap kali data berubah
 *  - Pasang satu listener untuk event tersebut yang memanggil fungsi render dan update dasbor
 */
document.addEventListener('transaction:updated', () => {
    const keyword = searchInput.value.toLowerCase().trim();
    const filteredData = transactions.filter(t =>
        t.title.toLowerCase().includes(keyword)
    );

    renderTransactions(filteredData);
    updateDashboard();
});


/**
 * ========================================================
 * Kriteria 3: Fitur Interaktif (Pindah Kategori dan Pencarian)
 * ========================================================
 */
/**
 * TODO [Basic]:
 * Tambahkan tombol "Ubah Tipe" pada setiap kartu transaksi:
 *  - Saat diklik, ubah tipe transaksi: 'income' → 'expense' atau 'expense' → 'income'
 *  - Simpan perubahan ke localStorage dan perbarui tampilan
 */
function toggleTransactionType(id) {
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        transactions[index].type = transactions[index].type === 'income' ? 'expense' : 'income';
        saveData();
    }
}

/**
 * TODO [Skilled]:
 * Tambahkan event listener 'input' pada kolom pencarian:
 *  - Filter array transaksi berdasarkan kecocokan kata kunci dengan judul transaksi
 *  - Tampilkan hanya transaksi yang judulnya mengandung kata kunci tersebut
 */
searchInput.addEventListener('input', () => {
    document.dispatchEvent(new Event('transaction:updated'));
});

/**
 * TODO [Advanced]:
 * Pastikan fitur pencarian berjalan dengan baik di semua kondisi:
 *  - Saat kolom pencarian dikosongkan, tampilkan kembali seluruh daftar transaksi
 */
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    document.dispatchEvent(new Event('transaction:updated'));
});

// Load awal
document.addEventListener('DOMContentLoaded', () => {
    loadData();
});
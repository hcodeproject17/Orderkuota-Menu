const spreadsheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTkOMIskV0lw9TKHYsAUrW35Kfp5n2MVFaDsMcV_IieBLCAAmWfa0WCPHBGKKHpD3dYB-zXfEab0pVj/pub?output=csv"; // Ganti dengan URL CSV Anda

// Variabel untuk menyimpan transaksi dari CSV
let transactions = [];

// Kurs mata uang (simulasi)
const exchangeRates = {
    IDR: 1,
    USD: 0.000064, // 1 IDR = 0.000064 USD
    EUR: 0.000059  // 1 IDR = 0.000059 EUR
};

async function loadCSV(url) {
    // Show loading indicator
    document.getElementById('loading-container').style.display = 'flex';
    document.getElementById('saldo-container').style.display = 'none';
    
    try {
        const response = await fetch(url);
        const data = await response.text();
        const result = parseCSV(data);
        
        // Inisialisasi fitur tambahan
        initCurrencyConverter();
        initAddTransactionForm();
        updateLastUpdateTime();
        
        // Inisialisasi dan update grafik penjualan
        if (typeof initSalesChart === 'function') {
            initSalesChart();
        } else {
            console.error("Function initSalesChart is not defined. Make sure chart.js is loaded properly.");
        }
        
        // Hide loading indicator after data is loaded
        setTimeout(() => {
            document.getElementById('loading-container').style.display = 'none';
            document.getElementById('saldo-container').style.display = 'flex';
        }, 500); // 500 milidetik = 0,5 detik
    } catch (error) {
        console.error("Gagal memuat data:", error);
        // Hide loading and show error message
        document.getElementById('loading-container').style.display = 'none';
        document.getElementById('saldo-container').innerHTML = '<div class="error-message">Gagal memuat data. Silakan coba lagi nanti.</div>';
    }
}

function parseCSV(csv) {
    const rows = csv.split("\n").map(row => row.split(","));
    
    // Pastikan data memiliki header
    if (rows.length < 2) return;

    // Hapus spasi di setiap elemen
    const headers = rows[0].map(header => header.trim());
    const saldoContainer = document.getElementById("saldo-container");
    saldoContainer.innerHTML = "";

    // Ekstrak data saldo untuk ditampilkan
    rows.slice(1).forEach((row, index) => {
        let data = row.map(cell => cell.trim());

        const saldo = data[0] || "0";
        const mataUang = data[1] || "Rp";

        const card = document.createElement("div");
        card.classList.add("saldo-card");
        
        // Tambahkan animasi delay berdasarkan index
        card.style.animation = `fadeIn 0.5s ease ${index * 0.1}s both`;
        
        card.innerHTML = `
            <h2>Saldo Akun</h2>
            <p>${mataUang} ${formatNumber(saldo)}</p>
        `;

        saldoContainer.appendChild(card);
    });
    
    return { headers, rows };
}

// Fungsi untuk memformat angka dengan pemisah ribuan
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Tambahkan style untuk animasi
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

// Fungsi untuk menginisialisasi riwayat transaksi
function initTransactionHistory() {
    const riwayatContainer = document.getElementById('riwayat-container');
    if (!riwayatContainer) return;
    
    // Hapus placeholder
    riwayatContainer.innerHTML = '';
    
    // Buat tabel untuk riwayat transaksi
    const table = document.createElement('table');
    table.classList.add('riwayat-table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Jumlah</th>
                <th>Keterangan</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    
    const tbody = table.querySelector('tbody');
    
    // Gunakan data transaksi dari CSV atau fallback ke dummy jika kosong
    const transactionsToShow = transactions.length > 0 ? transactions : [];
    
    // Tambahkan data transaksi ke tabel
    transactionsToShow.forEach((transaksi, index) => {
        const row = document.createElement('tr');
        row.style.animation = `fadeIn 0.5s ease ${index * 0.1}s both`;
        
        // Format tanggal
        const tanggal = new Date(transaksi.tanggal);
        const formattedDate = !isNaN(tanggal.getTime()) ? 
            tanggal.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }) : transaksi.tanggal;
        
        // Tentukan kelas berdasarkan jenis transaksi
        const jenisClass = transaksi.jenis.toLowerCase() === 'masuk' ? 'transaksi-masuk' : 'transaksi-keluar';
        const jenisIcon = transaksi.jenis.toLowerCase() === 'masuk' ? 
            '<i class="fas fa-arrow-down"></i>' : 
            '<i class="fas fa-arrow-up"></i>';
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td class="${jenisClass}">${jenisIcon} ${transaksi.jenis}</td>
            <td class="${jenisClass}">Rp ${formatNumber(transaksi.jumlah)}</td>
            <td>${transaksi.keterangan}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Tampilkan pesan jika tidak ada transaksi
    if (transactionsToShow.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="4" style="text-align: center; padding: 20px;">
                Tidak ada data transaksi tersedia
            </td>
        `;
        tbody.appendChild(emptyRow);
    }
    
    riwayatContainer.appendChild(table);
    
    // Tambahkan style untuk tabel
    const style = document.createElement('style');
    style.textContent = `
        .riwayat-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
        }
        
        .riwayat-table th, .riwayat-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #444;
        }
        
        .riwayat-table th {
            background-color: #1a1a1a;
            color: #00ff00;
            font-weight: 600;
        }
        
        .riwayat-table tr:hover {
            background-color: #333;
        }
        
        .transaksi-masuk {
            color: #00ff00;
        }
        
        .transaksi-keluar {
            color: #ff6b6b;
        }
    `;
    document.head.appendChild(style);
}

// Fungsi untuk menginisialisasi konverter mata uang
function initCurrencyConverter() {
    const konversiButton = document.getElementById('konversi-button');
    if (!konversiButton) return;
    
    konversiButton.addEventListener('click', () => {
        const jumlah = parseFloat(document.getElementById('jumlah').value);
        const dariMataUang = document.getElementById('dari-mata-uang').value;
        const keMataUang = document.getElementById('ke-mata-uang').value;
        
        // Konversi ke IDR terlebih dahulu (jika bukan IDR)
        let nilaiIDR = jumlah;
        if (dariMataUang !== 'IDR') {
            nilaiIDR = jumlah / exchangeRates[dariMataUang];
        }
        
        // Konversi dari IDR ke mata uang tujuan
        let hasilKonversi = nilaiIDR;
        if (keMataUang !== 'IDR') {
            hasilKonversi = nilaiIDR * exchangeRates[keMataUang];
        }
        
        // Format hasil sesuai mata uang
        let formatHasil = '';
        if (keMataUang === 'IDR') {
            formatHasil = `Rp ${formatNumber(hasilKonversi.toFixed(0))}`;
        } else if (keMataUang === 'USD') {
            formatHasil = `$ ${hasilKonversi.toFixed(2)}`;
        } else if (keMataUang === 'EUR') {
            formatHasil = `€ ${hasilKonversi.toFixed(2)}`;
        }
        
        // Tampilkan hasil
        const hasilKonversiElement = document.getElementById('hasil-konversi');
        hasilKonversiElement.innerHTML = `
            <p class="hasil-nilai">${formatHasil}</p>
            <p class="hasil-detail">${formatNumber(jumlah)} ${dariMataUang} = ${formatHasil}</p>
        `;
        
        // Animasi hasil
        hasilKonversiElement.style.animation = 'fadeIn 0.5s ease';
        setTimeout(() => {
            hasilKonversiElement.style.animation = '';
        }, 500);
    });
}

// Fungsi untuk memperbarui waktu terakhir diperbarui
function updateLastUpdateTime() {
    const lastUpdateElement = document.getElementById('last-update');
    if (!lastUpdateElement) return;
    
    const now = new Date();
    const options = {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    lastUpdateElement.textContent = now.toLocaleDateString('id-ID', options);
}

// Panggil fungsi untuk memuat data
loadCSV(spreadsheetURL);

// Fungsi untuk menginisialisasi form tambah transaksi
function initAddTransactionForm() {
    const formContainer = document.getElementById('add-transaction-form');
    if (!formContainer) return;
    
    // Buat form untuk menambah transaksi
    formContainer.innerHTML = `
        <h3>Tambah Transaksi Baru</h3>
        <form id="transaction-form">
            <div class="form-group">
                <label for="tanggal">Tanggal</label>
                <input type="date" id="tanggal" required>
            </div>
            <div class="form-group">
                <label for="jenis">Jenis Transaksi</label>
                <select id="jenis" required>
                    <option value="masuk">Pemasukan</option>
                    <option value="keluar">Pengeluaran</option>
                </select>
            </div>
            <div class="form-group">
                <label for="jumlah">Jumlah (Rp)</label>
                <input type="number" id="jumlah" min="1" required>
            </div>
            <div class="form-group">
                <label for="keterangan">Keterangan</label>
                <input type="text" id="keterangan" required>
            </div>
            <button type="submit" class="submit-btn">Simpan Transaksi</button>
        </form>
        <div id="form-status" class="form-status"></div>
    `;
    
    // Tambahkan style untuk form
    const style = document.createElement('style');
    style.textContent = `
        #transaction-form {
            background-color: #1a1a1a;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #00ff00;
            font-weight: 500;
        }
        
        .form-group input, .form-group select {
            width: 100%;
            padding: 10px;
            background-color: #333;
            border: 1px solid #444;
            border-radius: 4px;
            color: #fff;
        }
        
        .submit-btn {
            background-color: #00ff00;
            color: #000;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            transition: background-color 0.3s;
        }
        
        .submit-btn:hover {
            background-color: #00cc00;
        }
        
        .form-status {
            margin-top: 15px;
            padding: 10px;
            border-radius: 4px;
            display: none;
        }
        
        .status-success {
            display: block;
            background-color: rgba(0, 255, 0, 0.2);
            color: #00ff00;
        }
        
        .status-error {
            display: block;
            background-color: rgba(255, 0, 0, 0.2);
            color: #ff6b6b;
        }
    `;
    document.head.appendChild(style);
    
    // Tambahkan event listener untuk form submission
    const form = document.getElementById('transaction-form');
    form.addEventListener('submit', handleTransactionSubmit);
}

// Fungsi untuk menangani submit form transaksi
async function handleTransactionSubmit(event) {
    event.preventDefault();
    
    const tanggal = document.getElementById('tanggal').value;
    const jenis = document.getElementById('jenis').value;
    const jumlah = document.getElementById('jumlah').value;
    const keterangan = document.getElementById('keterangan').value;
    
    const formStatus = document.getElementById('form-status');
    formStatus.className = 'form-status';
    formStatus.textContent = 'Menyimpan transaksi...';
    formStatus.style.display = 'block';
    
    try {
        // Kirim data ke Google Sheets menggunakan Google Apps Script
        const result = await sendTransactionToSheet(tanggal, jenis, jumlah, keterangan);
        
        if (result.success) {
            // Tampilkan pesan sukses
            formStatus.textContent = 'Transaksi berhasil disimpan!';
            formStatus.classList.add('status-success');
            
            // Reset form
            document.getElementById('transaction-form').reset();
            
            // Reload data setelah 2 detik
            setTimeout(() => {
                loadCSV(spreadsheetURL);
            }, 2000);
        } else {
            throw new Error(result.error || 'Gagal menyimpan transaksi');
        }
    } catch (error) {
        console.error('Error:', error);
        formStatus.textContent = `Gagal menyimpan transaksi: ${error.message}`;
        formStatus.classList.add('status-error');
    }
}

// Fungsi untuk mengirim data transaksi ke Google Sheet
async function sendTransactionToSheet(tanggal, jenis, jumlah, keterangan) {
    // URL Google Apps Script Web App
    const scriptURL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
    
    const formData = new FormData();
    formData.append('tanggal', tanggal);
    formData.append('jenis', jenis);
    formData.append('jumlah', jumlah);
    formData.append('keterangan', keterangan);
    
    const response = await fetch(scriptURL, {
        method: 'POST',
        body: formData
    });
    
    return await response.json();
}

// Modifikasi fungsi loadCSV untuk memanggil initAddTransactionForm
async function loadCSV(url) {
    // Show loading indicator
    document.getElementById('loading-container').style.display = 'flex';
    document.getElementById('saldo-container').style.display = 'none';
    
    try {
        const response = await fetch(url);
        const data = await response.text();
        const result = parseCSV(data);
        
        // Inisialisasi fitur tambahan
        initCurrencyConverter();
        initAddTransactionForm();
        updateLastUpdateTime();
        
        // Inisialisasi dan update grafik penjualan
        if (typeof initSalesChart === 'function') {
            initSalesChart();
        } else {
            console.error("Function initSalesChart is not defined. Make sure chart.js is loaded properly.");
        }
        
        // Hide loading indicator after data is loaded
        setTimeout(() => {
            document.getElementById('loading-container').style.display = 'none';
            document.getElementById('saldo-container').style.display = 'flex';
        }, 500); // 500 milidetik = 0,5 detik
    } catch (error) {
        console.error("Gagal memuat data:", error);
        // Hide loading and show error message
        document.getElementById('loading-container').style.display = 'none';
        document.getElementById('saldo-container').innerHTML = '<div class="error-message">Gagal memuat data. Silakan coba lagi nanti.</div>';
    }
}

// Fungsi untuk menampilkan salam berdasarkan waktu lokal
function updateGreeting() {
    const greetingElement = document.getElementById('greeting');
    const timeElement = document.getElementById('current-time');
    
    if (!greetingElement || !timeElement) return;
    
    const now = new Date();
    const hour = now.getHours();
    
    // Tentukan salam berdasarkan waktu
    let greeting = '';
    if (hour >= 3 && hour < 11) {
        greeting = 'Selamat Pagi';
    } else if (hour >= 11 && hour < 15) {
        greeting = 'Selamat Siang';
    } else if (hour >= 15 && hour < 18) {
        greeting = 'Selamat Sore';
    } else {
        greeting = 'Selamat Malam';
    }
    
    // Tampilkan salam
    greetingElement.textContent = `${greeting}, `;
    
    // Format dan tampilkan waktu saat ini
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    timeElement.textContent = now.toLocaleTimeString('id-ID', options);
    
    // Perbarui setiap menit
    setTimeout(updateGreeting, 60000);
}

// Panggil fungsi updateGreeting saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    updateGreeting();
    // ... panggilan fungsi lain yang sudah ada ...
});

// URL data CSV untuk data penjualan 12 bulan
const salesDataURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vST67-Z2iTrRHEs_TpS6ivNgTViMiZLSDgfErivtILbtQdivbKY9C63lYqRusouoJdmcTv2I0AiOgJA/pub?output=csv';

// Fungsi untuk memuat data visualisasi
async function loadVisualizationData() {
    try {
        const response = await fetch(salesDataURL);
        const data = await response.text();
        return data;
    } catch (error) {
        console.error('Gagal memuat data visualisasi:', error);
        return null;
    }
}

// Fungsi untuk mem-parse data CSV penjualan
function parseSalesData(csvData) {
    if (!csvData) return { labels: [], values: [] };
    
    const rows = csvData.split('\n');
    
    // Pastikan ada header dan data
    if (rows.length < 2) return { labels: [], values: [] };
    
    // Asumsikan baris pertama adalah header
    const dataRows = rows.slice(1).filter(row => row.trim() !== '');
    
    const labels = [];
    const values = [];
    
    dataRows.forEach(row => {
        const cols = row.split(',');
        if (cols.length >= 2) {
            // Asumsikan kolom pertama adalah bulan dan kolom kedua adalah nilai penjualan
            labels.push(cols[0].trim());
            // Konversi nilai penjualan ke angka dan pastikan valid
            const value = parseFloat(cols[1].trim());
            values.push(isNaN(value) ? 0 : value);
        }
    });
    
    return { labels, values };
}

// Fungsi untuk menginisialisasi grafik penjualan
function initSalesChart() {
    // Dapatkan elemen grafik
    const chartContainer = document.querySelector('.chart-placeholder');
    if (!chartContainer) return;
    
    // Bersihkan placeholder
    chartContainer.innerHTML = '';
    
    // Buat elemen canvas untuk grafik
    const canvas = document.createElement('canvas');
    canvas.id = 'salesChart';
    chartContainer.appendChild(canvas);
    
    // Muat dan proses data
    loadVisualizationData().then(csvData => {
        const { labels, values } = parseSalesData(csvData);
        createSalesChart(labels, values);
    });
}

// Fungsi untuk membuat grafik penjualan
function createSalesChart(labels, values) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    
    // Buat gradien untuk area di bawah garis
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 255, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
    
    // Buat grafik
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Penjualan Harian',
                data: values,
                borderColor: '#00ff00',
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: '#00ff00',
                pointBorderColor: '#121212',
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#ffffff',
                        font: {
                            family: 'monospace',
                            size: 12
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Data Penjualan Perminggu',
                    color: '#00ff00',
                    font: {
                        family: 'monospace',
                        size: 16,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                tooltip: {
                    backgroundColor: '#1a1a1a',
                    titleColor: '#00ff00',
                    bodyColor: '#ffffff',
                    borderColor: '#00ff00',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `Penjualan: Rp ${formatNumber(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#ffffff'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#ffffff',
                        callback: function(value) {
                            return 'Rp ' + formatNumber(value);
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Fungsi untuk memformat angka dengan pemisah ribuan
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
// URL to the published Google Spreadsheet CSV containing menu data
// const menuSpreadsheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS1AT0J-DyWK-LX1tMzrBanwY0hTX0Eg24w9BQDKGJIvrym2Rb4hLSpp_dmHfIU0JsI-9zVKMx0s3yr/pub?output=csv"; // Menu CSV URL
const menuSpreadsheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTq31KUUVAyIdyXGmkizBBkKq0JRLlqOlffwj0mKy_4OI1d32d9KqHvmV8mrOilF-kBV-nCNw4Tb1we/pub?output=csv"; // Menu CSV URL

// Global variables
let menuItems = [];
let categories = [];
let selectedItems = [];
const whatsappNumber = "6285794281784"; // Your WhatsApp number

// Load menu data when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the greeting
    updateGreeting();
    
    // Load menu data
    loadMenuData(menuSpreadsheetURL);
    
    // Set up event listeners
    setupEventListeners();
});

// Function to load menu data from CSV
async function loadMenuData(url) {
    // Show loading indicator
    document.getElementById('loading-container').style.display = 'flex';
    document.getElementById('menu-container').innerHTML = '';
    
    try {
        const response = await fetch(url);
        const data = await response.text();
        parseMenuCSV(data);
        
        // Hide loading indicator after data is loaded
        setTimeout(() => {
            document.getElementById('loading-container').style.display = 'none';
        }, 500);
        
        // Update last update time
        updateLastUpdateTime();
    } catch (error) {
        console.error("Gagal memuat data menu:", error);
        // Hide loading and show error message
        document.getElementById('loading-container').style.display = 'none';
        document.getElementById('menu-container').innerHTML = '<div class="error-message">Gagal memuat data menu. Silakan coba lagi nanti.</div>';
    }
}

// Function to parse CSV data
function parseMenuCSV(csv) {
    const rows = csv.split("\n").map(row => row.split(","));
    
    // Ensure data has headers
    if (rows.length < 2) {
        document.getElementById('menu-container').innerHTML = '<div class="error-message">Data menu tidak tersedia.</div>';
        return;
    }

    // Get headers and trim whitespace
    const headers = rows[0].map(header => header.trim());
    
    // Extract menu items from CSV
    menuItems = [];
    categories = [];
    
    rows.slice(1).forEach((row, index) => {
        if (row.length >= headers.length) {
            const item = {};
            
            // Map CSV columns to item properties
            headers.forEach((header, index) => {
                item[header.toLowerCase()] = row[index].trim();
            });
            
            // Ensure required fields exist (Kategori and Nama Produk)
            if (item['nama produk'] && item.kategori) {
                // Rename fields for consistency with existing code
                item.nama = item['nama produk'];
                item.id = item['kode produk'] || index.toString();
                
                menuItems.push(item);
                
                // Add category if it doesn't exist yet
                if (!categories.includes(item.kategori)) {
                    categories.push(item.kategori);
                }
            }
        }
    });
    
    // Sort categories alphabetically
    categories.sort();
    
    // Populate category filter
    populateCategoryFilter();
    
    // Display menu items grouped by category
    displayMenuByCategory();
}

// Function to populate category filter dropdown
function populateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    
    // Clear existing options except "All Categories"
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    // Add categories to filter
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Function to display menu items grouped by category
function displayMenuByCategory(filterCategory = 'all', searchQuery = '') {
    const menuContainer = document.getElementById('menu-container');
    menuContainer.innerHTML = '';
    
    // If we're searching, show all matching items across categories
    if (searchQuery !== '') {
        // Create a container for search results
        const searchResultsContainer = document.createElement('div');
        searchResultsContainer.classList.add('search-results');
        
        // Add search results title
        const searchTitle = document.createElement('h3');
        searchTitle.classList.add('category-title');
        searchTitle.innerHTML = `<i class="fas fa-search"></i> Hasil Pencarian: "${searchQuery}"`;
        searchResultsContainer.appendChild(searchTitle);
        
        // Filter items by search query across all categories
        const searchResults = menuItems.filter(item => {
            const matchesCategory = filterCategory === 'all' || item.kategori === filterCategory;
            const matchesSearch = item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item['kode produk'] && item['kode produk'].toLowerCase().includes(searchQuery.toLowerCase()));
            
            return matchesCategory && matchesSearch;
        });
        
        if (searchResults.length > 0) {
            // Create grid for search results
            const itemsGrid = document.createElement('div');
            itemsGrid.classList.add('menu-items-grid');
            
            // Add items to grid
            searchResults.forEach((item, index) => {
                const itemCard = createMenuItemCard(item, index);
                itemsGrid.appendChild(itemCard);
            });
            
            searchResultsContainer.appendChild(itemsGrid);
            menuContainer.appendChild(searchResultsContainer);
        } else {
            menuContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search empty-icon"></i>
                    <p>Tidak ada menu yang sesuai dengan pencarian Anda.</p>
                </div>
            `;
        }
    } 
    // If no search query, show categories or category items
    else {
        // If no specific category is selected, show only category cards
        if (filterCategory === 'all') {
            const categoriesGrid = document.createElement('div');
            categoriesGrid.classList.add('categories-grid');
            
            // Create a card for each category
            categories.forEach(category => {
                const categoryCard = createCategoryCard(category);
                categoriesGrid.appendChild(categoryCard);
            });
            
            menuContainer.appendChild(categoriesGrid);
        } 
        // If a specific category is selected, show its items
        else {
            // Create category section
            const categorySection = document.createElement('div');
            categorySection.classList.add('menu-category');
            
            // Add category title with back button
            const categoryTitle = document.createElement('h3');
            categoryTitle.classList.add('category-title');
            categoryTitle.innerHTML = `
                <span class="category-back-btn"><i class="fas fa-arrow-left"></i></span>
                <i class="fas fa-tag"></i> ${filterCategory}
            `;
            categorySection.appendChild(categoryTitle);
            
            // Add event listener to back button
            const backBtn = categoryTitle.querySelector('.category-back-btn');
            backBtn.addEventListener('click', () => {
                document.getElementById('category-filter').value = 'all';
                displayMenuByCategory('all', '');
            });
            
            // Filter items by the selected category
            const categoryItems = menuItems.filter(item => item.kategori === filterCategory);
            
            if (categoryItems.length > 0) {
                // Create grid for menu items
                const itemsGrid = document.createElement('div');
                itemsGrid.classList.add('menu-items-grid');
                
                // Add items to grid
                categoryItems.forEach((item, index) => {
                    const itemCard = createMenuItemCard(item, index);
                    itemsGrid.appendChild(itemCard);
                });
                
                categorySection.appendChild(itemsGrid);
                menuContainer.appendChild(categorySection);
            } else {
                menuContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-circle empty-icon"></i>
                        <p>Tidak ada menu dalam kategori ini.</p>
                    </div>
                `;
            }
        }
    }
}

// Function to create a category card
function createCategoryCard(category) {
    const card = document.createElement('div');
    card.classList.add('category-card');
    
    // Create card content
    card.innerHTML = `
        <div class="category-card-content">
            <h3 class="category-card-title"><i class="fas fa-tag"></i> ${category}</h3>
            <p class="category-card-desc">Lihat semua menu dalam kategori ini</p>
        </div>
        <div class="category-card-action">
            <button class="view-category-btn">Lihat Menu <i class="fas fa-arrow-right"></i></button>
        </div>
    `;
    
    // Add event listener to view button
    const viewBtn = card.querySelector('.view-category-btn');
    viewBtn.addEventListener('click', function() {
        // Update category filter dropdown
        document.getElementById('category-filter').value = category;
        
        // Display items for this category
        displayMenuByCategory(category, '');
    });
    
    return card;
}

// Function to create a menu item card
function createMenuItemCard(item, index) {
    const card = document.createElement('div');
    card.classList.add('menu-item-card');
    card.style.animation = `fadeIn 0.5s ease ${index * 0.05}s both`;
    
    // Check if item is already selected
    const isSelected = selectedItems.some(selectedItem => selectedItem.id === item.id);
    
    // Create card content
    card.innerHTML = `
        <div class="menu-item-content">
            <h4 class="menu-item-name">${item.nama}</h4>
            ${item.deskripsi ? `<p class="menu-item-desc">${item.deskripsi}</p>` : ''}
            ${item['kode produk'] ? `<p class="menu-item-code">Kode: ${item['kode produk']}</p>` : ''}
        </div>
        <div class="menu-item-action">
            <label class="menu-item-select">
                <input type="radio" name="menu-item" value="${item.nama}" data-id="${item.id || index}" ${isSelected ? 'checked' : ''}>
                <span class="radio-checkmark"></span>
                <span class="select-text">Pilih</span>
            </label>
        </div>
    `;
    
    // Add event listener to radio button
    const radioBtn = card.querySelector('input[type="radio"]');
    radioBtn.addEventListener('change', function() {
        if (this.checked) {
            // Clear previous selections
            selectedItems = [];
            
            // Add item to selected items
            selectedItems.push({
                id: this.dataset.id,
                name: this.value,
                code: item['kode produk'] || ''
            });
            
            // Uncheck other radio buttons
            document.querySelectorAll('input[name="menu-item"]').forEach(radio => {
                if (radio !== this) {
                    radio.checked = false;
                }
            });
        }
        
        // Update selected items display
        updateSelectedItems();
    });
    
    return card;
}

// Function to update selected items display
function updateSelectedItems() {
    const container = document.getElementById('selected-items-container');
    const orderButton = document.getElementById('order-button');
    const floatingCartItems = document.getElementById('floating-cart-items');
    const cartEmptyMessage = document.getElementById('cart-empty');
    const cartOrderButton = document.getElementById('cart-order-button');
    
    if (selectedItems.length === 0) {
        // Update main selected items container
        container.innerHTML = '<p class="empty-selection">Belum ada item yang dipilih</p>';
        orderButton.disabled = true;
        
        // Update floating cart
        if (floatingCartItems) floatingCartItems.innerHTML = '';
        if (cartEmptyMessage) cartEmptyMessage.style.display = 'block';
        if (cartOrderButton) cartOrderButton.disabled = true;
    } else {
        // Create list of selected items for main container
        let html = '<ul class="selected-items-list">';
        
        selectedItems.forEach(item => {
            html += `
                <li class="selected-item">
                    <span class="selected-item-name">${item.name}</span>
                    ${item.code ? `<span class="selected-item-code">Kode: ${item.code}</span>` : ''}
                    <button class="remove-item-btn" data-id="${item.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </li>
            `;
        });
        
        html += '</ul>';
        
        container.innerHTML = html;
        orderButton.disabled = false;
        
        // Create list of selected items for floating cart
        if (floatingCartItems) {
            let cartHtml = '';
            
            selectedItems.forEach(item => {
                cartHtml += `
                    <div class="cart-item">
                        <span class="cart-item-name">${item.name}</span>
                        ${item.code ? `<span class="cart-item-code">${item.code}</span>` : ''}
                        <button class="cart-remove-btn" data-id="${item.id}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            });
            
            floatingCartItems.innerHTML = cartHtml;
            if (cartEmptyMessage) cartEmptyMessage.style.display = 'none';
            if (cartOrderButton) cartOrderButton.disabled = false;
        }
        
        // Add event listeners to remove buttons in main container
        document.querySelectorAll('.remove-item-btn').forEach(button => {
            button.addEventListener('click', function() {
                const itemId = this.dataset.id;
                
                // Remove item from selected items
                selectedItems = [];
                
                // Uncheck corresponding radio button
                const radioBtn = document.querySelector(`input[data-id="${itemId}"]`);
                if (radioBtn) radioBtn.checked = false;
                
                // Update selected items display
                updateSelectedItems();
            });
        });
        
        // Add event listeners to remove buttons in floating cart
        document.querySelectorAll('.cart-remove-btn').forEach(button => {
            button.addEventListener('click', function() {
                const itemId = this.dataset.id;
                
                // Remove item from selected items
                selectedItems = [];
                
                // Uncheck corresponding radio button
                const radioBtn = document.querySelector(`input[data-id="${itemId}"]`);
                if (radioBtn) radioBtn.checked = false;
                
                // Update selected items display
                updateSelectedItems();
            });
        });
    }
}


// Function to set up event listeners
function setupEventListeners() {
    // Search button click
    document.getElementById('search-button').addEventListener('click', performSearch);
    
    // Search input enter key
    document.getElementById('menu-search').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
    
    // Category filter change
    document.getElementById('category-filter').addEventListener('change', function() {
        const searchQuery = document.getElementById('menu-search').value.trim();
        displayMenuByCategory(this.value, searchQuery);
    });
    
    // Order button click
    document.getElementById('order-button').addEventListener('click', function() {
        sendWhatsAppOrder();
    });
    
    // Floating cart toggle
    const cartToggle = document.querySelector('.cart-toggle');
    const floatingCart = document.getElementById('floating-cart');
    
    if (cartToggle && floatingCart) {
        cartToggle.addEventListener('click', function() {
            floatingCart.classList.toggle('expanded');
        });
    }
    
    // Cart order button click
    const cartOrderButton = document.getElementById('cart-order-button');
    if (cartOrderButton) {
        cartOrderButton.addEventListener('click', function() {
            sendWhatsAppOrder();
        });
    }
}

// Function to perform search
function performSearch() {
    const searchQuery = document.getElementById('menu-search').value.trim();
    const category = document.getElementById('category-filter').value;
    
    if (searchQuery === '') {
        // If search is empty, just show categories or selected category
        displayMenuByCategory(category, '');
    } else {
        // If there's a search query, show results across categories or within selected category
        displayMenuByCategory(category, searchQuery);
    }
}

// Function to send WhatsApp order
function sendWhatsAppOrder() {
    if (selectedItems.length === 0) return;
    
    // Create order message
    let message = "Halo, saya ingin menanyakan harga untuk:\n";
    
    selectedItems.forEach(item => {
        message += `- ${item.name}`;
        if (item.code) {
            message += ` (Kode: ${item.code})`;
        }
        message += "\n";
    });
    
    message += "\nMohon informasi harga untuk produk tersebut. Terima kasih!";
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappURL, '_blank');
}

// Function to format number with thousand separator
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Function to update last update time
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

// Function to display greeting based on local time
function updateGreeting() {
    const greetingElement = document.getElementById('greeting');
    const timeElement = document.getElementById('current-time');
    
    if (!greetingElement || !timeElement) return;
    
    const now = new Date();
    const hour = now.getHours();
    
    // Determine greeting based on time
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
    
    // Display greeting
    greetingElement.textContent = `${greeting}, `;
    
    // Format and display current time
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    timeElement.textContent = now.toLocaleTimeString('id-ID', options);
    
    // Perbarui setiap menit
    setTimeout(updateGreeting, 60000);
}
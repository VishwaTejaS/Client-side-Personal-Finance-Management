"use strict";

// ===== AUTHENTICATION INTEGRATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Require authentication
    if (typeof AuthService !== 'undefined') {
        AuthService.requireAuth();
        updateUserHeader();
    }
    
    loadFromStorage();
    applyUrlFilters();
    initCharts();
    setupFilterButtons();
});

// Update header with user information
function updateUserHeader() {
    const user = AuthService.getCurrentUser();
    if (user) {
        const avatarEl = document.getElementById('header-avatar');
        const nameEl = document.getElementById('header-name');
        
        if (avatarEl) avatarEl.src = user.avatar;
        if (nameEl) nameEl.textContent = user.fullName.split(' ')[0];
    }
}

// Logout function
async function logout(e) {
    e.preventDefault();
    const action = await UIService.showModal(
        'Logout',
        'Are you sure you want to logout?',
        [
            { label: 'Cancel', action: 'cancel', type: 'secondary' },
            { label: 'Logout', action: 'confirm', type: 'danger' }
        ]
    );

    if (action === 'confirm') {
        AuthService.logout();
        UIService.showNotification('Logged out successfully', 'success', 1500);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
}

// Close dropdown on click outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-section')) {
        UIService?.hideProfileDropdown?.();
    }
});

let pieChart = null;
let barChart = null;
let filteredItemList = [];

function setupFilterButtons() {
    const btnSearch = document.getElementById('btn_filter_search');
    const btnReset = document.getElementById('btn_filter_reset');
    const btnToggleDark = document.getElementById('btn_toggle_dark');
    
    if (btnSearch) btnSearch.addEventListener('click', applyFilters);
    if (btnReset) btnReset.addEventListener('click', resetFilters);
    if (btnToggleDark) btnToggleDark.addEventListener('click', () => { document.body.classList.toggle('dark'); localStorage.setItem('pfm_dark', document.body.classList.contains('dark')); btnToggleDark.setAttribute('aria-pressed', document.body.classList.contains('dark')); });
}

function applyFilters() {
    const category = document.getElementById('filter-category').value;
    const search = document.getElementById('filter-search').value.toLowerCase();
    const fromDate = document.getElementById('filter-from-date').value;
    const toDate = document.getElementById('filter-to-date').value;

    // Filter items based on criteria
    filteredItemList = itemList.filter(item => {
        // Category filter
        if (category && item.category !== category) return false;
        
        // Search filter
        if (search && !item.title.toLowerCase().includes(search)) return false;
        
        // Date range filter
        if (fromDate) {
            const itemDate = new Date(item.dateTime).toISOString().split('T')[0];
            if (itemDate < fromDate) return false;
        }
        if (toDate) {
            const itemDate = new Date(item.dateTime).toISOString().split('T')[0];
            if (itemDate > toDate) return false;
        }
        
        return true;
    });

    // Update charts and tables with filtered data
    updateSummary(filteredItemList);
    renderPieChart(filteredItemList);
    renderBarChart(filteredItemList);
    renderCategoryTable(filteredItemList);
}

function resetFilters() {
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-from-date').value = '';
    document.getElementById('filter-to-date').value = '';
    
    filteredItemList = [...itemList];
    
    // Update charts and tables with all data
    updateSummary(itemList);
    renderPieChart(itemList);
    renderBarChart(itemList);
    renderCategoryTable(itemList);
}

let itemList = [];
let budget = 0;

function loadFromStorage() {
    const raw = localStorage.getItem('pfm_state');
    if (!raw) return;
    try {
        const state = JSON.parse(raw);
        itemList = Array.isArray(state.itemList) ? state.itemList : [];
        budget = typeof state.budget === 'number' ? state.budget : 0;
        filteredItemList = [...itemList]; // Initialize filtered list with all items
    } catch (e) {
        console.warn('Failed to parse storage', e);
    }
}

function initCharts() {
    updateSummary(itemList);
    renderPieChart(itemList);
    renderBarChart(itemList);
    renderCategoryTable(itemList);
}

function updateSummary(dataList) {
    const total = dataList.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
    const balance = budget - total;
    document.getElementById('stat-budget').textContent = budget;
    document.getElementById('stat-expenses').textContent = total;
    document.getElementById('stat-balance').textContent = balance;
    
    // Find most expensive category
    const catMap = {};
    dataList.forEach(it => {
        const cat = it.category || 'General';
        catMap[cat] = (catMap[cat] || 0) + Number(it.amount);
    });
    const mostExpensive = Object.keys(catMap).sort((a, b) => catMap[b] - catMap[a])[0] || '—';
    document.getElementById('stat-category').textContent = mostExpensive + ' (₹' + (catMap[mostExpensive] || 0) + ')';
}

function renderPieChart(dataList) {
    const ctx = document.getElementById('pieChart');
    if (!ctx) return;

    // Aggregate by category
    const catMap = {};
    dataList.forEach(it => {
        const key = it.category || 'General';
        catMap[key] = (catMap[key] || 0) + Number(it.amount);
    });
    
    const labels = Object.keys(catMap);
    const data = labels.map(l => catMap[l]);
    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'];

    const cfg = {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: 'var(--card)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: 'var(--text)', font: { size: 12 } } }
            }
        }
    };

    if (pieChart) pieChart.destroy();
    pieChart = new Chart(ctx, cfg);
}

function renderBarChart(dataList) {
    const ctx = document.getElementById('barChart');
    if (!ctx) return;

    // Group by category
    const catMap = {};
    dataList.forEach(it => {
        const key = it.category || 'General';
        catMap[key] = (catMap[key] || 0) + Number(it.amount);
    });
    
    const labels = Object.keys(catMap);
    const data = labels.map(l => catMap[l]);
    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'];

    const cfg = {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Spending by Category',
                data,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: 'var(--primary)',
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'x',
            plugins: {
                legend: { labels: { color: 'var(--text)' } }
            },
            scales: {
                x: { ticks: { color: 'var(--text)' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                y: { ticks: { color: 'var(--text)' }, grid: { color: 'rgba(255,255,255,0.1)' } }
            }
        }
    };

    if (barChart) barChart.destroy();
    barChart = new Chart(ctx, cfg);
}

function renderCategoryTable(dataList) {
    const tbody = document.getElementById('categoryTableBody');
    if (!tbody) return;

    const catMap = {};
    const catItems = {};
    dataList.forEach(it => {
        const cat = it.category || 'General';
        catMap[cat] = (catMap[cat] || 0) + Number(it.amount);
        catItems[cat] = (catItems[cat] || 0) + 1;
    });

    if (Object.keys(catMap).length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="padding: 20px; text-align: center; color: var(--text-muted);">No expenses found</td></tr>';
        return;
    }

    const total = Object.values(catMap).reduce((a, b) => a + b, 0);
    tbody.innerHTML = Object.keys(catMap).map(cat => `
        <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 10px;">${cat}</td>
            <td style="padding: 10px; text-align: right; font-weight: 600; color: var(--danger);">₹${catMap[cat]}</td>
            <td style="padding: 10px; text-align: right; color: var(--text-muted);">${budget > 0 ? ((catMap[cat] / budget * 100).toFixed(1)) : '0'}%</td>
            <td style="padding: 10px; text-align: center; color: var(--primary); font-weight: 600;">${catItems[cat]}</td>
        </tr>
    `).join('');
}

function applyUrlFilters() {
    // If opened via drilldown, a category may be passed
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category') || localStorage.getItem('pfm_selected_category');
    if (category) {
        const select = document.getElementById('filter-category');
        if (select) select.value = category;
        // apply immediately
        filteredItemList = itemList.filter(it => (it.category || 'General') === category);
        updateSummary(filteredItemList);
        renderPieChart(filteredItemList);
        renderBarChart(filteredItemList);
        renderCategoryTable(filteredItemList);
        // clear the transient selection
        localStorage.removeItem('pfm_selected_category');
    }
}
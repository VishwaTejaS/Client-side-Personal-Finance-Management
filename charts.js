// ===== AUTHENTICATION INTEGRATION =====
window.addEventListener('DOMContentLoaded', () => {
    // Require authentication
    if (typeof AuthService !== 'undefined') {
        AuthService.requireAuth();
        updateUserHeader();
    }
    
    loadFromStorage();
    renderPieChart(itemList);
    renderBarChart(itemList);
    setupFilterButtons();
    setupChartControls();
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

let pieChart, barChart;
let filteredItemList = [];

function loadFromStorage() {
    const stored = localStorage.getItem('pfm_state');
    if (stored) {
        const data = JSON.parse(stored);
        itemList = data.itemList || [];
        budget = data.budget || 0;
        filteredItemList = [...itemList];
    }
}

function setupFilterButtons() {
    const btnFilter = document.getElementById('btn_chart_filter');
    const btnReset = document.getElementById('btn_chart_reset');
    
    if (btnFilter) btnFilter.addEventListener('click', applyChartFilters);
    if (btnReset) btnReset.addEventListener('click', resetChartFilters);
}

function applyChartFilters() {
    const month = document.getElementById('filter-month').value;
    const year = document.getElementById('filter-year').value;
    const category = document.getElementById('filter-category').value;

    filteredItemList = itemList.filter(item => {
        // Category filter
        if (category && item.category !== category) return false;
        
        // Month and Year filter
        if (month || year) {
            const itemDate = new Date(item.dateTime);
            const itemMonth = String(itemDate.getMonth() + 1).padStart(2, '0');
            const itemYear = itemDate.getFullYear().toString();
            
            if (month && itemMonth !== month) return false;
            if (year && itemYear !== year) return false;
        }
        
        return true;
    });

    // Update charts with filtered data
    renderPieChart(filteredItemList);
    renderBarChart(filteredItemList);
}

function resetChartFilters() {
    document.getElementById('filter-month').value = '';
    document.getElementById('filter-year').value = '';
    document.getElementById('filter-category').value = '';
    
    filteredItemList = [...itemList];
    
    // Update charts with all data
    renderPieChart(itemList);
    renderBarChart(itemList);
}

function renderPieChart(dataList) {
    const ctx = document.getElementById('pieChart');
    if (!ctx) return;

    const map = {};
    dataList.forEach(it => {
        const key = it.category || 'General';
        map[key] = (map[key] || 0) + Number(it.amount);
    });
    
    const labels = Object.keys(map);
    const data = labels.map(l => map[l]);
    const colors = ['#2563eb','#ef4444','#f59e0b','#10b981','#8b5cf6','#ec4899','#14b8a6','#f97316'];

    const cfg = {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors.slice(0, labels.length)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: 'var(--text)' } }
            }
        }
    };

    if (pieChart) pieChart.destroy();
    pieChart = new Chart(ctx, cfg);
    // Enable click -> drilldown to analytics by category
    ctx.onclick = function(evt) {
        const points = pieChart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false);
        if (points.length) {
            const idx = points[0].index;
            const category = pieChart.data.labels[idx];
            // store selected category and navigate
            localStorage.setItem('pfm_selected_category', category);
            window.location.href = 'analytics.html?category=' + encodeURIComponent(category);
        }
    };
}

function renderBarChart(dataList) {
    const ctx = document.getElementById('barChart');
    if (!ctx) return;

    // Group by month
    const monthMap = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    dataList.forEach(it => {
        const date = new Date(it.dateTime);
        const monthKey = months[date.getMonth()];
        monthMap[monthKey] = (monthMap[monthKey] || 0) + Number(it.amount);
    });
    
    const labels = Object.keys(monthMap);
    const data = labels.map(l => monthMap[l]);
    const colors = ['#2563eb','#ef4444','#f59e0b','#10b981','#8b5cf6','#ec4899','#14b8a6','#f97316'];

    const cfg = {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Spending by Month',
                data,
                backgroundColor: colors.slice(0, labels.length),
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, labels: { color: 'var(--text)' } }
            },
            scales: {
                x: { 
                    beginAtZero: true,
                    ticks: { color: 'var(--text)' }, 
                    grid: { color: 'rgba(255,255,255,0.1)' } 
                },
                y: { 
                    ticks: { color: 'var(--text)' }, 
                    grid: { color: 'rgba(255,255,255,0.1)' } 
                }
            }
        }
    };

    if (barChart) barChart.destroy();
    barChart = new Chart(ctx, cfg);
}

function setupChartControls() {
    const btnDownloadPie = document.getElementById('btn_download_pie');
    const btnDownloadBar = document.getElementById('btn_download_bar');
    const btnToggleDark = document.getElementById('btn_toggle_dark');

    if (btnDownloadPie) btnDownloadPie.addEventListener('click', () => downloadChartImage('pieChart'));
    if (btnDownloadBar) btnDownloadBar.addEventListener('click', () => downloadChartImage('barChart'));
    if (btnToggleDark) btnToggleDark.addEventListener('click', () => { document.body.classList.toggle('dark'); localStorage.setItem('pfm_dark', document.body.classList.contains('dark')); btnToggleDark.setAttribute('aria-pressed', document.body.classList.contains('dark')); });
}

function downloadChartImage(canvasId) {
    const c = document.getElementById(canvasId);
    if (!c) return;
    const url = c.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${canvasId}_${new Date().toISOString().slice(0,10)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

let itemList = [];
let budget = 0;
"use strict";

// ===== AUTHENTICATION INTEGRATION =====
// Check if user is authenticated on page load
document.addEventListener('DOMContentLoaded', () => {
    // Skip auth check for auth pages
    const currentPage = window.location.pathname;
    if (!currentPage.includes('login.html') && !currentPage.includes('register.html')) {
        // Require authentication
        if (typeof AuthService !== 'undefined') {
            AuthService.requireAuth();
            updateUserHeader();
        }
    }
    
    loadFromStorage();
    applyThemeFromStorage();
    renderAll();
    
    // register service worker if available
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js').catch(()=>{});
    }
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

// Elements
const errorMesgEl = document.querySelector(".error_message");
const budgetInputEl = document.querySelector(".budget_input");
const expenseDescEl = document.querySelector(".expensess_input");
const expenseAmountEl = document.querySelector(".expensess_amount");
const expenseCategoryEl = document.querySelector('.expenses_category');
const expenseDateTimeEl = document.querySelector('.expense_datetime');
const tblRecordEl = document.querySelector("#tbl_data");

const budgetCardEl = document.querySelector(".budget_card");
const expensesCardEl = document.querySelector(".expenses_card");
const balanceCardEl = document.querySelector(".balance_card");

const btnBudgetCal = document.querySelector("#btn_budget");
const btnExpensesCal = document.querySelector("#btn_expenses");
const btnExportCSV = document.querySelector('#btn_export_csv');
const btnExportPDF = document.querySelector('#btn_export_pdf');
const btnToggleDark = document.querySelector('#btn_toggle_dark');
const btnClearAll = document.querySelector('#btn_clear_all');
const btnToggleSettings = document.querySelector('#btn_toggle_settings');
const btnSaveLimits = document.querySelector('#btn_save_limits');
const btnAddRecurring = document.querySelector('#btn_add_recurring');
const settingsPanel = document.querySelector('#settings_panel');
const budgetLimitsForm = document.querySelector('#budget_limits_form');
const recurringList = document.querySelector('#recurring_list');

// Data
let itemList = [];
let itemId = 0;
let totalBudget = 0;
let budgetLimits = {}; // { category: limit }
let recurringExpenses = []; // [{ id, desc, category, amount, frequency, nextDue }]
let recurringId = 0;

// Chart
let expenseChart = null;

// Event listeners
if (btnBudgetCal) btnBudgetCal.addEventListener("click", (e)=> { e.preventDefault(); budgetFun(); });
if (btnExpensesCal) btnExpensesCal.addEventListener("click", (e)=> { e.preventDefault(); expensesFun(); });
if (tblRecordEl) tblRecordEl.addEventListener("click", tableClickHandler);
if (btnExportCSV) btnExportCSV.addEventListener('click', exportCSV);
if (btnExportPDF) btnExportPDF.addEventListener('click', exportPDF);
if (btnToggleDark) btnToggleDark.addEventListener('click', toggleDarkMode);
if (btnClearAll) btnClearAll.addEventListener('click', clearAll);
if (btnToggleSettings) btnToggleSettings.addEventListener('click', ()=> { 
    settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none'; 
    if (settingsPanel.style.display === 'block') renderBudgetLimitsForm();
});
if (btnSaveLimits) btnSaveLimits.addEventListener('click', saveBudgetLimits);
if (btnAddRecurring) btnAddRecurring.addEventListener('click', (e)=> { e.preventDefault(); addRecurringFun(); });

function tableClickHandler(e) {
    const target = e.target;
    if (target.classList.contains('btn-edit')) {
        editExpense(target);
    } else if (target.classList.contains('btn-delete')) {
        deleteExpense(target);
    }
}

// Core functions
function expensesFun() {
    const desc = (expenseDescEl && expenseDescEl.value.trim()) || '';
    const amountRaw = (expenseAmountEl && expenseAmountEl.value) || '';
    const dateTimeRaw = (expenseDateTimeEl && expenseDateTimeEl.value) || '';

    if (desc === '' || amountRaw === '' || Number(amountRaw) <= 0) {
        showError('Please enter description and a positive amount');
        return;
    }

    const amount = Number(amountRaw);
    const category = (expenseCategoryEl && expenseCategoryEl.value) ? expenseCategoryEl.value : 'General';
    const dateTime = dateTimeRaw || new Date().toISOString().slice(0, 16);
    const expense = { id: itemId++, title: desc, amount, category, dateTime, type: 'expense' };
    itemList.push(expense);

    if (expenseAmountEl) expenseAmountEl.value = '';
    if (expenseDescEl) expenseDescEl.value = '';
    if (expenseCategoryEl) expenseCategoryEl.value = 'General';
    if (expenseDateTimeEl) expenseDateTimeEl.value = '';

    saveToStorage();
    addExpenseRow(expense);
    renderSummaryAndChart();
}

function addExpenseRow(item) {
    if (!tblRecordEl) return;
    const row = document.createElement('div');
    row.className = 'tbl_tr_content';
    row.setAttribute('data-id', item.id);
    const dateTime = item.dateTime ? new Date(item.dateTime).toLocaleString() : 'N/A';
    
    row.innerHTML = `
        <div class="id">${item.id}</div>
        <div class="title">${escapeHtml(item.title)}</div>
        <div class="category">${escapeHtml(item.category || 'General')}</div>
        <div class="amount">₹${item.amount}</div>
        <div class="datetime">${dateTime}</div>
        <div class="actions">
            <button class="btn-edit" aria-label="Edit ${item.title}">Edit</button>
            <button class="btn-delete" aria-label="Delete ${item.title}">Delete</button>
        </div>
    `;
    tblRecordEl.appendChild(row);
}

function editExpense(button) {
    const row = button.closest('.tbl_tr_content');
    if (!row) return;
    const id = Number(row.getAttribute('data-id'));
    const expense = itemList.find(i => i.id === id);
    if (!expense) return;

    if (expenseDescEl) expenseDescEl.value = expense.title;
    if (expenseAmountEl) expenseAmountEl.value = expense.amount;
    if (expenseCategoryEl) expenseCategoryEl.value = expense.category || 'General';
    if (expenseDateTimeEl && expense.dateTime) expenseDateTimeEl.value = expense.dateTime;

    itemList = itemList.filter(i => i.id !== id);
    row.remove();
    saveToStorage();
    renderSummaryAndChart();
}

function deleteExpense(button) {
    const row = button.closest('.tbl_tr_content');
    if (!row) return;
    const id = Number(row.getAttribute('data-id'));
    itemList = itemList.filter(i => i.id !== id);
    row.remove();
    saveToStorage();
    renderSummaryAndChart();
}

function showError(msg) {
    if (!errorMesgEl) return;
    errorMesgEl.textContent = msg;
    errorMesgEl.style.background = '#ef4444';
    errorMesgEl.classList.add('show');
    setTimeout(()=> {
        errorMesgEl.classList.remove('show');
        errorMesgEl.style.background = '';
    }, 2500);
}

function showSuccess(msg) {
    if (!errorMesgEl) return;
    errorMesgEl.textContent = msg;
    errorMesgEl.style.background = '#10b981';
    errorMesgEl.classList.add('show');
    setTimeout(()=> {
        errorMesgEl.classList.remove('show');
        errorMesgEl.style.background = '';
    }, 2500);
}

function budgetFun() {
    const val = (budgetInputEl && budgetInputEl.value) || '';
    if (val === '' || Number(val) <= 0) {
        showError('Please enter a budget greater than 0');
        return;
    }
    
    const newBudget = Number(val);
    totalBudget += newBudget; // Add to existing budget instead of replacing
    budgetCardEl.textContent = totalBudget.toFixed(2);
    
    if (budgetInputEl) budgetInputEl.value = '';
    
    showSuccess(`₹${newBudget} added to budget. Total budget: ₹${totalBudget.toFixed(2)}`);
    saveToStorage();
    renderSummaryAndChart();
}

function totalExpenses() {
    return itemList.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
}

function renderSummaryAndChart() {
    const total = totalExpenses();
    expensesCardEl.textContent = total;
    const budget = Number(budgetCardEl.textContent) || 0;
    balanceCardEl.textContent = budget - total;
    
    // Check budget limits and show alerts
    checkBudgetAlerts();
    updateChart();
}

function checkBudgetAlerts() {
    const categories = {};
    itemList.forEach(item => {
        const cat = item.category || 'General';
        categories[cat] = (categories[cat] || 0) + Number(item.amount || 0);
    });
    
    let alerts = [];
    Object.keys(budgetLimits).forEach(cat => {
        if (categories[cat] && categories[cat] > budgetLimits[cat]) {
            const overage = (categories[cat] - budgetLimits[cat]).toFixed(2);
            alerts.push(`⚠️ ${cat}: Over limit by ₹${overage}`);
        }
    });
    
    if (alerts.length > 0) {
        showError(alerts.join(' | '));
    }
}

function renderAll() {
    if (tblRecordEl) tblRecordEl.innerHTML = '';
    itemList.forEach(addExpenseRow);
    renderSummaryAndChart();
    applyThemeFromStorage();
}

// Local Storage
function saveToStorage() {
    const state = { 
        itemList, itemId, budget: totalBudget, 
        budgetLimits, recurringExpenses, recurringId,
        dark: document.body.classList.contains('dark') 
    };
    localStorage.setItem('pfm_state', JSON.stringify(state));
}

function loadFromStorage() {
    const raw = localStorage.getItem('pfm_state');
    if (!raw) return;
    try {
        const state = JSON.parse(raw);
        itemList = Array.isArray(state.itemList) ? state.itemList : [];
        itemId = typeof state.itemId === 'number' ? state.itemId : (itemList.length ? Math.max(...itemList.map(i=>i.id))+1 : 0);
        totalBudget = typeof state.budget === 'number' ? state.budget : 0;
        budgetLimits = typeof state.budgetLimits === 'object' ? state.budgetLimits : {};
        recurringExpenses = Array.isArray(state.recurringExpenses) ? state.recurringExpenses : [];
        recurringId = typeof state.recurringId === 'number' ? state.recurringId : 0;
        if (budgetCardEl) budgetCardEl.textContent = totalBudget.toFixed(2);
        if (state.dark) document.body.classList.add('dark');
        processRecurringExpenses();
    } catch (e) {
        console.warn('Failed to parse storage', e);
    }
}

function applyThemeFromStorage() {
    const dark = document.body.classList.contains('dark');
    if (btnToggleDark) btnToggleDark.setAttribute('aria-pressed', dark ? 'true' : 'false');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark');
    saveToStorage();
    applyThemeFromStorage();
}

function clearAll() {
    if (!confirm('Clear all transactions? This cannot be undone.')) return;
    itemList = [];
    itemId = 0;
    if (tblRecordEl) tblRecordEl.innerHTML = '';
    saveToStorage();
    renderSummaryAndChart();
}

function renderBudgetLimitsForm() {
    if (!budgetLimitsForm) return;
    const categories = ['General', 'Food', 'Transport', 'Entertainment', 'Bills', 'Other'];
    budgetLimitsForm.innerHTML = categories.map(cat => `
        <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text);">${cat}:</label>
            <input type="number" class="budget-limit-input" data-category="${cat}" placeholder="Limit (optional)" value="${budgetLimits[cat] || ''}" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 8px; background: var(--card); color: var(--text); font-family: inherit;" />
        </div>
    `).join('');
}

function saveBudgetLimits() {
    budgetLimits = {};
    document.querySelectorAll('.budget-limit-input').forEach(inp => {
        const val = inp.value.trim();
        if (val && Number(val) > 0) {
            budgetLimits[inp.dataset.category] = Number(val);
        }
    });
    showSuccess('Budget limits saved!');
    saveToStorage();
    renderSummaryAndChart();
}

function addRecurringFun() {
    const desc = document.querySelector('.recurring_desc')?.value.trim() || '';
    const category = document.querySelector('.recurring_category')?.value || 'General';
    const amountRaw = document.querySelector('.recurring_amount')?.value || '';
    const frequency = document.querySelector('.recurring_frequency')?.value || 'monthly';
    const startRaw = document.querySelector('.recurring_start')?.value || '';
    
    if (!desc || !amountRaw || Number(amountRaw) <= 0) {
        showError('Please fill all recurring expense fields');
        return;
    }
    
    const amount = Number(amountRaw);
    const startDate = startRaw ? new Date(startRaw) : new Date();
    const nextDue = new Date(startDate).toISOString();
    
    recurringExpenses.push({
        id: recurringId++,
        title: desc,
        category,
        amount,
        frequency,
        nextDue,
        active: true
    });
    
    document.querySelector('.recurring_desc').value = '';
    document.querySelector('.recurring_amount').value = '';
    document.querySelector('.recurring_start').value = '';
    
    saveToStorage();
    renderRecurringList();
    showSuccess(`Recurring expense "${desc}" added`);
}

function renderRecurringList() {
    if (!recurringList) return;
    recurringList.innerHTML = recurringExpenses.filter(r => r.active).map(r => `
        <div style="background: rgba(99,102,241,0.05); padding: 10px; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: var(--text);"><strong>${r.title}</strong> (${r.category}) - ₹${r.amount} ${r.frequency}</span>
            <button onclick="deleteRecurring(${r.id})" class="button" style="padding: 6px 12px; font-size: 0.85rem;">Delete</button>
        </div>
    `).join('');
}

function deleteRecurring(id) {
    recurringExpenses = recurringExpenses.map(r => r.id === id ? {...r, active: false} : r);
    saveToStorage();
    renderRecurringList();
}

function processRecurringExpenses() {
    const now = new Date();
    recurringExpenses.forEach(recurring => {
        if (!recurring.active) return;
        const nextDue = new Date(recurring.nextDue);
        if (nextDue <= now) {
            const expense = {
                id: itemId++,
                title: `[Recurring] ${recurring.title}`,
                amount: recurring.amount,
                category: recurring.category,
                dateTime: now.toISOString().slice(0, 16),
                type: 'expense'
            };
            itemList.push(expense);
            
            // Update next due date
            const nextDate = new Date(nextDue);
            if (recurring.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
            else if (recurring.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
            else if (recurring.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
            
            recurring.nextDue = nextDate.toISOString();
        }
    });
}

function updateChart() {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;

    const map = {};
    itemList.forEach(it => { const key = it.category || 'General'; map[key] = (map[key] || 0) + Number(it.amount); });
    const labels = Object.keys(map);
    const data = labels.map(l => map[l]);

    const cfg = {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: ['#2563eb','#ef4444','#f59e0b','#10b981','#8b5cf6','#ec4899','#14b8a6','#f97316'] }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    };

    if (expenseChart) expenseChart.destroy();
    expenseChart = new Chart(ctx, cfg);
}

// Export CSV
function exportCSV() {
    if (!itemList.length) { showError('No transactions to export'); return; }
    const rows = [['ID','Description','Category','Amount','DateTime']];
    itemList.forEach(i => {
        const dateTime = i.dateTime ? new Date(i.dateTime).toLocaleString() : 'N/A';
        rows.push([i.id, i.title, i.category || 'General', '₹' + i.amount, dateTime]);
    });
    const csv = rows.map(r => r.map(cell => '"'+String(cell).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'transactions.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// Export PDF
function exportPDF() {
    if (!itemList.length) { showError('No transactions to export'); return; }
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text('Transactions', 14, 16);
        const body = itemList.map(it => {
            const dateTime = it.dateTime ? new Date(it.dateTime).toLocaleString() : 'N/A';
            return [String(it.id), String(it.title), String(it.category || 'General'), '₹' + String(it.amount), dateTime];
        });
        if (doc && doc.autoTable) {
            doc.autoTable({ head: [['ID','Description','Category','Amount','DateTime']], body, startY: 24 });
        } else if (window.jspdf && window.jspdf.autotable) {
            window.jspdf.autotable(doc, { head: [['ID','Description','Category','Amount','DateTime']], body, startY: 24 });
        } else {
            let y = 26;
            doc.setFontSize(10);
            doc.text('ID', 14, y); doc.text('Description', 34, y); doc.text('Category', 100, y); doc.text('Amount', 150, y); doc.text('DateTime', 180, y);
            y += 6;
            itemList.forEach(it => {
                if (y > 280) { doc.addPage(); y = 20; }
                const dateTime = it.dateTime ? new Date(it.dateTime).toLocaleString() : 'N/A';
                doc.text(String(it.id), 14, y);
                doc.text(String(it.title), 34, y);
                doc.text(String(it.category || 'General'), 100, y);
                doc.text(String(it.amount), 150, y);
                doc.text(dateTime, 180, y);
                y += 6;
            });
        }
        doc.save('transactions.pdf');
    } catch (e) {
        console.error(e); showError('PDF export failed');
    }
}

// Import Data - Supports CSV, JSON, and XLSX
function triggerFileInput() {
    let fileInput = document.getElementById('dataFileInput');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'dataFileInput';
        fileInput.accept = '.csv,.json,.xlsx,.xls';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', handleFileImport);
        document.body.appendChild(fileInput);
    }
    fileInput.click();
}

async function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.split('.').pop().toLowerCase();

    try {
        if (fileType === 'csv') {
            handleCSVImport(file);
        } else if (fileType === 'json') {
            handleJSONImport(file);
        } else if (fileType === 'xlsx' || fileType === 'xls') {
            handleExcelImport(file);
        } else {
            showError('Unsupported file type. Use CSV, JSON, or XLSX');
        }
    } catch (error) {
        console.error(error);
        showError('Error processing file: ' + error.message);
    }
    e.target.value = '';
}

function handleCSVImport(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const csv = event.target.result;
            const lines = csv.trim().split('\n');
            
            if (lines.length < 2) {
                showError('CSV file is empty or invalid');
                return;
            }

            const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
            const requiredFields = ['description', 'category', 'amount'];
            const hasRequiredFields = requiredFields.every(field => header.includes(field));

            if (!hasRequiredFields) {
                showError('CSV must have columns: Description, Category, Amount');
                return;
            }

            const descIndex = header.indexOf('description');
            const catIndex = header.indexOf('category');
            const amtIndex = header.indexOf('amount');
            const dtIndex = header.indexOf('datetime');

            let importedCount = 0;
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const values = parseCSVLine(line);
                if (values.length < 3) continue;

                const desc = values[descIndex] ? values[descIndex].trim() : '';
                const category = values[catIndex] ? values[catIndex].trim() : 'General';
                const amount = parseFloat(values[amtIndex]);

                if (!desc || isNaN(amount) || amount <= 0) continue;

                const dateTime = dtIndex >= 0 && values[dtIndex] ? values[dtIndex].trim() : new Date().toISOString().slice(0, 16);
                const expense = { id: itemId++, title: desc, amount, category, dateTime };
                itemList.push(expense);
                importedCount++;
            }

            if (importedCount === 0) {
                showError('No valid transactions found in CSV');
                return;
            }

            saveToStorage();
            renderAll();
            showSuccess(`Successfully imported ${importedCount} transactions from CSV`);
        } catch (error) {
            console.error(error);
            showError('Error parsing CSV: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function handleJSONImport(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            let importedCount = 0;

            if (Array.isArray(data)) {
                // Handle array of transactions
                data.forEach(item => {
                    if (item.title && item.amount && !isNaN(item.amount) && item.amount > 0) {
                        const expense = {
                            id: itemId++,
                            title: item.title || '',
                            amount: parseFloat(item.amount),
                            category: item.category || 'General',
                            dateTime: item.dateTime || new Date().toISOString().slice(0, 16)
                        };
                        itemList.push(expense);
                        importedCount++;
                    }
                });
            } else if (data.itemList && Array.isArray(data.itemList)) {
                // Handle backup format with metadata
                data.itemList.forEach(item => {
                    if (item.title && item.amount && !isNaN(item.amount) && item.amount > 0) {
                        const expense = {
                            id: itemId++,
                            title: item.title || '',
                            amount: parseFloat(item.amount),
                            category: item.category || 'General',
                            dateTime: item.dateTime || new Date().toISOString().slice(0, 16)
                        };
                        itemList.push(expense);
                        importedCount++;
                    }
                });
            }

            if (importedCount === 0) {
                showError('No valid transactions found in JSON');
                return;
            }

            saveToStorage();
            renderAll();
            showSuccess(`Successfully imported ${importedCount} transactions from JSON`);
        } catch (error) {
            console.error(error);
            showError('Error parsing JSON: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function handleExcelImport(file) {
    // Load SheetJS library if not already loaded
    if (!window.XLSX) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.min.js';
        script.onload = () => processExcelFile(file);
        script.onerror = () => showError('Failed to load Excel library');
        document.head.appendChild(script);
    } else {
        processExcelFile(file);
    }
}

function processExcelFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            let importedCount = 0;
            json.forEach(row => {
                const desc = row.Description || row.description || row.Title || row.title || '';
                const category = row.Category || row.category || 'General';
                const amount = parseFloat(row.Amount || row.amount || 0);
                const dateTime = row.DateTime || row.dateTime || new Date().toISOString().slice(0, 16);

                if (desc && !isNaN(amount) && amount > 0) {
                    const expense = {
                        id: itemId++,
                        title: desc,
                        amount,
                        category,
                        dateTime
                    };
                    itemList.push(expense);
                    importedCount++;
                }
            });

            if (importedCount === 0) {
                showError('No valid transactions found in Excel');
                return;
            }

            saveToStorage();
            renderAll();
            showSuccess(`Successfully imported ${importedCount} transactions from Excel`);
        } catch (error) {
            console.error(error);
            showError('Error parsing Excel: ' + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            result.push(current.replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.replace(/^"|"$/g, ''));
    return result;
}

function showSuccess(msg) {
    if (!errorMesgEl) return;
    errorMesgEl.textContent = msg;
    errorMesgEl.style.background = '#10b981';
    errorMesgEl.classList.add('show');
    setTimeout(() => {
        errorMesgEl.classList.remove('show');
        errorMesgEl.style.background = '';
    }, 2500);
}

// Backup Data - JSON format
function backupData() {
    const state = { itemList, itemId, budget: totalBudget, dark: document.body.classList.contains('dark'), timestamp: new Date().toISOString() };
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `pfm_backup_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showSuccess('Backup downloaded successfully');
}

// Restore Data - Supports JSON, CSV, and XLSX
function triggerRestoreInput() {
    let fileInput = document.getElementById('restoreFileInput');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'restoreFileInput';
        fileInput.accept = '.json,.csv,.xlsx,.xls';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', handleRestore);
        document.body.appendChild(fileInput);
    }
    fileInput.click();
}

async function handleRestore(e) {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.split('.').pop().toLowerCase();

    if (!confirm('This will replace all current data. Continue?')) {
        e.target.value = '';
        return;
    }

    try {
        if (fileType === 'json') {
            restoreFromJSON(file);
        } else if (fileType === 'csv') {
            restoreFromCSV(file);
        } else if (fileType === 'xlsx' || fileType === 'xls') {
            restoreFromExcel(file);
        } else {
            showError('Unsupported file type. Use JSON, CSV, or XLSX');
        }
    } catch (error) {
        console.error(error);
        showError('Error restoring backup: ' + error.message);
    }
    e.target.value = '';
}

function restoreFromJSON(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const state = JSON.parse(event.target.result);
            
            if (!state.itemList || !Array.isArray(state.itemList)) {
                showError('Invalid backup file format');
                return;
            }

            itemList = state.itemList;
            itemId = state.itemId || 0;
            totalBudget = state.budget || 0;
            budgetCardEl.textContent = totalBudget.toFixed(2);
            if (state.dark) document.body.classList.add('dark');
            else document.body.classList.remove('dark');

            saveToStorage();
            renderAll();
            showSuccess('Data restored successfully');
        } catch (error) {
            console.error(error);
            showError('Error restoring backup: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function restoreFromCSV(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            itemList = [];
            itemId = 0;
            const csv = event.target.result;
            const lines = csv.trim().split('\n');
            
            if (lines.length < 2) {
                showError('CSV file is empty');
                return;
            }

            const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
            const descIndex = header.indexOf('description');
            const catIndex = header.indexOf('category');
            const amtIndex = header.indexOf('amount');
            const dtIndex = header.indexOf('datetime');

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const values = parseCSVLine(line);
                const desc = values[descIndex] ? values[descIndex].trim() : '';
                const category = values[catIndex] ? values[catIndex].trim() : 'General';
                const amount = parseFloat(values[amtIndex]);
                const dateTime = dtIndex >= 0 && values[dtIndex] ? values[dtIndex].trim() : new Date().toISOString().slice(0, 16);

                if (desc && !isNaN(amount) && amount > 0) {
                    itemList.push({ id: itemId++, title: desc, amount, category, dateTime });
                }
            }

            saveToStorage();
            renderAll();
            showSuccess(`Data restored from CSV (${itemList.length} transactions)`);
        } catch (error) {
            console.error(error);
            showError('Error restoring from CSV: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function restoreFromExcel(file) {
    if (!window.XLSX) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.min.js';
        script.onload = () => processExcelRestore(file);
        script.onerror = () => showError('Failed to load Excel library');
        document.head.appendChild(script);
    } else {
        processExcelRestore(file);
    }
}

function processExcelRestore(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            itemList = [];
            itemId = 0;
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            json.forEach(row => {
                const desc = row.Description || row.description || row.Title || row.title || '';
                const category = row.Category || row.category || 'General';
                const amount = parseFloat(row.Amount || row.amount || 0);
                const dateTime = row.DateTime || row.dateTime || new Date().toISOString().slice(0, 16);

                if (desc && !isNaN(amount) && amount > 0) {
                    itemList.push({ id: itemId++, title: desc, amount, category, dateTime });
                }
            });

            saveToStorage();
            renderAll();
            showSuccess(`Data restored from Excel (${itemList.length} transactions)`);
        } catch (error) {
            console.error(error);
            showError('Error restoring from Excel: ' + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// Utility
function escapeHtml(text) { return String(text).replace(/[&"'<>]/g, (c)=> ({'&':'&amp;','"':'&quot;','\'':'&#39;','<':'&lt;','>':'&gt;'}[c])); }
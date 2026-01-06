"use strict";

// ===== AUTHENTICATION INTEGRATION =====
let itemList = [];
let budget = 0;

const btnRefresh = document.querySelector('#btn_refresh_summary');
const btnExport = document.querySelector('#btn_export_summary');
const btnToggleDark = document.querySelector('#btn_toggle_dark');

document.addEventListener('DOMContentLoaded', () => {
    // Require authentication
    if (typeof AuthService !== 'undefined') {
        AuthService.requireAuth();
        updateUserHeader();
    }
    
    loadFromStorage();
    applyThemeFromStorage();
    generateSummary();
    setupDarkMode();
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

if (btnRefresh) btnRefresh.addEventListener('click', generateSummary);
if (btnExport) btnExport.addEventListener('click', exportSummary);
if (btnToggleDark) btnToggleDark.addEventListener('click', toggleDarkMode);

function loadFromStorage() {
    const raw = localStorage.getItem('pfm_state');
    if (!raw) return;
    try {
        const state = JSON.parse(raw);
        itemList = Array.isArray(state.itemList) ? state.itemList : [];
        budget = typeof state.budget === 'number' ? state.budget : 0;
    } catch (e) {
        console.warn('Failed to parse storage', e);
    }
}

function generateSummary() {
    generateOverviewSummary();
    generateSpendingSummary();
    generateCategorySummary();
    generateInsights();
    updateQuickStats();
}

function generateOverviewSummary() {
    const totalExpenses = itemList.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
    const balance = budget - totalExpenses;
    const spendingRate = budget > 0 ? ((totalExpenses / budget) * 100).toFixed(2) : 0;

    let html = '';
    
    if (itemList.length === 0) {
        html = `
            <p>You haven't recorded any transactions yet. Start by adding expenses to see your financial overview.</p>
        `;
    } else {
        html = `
            <ul style="list-style: none; padding: 0; margin: 0;">
                <li style="margin-bottom: 12px; padding: 8px; background: rgba(99,102,241,0.05); border-radius: 6px;">
                    <strong>Total Budget:</strong> ₹${budget.toFixed(2)}
                </li>
                <li style="margin-bottom: 12px; padding: 8px; background: rgba(239,68,68,0.05); border-radius: 6px;">
                    <strong>Total Expenses:</strong> ₹${totalExpenses.toFixed(2)}
                </li>
                <li style="margin-bottom: 12px; padding: 8px; background: rgba(16,185,129,0.05); border-radius: 6px;">
                    <strong>Remaining Balance:</strong> ₹${balance.toFixed(2)} ${balance < 0 ? '(Exceeded)' : '(Available)'}
                </li>
                <li style="margin-bottom: 12px; padding: 8px; background: rgba(245,158,11,0.05); border-radius: 6px;">
                    <strong>Spending Rate:</strong> ${spendingRate}% of budget
                </li>
            </ul>
            ${balance < 0 ? `<p style="color: var(--danger); margin-top: 12px; font-weight: 600;">⚠️ You have exceeded your budget by ₹${Math.abs(balance).toFixed(2)}</p>` : ''}
        `;
    }

    document.querySelector('#overview_summary').innerHTML = html;
}

function generateSpendingSummary() {
    if (itemList.length === 0) {
        document.querySelector('#spending_summary').innerHTML = '<p>No transactions recorded yet.</p>';
        return;
    }

    const totalExpenses = itemList.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
    const avgExpense = (totalExpenses / itemList.length).toFixed(2);
    const maxExpense = Math.max(...itemList.map(i => Number(i.amount || 0))).toFixed(2);
    const minExpense = Math.min(...itemList.map(i => Number(i.amount || 0))).toFixed(2);

    const categoryCount = new Set(itemList.map(i => i.category || 'General')).size;
    const mostFrequentCategory = getMostFrequentCategory();

    let spendingTrend = 'stable';
    const recentExpenses = itemList.slice(-5);
    const recentAvg = recentExpenses.reduce((a, b) => a + Number(b.amount || 0), 0) / recentExpenses.length;
    const overallAvg = totalExpenses / itemList.length;
    
    if (recentAvg > overallAvg * 1.2) spendingTrend = 'increasing';
    else if (recentAvg < overallAvg * 0.8) spendingTrend = 'decreasing';

    const html = `
        <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 12px; padding: 8px; background: rgba(99,102,241,0.05); border-radius: 6px;">
                <strong>Total Transactions:</strong> ${itemList.length} expenses recorded
            </li>
            <li style="margin-bottom: 12px; padding: 8px; background: rgba(236,72,153,0.05); border-radius: 6px;">
                <strong>Average Expense:</strong> ₹${avgExpense} per transaction
            </li>
            <li style="margin-bottom: 12px; padding: 8px; background: rgba(34,197,94,0.05); border-radius: 6px;">
                <strong>Highest Expense:</strong> ₹${maxExpense}
            </li>
            <li style="margin-bottom: 12px; padding: 8px; background: rgba(239,68,68,0.05); border-radius: 6px;">
                <strong>Lowest Expense:</strong> ₹${minExpense}
            </li>
            <li style="margin-bottom: 12px; padding: 8px; background: rgba(245,158,11,0.05); border-radius: 6px;">
                <strong>Spending Trend:</strong> Currently ${spendingTrend} (${spendingTrend === 'increasing' ? '📈' : spendingTrend === 'decreasing' ? '📉' : '➡️'})
            </li>
            <li style="margin-bottom: 12px; padding: 8px; background: rgba(139,92,246,0.05); border-radius: 6px;">
                <strong>Categories:</strong> ${categoryCount} different categories tracked
            </li>
            <li style="margin-bottom: 12px; padding: 8px; background: rgba(20,184,166,0.05); border-radius: 6px;">
                <strong>Most Frequent Category:</strong> ${mostFrequentCategory}
            </li>
        </ul>
    `;

    document.querySelector('#spending_summary').innerHTML = html;
}

function generateCategorySummary() {
    if (itemList.length === 0) {
        document.querySelector('#category_summary').innerHTML = '<p>No transactions recorded yet.</p>';
        return;
    }

    const catMap = {};
    const catItems = {};
    itemList.forEach(it => {
        const cat = it.category || 'General';
        catMap[cat] = (catMap[cat] || 0) + Number(it.amount || 0);
        catItems[cat] = (catItems[cat] || 0) + 1;
    });

    const total = Object.values(catMap).reduce((a, b) => a + b, 0);
    const topCategories = Object.keys(catMap).sort((a, b) => catMap[b] - catMap[a]).slice(0, 3);

    let html = '<ul style="list-style: none; padding: 0; margin: 0;">';

    Object.keys(catMap).forEach(cat => {
        const amount = catMap[cat];
        const percentage = ((amount / total) * 100).toFixed(1);
        const items = catItems[cat];
        const isTop = topCategories.includes(cat);
        const highlight = isTop ? 'background: rgba(99,102,241,0.1); border-left: 4px solid var(--primary);' : '';

        html += `
            <li style="margin-bottom: 12px; padding: 12px; border-radius: 6px; ${highlight}">
                <strong>${cat}:</strong> ₹${amount.toFixed(2)} (${percentage}%) across ${items} transaction${items !== 1 ? 's' : ''}
            </li>
        `;
    });

    html += '</ul>';

    document.querySelector('#category_summary').innerHTML = html;
}

function generateInsights() {
    if (itemList.length === 0) {
        document.querySelector('#insights_summary').innerHTML = '<p>No data available for insights yet. Start recording expenses to get personalized insights.</p>';
        return;
    }

    const totalExpenses = itemList.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
    const balance = budget - totalExpenses;
    const avgExpense = totalExpenses / itemList.length;
    const spendingRate = budget > 0 ? (totalExpenses / budget) * 100 : 0;

    const catMap = {};
    itemList.forEach(it => {
        const cat = it.category || 'General';
        catMap[cat] = (catMap[cat] || 0) + Number(it.amount || 0);
    });

    const topCategory = Object.keys(catMap).sort((a, b) => catMap[b] - catMap[a])[0];
    const topCategoryAmount = catMap[topCategory];
    const topCategoryPercent = ((topCategoryAmount / totalExpenses) * 100).toFixed(1);

    let insights = [];

    // Insight 1: Budget Status
    if (spendingRate >= 100) {
        insights.push(`🚨 <strong>Budget Alert:</strong> You have exceeded your budget by ₹${Math.abs(balance).toFixed(2)}. Consider reducing expenses or increasing your budget.`);
    } else if (spendingRate >= 80) {
        insights.push(`⚠️ <strong>Budget Warning:</strong> You've spent ${spendingRate.toFixed(1)}% of your budget. You have only ₹${balance.toFixed(2)} remaining.`);
    } else if (spendingRate >= 60) {
        insights.push(`📊 <strong>Budget Status:</strong> You're maintaining good control with ${spendingRate.toFixed(1)}% spent. Keep up the discipline!`);
    } else {
        insights.push(`✅ <strong>Budget Control:</strong> Excellent spending control! You've only spent ${spendingRate.toFixed(1)}% of your budget.`);
    }

    // Insight 2: Top Category
    insights.push(`📌 <strong>Top Spending Category:</strong> ${topCategory} accounts for ${topCategoryPercent}% of your total spending (₹${topCategoryAmount.toFixed(2)}). Monitor this category closely.`);

    // Insight 3: Average Spending
    if (avgExpense > (budget / 30)) {
        insights.push(`📈 <strong>Daily Average:</strong> Your average expense of ₹${avgExpense.toFixed(2)} is relatively high. Consider setting daily spending limits.`);
    } else {
        insights.push(`✨ <strong>Daily Average:</strong> Your average expense of ₹${avgExpense.toFixed(2)} shows disciplined spending.`);
    }

    // Insight 4: Transaction Frequency
    const daysActive = Math.max(...itemList.map(i => new Date(i.dateTime).getTime())) - Math.min(...itemList.map(i => new Date(i.dateTime).getTime()));
    const daysDiff = Math.ceil(daysActive / (1000 * 60 * 60 * 24)) || 1;
    const transPerDay = (itemList.length / daysDiff).toFixed(2);
    insights.push(`📅 <strong>Activity:</strong> You're making approximately ${transPerDay} transactions per day over the last ${daysDiff} days.`);

    // Insight 5: Categories Distribution
    const categoryCount = Object.keys(catMap).length;
    if (categoryCount <= 2) {
        insights.push(`🏷️ <strong>Category Diversity:</strong> You're tracking ${categoryCount} categories. Consider diversifying to better analyze spending patterns.`);
    } else {
        insights.push(`🏷️ <strong>Category Tracking:</strong> Good! You're tracking ${categoryCount} different categories for comprehensive analysis.`);
    }

    const html = insights.map((insight, idx) => {
        return `<p style="margin: 12px 0; padding: 12px; background: rgba(99,102,241,0.05); border-radius: 6px; border-left: 4px solid var(--primary);">${insight}</p>`;
    }).join('');

    document.querySelector('#insights_summary').innerHTML = html;
}

function updateQuickStats() {
    const totalExpenses = itemList.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
    const avgExpense = itemList.length > 0 ? (totalExpenses / itemList.length).toFixed(2) : 0;
    const spendingRate = budget > 0 ? ((totalExpenses / budget) * 100).toFixed(1) : 0;

    document.querySelector('#stat-transactions').textContent = itemList.length;
    document.querySelector('#stat-avg-expense').textContent = avgExpense;
    document.querySelector('#stat-spending-rate').textContent = spendingRate;
}

function getMostFrequentCategory() {
    const catCount = {};
    itemList.forEach(it => {
        const cat = it.category || 'General';
        catCount[cat] = (catCount[cat] || 0) + 1;
    });
    
    return Object.keys(catCount).reduce((a, b) => catCount[a] > catCount[b] ? a : b, 'General');
}

async function exportSummary() {
    UIService.showLoading('Generating PDF...');

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPosition = 20;

        // Helper function to add section
        const addSection = (title, content, yPos) => {
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(37, 99, 235); // Primary color
            doc.text(title, 20, yPos);
            yPos += 8;

            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(31, 41, 55); // Text color
            return yPos;
        };

        // Add header
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(37, 99, 235);
        doc.text('💰 Personal Finance Summary Report', 20, yPosition);
        yPosition += 12;

        // Add generated date
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128); // Muted text
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition);
        doc.text(`Report Period: Last 12 Months`, 20, yPosition + 5);
        yPosition += 15;

        // Add horizontal line
        doc.setDrawColor(209, 213, 219);
        doc.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += 8;

        // Overview Section
        yPosition = addSection('📊 FINANCIAL OVERVIEW', '', yPosition);
        const totalExpenses = itemList.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
        const balance = budget - totalExpenses;
        const spendingRate = budget > 0 ? ((totalExpenses / budget) * 100).toFixed(2) : 0;

        const overviewData = [
            ['Budget', `₹${budget.toFixed(2)}`],
            ['Total Expenses', `₹${totalExpenses.toFixed(2)}`],
            ['Balance', `₹${balance.toFixed(2)}`],
            ['Spending Rate', `${spendingRate}%`],
            ['Total Transactions', itemList.length]
        ];

        doc.autoTable({
            startY: yPosition,
            head: [['Metric', 'Value']],
            body: overviewData,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
            bodyStyles: { textColor: [31, 41, 55] },
            alternateRowStyles: { fillColor: [243, 244, 246] },
            margin: { left: 20, right: 20 },
            columnStyles: { 1: { halign: 'right' } }
        });

        yPosition = doc.lastAutoTable.finalY + 12;

        // Category Breakdown
        yPosition = addSection('🏷️ CATEGORY BREAKDOWN', '', yPosition);

        const categoryMap = {};
        itemList.forEach(item => {
            const cat = item.category || 'General';
            categoryMap[cat] = (categoryMap[cat] || 0) + Number(item.amount || 0);
        });

        const categoryData = Object.entries(categoryMap)
            .map(([category, amount]) => [
                category,
                `₹${amount.toFixed(2)}`,
                `${budget > 0 ? ((amount / budget) * 100).toFixed(1) : 0}%`
            ])
            .sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));

        if (categoryData.length > 0) {
            doc.autoTable({
                startY: yPosition,
                head: [['Category', 'Amount', 'Budget %']],
                body: categoryData,
                theme: 'grid',
                headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
                bodyStyles: { textColor: [31, 41, 55] },
                alternateRowStyles: { fillColor: [243, 244, 246] },
                margin: { left: 20, right: 20 },
                columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } }
            });
            yPosition = doc.lastAutoTable.finalY + 12;
        }

        // Recent Transactions
        if (yPosition + 40 > pageHeight) {
            doc.addPage();
            yPosition = 20;
        }

        yPosition = addSection('📋 RECENT TRANSACTIONS (Last 10)', '', yPosition);

        const recentTransactions = itemList
            .slice()
            .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
            .slice(0, 10)
            .map(item => [
                new Date(item.dateTime).toLocaleDateString(),
                item.title || 'No description',
                item.category || 'General',
                `₹${Number(item.amount || 0).toFixed(2)}`
            ]);

        if (recentTransactions.length > 0) {
            doc.autoTable({
                startY: yPosition,
                head: [['Date', 'Description', 'Category', 'Amount']],
                body: recentTransactions,
                theme: 'grid',
                headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
                bodyStyles: { textColor: [31, 41, 55] },
                alternateRowStyles: { fillColor: [243, 244, 246] },
                margin: { left: 20, right: 20 },
                columnStyles: { 3: { halign: 'right' } }
            });
        }

        // Add footer on last page
        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : yPosition;
        if (finalY + 30 < pageHeight) {
            doc.setFont('Helvetica', 'italic');
            doc.setFontSize(9);
            doc.setTextColor(107, 114, 128);
            doc.text('Report generated by Personal Finance Manager', 20, pageHeight - 15);
        }

        // Add page numbers to all pages
        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(107, 114, 128);
            doc.text(
                `Page ${i} of ${totalPages}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
        }

        // Save PDF
        const fileName = `Financial_Summary_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);

        UIService.hideLoading();
        UIService.showNotification(`✓ PDF exported successfully: ${fileName}`, 'success', 2000);

    } catch (error) {
        UIService.hideLoading();
        UIService.showNotification('Failed to export PDF: ' + error.message, 'error');
        console.error('Export error:', error);
    }
}

function setupDarkMode() {
    const btn = document.querySelector('#btn_toggle_dark');
    if (btn) {
        btn.addEventListener('click', toggleDarkMode);
        applyThemeFromStorage();
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark');
    applyThemeFromStorage();
    localStorage.setItem('pfm_dark', document.body.classList.contains('dark'));
}

function applyThemeFromStorage() {
    const dark = localStorage.getItem('pfm_dark') === 'true';
    if (dark) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
    
    const btn = document.querySelector('#btn_toggle_dark');
    if (btn) btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
}
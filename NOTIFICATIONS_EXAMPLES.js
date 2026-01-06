/**
 * NOTIFICATIONS & ALERTS - IMPLEMENTATION EXAMPLES
 * 
 * This file demonstrates practical implementations of notifications,
 * loading spinners, and modal dialogs throughout the application.
 */

// ============================================
// 1. FORM SUBMISSIONS WITH VALIDATION
// ============================================

/**
 * Add Expense with validation and notifications
 */
function addExpenseWithNotifications() {
    const description = document.querySelector('.expensess_input')?.value;
    const amount = document.querySelector('.expensess_amount')?.value;
    const category = document.querySelector('.expenses_category')?.value;
    const dateTime = document.querySelector('.expense_datetime')?.value;

    // Validation
    if (!description?.trim()) {
        UIService.showNotification('Please enter expense description', 'warning');
        return;
    }

    if (!amount || parseFloat(amount) <= 0) {
        UIService.showNotification('Please enter a valid amount', 'warning');
        return;
    }

    if (!dateTime) {
        UIService.showNotification('Please select date and time', 'warning');
        return;
    }

    // Show loading
    UIService.showLoading('Adding expense...');

    // Simulate async operation
    setTimeout(() => {
        try {
            const expense = {
                id: Date.now(),
                title: description,
                amount: parseFloat(amount),
                category: category,
                dateTime: dateTime
            };

            itemList.push(expense);
            saveToStorage();

            UIService.hideLoading();
            UIService.showNotification('Expense added successfully ✓', 'success', 2000);

            // Reset form
            document.querySelector('.expensess_input').value = '';
            document.querySelector('.expensess_amount').value = '';
            document.querySelector('.expense_datetime').value = '';

            renderAll();

        } catch (error) {
            UIService.hideLoading();
            UIService.showNotification('Failed to add expense: ' + error.message, 'error');
        }
    }, 800);
}

/**
 * Set Budget with loading feedback
 */
function setBudgetWithNotifications() {
    const budgetInput = document.querySelector('.budget_input');
    const amount = budgetInput?.value;

    if (!amount || parseFloat(amount) <= 0) {
        UIService.showNotification('Please enter a valid budget amount', 'warning');
        return;
    }

    UIService.showLoading('Saving budget...');

    setTimeout(() => {
        try {
            totalBudget = parseFloat(amount);
            saveToStorage();

            UIService.hideLoading();
            UIService.showNotification('Budget set to ₹' + totalBudget, 'success');

            budgetInput.value = '';
            renderAll();

        } catch (error) {
            UIService.hideLoading();
            UIService.showNotification('Failed to set budget', 'error');
        }
    }, 600);
}

// ============================================
// 2. DESTRUCTIVE ACTIONS WITH CONFIRMATIONS
// ============================================

/**
 * Delete expense with confirmation modal
 */
async function deleteExpenseWithConfirmation(itemId) {
    const item = itemList.find(i => i.id === itemId);

    const action = await UIService.showModal(
        'Delete Expense',
        `Are you sure you want to delete this expense?<br><br>
         <strong>${item.title}</strong><br>
         Amount: ₹${item.amount}<br>
         Date: ${new Date(item.dateTime).toLocaleDateString()}`,
        [
            { label: 'Cancel', action: 'cancel', type: 'secondary' },
            { label: 'Delete', action: 'confirm', type: 'danger' }
        ]
    );

    if (action === 'confirm') {
        UIService.showLoading('Deleting expense...');

        setTimeout(() => {
            itemList = itemList.filter(i => i.id !== itemId);
            saveToStorage();

            UIService.hideLoading();
            UIService.showNotification('Expense deleted successfully', 'success', 2000);

            renderAll();
        }, 500);
    }
}

/**
 * Clear all transactions with confirmation
 */
async function clearAllWithConfirmation() {
    const action = await UIService.showModal(
        'Clear All Transactions',
        'This action will delete all your transactions and cannot be undone.',
        [
            { label: 'Cancel', action: 'cancel', type: 'secondary' },
            { label: 'Clear All', action: 'confirm', type: 'danger' }
        ]
    );

    if (action === 'confirm') {
        UIService.showLoading('Clearing all data...');

        setTimeout(() => {
            itemList = [];
            totalBudget = 0;
            saveToStorage();

            UIService.hideLoading();
            UIService.showNotification('All transactions cleared', 'success', 2000);

            renderAll();
        }, 700);
    }
}

// ============================================
// 3. EXPORT OPERATIONS
// ============================================

/**
 * Export to CSV with loading state
 */
function exportToCSVWithNotifications() {
    if (itemList.length === 0) {
        UIService.showNotification('No transactions to export', 'warning');
        return;
    }

    UIService.showLoading('Generating CSV...');

    setTimeout(() => {
        try {
            let csv = 'Date,Description,Category,Amount\n';
            itemList.forEach(item => {
                const date = new Date(item.dateTime).toISOString().split('T')[0];
                csv += `"${date}","${item.title}","${item.category}",${item.amount}\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'transactions.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();

            UIService.hideLoading();
            UIService.showNotification('CSV exported successfully ✓', 'success', 2000);

        } catch (error) {
            UIService.hideLoading();
            UIService.showNotification('Failed to export CSV: ' + error.message, 'error');
        }
    }, 800);
}

/**
 * Export to PDF with loading state
 */
function exportToPDFWithNotifications() {
    if (itemList.length === 0) {
        UIService.showNotification('No transactions to export', 'warning');
        return;
    }

    UIService.showLoading('Generating PDF...');

    setTimeout(() => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Title
            doc.setFontSize(16);
            doc.text('Financial Report', 20, 20);

            // Date
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);

            // Table data
            const data = itemList.map(item => [
                new Date(item.dateTime).toLocaleDateString(),
                item.title,
                item.category,
                '₹' + item.amount.toFixed(2)
            ]);

            doc.autoTable({
                head: [['Date', 'Description', 'Category', 'Amount']],
                body: data,
                startY: 40,
                theme: 'grid',
                columnStyles: { 3: { halign: 'right' } }
            });

            // Summary
            const totalExpenses = itemList.reduce((sum, item) => sum + item.amount, 0);
            doc.text(`Total Expenses: ₹${totalExpenses.toFixed(2)}`, 20, doc.lastAutoTable.finalY + 20);

            doc.save('transactions.pdf');

            UIService.hideLoading();
            UIService.showNotification('PDF exported successfully ✓', 'success', 2000);

        } catch (error) {
            UIService.hideLoading();
            UIService.showNotification('Failed to export PDF: ' + error.message, 'error');
        }
    }, 1000);
}

// ============================================
// 4. BUDGET LIMIT MONITORING
// ============================================

/**
 * Check and notify about budget limits
 */
function checkBudgetLimitsWithNotifications() {
    if (totalBudget === 0) {
        return;  // No budget set
    }

    const totalExpenses = itemList.reduce((sum, item) => sum + item.amount, 0);
    const percentage = (totalExpenses / totalBudget) * 100;
    const remaining = totalBudget - totalExpenses;

    if (percentage >= 100) {
        UIService.showNotification('⚠️ Budget limit reached! No more budget available.', 'error', 4000);
    } else if (percentage >= 90) {
        UIService.showNotification(`⚠️ You have used 90% of your budget. ₹${remaining.toFixed(2)} remaining.`, 'warning', 4000);
    } else if (percentage >= 75) {
        UIService.showNotification(`Budget alert: 75% used. ₹${remaining.toFixed(2)} remaining.`, 'warning', 3000);
    } else if (percentage >= 50) {
        UIService.showNotification(`Budget update: 50% used. ₹${remaining.toFixed(2)} remaining.`, 'info', 2000);
    }
}

/**
 * Check category-specific budget limits
 */
function checkCategoryLimitsWithNotifications() {
    const categories = ['Food', 'Entertainment', 'Transport', 'Bills', 'General', 'Other'];

    categories.forEach(category => {
        const spent = itemList
            .filter(item => item.category === category)
            .reduce((sum, item) => sum + item.amount, 0);

        const limit = budgetLimits[category];

        if (limit && spent > 0) {
            const percentage = (spent / limit) * 100;

            if (percentage >= 100) {
                UIService.showNotification(
                    `${category} limit exceeded by ₹${(spent - limit).toFixed(2)}`,
                    'error',
                    4000
                );
            } else if (percentage >= 80) {
                UIService.showNotification(
                    `${category}: ${percentage.toFixed(0)}% of limit used`,
                    'warning',
                    3000
                );
            }
        }
    });
}

// ============================================
// 5. DATA SYNC & IMPORT OPERATIONS
// ============================================

/**
 * Sync data with loading state
 */
async function syncDataWithNotifications() {
    UIService.showLoading('Syncing data...');

    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Save to storage
        saveToStorage();

        UIService.hideLoading();
        UIService.showNotification('Data synced successfully ✓', 'success', 2000);

    } catch (error) {
        UIService.hideLoading();
        UIService.showNotification('Sync failed: ' + error.message, 'error');
    }
}

/**
 * Import data with validation
 */
async function importDataWithNotifications() {
    const action = await UIService.showModal(
        'Import Data',
        'This will replace all your current data with imported data. Continue?',
        [
            { label: 'Cancel', action: 'cancel', type: 'secondary' },
            { label: 'Import', action: 'confirm', type: 'primary' }
        ]
    );

    if (action === 'confirm') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            UIService.showLoading('Importing data...');

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);

                    if (Array.isArray(data.itemList)) {
                        itemList = data.itemList;
                        totalBudget = data.budget || 0;
                        saveToStorage();

                        UIService.hideLoading();
                        UIService.showNotification(`Imported ${itemList.length} transactions`, 'success', 2000);

                        renderAll();
                    } else {
                        throw new Error('Invalid file format');
                    }
                } catch (error) {
                    UIService.hideLoading();
                    UIService.showNotification('Failed to import: ' + error.message, 'error');
                }
            };

            reader.readAsText(file);
        };

        input.click();
    }
}

// ============================================
// 6. PROFILE & SETTINGS OPERATIONS
// ============================================

/**
 * Update profile with confirmation
 */
async function updateProfileWithNotifications(userData) {
    const action = await UIService.showModal(
        'Update Profile',
        'Review your profile changes and confirm to save.',
        [
            { label: 'Cancel', action: 'cancel', type: 'secondary' },
            { label: 'Save Changes', action: 'confirm', type: 'primary' }
        ]
    );

    if (action === 'confirm') {
        UIService.showLoading('Saving profile...');

        setTimeout(() => {
            try {
                const user = AuthService.getCurrentUser();
                Object.assign(user, userData);
                localStorage.setItem('pfm_user', JSON.stringify(user));

                UIService.hideLoading();
                UIService.showNotification('Profile updated successfully ✓', 'success', 2000);

            } catch (error) {
                UIService.hideLoading();
                UIService.showNotification('Failed to update profile', 'error');
            }
        }, 700);
    }
}

/**
 * Change password with validation
 */
async function changePasswordWithNotifications() {
    const action = await UIService.showModal(
        'Change Password',
        'Enter your current and new password.',
        [
            { label: 'Cancel', action: 'cancel', type: 'secondary' },
            { label: 'Change', action: 'confirm', type: 'primary' }
        ]
    );

    if (action === 'confirm') {
        UIService.showLoading('Updating password...');

        setTimeout(() => {
            try {
                // Validate password strength
                const strength = UIService.validatePassword('newPassword');
                if (!strength.isValid) {
                    UIService.hideLoading();
                    UIService.showNotification('Password must be at least 8 characters', 'warning');
                    return;
                }

                // Update password
                UIService.hideLoading();
                UIService.showNotification('Password changed successfully ✓', 'success', 2000);

            } catch (error) {
                UIService.hideLoading();
                UIService.showNotification('Failed to change password', 'error');
            }
        }, 600);
    }
}

// ============================================
// 7. RECURRING EXPENSE OPERATIONS
// ============================================

/**
 * Add recurring expense with notification
 */
async function addRecurringExpenseWithNotifications() {
    UIService.showLoading('Adding recurring expense...');

    try {
        const recurring = {
            id: Date.now(),
            description: 'Monthly Subscription',
            category: 'Bills',
            amount: 500,
            frequency: 'monthly',
            startDate: new Date().toISOString()
        };

        recurringExpenses.push(recurring);
        saveToStorage();

        UIService.hideLoading();
        UIService.showNotification('Recurring expense added ✓', 'success', 2000);

    } catch (error) {
        UIService.hideLoading();
        UIService.showNotification('Failed to add recurring expense', 'error');
    }
}

/**
 * Process recurring expenses
 */
function processRecurringExpensesWithNotifications() {
    let processedCount = 0;

    recurringExpenses.forEach(recurring => {
        const lastDue = new Date(recurring.nextDue || recurring.startDate);
        const now = new Date();
        const daysDifference = (now - lastDue) / (1000 * 60 * 60 * 24);

        if (daysDifference >= 1) {
            itemList.push({
                id: Date.now() + Math.random(),
                title: recurring.description,
                category: recurring.category,
                amount: recurring.amount,
                dateTime: now.toISOString(),
                isRecurring: true,
                recurringId: recurring.id
            });

            processedCount++;
        }
    });

    if (processedCount > 0) {
        saveToStorage();
        renderAll();
        UIService.showNotification(
            `${processedCount} recurring expense(s) processed ✓`,
            'success',
            2000
        );
    }
}

// ============================================
// 8. ERROR HANDLING WITH NOTIFICATIONS
// ============================================

/**
 * Global error handler
 */
window.addEventListener('error', (event) => {
    console.error('Error:', event.error);

    if (event.error && event.error.message) {
        UIService.showNotification(
            'An error occurred: ' + event.error.message,
            'error',
            4000
        );
    }
});

/**
 * Handle network errors
 */
function handleNetworkError() {
    UIService.showNotification(
        '⚠️ Network connection lost. Some features may not work.',
        'warning',
        5000
    );
}

// ============================================
// 9. INITIALIZATION & MONITORING
// ============================================

/**
 * Initialize notification system
 */
function initNotificationSystem() {
    console.log('Notification system initialized');

    // Monitor budget on page load
    window.addEventListener('load', () => {
        setTimeout(() => {
            checkBudgetLimitsWithNotifications();
        }, 1000);
    });

    // Listen for storage changes
    window.addEventListener('storage', (e) => {
        if (e.key === 'pfm_state') {
            UIService.showNotification('Data updated from another tab', 'info', 2000);
        }
    });

    // Handle online/offline
    window.addEventListener('online', () => {
        UIService.showNotification('You are back online ✓', 'success', 2000);
        syncDataWithNotifications();
    });

    window.addEventListener('offline', () => {
        UIService.showNotification('You are offline. Changes will sync when online.', 'warning', 5000);
    });
}

// Export functions for use in other modules
window.NotificationExamples = {
    addExpenseWithNotifications,
    setBudgetWithNotifications,
    deleteExpenseWithConfirmation,
    clearAllWithConfirmation,
    exportToCSVWithNotifications,
    exportToPDFWithNotifications,
    checkBudgetLimitsWithNotifications,
    checkCategoryLimitsWithNotifications,
    syncDataWithNotifications,
    importDataWithNotifications,
    updateProfileWithNotifications,
    changePasswordWithNotifications,
    addRecurringExpenseWithNotifications,
    processRecurringExpensesWithNotifications,
    initNotificationSystem
};

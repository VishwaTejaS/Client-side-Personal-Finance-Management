# Notifications & Alerts Guide

This document provides comprehensive guidance on using the Notifications & Alerts system in the Personal Finance Manager application.

## Overview

The application includes three main notification/alert systems:

1. **Toast Notifications** - Non-blocking success/error/warning messages
2. **Loading Spinners** - Visual feedback during async operations
3. **Modal Dialogs** - Interactive confirmation and information dialogs

All features are managed through the `UIService` utility.

---

## 1. Toast Notifications

Toast notifications are temporary, non-blocking messages that appear in the top-right corner and auto-dismiss after a specified duration.

### Usage

```javascript
UIService.showNotification(message, type, duration);
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `message` | String | Required | The notification message text |
| `type` | String | 'info' | One of: 'success', 'error', 'warning', 'info' |
| `duration` | Number | 3000 | Time in milliseconds before auto-dismiss |

### Examples

#### Success Notification
```javascript
// Show success message for 3 seconds
UIService.showNotification('Profile updated successfully', 'success');

// Show custom duration
UIService.showNotification('Data saved', 'success', 2000);
```

#### Error Notification
```javascript
// Show error message
UIService.showNotification('Failed to update profile', 'error');

// Long duration for important errors
UIService.showNotification('Database connection error', 'error', 5000);
```

#### Warning Notification
```javascript
UIService.showNotification('Please fill all required fields', 'warning');
UIService.showNotification('You are about to delete this item', 'warning', 4000);
```

#### Info Notification
```javascript
UIService.showNotification('New feature available', 'info');
UIService.showNotification('Syncing data...', 'info', 3000);
```

### Styling

Toast notifications are styled with:
- **Color**: Left border matches the notification type
  - Success: Green
  - Error: Red
  - Warning: Orange
  - Info: Blue
- **Position**: Fixed top-right corner
- **Animation**: Slide-in from right, fade-out on dismiss
- **Shadow**: Drop shadow for prominence

### CSS Classes

```css
.notification                 /* Base notification container */
.notification.show           /* Active/visible state */
.notification-success        /* Success styling */
.notification-error          /* Error styling */
.notification-warning        /* Warning styling */
.notification-info           /* Info styling */
.notification-icon           /* Icon element */
.notification-message        /* Message text */
```

---

## 2. Loading Spinners

Loading spinners provide visual feedback when operations take time. They show a semi-transparent overlay with an animated spinner and optional message.

### Usage

```javascript
// Show loading
UIService.showLoading(message);

// Hide loading
UIService.hideLoading();
```

### Parameters

| Method | Parameter | Type | Default | Description |
|--------|-----------|------|---------|-------------|
| `showLoading` | `message` | String | 'Loading...' | Message displayed below spinner |
| `hideLoading` | - | - | - | Removes the loading overlay |

### Examples

#### Basic Loading
```javascript
UIService.showLoading();  // Shows "Loading..." message
```

#### Custom Message
```javascript
UIService.showLoading('Exporting data...');
UIService.showLoading('Saving profile...');
UIService.showLoading('Processing transaction...');
```

#### Complete Flow
```javascript
async function saveUserData() {
    UIService.showLoading('Saving your profile...');
    
    try {
        const response = await fetch('/api/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            UIService.hideLoading();
            UIService.showNotification('Profile saved successfully', 'success');
        }
    } catch (error) {
        UIService.hideLoading();
        UIService.showNotification('Failed to save profile', 'error');
    }
}
```

### Styling

Loading overlays feature:
- **Overlay**: Semi-transparent dark background (70% opacity)
- **Spinner**: Animated rotating circle (1s rotation)
- **Message**: Bold white text below spinner
- **Animation**: Fade-in on display, fade-out on dismiss
- **z-index**: 9999 (very high priority)

### CSS Classes

```css
.loading-overlay           /* Overlay container */
.loading-overlay.show     /* Active/visible state */
.spinner                  /* Animated spinner circle */
.loading-overlay p        /* Message text */
```

### Spinner Animation

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## 3. Modal Dialogs

Modal dialogs are interactive overlays for confirmations, alerts, and user interactions. They block interaction with the page and require user action.

### Usage

```javascript
UIService.showModal(title, content, buttons);
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `title` | String | Modal header title |
| `content` | String | HTML content body |
| `buttons` | Array | Button configuration array |

### Button Configuration

Each button object should contain:

```javascript
{
    label: String,        // Button text
    action: String,       // Action identifier (returned on click)
    type: String         // One of: 'primary', 'secondary', 'danger'
}
```

### Return Value

The function returns a Promise that resolves with the clicked button's `action` value, or `null` if modal was closed.

### Examples

#### Simple Confirmation
```javascript
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
    UIService.showNotification('Logged out successfully', 'success');
}
```

#### Delete Confirmation
```javascript
const action = await UIService.showModal(
    'Delete Transaction',
    'This action cannot be undone. Delete this transaction?',
    [
        { label: 'Cancel', action: 'cancel', type: 'secondary' },
        { label: 'Delete', action: 'confirm', type: 'danger' }
    ]
);

if (action === 'confirm') {
    deleteTransaction(transactionId);
    UIService.showNotification('Transaction deleted', 'success');
}
```

#### Multiple Options
```javascript
const action = await UIService.showModal(
    'Export Data',
    'Choose format to export your financial data:',
    [
        { label: 'CSV', action: 'csv', type: 'primary' },
        { label: 'PDF', action: 'pdf', type: 'primary' },
        { label: 'Cancel', action: 'cancel', type: 'secondary' }
    ]
);

switch (action) {
    case 'csv':
        exportToCSV();
        break;
    case 'pdf':
        exportToPDF();
        break;
}
```

#### Information Alert
```javascript
await UIService.showModal(
    'Transaction Limit Reached',
    'You have reached your monthly limit for the Entertainment category.<br><br>Limit: ₹5,000 | Spent: ₹5,000',
    [
        { label: 'OK', action: 'confirm', type: 'primary' }
    ]
);
```

### Styling

Modal dialogs include:
- **Overlay**: Semi-transparent dark background
- **Content Box**: Centered white card with rounded corners
- **Header**: Title with close button
- **Body**: Message content
- **Footer**: Action buttons
- **Animation**: Fade-in on display, fade-out on close
- **z-index**: 5000

### CSS Classes

```css
.modal                      /* Modal container */
.modal.show                 /* Active/visible state */
.modal.closing              /* Closing animation state */
.modal-overlay              /* Dark background overlay */
.modal-content              /* White content box */
.modal-header               /* Title section */
.modal-body                 /* Content section */
.modal-footer               /* Button section */
.modal-close                /* Close button */
.modal-button               /* Base button styling */
.modal-button-primary       /* Primary button */
.modal-button-secondary     /* Secondary button */
.modal-button-danger        /* Danger button */
```

---

## 4. Real-World Implementation Examples

### Example 1: Form Submission with Validation

```javascript
async function submitExpenseForm() {
    // Validate input
    if (!expenseDescription || !expenseAmount) {
        UIService.showNotification('Please fill all required fields', 'warning');
        return;
    }

    // Show loading
    UIService.showLoading('Adding expense...');

    try {
        // Simulate API call
        const expense = {
            id: Date.now(),
            description: expenseDescription,
            amount: parseFloat(expenseAmount),
            category: expenseCategory,
            date: new Date().toISOString()
        };

        // Add to local storage
        itemList.push(expense);
        saveToStorage();

        // Hide loading and show success
        UIService.hideLoading();
        UIService.showNotification('Expense added successfully', 'success');

        // Clear form
        resetForm();
        renderExpenseTable();

    } catch (error) {
        UIService.hideLoading();
        UIService.showNotification('Failed to add expense: ' + error.message, 'error');
    }
}
```

### Example 2: Async Data Export

```javascript
async function exportTransactionsPDF() {
    UIService.showLoading('Generating PDF...');

    try {
        const doc = new jsPDF();
        
        // Add title
        doc.text('Financial Report', 20, 20);
        
        // Add table data
        const data = itemList.map(item => [
            item.date,
            item.description,
            item.category,
            '₹' + item.amount
        ]);

        doc.autoTable({
            head: [['Date', 'Description', 'Category', 'Amount']],
            body: data,
            startY: 30
        });

        UIService.hideLoading();
        
        // Save PDF
        doc.save('transactions.pdf');
        UIService.showNotification('PDF exported successfully', 'success');

    } catch (error) {
        UIService.hideLoading();
        UIService.showNotification('Failed to export PDF', 'error');
    }
}
```

### Example 3: Budget Limit Warning

```javascript
function checkBudgetLimits() {
    const categories = ['Food', 'Entertainment', 'Transport'];
    
    for (let category of categories) {
        const spent = itemList
            .filter(item => item.category === category)
            .reduce((sum, item) => sum + item.amount, 0);
        
        const limit = budgetLimits[category] || 10000;
        const percentage = (spent / limit) * 100;

        if (percentage >= 100) {
            UIService.showNotification(
                `⚠️ Budget limit reached for ${category}`,
                'warning',
                4000
            );
        } else if (percentage >= 80) {
            UIService.showNotification(
                `${category} spending at ${percentage.toFixed(0)}% of limit`,
                'warning'
            );
        }
    }
}
```

### Example 4: Profile Update Flow

```javascript
async function updateProfile(name, email, avatar) {
    const action = await UIService.showModal(
        'Update Profile',
        'Are you sure you want to update your profile?',
        [
            { label: 'Cancel', action: 'cancel', type: 'secondary' },
            { label: 'Update', action: 'confirm', type: 'primary' }
        ]
    );

    if (action === 'confirm') {
        UIService.showLoading('Updating profile...');

        try {
            const user = AuthService.getCurrentUser();
            user.fullName = name;
            user.email = email;
            user.avatar = avatar || generateDefaultAvatar();

            localStorage.setItem('pfm_user', JSON.stringify(user));

            UIService.hideLoading();
            UIService.showNotification('Profile updated successfully', 'success');

        } catch (error) {
            UIService.hideLoading();
            UIService.showNotification('Failed to update profile', 'error');
        }
    }
}
```

---

## 5. Best Practices

### ✅ Do's

1. **Use appropriate types**: Match notification type to the context
   - `success` - For completed actions
   - `error` - For failures
   - `warning` - For cautions/validations
   - `info` - For general information

2. **Keep messages clear and concise**: Users should understand immediately
   ```javascript
   // Good
   UIService.showNotification('Transaction deleted', 'success');
   
   // Bad
   UIService.showNotification('The system has successfully removed the transaction from the database', 'success');
   ```

3. **Use loading for long operations**: Show loading for operations > 500ms
   ```javascript
   UIService.showLoading('Processing...');
   // ... long operation
   UIService.hideLoading();
   ```

4. **Confirm destructive actions**: Always ask before deletion
   ```javascript
   const action = await UIService.showModal(
       'Delete All',
       'Delete all transactions permanently?',
       [
           { label: 'Cancel', action: 'cancel', type: 'secondary' },
           { label: 'Delete', action: 'confirm', type: 'danger' }
       ]
   );
   ```

5. **Always hide loading**: Ensure loading is hidden in success and error cases
   ```javascript
   try {
       // operation
       UIService.hideLoading();
   } catch (error) {
       UIService.hideLoading();  // Don't forget in error case!
   }
   ```

### ❌ Don'ts

1. **Don't use success for validations**: Use warning instead
   ```javascript
   // Bad
   UIService.showNotification('Please enter amount', 'success');
   
   // Good
   UIService.showNotification('Please enter amount', 'warning');
   ```

2. **Don't spam notifications**: Batch related messages
   ```javascript
   // Bad - Showing multiple notifications
   validationErrors.forEach(error => 
       UIService.showNotification(error, 'error')
   );
   
   // Good - Combine into one
   UIService.showNotification(
       'Validation errors: ' + validationErrors.join(', '),
       'error'
   );
   ```

3. **Don't forget to hide loading**: Always clear loading state
   ```javascript
   // Bad - Loading might stay visible if operation succeeds
   UIService.showLoading();
   doSomething();
   
   // Good - Explicitly hide
   UIService.showLoading();
   doSomething().finally(() => UIService.hideLoading());
   ```

4. **Don't overuse modals**: Use for important confirmations only
   ```javascript
   // Use toast notification instead
   UIService.showNotification('Saved', 'success');  // Better than modal
   ```

5. **Don't leave loading indefinitely**: Set a timeout fallback
   ```javascript
   UIService.showLoading('Processing...');
   setTimeout(() => {
       UIService.hideLoading();
       UIService.showNotification('Operation timeout', 'error');
   }, 30000);  // Fallback after 30 seconds
   ```

---

## 6. Accessibility Features

All notification and alert components include:

### ARIA Attributes
- **Notifications**: `role="alert"` and `aria-live="polite"` for screen readers
- **Modals**: `role="dialog"` and `aria-labelledby` for accessible headings
- **Buttons**: `aria-label` for icon-only buttons

### Keyboard Navigation
- **Modals**: Can be closed with `Escape` key
- **Buttons**: Full keyboard access with Tab key
- **Focus**: Proper focus management

### Color Contrast
- Notification types use distinct colors for clarity
- Text colors meet WCAG AA standards

### Screen Reader Support
```javascript
// Notifications are announced to screen readers
notification.setAttribute('role', 'alert');
notification.setAttribute('aria-live', 'polite');

// Modal titles are linked to dialog
modal.setAttribute('aria-labelledby', 'modal-title');
```

---

## 7. Configuration & Customization

### Default Values
```javascript
// Notification defaults
const defaultType = 'info';
const defaultDuration = 3000;  // 3 seconds

// Loading overlay defaults
const defaultLoadingMessage = 'Loading...';

// Modal defaults
const modalAnimationDuration = 300;  // milliseconds
```

### Custom Styling
Modify CSS variables in `styles.css`:
```css
:root {
  --primary: #2563eb;
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;
  --card: #ffffff;
  --text: #1f2937;
}

/* Override notification styling */
.notification {
  min-width: 300px;  /* Customize width */
  border-radius: 8px;  /* Customize border radius */
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);  /* Customize shadow */
}
```

---

## 8. Troubleshooting

### Notification Not Showing
- Ensure `UIService` is loaded before calling the method
- Check if notification container exists in the DOM
- Verify z-index is high enough

### Loading Overlay Stuck
- Always call `UIService.hideLoading()` in try-catch finally block
- Check browser console for JavaScript errors

### Modal Not Responding
- Ensure `UIService` is properly initialized
- Check for conflicting event listeners
- Verify modal is not trapped behind other elements

---

## 9. Complete Integration Checklist

- [x] Toast notifications implemented
- [x] Success/warning/error message types
- [x] Loading spinners with custom messages
- [x] Modal dialogs with button actions
- [x] Accessibility (ARIA, keyboard nav)
- [x] Responsive design
- [x] Dark mode support
- [x] CSS animations
- [x] TypeScript-ready structure
- [x] Error handling

---

For more information, see [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) for system design details.

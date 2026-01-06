# Quick Start Guide - Authentication System

## 🚀 Getting Started in 2 Minutes

### Step 1: Start Using the App
1. Open `index.html` in your browser
2. You'll automatically be redirected to `login.html`

### Step 2: Create Your Account (or Use Demo)

**Option A: Register a New Account**
- Click "Sign up here" link
- Fill in your details:
  - Full Name: e.g., "John Doe"
  - Email: e.g., "john@example.com"
  - Password: Create a strong password (8+ chars)
- Click "Create Account"
- You'll be redirected to login page

**Option B: Use Demo Account (Quickest)**
- Click "Login as Demo" button
- It auto-fills demo credentials
- Click "Sign In"

**Demo Credentials:**
```
Email: demo@example.com
Password: Demo@123
```

### Step 3: You're In!
- Dashboard loads with your financial data
- Your name and avatar appear in the top-right
- Click on your name to see profile options

---

## 🎯 Main Features

### 💰 Dashboard (index.html)
- Track budget and expenses
- Add expense entries
- View transaction history
- Export data as CSV or PDF

### 👤 Profile (profile.html)
**Overview Tab:**
- View account information
- See last login time
- Check financial statistics

**Edit Tab:**
- Update your name
- Change email
- Update avatar

**Settings Tab:**
- Toggle dark mode
- Export your data
- Clear all data
- Delete account

### 📊 Other Pages
- **Analytics** - View expense analytics
- **Charts** - Visual charts of spending
- **Summary** - Financial summary report

All protected pages require authentication!

---

## 🔐 Security Features

✅ **Client-side Encryption** - User data encoded in localStorage
✅ **Token Validation** - Tokens expire in 24 hours
✅ **Session Protection** - Auto-redirect if not authenticated
✅ **Password Security** - Passwords validated for strength
✅ **Secure Logout** - All auth data cleared on logout

---

## 📱 Mobile Support

- ✅ Fully responsive design
- ✅ Touch-friendly buttons
- ✅ Mobile optimized forms
- ✅ Works on all devices

---

## 💡 Tips & Tricks

### Remember Your Login
- Check "Remember Me" on login page
- Your email will be pre-filled next time

### Dark Mode
- Go to Profile > Settings
- Toggle "Dark Mode" switch
- Your preference is saved

### Export Your Data
- Profile > Settings > "Export Data"
- Downloads JSON file with all your data

### Reset Everything
- Profile > Settings > "Clear Data"
- Keeps your account but removes financial data

---

## ❓ Common Questions

**Q: Where is my data stored?**
A: Locally in your browser's localStorage (not on any server)

**Q: Is my password safe?**
A: Passwords are hashed before storage. Never stored in plain text.

**Q: What happens if I clear browser cache?**
A: All data will be deleted. Export first if needed!

**Q: How long is my session?**
A: 24 hours. After that, you'll need to login again.

**Q: Can I use this on multiple devices?**
A: Not yet - data is local to each device. (Requires backend for sync)

---

## 🎨 Customization

### Change Colors
Edit `styles.css`:
```css
:root {
  --primary: #6366f1;      /* Main color */
  --accent: #ec4899;       /* Accent color */
  --success: #10b981;      /* Success color */
  --danger: #ef4444;       /* Danger color */
}
```

### Change App Name
Edit HTML title and header in each page:
```html
<div class="title">💰 Your App Name</div>
```

---

## 🐛 Troubleshooting

**Problem:** Redirected to login on every page
- Clear browser cache
- Check localStorage is enabled
- Try incognito/private mode

**Problem:** Can't login with demo account
- Check browser console (F12) for errors
- Verify localStorage has user_database
- Refresh and try again

**Problem:** Lost all my data
- Data is local only - check other browsers/devices
- Use "Export Data" before clearing cache

---

## 📞 Need Help?

1. Open Developer Tools (F12)
2. Check Console tab for errors
3. Go to Application > LocalStorage
4. Look for auth_user, auth_token, user_database
5. Check values are present and valid

---

## 🎉 You're All Set!

Your authentication system is ready to use. Start by:
1. Creating an account or using demo login
2. Exploring the dashboard
3. Adding some expenses
4. Checking your profile

**Enjoy using your Personal Finance Manager!** 💰📊

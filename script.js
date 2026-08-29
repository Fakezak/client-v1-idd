// Zaka Key Generator Logic
const API_ENDPOINT = '/api/generate';

// Generate UUID
function generateUUID() {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Generate random string
function generateRandomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => chars[byte % chars.length]).join('');
}

// Generate key locally (fallback if API fails)
function generateKeyLocally(accountId, keyType, expiryDays) {
    const timestamp = Date.now();
    const randomPart = generateRandomString(32);
    const uuid = generateUUID();
    
    const keyData = {
        key: `zaka_${keyType}_${randomPart}_${uuid.slice(0, 8)}`,
        account_id: accountId,
        key_type: keyType,
        created_at: new Date(timestamp).toISOString(),
        expires_at: new Date(timestamp + (expiryDays * 24 * 60 * 60 * 1000)).toISOString(),
        request_id: uuid,
        status: 'active'
    };
    
    return keyData;
}

// Generate key via API
async function generateKey() {
    const accountId = document.getElementById('account-id').value.trim();
    const keyType = document.getElementById('key-type').value;
    const expiryDays = parseInt(document.getElementById('expiry').value);
    
    // Validate input
    if (!accountId || accountId.length < 3) {
        showError('Please enter a valid Account ID (minimum 3 characters)');
        return;
    }
    
    // Show loading
    document.getElementById('generate-btn').disabled = true;
    document.getElementById('loading-spinner').classList.add('show');
    document.getElementById('result-container').classList.remove('show');
    document.getElementById('error-message').classList.remove('show');
    
    try {
        let keyData;
        
        try {
            // Try API first
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    account_id: accountId,
                    key_type: keyType,
                    expiry_days: expiryDays,
                    request_id: generateUUID()
                })
            });
            
            if (!response.ok) {
                throw new Error('API failed');
            }
            
            const data = await response.json();
            keyData = data.data;
        } catch (apiError) {
            // Fallback to local generation
            console.log('API failed, generating locally:', apiError);
            keyData = generateKeyLocally(accountId, keyType, expiryDays);
        }
        
        // Display result
        displayKeyResult(keyData);
        
        // Save to history
        saveKeyToHistory(keyData);
        
    } catch (error) {
        showError('Failed to generate key: ' + error.message);
    } finally {
        document.getElementById('generate-btn').disabled = false;
        document.getElementById('loading-spinner').classList.remove('show');
    }
}

// Display generated key
function displayKeyResult(keyData) {
    const resultContainer = document.getElementById('result-container');
    document.getElementById('generated-key').textContent = keyData.key;
    document.getElementById('expiry-date').textContent = new Date(keyData.expires_at).toLocaleString();
    document.getElementById('result-account').textContent = keyData.account_id;
    document.getElementById('result-type').textContent = keyData.key_type;
    
    resultContainer.classList.add('show');
}

// Copy key to clipboard
async function copyKey() {
    const key = document.getElementById('generated-key').textContent;
    
    try {
        await navigator.clipboard.writeText(key);
        showNotification('Key copied to clipboard!');
    } catch (error) {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = key;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification('Key copied to clipboard!');
    }
}

// Save key to history
function saveKeyToHistory(keyData) {
    let history = JSON.parse(localStorage.getItem('zaka_key_history') || '[]');
    history.unshift(keyData);
    
    // Keep only last 10 keys
    history = history.slice(0, 10);
    
    localStorage.setItem('zaka_key_history', JSON.stringify(history));
    displayKeyHistory();
}

// Display key history
function displayKeyHistory() {
    const history = JSON.parse(localStorage.getItem('zaka_key_history') || '[]');
    const historyList = document.getElementById('history-list');
    
    if (history.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; opacity: 0.7;">No keys generated yet</p>';
        return;
    }
    
    historyList.innerHTML = history.map((keyData, index) => {
        const isExpired = new Date(keyData.expires_at) < new Date();
        const statusClass = isExpired ? 'status-expired' : 'status-active';
        const statusText = isExpired ? 'Expired' : 'Active';
        
        return `
            <div class="history-item" onclick="viewHistoryKey(${index})">
                <div class="history-key">${keyData.key}</div>
                <div class="history-meta">
                    <span>${keyData.key_type}</span>
                    <span>${keyData.account_id}</span>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
            </div>
        `;
    }).join('');
}

// View history key
function viewHistoryKey(index) {
    const history = JSON.parse(localStorage.getItem('zaka_key_history') || '[]');
    const keyData = history[index];
    
    if (keyData) {
        displayKeyResult(keyData);
    }
}

// Show error message
function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.classList.add('show');
    
    setTimeout(() => {
        errorElement.classList.remove('show');
    }, 5000);
}

// Show notification (toast)
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        animation: fadeIn 0.3s ease-in;
        z-index: 9999;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Check for expired keys periodically
function checkExpiredKeys() {
    const history = JSON.parse(localStorage.getItem('zaka_key_history') || '[]');
    const now = new Date();
    
    history.forEach(keyData => {
        if (new Date(keyData.expires_at) < now && keyData.status === 'active') {
            keyData.status = 'expired';
            console.log(`Key expired: ${keyData.key}`);
        }
    });
    
    localStorage.setItem('zaka_key_history', JSON.stringify(history));
    displayKeyHistory();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    displayKeyHistory();
    checkExpiredKeys();
    
    // Check for expired keys every minute
    setInterval(checkExpiredKeys, 60000);
});

// Export functions for use in HTML
window.generateKey = generateKey;
window.copyKey = copyKey;
window.viewHistoryKey = viewHistoryKey;

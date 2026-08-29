// Zaka Project - Client-side Authentication Flow

// Client configuration
const CONFIG = {
    platform: 'freefire',
    version: '1.0.0',
    sessionDuration: 3600 // 1 hour in seconds
};

// Generate UUID v4
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

// Generate random token
function generateToken(length = 64) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Get account_id from URL parameters or localStorage
function getAccountId() {
    const urlParams = new URLSearchParams(window.location.search);
    const accountId = urlParams.get('account_id') || localStorage.getItem('zaka_account_id');
    
    if (accountId) {
        localStorage.setItem('zaka_account_id', accountId);
        return accountId;
    }
    
    // For demo purposes, generate a random account ID
    const demoAccountId = 'FF_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    localStorage.setItem('zaka_account_id', demoAccountId);
    return demoAccountId;
}

// Simulate server authentication (replace with actual API call later)
function authenticateWithServer(accountId) {
    return new Promise((resolve, reject) => {
        // Simulate network delay
        setTimeout(() => {
            try {
                const sessionData = {
                    request_id: generateUUID(),
                    account_id: accountId,
                    session_token: generateToken(),
                    message: `Welcome user${accountId} to zaka project :)`,
                    expires_in: CONFIG.sessionDuration,
                    timestamp: new Date().toISOString()
                };
                resolve(sessionData);
            } catch (error) {
                reject(error);
            }
        }, 2000); // 2 second delay to simulate server response
    });
}

// Display welcome message
function displayWelcomeMessage(sessionData) {
    const loadingElement = document.getElementById('loading');
    const welcomeElement = document.getElementById('welcome-message');
    const welcomeText = document.getElementById('welcome-text');
    
    loadingElement.classList.add('hidden');
    welcomeText.textContent = `Welcome user${sessionData.account_id} to zaka project `;
    welcomeElement.classList.remove('hidden');
    
    // After 5 seconds, transition to "Enjoy :)"
    setTimeout(() => {
        welcomeElement.style.animation = 'fadeOut 0.5s ease-out';
        welcomeElement.style.opacity = '0';
        
        setTimeout(() => {
            welcomeElement.classList.add('hidden');
            displayEnjoyMessage(sessionData);
        }, 500);
    }, 5000);
}

// Display "Enjoy :)" message
function displayEnjoyMessage(sessionData) {
    const enjoyElement = document.getElementById('enjoy-message');
    enjoyElement.classList.remove('hidden');
    enjoyElement.style.opacity = '1';
    
    // After 2 seconds, transition to authenticated state
    setTimeout(() => {
        enjoyElement.style.animation = 'fadeOut 0.5s ease-out';
        enjoyElement.style.opacity = '0';
        
        setTimeout(() => {
            enjoyElement.classList.add('hidden');
            displayAuthenticatedState(sessionData);
        }, 500);
    }, 2000);
}

// Display authenticated state
function displayAuthenticatedState(sessionData) {
    const authenticatedElement = document.getElementById('authenticated-state');
    
    document.getElementById('account-id').textContent = sessionData.account_id;
    document.getElementById('request-id').textContent = sessionData.request_id;
    document.getElementById('session-token').textContent = sessionData.session_token;
    
    const expiryDate = new Date(Date.now() + (sessionData.expires_in * 1000));
    document.getElementById('session-expiry').textContent = expiryDate.toLocaleString();
    
    authenticatedElement.classList.remove('hidden');
    
    // Store session data
    sessionStorage.setItem('zaka_session', JSON.stringify(sessionData));
}

// Show error message
function showError(message) {
    const errorElement = document.getElementById('error-container');
    errorElement.textContent = `Error: ${message}`;
    errorElement.classList.remove('hidden');
    
    const loadingElement = document.getElementById('loading');
    loadingElement.classList.add('hidden');
}

// Initialize client
async function init() {
    try {
        const accountId = getAccountId();
        const sessionData = await authenticateWithServer(accountId);
        displayWelcomeMessage(sessionData);
    } catch (error) {
        console.error('Authentication error:', error);
        showError(error.message);
    }
}

// Start the client when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

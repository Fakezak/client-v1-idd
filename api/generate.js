// Vercel serverless function for key generation
const crypto = require('crypto');

// Secret for key generation (should be in environment variables)
const GENERATOR_SECRET = process.env.GENERATOR_SECRET || 'zaka_key_generator_secret_2024';

// Generate secure random string
function generateSecureString(length = 32) {
    return crypto.randomBytes(length).toString('base64').replace(/[+/=]/g, '').slice(0, length);
}

// Generate key
function generateKey(accountId, keyType, expiryDays) {
    const timestamp = Date.now();
    const randomPart = generateSecureString(32);
    const requestId = crypto.randomUUID();
    
    // Create key with embedded metadata
    const keyPayload = {
        type: keyType,
        account: accountId,
        random: randomPart,
        created: timestamp
    };
    
    // Sign the key
    const signature = crypto
        .createHmac('sha256', GENERATOR_SECRET)
        .update(JSON.stringify(keyPayload))
        .digest('hex')
        .slice(0, 16);
    
    const key = `zaka_${keyType}_${randomPart}_${signature}`;
    
    return {
        key: key,
        account_id: accountId,
        key_type: keyType,
        created_at: new Date(timestamp).toISOString(),
        expires_at: new Date(timestamp + (expiryDays * 24 * 60 * 60 * 1000)).toISOString(),
        request_id: requestId,
        status: 'active',
        signature: signature
    };
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Only POST
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }
    
    try {
        const { account_id, key_type = 'client', expiry_days = 3 } = req.body || {};
        
        // Validate
        if (!account_id || account_id.length < 3) {
            return res.status(400).json({
                success: false,
                error: 'Invalid account_id'
            });
        }
        
        // Limit expiry days
        const maxDays = 30;
        const validExpiry = Math.min(Math.max(1, parseInt(expiry_days) || 3), maxDays);
        
        // Generate key
        const keyData = generateKey(account_id, key_type, validExpiry);
        
        return res.status(200).json({
            success: true,
            data: keyData,
            message: `Key generated successfully. Valid for ${validExpiry} days.`
        });
        
    } catch (error) {
        console.error('Key generation error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

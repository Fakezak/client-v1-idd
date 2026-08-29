// Vercel serverless function for key validation
const crypto = require('crypto');

const GENERATOR_SECRET = process.env.GENERATOR_SECRET || 'zaka_key_generator_secret_2024';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }
    
    try {
        const { key } = req.body || {};
        
        if (!key) {
            return res.status(400).json({
                success: false,
                error: 'Key is required'
            });
        }
        
        // Parse key
        const parts = key.split('_');
        if (parts.length < 4 || parts[0] !== 'zaka') {
            return res.status(400).json({
                success: false,
                valid: false,
                error: 'Invalid key format'
            });
        }
        
        // Extract components
        const keyType = parts[1];
        const randomPart = parts[2];
        const signature = parts[3];
        
        // In production, you'd verify against a database
        // For demo, we'll just validate the format
        
        return res.status(200).json({
            success: true,
            valid: true,
            data: {
                key_type: keyType,
                signature: signature,
                validated_at: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Validation error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

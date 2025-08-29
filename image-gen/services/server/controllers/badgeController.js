import badgeService from '../services/badgeService.js';

export const generateBadge = async (req, res) => {
    try {
        const config = req.body;
        const result = await badgeService.generateBadgeImage(config);
        
        res.json({
            success: true,
            message: 'Badge generated successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
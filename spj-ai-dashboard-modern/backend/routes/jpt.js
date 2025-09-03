const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get JPT cohort data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { cohort_id, phase, limit = 100, offset = 0 } = req.query;
    
    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    if (cohort_id) {
      whereConditions.push(`cohort_id = $${paramCount++}`);
      params.push(cohort_id);
    }

    if (phase) {
      whereConditions.push(`phase = $${paramCount++}`);
      params.push(phase);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const query = `
      SELECT * FROM jpt_cohort 
      ${whereClause}
      ORDER BY cohort_id, phase
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
    
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);
    
    res.json({
      jpt: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('JPT data fetch error:', error);
    res.status(500).json({ message: 'Error fetching JPT data' });
  }
});

module.exports = router;

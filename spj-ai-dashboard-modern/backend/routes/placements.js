const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get placements data with filtering
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
      SELECT * FROM placements_cohort 
      ${whereClause}
      ORDER BY cohort_id, phase
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
    
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);
    
    res.json({
      placements: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Placements fetch error:', error);
    res.status(500).json({ message: 'Error fetching placements data' });
  }
});

// Get company visits data
router.get('/visits', authenticateToken, async (req, res) => {
  try {
    const { cohort_id, phase, company, tier, limit = 100, offset = 0 } = req.query;
    
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

    if (company) {
      whereConditions.push(`company_name ILIKE $${paramCount++}`);
      params.push(`%${company}%`);
    }

    if (tier) {
      whereConditions.push(`tier = $${paramCount++}`);
      params.push(tier);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const query = `
      SELECT * FROM company_visits 
      ${whereClause}
      ORDER BY visit_date DESC, company_name
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
    
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);
    
    res.json({
      visits: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Company visits fetch error:', error);
    res.status(500).json({ message: 'Error fetching company visits data' });
  }
});

module.exports = router;

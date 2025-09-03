const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get tutor sessions data
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const { cohort_id, phase, unit_code, limit = 100, offset = 0 } = req.query;
    
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

    if (unit_code) {
      whereConditions.push(`unit_code = $${paramCount++}`);
      params.push(unit_code);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const query = `
      SELECT * FROM tutor_sessions 
      ${whereClause}
      ORDER BY created_week, unit_code
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
    
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);
    
    res.json({
      sessions: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Tutor sessions fetch error:', error);
    res.status(500).json({ message: 'Error fetching tutor sessions data' });
  }
});

// Get tutor utilization data
router.get('/utilization', authenticateToken, async (req, res) => {
  try {
    const { cohort_id, phase, session_id, limit = 100, offset = 0 } = req.query;
    
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

    if (session_id) {
      whereConditions.push(`session_id = $${paramCount++}`);
      params.push(session_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const query = `
      SELECT * FROM tutor_session_utilization 
      ${whereClause}
      ORDER BY week, session_id
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
    
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);
    
    res.json({
      utilization: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Tutor utilization fetch error:', error);
    res.status(500).json({ message: 'Error fetching tutor utilization data' });
  }
});

// Get tutor weekly summary
router.get('/weekly', authenticateToken, async (req, res) => {
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
      SELECT * FROM tutor_weekly_summary 
      ${whereClause}
      ORDER BY week
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
    
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);
    
    res.json({
      weekly: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Tutor weekly fetch error:', error);
    res.status(500).json({ message: 'Error fetching tutor weekly data' });
  }
});

// Get tutor cohort summary
router.get('/summary', authenticateToken, async (req, res) => {
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
      SELECT * FROM tutor_cohort_summary 
      ${whereClause}
      ORDER BY cohort_id, phase
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
    
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);
    
    res.json({
      summary: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Tutor summary fetch error:', error);
    res.status(500).json({ message: 'Error fetching tutor summary data' });
  }
});

module.exports = router;

const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all cohorts with filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { year, program, phase, limit = 100, offset = 0 } = req.query;
    
    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    if (year) {
      whereConditions.push(`year = $${paramCount++}`);
      params.push(year);
    }

    if (program) {
      whereConditions.push(`program = $${paramCount++}`);
      params.push(program);
    }

    if (phase) {
      whereConditions.push(`phase = $${paramCount++}`);
      params.push(phase);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const query = `
      SELECT * FROM cohort_master 
      ${whereClause}
      ORDER BY year DESC, program, cohort_id
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
    
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);
    
    res.json({
      cohorts: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Cohorts fetch error:', error);
    res.status(500).json({ message: 'Error fetching cohorts' });
  }
});

// Get cohort by ID
router.get('/:cohortId', authenticateToken, async (req, res) => {
  try {
    const { cohortId } = req.params;
    
    const result = await db.query(
      'SELECT * FROM cohort_master WHERE cohort_id = $1',
      [cohortId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cohort not found' });
    }

    res.json({ cohort: result.rows[0] });
  } catch (error) {
    console.error('Cohort fetch error:', error);
    res.status(500).json({ message: 'Error fetching cohort' });
  }
});

// Get cohort statistics
router.get('/:cohortId/stats', authenticateToken, async (req, res) => {
  try {
    const { cohortId } = req.params;
    
    // Get cohort info
    const cohortResult = await db.query(
      'SELECT * FROM cohort_master WHERE cohort_id = $1',
      [cohortId]
    );

    if (cohortResult.rows.length === 0) {
      return res.status(404).json({ message: 'Cohort not found' });
    }

    const cohort = cohortResult.rows[0];

    // Get placement stats
    const placementResult = await db.query(
      'SELECT * FROM placements_cohort WHERE cohort_id = $1',
      [cohortId]
    );

    // Get tutor stats
    const tutorResult = await db.query(
      'SELECT * FROM tutor_cohort_summary WHERE cohort_id = $1',
      [cohortId]
    );

    // Get mentor stats
    const mentorResult = await db.query(
      'SELECT * FROM mentor_cohort WHERE cohort_id = $1',
      [cohortId]
    );

    // Get JPT stats
    const jptResult = await db.query(
      'SELECT * FROM jpt_cohort WHERE cohort_id = $1',
      [cohortId]
    );

    res.json({
      cohort,
      placement: placementResult.rows[0] || null,
      tutor: tutorResult.rows[0] || null,
      mentor: mentorResult.rows[0] || null,
      jpt: jptResult.rows[0] || null
    });
  } catch (error) {
    console.error('Cohort stats error:', error);
    res.status(500).json({ message: 'Error fetching cohort statistics' });
  }
});

module.exports = router;

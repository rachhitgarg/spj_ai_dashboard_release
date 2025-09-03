const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get overview analytics
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const { tools, courses, cohorts, phases } = req.query;
    
    // Build dynamic WHERE clause
    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    if (cohorts) {
      const cohortList = cohorts.split(',');
      const placeholders = cohortList.map(() => `$${paramCount++}`).join(',');
      whereConditions.push(`cm.cohort_id IN (${placeholders})`);
      params.push(...cohortList);
    }

    if (courses) {
      const courseList = courses.split(',');
      const placeholders = courseList.map(() => `$${paramCount++}`).join(',');
      whereConditions.push(`cm.program IN (${placeholders})`);
      params.push(...courseList);
    }

    if (phases) {
      const phaseList = phases.split(',');
      const placeholders = phaseList.map(() => `$${paramCount++}`).join(',');
      whereConditions.push(`cm.phase IN (${placeholders})`);
      params.push(...phaseList);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Core placement metrics
    const placementQuery = `
      SELECT 
        AVG(pc.avg_package) as avg_package,
        AVG(pc.avg_conversion_per_visit_pct) as avg_conversion_per_visit,
        SUM(pc.tier1_offers) as total_tier1_offers,
        SUM(pc.offers) as total_offers,
        SUM(pc.placed) as total_placed,
        SUM(pc.eligible) as total_eligible
      FROM placements_cohort pc
      JOIN cohort_master cm ON pc.cohort_id = cm.cohort_id
      ${whereClause}
    `;

    // AI Tutor metrics
    const tutorQuery = `
      SELECT 
        AVG(tcs.posttutor_exam_avg - tcs.pretutor_exam_avg) as exam_improvement,
        AVG(tcs.posttutor_assignment_avg - tcs.pretutor_assignment_avg) as assignment_improvement,
        AVG(tcs.active_users_pct) as avg_active_users,
        AVG(tcs.units_adopted_pct) as avg_units_adopted
      FROM tutor_cohort_summary tcs
      JOIN cohort_master cm ON tcs.cohort_id = cm.cohort_id
      ${whereClause}
    `;

    // AI Mentor metrics
    const mentorQuery = `
      SELECT 
        AVG(mc.postmentor_capstone_grade_avg - mc.prementor_capstone_grade_avg) as capstone_improvement,
        AVG(mc.grade_a_distribution_pct_post - mc.grade_a_distribution_pct_pre) as grade_a_improvement,
        SUM(mc.higher_degree_admissions) as total_higher_degree_admissions,
        SUM(mc.higher_degree_attempts) as total_higher_degree_attempts
      FROM mentor_cohort mc
      JOIN cohort_master cm ON mc.cohort_id = cm.cohort_id
      ${whereClause}
    `;

    // JPT metrics
    const jptQuery = `
      SELECT 
        AVG(jc.avg_ai_technical) as avg_ai_technical,
        AVG(jc.avg_ai_communication) as avg_ai_communication,
        AVG(jc.avg_ai_confidence) as avg_ai_confidence,
        AVG(jc.postjpt_conv_rate_per_opening_pct - jc.prejpt_conv_rate_per_opening_pct) as conversion_boost,
        AVG(jc.avg_package_after - jc.avg_package_before) as package_improvement
      FROM jpt_cohort jc
      JOIN cohort_master cm ON jc.cohort_id = cm.cohort_id
      ${whereClause}
    `;

    // Traditional vs AI comparison
    const comparisonQuery = `
      SELECT 
        cm.phase,
        AVG(pc.avg_package) as avg_package,
        AVG(pc.avg_conversion_per_visit_pct) as avg_conversion_per_visit,
        SUM(pc.tier1_offers) as total_tier1_offers,
        SUM(pc.offers) as total_offers,
        SUM(pc.placed) as total_placed,
        SUM(pc.eligible) as total_eligible
      FROM placements_cohort pc
      JOIN cohort_master cm ON pc.cohort_id = cm.cohort_id
      ${whereClause}
      GROUP BY cm.phase
      ORDER BY 
        CASE cm.phase 
          WHEN 'Pre-AI' THEN 1 
          WHEN 'Yoodli' THEN 2 
          WHEN 'JPT' THEN 3 
        END
    `;

    const [placementResult, tutorResult, mentorResult, jptResult, comparisonResult] = await Promise.all([
      db.query(placementQuery, params),
      db.query(tutorQuery, params),
      db.query(mentorQuery, params),
      db.query(jptQuery, params),
      db.query(comparisonQuery, params)
    ]);

    const placement = placementResult.rows[0];
    const tutor = tutorResult.rows[0];
    const mentor = mentorResult.rows[0];
    const jpt = jptResult.rows[0];
    const comparison = comparisonResult.rows;

    // Calculate derived metrics
    const jobConversionRate = placement.total_eligible > 0 
      ? (placement.total_placed / placement.total_eligible) * 100 
      : 0;
    
    const tier1Share = placement.total_offers > 0 
      ? (placement.total_tier1_offers / placement.total_offers) * 100 
      : 0;

    const higherDegreeSuccessRate = mentor.total_higher_degree_attempts > 0 
      ? (mentor.total_higher_degree_admissions / mentor.total_higher_degree_attempts) * 100 
      : 0;

    res.json({
      coreMetrics: {
        jobConversionRate: parseFloat(jobConversionRate.toFixed(2)),
        avgPackage: parseFloat(placement.avg_package?.toFixed(2) || 0),
        tier1Share: parseFloat(tier1Share.toFixed(2)),
        conversionPerVisit: parseFloat(placement.avg_conversion_per_visit?.toFixed(2) || 0)
      },
      aiToolPerformance: {
        tutorExamImprovement: parseFloat(tutor.exam_improvement?.toFixed(2) || 0),
        mentorCapstoneImprovement: parseFloat(mentor.capstone_improvement?.toFixed(2) || 0),
        jptTechnicalScore: parseFloat(jpt.avg_ai_technical?.toFixed(2) || 0),
        jptConversionBoost: parseFloat(jpt.conversion_boost?.toFixed(2) || 0),
        higherDegreeSuccessRate: parseFloat(higherDegreeSuccessRate.toFixed(2))
      },
      phaseComparison: comparison.map(phase => ({
        phase: phase.phase,
        avgPackage: parseFloat(phase.avg_package?.toFixed(2) || 0),
        conversionPerVisit: parseFloat(phase.avg_conversion_per_visit?.toFixed(2) || 0),
        tier1Share: phase.total_offers > 0 
          ? parseFloat(((phase.total_tier1_offers / phase.total_offers) * 100).toFixed(2))
          : 0,
        jobConversionRate: phase.total_eligible > 0 
          ? parseFloat(((phase.total_placed / phase.total_eligible) * 100).toFixed(2))
          : 0
      }))
    });
  } catch (error) {
    console.error('Overview analytics error:', error);
    res.status(500).json({ message: 'Error fetching overview analytics' });
  }
});

// Get AI Tutor analytics
router.get('/tutor', authenticateToken, async (req, res) => {
  try {
    const { cohorts, phases } = req.query;
    
    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    if (cohorts) {
      const cohortList = cohorts.split(',');
      const placeholders = cohortList.map(() => `$${paramCount++}`).join(',');
      whereConditions.push(`cm.cohort_id IN (${placeholders})`);
      params.push(...cohortList);
    }

    if (phases) {
      const phaseList = phases.split(',');
      const placeholders = phaseList.map(() => `$${paramCount++}`).join(',');
      whereConditions.push(`cm.phase IN (${placeholders})`);
      params.push(...phaseList);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Usage metrics
    const usageQuery = `
      SELECT 
        COUNT(DISTINCT ts.unit_code) as units_with_sessions,
        COUNT(ts.session_id) as total_sessions,
        AVG(tsu.avg_trs) as avg_trs,
        MAX(tsu.highest_trs) as highest_trs
      FROM tutor_sessions ts
      JOIN cohort_master cm ON ts.cohort_id = cm.cohort_id
      LEFT JOIN tutor_session_utilization tsu ON ts.session_id = tsu.session_id
      ${whereClause}
    `;

    // Weekly trends
    const weeklyQuery = `
      SELECT 
        tws.week,
        SUM(tws.sessions_created_this_week) as sessions_created,
        AVG(tws.overall_utilization_this_week_pct) as avg_utilization,
        AVG(tws.units_adopted_pct) as avg_units_adopted,
        AVG(tws.active_users_pct) as avg_active_users
      FROM tutor_weekly_summary tws
      JOIN cohort_master cm ON tws.cohort_id = cm.cohort_id
      ${whereClause}
      GROUP BY tws.week
      ORDER BY tws.week
    `;

    // Academic performance
    const academicQuery = `
      SELECT 
        cm.phase,
        AVG(tcs.pretutor_exam_avg) as pre_exam_avg,
        AVG(tcs.posttutor_exam_avg) as post_exam_avg,
        AVG(tcs.pretutor_assignment_avg) as pre_assignment_avg,
        AVG(tcs.posttutor_assignment_avg) as post_assignment_avg
      FROM tutor_cohort_summary tcs
      JOIN cohort_master cm ON tcs.cohort_id = cm.cohort_id
      ${whereClause}
      GROUP BY cm.phase
      ORDER BY 
        CASE cm.phase 
          WHEN 'Pre-AI' THEN 1 
          WHEN 'Yoodli' THEN 2 
          WHEN 'JPT' THEN 3 
        END
    `;

    const [usageResult, weeklyResult, academicResult] = await Promise.all([
      db.query(usageQuery, params),
      db.query(weeklyQuery, params),
      db.query(academicQuery, params)
    ]);

    res.json({
      usage: {
        unitsWithSessions: parseInt(usageResult.rows[0].units_with_sessions || 0),
        totalSessions: parseInt(usageResult.rows[0].total_sessions || 0),
        avgTrs: parseFloat(usageResult.rows[0].avg_trs?.toFixed(2) || 0),
        highestTrs: parseFloat(usageResult.rows[0].highest_trs?.toFixed(2) || 0)
      },
      weeklyTrends: weeklyResult.rows.map(row => ({
        week: row.week,
        sessionsCreated: parseInt(row.sessions_created || 0),
        avgUtilization: parseFloat(row.avg_utilization?.toFixed(2) || 0),
        avgUnitsAdopted: parseFloat(row.avg_units_adopted?.toFixed(2) || 0),
        avgActiveUsers: parseFloat(row.avg_active_users?.toFixed(2) || 0)
      })),
      academicPerformance: academicResult.rows.map(row => ({
        phase: row.phase,
        preExamAvg: parseFloat(row.pre_exam_avg?.toFixed(2) || 0),
        postExamAvg: parseFloat(row.post_exam_avg?.toFixed(2) || 0),
        preAssignmentAvg: parseFloat(row.pre_assignment_avg?.toFixed(2) || 0),
        postAssignmentAvg: parseFloat(row.post_assignment_avg?.toFixed(2) || 0)
      }))
    });
  } catch (error) {
    console.error('Tutor analytics error:', error);
    res.status(500).json({ message: 'Error fetching tutor analytics' });
  }
});

// Get AI Mentor analytics
router.get('/mentor', authenticateToken, async (req, res) => {
  try {
    const { cohorts, phases } = req.query;
    
    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    if (cohorts) {
      const cohortList = cohorts.split(',');
      const placeholders = cohortList.map(() => `$${paramCount++}`).join(',');
      whereConditions.push(`cm.cohort_id IN (${placeholders})`);
      params.push(...cohortList);
    }

    if (phases) {
      const phaseList = phases.split(',');
      const placeholders = phaseList.map(() => `$${paramCount++}`).join(',');
      whereConditions.push(`cm.phase IN (${placeholders})`);
      params.push(...phaseList);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Mentor impact metrics
    const impactQuery = `
      SELECT 
        AVG(mc.postmentor_capstone_grade_avg - mc.prementor_capstone_grade_avg) as capstone_improvement,
        AVG(mc.grade_a_distribution_pct_post - mc.grade_a_distribution_pct_pre) as grade_a_improvement,
        AVG(mc.postmentor_exam_avg) as post_exam_avg,
        AVG(mc.tier1_offers_share_pct) as tier1_offers_share,
        AVG(mc.avg_package_in_phase) as avg_package
      FROM mentor_cohort mc
      JOIN cohort_master cm ON mc.cohort_id = cm.cohort_id
      ${whereClause}
    `;

    // Higher degree performance
    const higherDegreeQuery = `
      SELECT 
        SUM(mc.higher_degree_attempts) as total_attempts,
        SUM(mc.higher_degree_admissions) as total_admissions,
        AVG(mc.higher_degree_admissions::float / NULLIF(mc.higher_degree_attempts, 0) * 100) as success_rate
      FROM mentor_cohort mc
      JOIN cohort_master cm ON mc.cohort_id = cm.cohort_id
      ${whereClause}
    `;

    // Phase-wise performance
    const phaseQuery = `
      SELECT 
        cm.phase,
        AVG(mc.prementor_capstone_grade_avg) as pre_capstone_avg,
        AVG(mc.postmentor_capstone_grade_avg) as post_capstone_avg,
        AVG(mc.grade_a_distribution_pct_pre) as pre_grade_a_pct,
        AVG(mc.grade_a_distribution_pct_post) as post_grade_a_pct,
        AVG(mc.avg_package_in_phase) as avg_package
      FROM mentor_cohort mc
      JOIN cohort_master cm ON mc.cohort_id = cm.cohort_id
      ${whereClause}
      GROUP BY cm.phase
      ORDER BY 
        CASE cm.phase 
          WHEN 'Pre-AI' THEN 1 
          WHEN 'Yoodli' THEN 2 
          WHEN 'JPT' THEN 3 
        END
    `;

    const [impactResult, higherDegreeResult, phaseResult] = await Promise.all([
      db.query(impactQuery, params),
      db.query(higherDegreeQuery, params),
      db.query(phaseQuery, params)
    ]);

    const impact = impactResult.rows[0];
    const higherDegree = higherDegreeResult.rows[0];

    res.json({
      impact: {
        capstoneImprovement: parseFloat(impact.capstone_improvement?.toFixed(2) || 0),
        gradeAImprovement: parseFloat(impact.grade_a_improvement?.toFixed(2) || 0),
        postExamAvg: parseFloat(impact.post_exam_avg?.toFixed(2) || 0),
        tier1OffersShare: parseFloat(impact.tier1_offers_share?.toFixed(2) || 0),
        avgPackage: parseFloat(impact.avg_package?.toFixed(2) || 0)
      },
      higherDegree: {
        totalAttempts: parseInt(higherDegree.total_attempts || 0),
        totalAdmissions: parseInt(higherDegree.total_admissions || 0),
        successRate: parseFloat(higherDegree.success_rate?.toFixed(2) || 0)
      },
      phasePerformance: phaseResult.rows.map(row => ({
        phase: row.phase,
        preCapstoneAvg: parseFloat(row.pre_capstone_avg?.toFixed(2) || 0),
        postCapstoneAvg: parseFloat(row.post_capstone_avg?.toFixed(2) || 0),
        preGradeAPct: parseFloat(row.pre_grade_a_pct?.toFixed(2) || 0),
        postGradeAPct: parseFloat(row.post_grade_a_pct?.toFixed(2) || 0),
        avgPackage: parseFloat(row.avg_package?.toFixed(2) || 0)
      }))
    });
  } catch (error) {
    console.error('Mentor analytics error:', error);
    res.status(500).json({ message: 'Error fetching mentor analytics' });
  }
});

// Get JPT analytics
router.get('/jpt', authenticateToken, async (req, res) => {
  try {
    const { cohorts, phases } = req.query;
    
    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    if (cohorts) {
      const cohortList = cohorts.split(',');
      const placeholders = cohortList.map(() => `$${paramCount++}`).join(',');
      whereConditions.push(`cm.cohort_id IN (${placeholders})`);
      params.push(...cohortList);
    }

    if (phases) {
      const phaseList = phases.split(',');
      const placeholders = phaseList.map(() => `$${paramCount++}`).join(',');
      whereConditions.push(`cm.phase IN (${placeholders})`);
      params.push(...phaseList);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // JPT performance metrics
    const performanceQuery = `
      SELECT 
        AVG(jc.avg_sessions_per_student) as avg_sessions_per_student,
        AVG(jc.avg_ai_technical) as avg_ai_technical,
        AVG(jc.avg_ai_communication) as avg_ai_communication,
        AVG(jc.avg_ai_confidence) as avg_ai_confidence,
        AVG(jc.prejpt_conv_rate_per_opening_pct) as pre_conv_rate,
        AVG(jc.postjpt_conv_rate_per_opening_pct) as post_conv_rate,
        AVG(jc.conversion_boost_per_opening_pct) as conversion_boost,
        AVG(jc.avg_package_before) as avg_package_before,
        AVG(jc.avg_package_after) as avg_package_after
      FROM jpt_cohort jc
      JOIN cohort_master cm ON jc.cohort_id = cm.cohort_id
      ${whereClause}
    `;

    // Before vs After comparison
    const comparisonQuery = `
      SELECT 
        cm.phase,
        AVG(jc.prejpt_conv_rate_per_opening_pct) as pre_conv_rate,
        AVG(jc.postjpt_conv_rate_per_opening_pct) as post_conv_rate,
        AVG(jc.avg_package_before) as avg_package_before,
        AVG(jc.avg_package_after) as avg_package_after,
        SUM(jc.tier1_offers_before) as tier1_offers_before,
        SUM(jc.tier1_offers_after) as tier1_offers_after
      FROM jpt_cohort jc
      JOIN cohort_master cm ON jc.cohort_id = cm.cohort_id
      ${whereClause}
      GROUP BY cm.phase
      ORDER BY 
        CASE cm.phase 
          WHEN 'Pre-AI' THEN 1 
          WHEN 'Yoodli' THEN 2 
          WHEN 'JPT' THEN 3 
        END
    `;

    // Usage patterns
    const usageQuery = `
      SELECT 
        cm.phase,
        AVG(jc.avg_sessions_per_student) as avg_sessions_per_student,
        SUM(jc.total_jpt_sessions) as total_sessions,
        AVG(jc.avg_ai_technical) as avg_ai_technical,
        AVG(jc.avg_ai_communication) as avg_ai_communication,
        AVG(jc.avg_ai_confidence) as avg_ai_confidence
      FROM jpt_cohort jc
      JOIN cohort_master cm ON jc.cohort_id = cm.cohort_id
      ${whereClause}
      GROUP BY cm.phase
      ORDER BY 
        CASE cm.phase 
          WHEN 'Pre-AI' THEN 1 
          WHEN 'Yoodli' THEN 2 
          WHEN 'JPT' THEN 3 
        END
    `;

    const [performanceResult, comparisonResult, usageResult] = await Promise.all([
      db.query(performanceQuery, params),
      db.query(comparisonQuery, params),
      db.query(usageQuery, params)
    ]);

    const performance = performanceResult.rows[0];

    res.json({
      performance: {
        avgSessionsPerStudent: parseFloat(performance.avg_sessions_per_student?.toFixed(2) || 0),
        avgAiTechnical: parseFloat(performance.avg_ai_technical?.toFixed(2) || 0),
        avgAiCommunication: parseFloat(performance.avg_ai_communication?.toFixed(2) || 0),
        avgAiConfidence: parseFloat(performance.avg_ai_confidence?.toFixed(2) || 0),
        preConvRate: parseFloat(performance.pre_conv_rate?.toFixed(2) || 0),
        postConvRate: parseFloat(performance.post_conv_rate?.toFixed(2) || 0),
        conversionBoost: parseFloat(performance.conversion_boost?.toFixed(2) || 0),
        packageImprovement: parseFloat((performance.avg_package_after - performance.avg_package_before)?.toFixed(2) || 0)
      },
      beforeAfterComparison: comparisonResult.rows.map(row => ({
        phase: row.phase,
        preConvRate: parseFloat(row.pre_conv_rate?.toFixed(2) || 0),
        postConvRate: parseFloat(row.post_conv_rate?.toFixed(2) || 0),
        avgPackageBefore: parseFloat(row.avg_package_before?.toFixed(2) || 0),
        avgPackageAfter: parseFloat(row.avg_package_after?.toFixed(2) || 0),
        tier1OffersBefore: parseInt(row.tier1_offers_before || 0),
        tier1OffersAfter: parseInt(row.tier1_offers_after || 0)
      })),
      usagePatterns: usageResult.rows.map(row => ({
        phase: row.phase,
        avgSessionsPerStudent: parseFloat(row.avg_sessions_per_student?.toFixed(2) || 0),
        totalSessions: parseInt(row.total_sessions || 0),
        avgAiTechnical: parseFloat(row.avg_ai_technical?.toFixed(2) || 0),
        avgAiCommunication: parseFloat(row.avg_ai_communication?.toFixed(2) || 0),
        avgAiConfidence: parseFloat(row.avg_ai_confidence?.toFixed(2) || 0)
      }))
    });
  } catch (error) {
    console.error('JPT analytics error:', error);
    res.status(500).json({ message: 'Error fetching JPT analytics' });
  }
});

module.exports = router;

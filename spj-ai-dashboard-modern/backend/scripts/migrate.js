const db = require('../config/database');

const createTables = async () => {
  try {
    console.log('🔄 Starting database migration...');

    // Users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Cohort Master table
    await db.query(`
      CREATE TABLE IF NOT EXISTS cohort_master (
        id SERIAL PRIMARY KEY,
        cohort_id VARCHAR(50) UNIQUE NOT NULL,
        year INTEGER NOT NULL,
        program VARCHAR(20) NOT NULL,
        batch_size INTEGER NOT NULL,
        phase VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Company Visits table
    await db.query(`
      CREATE TABLE IF NOT EXISTS company_visits (
        id SERIAL PRIMARY KEY,
        cohort_id VARCHAR(50) NOT NULL,
        phase VARCHAR(20) NOT NULL,
        company_name VARCHAR(100) NOT NULL,
        visit_date DATE NOT NULL,
        role_title VARCHAR(100) NOT NULL,
        role_family VARCHAR(50) NOT NULL,
        tier VARCHAR(20) NOT NULL,
        sector VARCHAR(50) NOT NULL,
        geography VARCHAR(50) NOT NULL,
        is_repeat_recruiter BOOLEAN DEFAULT FALSE,
        openings_announced INTEGER NOT NULL,
        applicants_attended INTEGER NOT NULL,
        interview_slots INTEGER NOT NULL,
        shortlisted INTEGER NOT NULL,
        offers_issued INTEGER NOT NULL,
        joined_count INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cohort_id) REFERENCES cohort_master(cohort_id)
      )
    `);

    // Placements Cohort table
    await db.query(`
      CREATE TABLE IF NOT EXISTS placements_cohort (
        id SERIAL PRIMARY KEY,
        cohort_id VARCHAR(50) NOT NULL,
        phase VARCHAR(20) NOT NULL,
        eligible INTEGER NOT NULL,
        applied INTEGER NOT NULL,
        shortlisted INTEGER NOT NULL,
        offers INTEGER NOT NULL,
        placed INTEGER NOT NULL,
        avg_package DECIMAL(10,2) NOT NULL,
        median_package DECIMAL(10,2) NOT NULL,
        highest_package DECIMAL(10,2) NOT NULL,
        tier1_offers INTEGER NOT NULL,
        tier2_offers INTEGER NOT NULL,
        startup_offers INTEGER NOT NULL,
        psu_offers INTEGER NOT NULL,
        tech_role_share_pct DECIMAL(5,2) NOT NULL,
        finance_role_share_pct DECIMAL(5,2) NOT NULL,
        consulting_role_share_pct DECIMAL(5,2) NOT NULL,
        other_role_share_pct DECIMAL(5,2) NOT NULL,
        avg_conversion_per_visit_pct DECIMAL(5,2) NOT NULL,
        avg_openings_per_visit DECIMAL(5,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cohort_id) REFERENCES cohort_master(cohort_id)
      )
    `);

    // JPT Cohort table
    await db.query(`
      CREATE TABLE IF NOT EXISTS jpt_cohort (
        id SERIAL PRIMARY KEY,
        cohort_id VARCHAR(50) NOT NULL,
        phase VARCHAR(20) NOT NULL,
        total_jpt_sessions INTEGER NOT NULL,
        avg_sessions_per_student DECIMAL(5,2) NOT NULL,
        avg_ai_confidence DECIMAL(5,2) NOT NULL,
        avg_ai_communication DECIMAL(5,2) NOT NULL,
        avg_ai_technical DECIMAL(5,2) NOT NULL,
        prejpt_conv_rate_per_opening_pct DECIMAL(5,2) NOT NULL,
        postjpt_conv_rate_per_opening_pct DECIMAL(5,2) NOT NULL,
        conversion_boost_per_opening_pct DECIMAL(5,2) NOT NULL,
        tier1_offers_before INTEGER NOT NULL,
        tier1_offers_after INTEGER NOT NULL,
        avg_package_before DECIMAL(10,2) NOT NULL,
        avg_package_after DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cohort_id) REFERENCES cohort_master(cohort_id)
      )
    `);

    // Tutor Sessions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS tutor_sessions (
        id SERIAL PRIMARY KEY,
        cohort_id VARCHAR(50) NOT NULL,
        phase VARCHAR(20) NOT NULL,
        unit_code VARCHAR(20) NOT NULL,
        unit_name VARCHAR(100) NOT NULL,
        session_id VARCHAR(50) UNIQUE NOT NULL,
        session_type VARCHAR(50) NOT NULL,
        created_week VARCHAR(20) NOT NULL,
        assigned_count INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cohort_id) REFERENCES cohort_master(cohort_id)
      )
    `);

    // Tutor Session Utilization table
    await db.query(`
      CREATE TABLE IF NOT EXISTS tutor_session_utilization (
        id SERIAL PRIMARY KEY,
        cohort_id VARCHAR(50) NOT NULL,
        phase VARCHAR(20) NOT NULL,
        session_id VARCHAR(50) NOT NULL,
        week VARCHAR(20) NOT NULL,
        started_count INTEGER NOT NULL,
        completed_count INTEGER NOT NULL,
        avg_trs DECIMAL(5,2) NOT NULL,
        highest_trs DECIMAL(5,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cohort_id) REFERENCES cohort_master(cohort_id),
        FOREIGN KEY (session_id) REFERENCES tutor_sessions(session_id)
      )
    `);

    // Tutor Weekly Summary table
    await db.query(`
      CREATE TABLE IF NOT EXISTS tutor_weekly_summary (
        id SERIAL PRIMARY KEY,
        cohort_id VARCHAR(50) NOT NULL,
        phase VARCHAR(20) NOT NULL,
        week VARCHAR(20) NOT NULL,
        sessions_created_this_week INTEGER NOT NULL,
        overall_utilization_this_week_pct DECIMAL(5,2) NOT NULL,
        units_with_sessions_count INTEGER NOT NULL,
        units_adopted_pct DECIMAL(5,2) NOT NULL,
        active_users_pct DECIMAL(5,2) NOT NULL,
        avg_sessions_per_student DECIMAL(5,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cohort_id) REFERENCES cohort_master(cohort_id)
      )
    `);

    // Tutor Cohort Summary table
    await db.query(`
      CREATE TABLE IF NOT EXISTS tutor_cohort_summary (
        id SERIAL PRIMARY KEY,
        cohort_id VARCHAR(50) NOT NULL,
        phase VARCHAR(20) NOT NULL,
        active_users_pct DECIMAL(5,2) NOT NULL,
        units_with_sessions_count INTEGER NOT NULL,
        units_adopted_pct DECIMAL(5,2) NOT NULL,
        avg_sessions_per_student DECIMAL(5,2) NOT NULL,
        pretutor_exam_avg DECIMAL(5,2) NOT NULL,
        posttutor_exam_avg DECIMAL(5,2) NOT NULL,
        pretutor_assignment_avg DECIMAL(5,2) NOT NULL,
        posttutor_assignment_avg DECIMAL(5,2) NOT NULL,
        pass_percentage DECIMAL(5,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cohort_id) REFERENCES cohort_master(cohort_id)
      )
    `);

    // Mentor Cohort table
    await db.query(`
      CREATE TABLE IF NOT EXISTS mentor_cohort (
        id SERIAL PRIMARY KEY,
        cohort_id VARCHAR(50) NOT NULL,
        phase VARCHAR(20) NOT NULL,
        prementor_capstone_grade_avg DECIMAL(5,2) NOT NULL,
        postmentor_capstone_grade_avg DECIMAL(5,2) NOT NULL,
        grade_a_distribution_pct_pre DECIMAL(5,2) NOT NULL,
        grade_a_distribution_pct_post DECIMAL(5,2) NOT NULL,
        higher_degree_attempts INTEGER NOT NULL,
        higher_degree_admissions INTEGER NOT NULL,
        postmentor_exam_avg DECIMAL(5,2) NOT NULL,
        tier1_offers_share_pct DECIMAL(5,2) NOT NULL,
        avg_package_in_phase DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cohort_id) REFERENCES cohort_master(cohort_id)
      )
    `);

    // Create indexes for better performance
    await db.query(`CREATE INDEX IF NOT EXISTS idx_cohort_master_cohort_id ON cohort_master(cohort_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_cohort_master_phase ON cohort_master(phase)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_company_visits_cohort_id ON company_visits(cohort_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_placements_cohort_cohort_id ON placements_cohort(cohort_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_jpt_cohort_cohort_id ON jpt_cohort(cohort_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_tutor_sessions_cohort_id ON tutor_sessions(cohort_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_mentor_cohort_cohort_id ON mentor_cohort(cohort_id)`);

    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createTables };

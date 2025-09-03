const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const { authenticateToken, requireRole } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'), false);
    }
  }
});

// Helper function to parse CSV
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

// Helper function to parse Excel
const parseExcel = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
};

// Helper function to validate data against schema
const validateData = (data, tableName) => {
  const schemas = {
    cohort_master: ['cohort_id', 'year', 'program', 'batch_size', 'phase'],
    company_visits: ['cohort_id', 'phase', 'company_name', 'visit_date', 'role_title', 'role_family', 'tier', 'sector', 'geography', 'is_repeat_recruiter', 'openings_announced', 'applicants_attended', 'interview_slots', 'shortlisted', 'offers_issued', 'joined_count'],
    placements_cohort: ['cohort_id', 'phase', 'eligible', 'applied', 'shortlisted', 'offers', 'placed', 'avg_package', 'median_package', 'highest_package', 'tier1_offers', 'tier2_offers', 'startup_offers', 'psu_offers', 'tech_role_share_pct', 'finance_role_share_pct', 'consulting_role_share_pct', 'other_role_share_pct', 'avg_conversion_per_visit_pct', 'avg_openings_per_visit'],
    jpt_cohort: ['cohort_id', 'phase', 'total_jpt_sessions', 'avg_sessions_per_student', 'avg_ai_confidence', 'avg_ai_communication', 'avg_ai_technical', 'prejpt_conv_rate_per_opening_pct', 'postjpt_conv_rate_per_opening_pct', 'conversion_boost_per_opening_pct', 'tier1_offers_before', 'tier1_offers_after', 'avg_package_before', 'avg_package_after'],
    tutor_sessions: ['cohort_id', 'phase', 'unit_code', 'unit_name', 'session_id', 'session_type', 'created_week', 'assigned_count'],
    tutor_session_utilization: ['cohort_id', 'phase', 'session_id', 'week', 'started_count', 'completed_count', 'avg_trs', 'highest_trs'],
    tutor_weekly_summary: ['cohort_id', 'phase', 'week', 'sessions_created_this_week', 'overall_utilization_this_week_pct', 'units_with_sessions_count', 'units_adopted_pct', 'active_users_pct', 'avg_sessions_per_student'],
    tutor_cohort_summary: ['cohort_id', 'phase', 'active_users_pct', 'units_with_sessions_count', 'units_adopted_pct', 'avg_sessions_per_student', 'pretutor_exam_avg', 'posttutor_exam_avg', 'pretutor_assignment_avg', 'posttutor_assignment_avg', 'pass_percentage'],
    mentor_cohort: ['cohort_id', 'phase', 'prementor_capstone_grade_avg', 'postmentor_capstone_grade_avg', 'grade_a_distribution_pct_pre', 'grade_a_distribution_pct_post', 'higher_degree_attempts', 'higher_degree_admissions', 'postmentor_exam_avg', 'tier1_offers_share_pct', 'avg_package_in_phase']
  };

  const requiredColumns = schemas[tableName];
  if (!requiredColumns) {
    throw new Error(`Unknown table: ${tableName}`);
  }

  if (data.length === 0) {
    throw new Error('No data found in file');
  }

  const dataColumns = Object.keys(data[0]);
  const missingColumns = requiredColumns.filter(col => !dataColumns.includes(col));
  const extraColumns = dataColumns.filter(col => !requiredColumns.includes(col));

  return {
    valid: missingColumns.length === 0,
    missingColumns,
    extraColumns,
    dataColumns
  };
};

// Helper function to insert data into database
const insertData = async (data, tableName) => {
  if (data.length === 0) return { inserted: 0 };

  const columns = Object.keys(data[0]);
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const columnNames = columns.join(', ');

  const query = `
    INSERT INTO ${tableName} (${columnNames}) 
    VALUES (${placeholders})
    ON CONFLICT DO NOTHING
  `;

  let inserted = 0;
  for (const row of data) {
    try {
      const values = columns.map(col => {
        const value = row[col];
        // Handle different data types
        if (value === '' || value === null || value === undefined) {
          return null;
        }
        if (col.includes('date')) {
          return new Date(value);
        }
        if (col.includes('pct') || col.includes('avg') || col.includes('package')) {
          return parseFloat(value) || 0;
        }
        if (col.includes('count') || col.includes('sessions') || col.includes('offers') || col.includes('year')) {
          return parseInt(value) || 0;
        }
        if (col === 'is_repeat_recruiter') {
          return value === 'true' || value === '1' || value === 1;
        }
        return value;
      });

      const result = await db.query(query, values);
      if (result.rowCount > 0) {
        inserted++;
      }
    } catch (error) {
      console.error(`Error inserting row:`, error);
      // Continue with other rows
    }
  }

  return { inserted };
};

// Upload and process file
router.post('/:tableName', authenticateToken, requireRole(['admin', 'user']), upload.single('file'), async (req, res) => {
  try {
    const { tableName } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Parse file based on extension
    let data;
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (fileExt === '.csv') {
      data = await parseCSV(file.path);
    } else if (fileExt === '.xlsx' || fileExt === '.xls') {
      data = await parseExcel(file.path);
    } else {
      return res.status(400).json({ message: 'Unsupported file format' });
    }

    // Validate data
    const validation = validateData(data, tableName);
    
    if (!validation.valid) {
      return res.status(400).json({
        message: 'Data validation failed',
        missingColumns: validation.missingColumns,
        extraColumns: validation.extraColumns
      });
    }

    // Insert data into database
    const result = await insertData(data, tableName);

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    res.json({
      message: 'File uploaded and processed successfully',
      tableName,
      totalRows: data.length,
      insertedRows: result.inserted,
      skippedRows: data.length - result.inserted,
      warnings: validation.extraColumns.length > 0 ? 
        `Extra columns ignored: ${validation.extraColumns.join(', ')}` : null
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      message: 'Error processing file',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get available templates
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const templatesDir = path.join(__dirname, '../../templates');
    
    if (!fs.existsSync(templatesDir)) {
      return res.json({ templates: [] });
    }

    const files = fs.readdirSync(templatesDir);
    const templates = files
      .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'))
      .map(file => ({
        name: file,
        path: `/templates/${file}`,
        size: fs.statSync(path.join(templatesDir, file)).size,
        lastModified: fs.statSync(path.join(templatesDir, file)).mtime
      }));

    res.json({ templates });
  } catch (error) {
    console.error('Templates error:', error);
    res.status(500).json({ message: 'Error fetching templates' });
  }
});

// Download template
router.get('/templates/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const templatePath = path.join(__dirname, '../../templates', filename);
    
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.download(templatePath, filename);
  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({ message: 'Error downloading template' });
  }
});

// Get upload history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    // This would require an uploads_log table to track upload history
    // For now, return a simple response
    res.json({ 
      message: 'Upload history feature coming soon',
      uploads: [] 
    });
  } catch (error) {
    console.error('Upload history error:', error);
    res.status(500).json({ message: 'Error fetching upload history' });
  }
});

module.exports = router;

/**
 * Aegis HR - Strategic Workforce Analytics Dashboard
 * Data Management & Mock Data Generator Module
 */

const DEPARTMENTS = ['Sales', 'R&D', 'Tech/AI', 'HR', 'Customer Service'];

// Default revenues for each department in USD (Annual)
const DEFAULT_DEPT_REVENUE = {
  'Sales': 12000000,       // $12M
  'Tech/AI': 10000000,     // $10M
  'R&D': 7000000,          // $7M
  'Customer Service': 4000000, // $4M
  'HR': 1500000            // $1.5M
};

// Target percentages for Digital Transformation per department
// (AI/Data & Digital Literacy skill requirements)
const DIGITAL_TRANSFORMATION_TARGETS = {
  'Sales': { 'AI/Data': 35, 'Digital Literacy': 80 },
  'R&D': { 'AI/Data': 80, 'Digital Literacy': 95 },
  'Tech/AI': { 'AI/Data': 95, 'Digital Literacy': 100 },
  'HR': { 'AI/Data': 25, 'Digital Literacy': 75 },
  'Customer Service': { 'AI/Data': 20, 'Digital Literacy': 85 }
};

/**
 * Generates realistic employee data based on demographic rules.
 * @param {number} count Number of employees to generate
 * @returns {Array<Object>} List of employee objects
 */
function generateMockEmployeeData(count = 250) {
  const employees = [];
  
  for (let i = 1; i <= count; i++) {
    // Determine Department first
    const randDept = Math.random();
    let dept = 'Sales';
    if (randDept < 0.28) dept = 'Sales';
    else if (randDept < 0.50) dept = 'Tech/AI';
    else if (randDept < 0.72) dept = 'R&D';
    else if (randDept < 0.88) dept = 'Customer Service';
    else dept = 'HR';

    const empId = `EMP-${String(i).padStart(4, '0')}`;
    
    // Performance Score probabilities based on department
    const randPerf = Math.random();
    let perf = 'Good';
    if (dept === 'Tech/AI' || dept === 'R&D') {
      if (randPerf < 0.25) perf = 'Excellent';
      else if (randPerf < 0.70) perf = 'Good';
      else if (randPerf < 0.90) perf = 'Average';
      else perf = 'Poor';
    } else {
      if (randPerf < 0.12) perf = 'Excellent';
      else if (randPerf < 0.65) perf = 'Good';
      else if (randPerf < 0.90) perf = 'Average';
      else perf = 'Poor';
    }

    // Status: Active or Resigned (around 15-18% resigned to have turnover history)
    const status = Math.random() < 0.16 ? 'Resigned' : 'Active';

    // Age distribution: 21 to 60. R&D and Tech tend to be younger, HR and Customer Service mixed.
    let age = 22 + Math.floor(Math.random() * 38);
    if (dept === 'Tech/AI') {
      age = 22 + Math.floor(Math.random() * 18); // Tech/AI is younger (22 - 40)
    } else if (dept === 'R&D') {
      age = 25 + Math.floor(Math.random() * 25); // R&D (25 - 50)
    }

    // Tenure in Months: must be logical relative to age. Maximum age - 20 * 12
    const maxTenure = Math.min((age - 20) * 12, 120);
    const tenureMonths = Math.max(1, Math.floor(Math.random() * maxTenure));

    // Core Skills based on department and random chance
    let skill = 'Traditional Skills';
    const randSkill = Math.random();
    if (dept === 'Tech/AI') {
      skill = randSkill < 0.75 ? 'AI/Data' : 'Digital Literacy';
    } else if (dept === 'R&D') {
      skill = randSkill < 0.50 ? 'AI/Data' : (randSkill < 0.90 ? 'Digital Literacy' : 'Traditional Skills');
    } else if (dept === 'Sales') {
      skill = randSkill < 0.20 ? 'AI/Data' : (randSkill < 0.70 ? 'Digital Literacy' : 'Traditional Skills');
    } else {
      skill = randSkill < 0.10 ? 'AI/Data' : (randSkill < 0.60 ? 'Digital Literacy' : 'Traditional Skills');
    }

    // Promoted in last 12 months: Mostly for active employees with Good/Excellent performance
    let promoted = 'No';
    if (status === 'Active' && (perf === 'Excellent' || perf === 'Good')) {
      // average 8% promotion rate
      promoted = Math.random() < 0.08 ? 'Yes' : 'No';
    } else if (status === 'Resigned') {
      // Resigned employees rarely got promoted before resigning
      promoted = Math.random() < 0.02 ? 'Yes' : 'No';
    }

    employees.push({
      Employee_ID: empId,
      Department: dept,
      Age: age,
      Tenure_Months: tenureMonths,
      Status: status,
      Performance_Score: perf,
      Core_Skills: skill,
      Promoted_Last_12M: promoted,
      Department_Revenue: DEFAULT_DEPT_REVENUE[dept]
    });
  }

  return employees;
}

/**
 * Converts array of employee objects to CSV string
 * @param {Array<Object>} data 
 * @returns {string} CSV format
 */
function convertToCSV(data) {
  if (!data || !data.length) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Escape commas in strings if any
      const escaped = ('' + val).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Parses CSV string back into array of employee objects
 * @param {string} csvText 
 * @returns {Array<Object>} parsed data
 */
function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length !== headers.length) continue;

    const obj = {};
    headers.forEach((header, index) => {
      let val = cols[index];
      
      // Parse data types correctly
      if (header === 'Age' || header === 'Tenure_Months' || header === 'Department_Revenue') {
        val = Number(val);
      }
      obj[header] = val;
    });
    data.push(obj);
  }

  return data;
}

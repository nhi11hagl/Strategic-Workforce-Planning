/**
 * Aegis HR - Strategic Workforce Analytics Dashboard
 * Main Application Logic & Computations
 */

// Global State
let allEmployees = [];
let filteredEmployees = [];
let charts = {};

// Simulation configuration
let simSettings = {
  scenario: 'base',      // 'optimistic', 'base', 'pessimistic'
  aiImpact: 10,          // 0% to 50%
  avgSalaryTraditional: 40000 // Average annual salary for estimation in USD
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  // Generate initial mock data
  allEmployees = generateMockEmployeeData(300);
  filteredEmployees = [...allEmployees];
  
  // Set up event listeners
  setupEventListeners();
  
  // Perform initial calculations & render UI
  updateDashboard();
});

// Setup DOM Event Listeners
function setupEventListeners() {
  // Navigation Tabs
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Filters
  document.getElementById('filter-dept').addEventListener('change', filterData);
  document.getElementById('filter-perf').addEventListener('change', filterData);
  document.getElementById('filter-skill').addEventListener('change', filterData);

  // Simulation Controls
  const scenarioBtns = document.querySelectorAll('.scenario-btn');
  scenarioBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      scenarioBtns.forEach(b => b.classList.remove('active', 'bg-indigo-600', 'text-white'));
      btn.classList.add('active', 'bg-indigo-600', 'text-white');
      simSettings.scenario = btn.getAttribute('data-scenario');
      runStrategicSimulation();
    });
  });

  const aiSlider = document.getElementById('ai-slider');
  const aiValDisplay = document.getElementById('ai-slider-value');
  aiSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    aiValDisplay.textContent = `${val}%`;
    simSettings.aiImpact = val;
    runStrategicSimulation();
  });

  // Action Buttons
  document.getElementById('btn-regenerate').addEventListener('click', () => {
    allEmployees = generateMockEmployeeData(300);
    filterData();
    // Show a small notification toast or alert
    showToast('Tái tạo dữ liệu ngẫu nhiên thành công!', 'success');
  });

  document.getElementById('btn-export-csv').addEventListener('click', exportDataToCSV);
  document.getElementById('btn-import-csv').addEventListener('click', () => {
    document.getElementById('csv-file-input').click();
  });
  document.getElementById('csv-file-input').addEventListener('change', importDataFromCSV);
}

// Switch Navigation Tab
function switchTab(tabId) {
  // Update nav buttons
  const buttons = document.querySelectorAll('.nav-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('bg-indigo-600/25', 'text-indigo-400', 'border-indigo-500/50');
      btn.classList.remove('text-slate-400', 'border-transparent');
    } else {
      btn.classList.remove('bg-indigo-600/25', 'text-indigo-400', 'border-indigo-500/50');
      btn.classList.add('text-slate-400', 'border-transparent');
    }
  });

  // Update tab sections
  const sections = document.querySelectorAll('.tab-content');
  sections.forEach(sec => {
    if (sec.id === `tab-${tabId}`) {
      sec.classList.remove('hidden');
    } else {
      sec.classList.add('hidden');
    }
  });

  // Specific tab render updates to refresh canvas sizes
  if (tabId === 'overview') {
    renderOverviewCharts();
  } else if (tabId === 'analytics') {
    renderAnalyticsCharts();
  } else if (tabId === 'simulator') {
    runStrategicSimulation();
  } else if (tabId === 'explorer') {
    renderEmployeeExplorer();
  }
}

// Filter the master employee list based on UI controls
function filterData() {
  const dept = document.getElementById('filter-dept').value;
  const perf = document.getElementById('filter-perf').value;
  const skill = document.getElementById('filter-skill').value;

  filteredEmployees = allEmployees.filter(emp => {
    const matchDept = dept === 'all' || emp.Department === dept;
    const matchPerf = perf === 'all' || emp.Performance_Score === perf;
    const matchSkill = skill === 'all' || emp.Core_Skills === skill;
    return matchDept && matchPerf && matchSkill;
  });

  updateDashboard();
}

// Update the entire dashboard metrics and visible tab
function updateDashboard() {
  // 1. Calculate General KPIs
  calculateGeneralKPIs();

  // 2. Render Active Tab Content
  const activeBtn = document.querySelector('.nav-btn.bg-indigo-600\\/25');
  const activeTab = activeBtn ? activeBtn.getAttribute('data-tab') : 'overview';
  switchTab(activeTab);
}

// Helper toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg z-50 text-white font-medium glass-card transform translate-y-10 opacity-0 transition-all duration-300 ${
    type === 'success' ? 'border-emerald-500 bg-emerald-950/80' : 
    type === 'error' ? 'border-rose-500 bg-rose-950/80' : 'border-indigo-500 bg-indigo-950/80'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-y-10', 'opacity-0');
  }, 10);

  // Animate out and remove
  setTimeout(() => {
    toast.classList.add('translate-y-10', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ==========================================================================
   LOGIC PHÂN HỆ 1: BÁO CÁO QUÁ KHỨ & HIỆN TẠI (HR REPORTING)
   ========================================================================== */

function calculateGeneralKPIs() {
  const activeEmployees = allEmployees.filter(e => e.Status === 'Active');
  const resignedEmployees = allEmployees.filter(e => e.Status === 'Resigned');

  // KPI 1: Tổng nhân sự (Active Headcount)
  const totalActive = activeEmployees.length;
  document.getElementById('kpi-total-headcount').textContent = totalActive.toLocaleString();

  // KPI 2: Tuổi trung bình (Active only)
  const avgAge = totalActive > 0 
    ? activeEmployees.reduce((sum, e) => sum + e.Age, 0) / totalActive 
    : 0;
  document.getElementById('kpi-avg-age').textContent = `${avgAge.toFixed(1)} tuổi`;
  
  // Đánh giá già hóa
  const ageWarning = document.getElementById('kpi-age-warning');
  if (avgAge > 40) {
    ageWarning.innerHTML = `<span class="text-rose-400 text-xs font-semibold flex items-center gap-1"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Lực lượng lao động đang già hóa</span>`;
  } else {
    ageWarning.innerHTML = `<span class="text-emerald-400 text-xs font-semibold">Lực lượng lao động trẻ, năng động</span>`;
  }

  // KPI 3: Thâm niên trung bình (Active only)
  const avgTenure = totalActive > 0 
    ? activeEmployees.reduce((sum, e) => sum + e.Tenure_Months, 0) / totalActive 
    : 0;
  document.getElementById('kpi-avg-tenure').textContent = `${avgTenure.toFixed(1)} tháng`;

  // KPI 4: Tỷ lệ nghỉ việc chung (Turnover Rate)
  // Công thức: Số người nghỉ / Tổng nhân sự bình quân (Active + Resigned)
  const totalCount = allEmployees.length;
  const turnoverRate = totalCount > 0 
    ? (resignedEmployees.length / totalCount) * 100 
    : 0;
  
  const kpiTurnover = document.getElementById('kpi-turnover-rate');
  kpiTurnover.textContent = `${turnoverRate.toFixed(1)}%`;
  
  // Đánh giá tỷ lệ nghỉ việc chung
  const turnoverWarning = document.getElementById('kpi-turnover-warning');
  if (turnoverRate > 15) {
    kpiTurnover.className = 'text-3xl font-extrabold text-rose-500 text-glow-rose';
    turnoverWarning.innerHTML = `<span class="text-rose-400 text-xs font-semibold">Tỷ lệ nghỉ việc ở mức báo động đỏ</span>`;
  } else if (turnoverRate > 8) {
    kpiTurnover.className = 'text-3xl font-extrabold text-amber-400 text-glow-amber';
    turnoverWarning.innerHTML = `<span class="text-amber-400 text-xs font-semibold">Tỷ lệ nghỉ việc trung bình</span>`;
  } else {
    kpiTurnover.className = 'text-3xl font-extrabold text-emerald-400 text-glow-emerald';
    turnoverWarning.innerHTML = `<span class="text-emerald-400 text-xs font-semibold">Tỷ lệ nghỉ việc lý tưởng</span>`;
  }
}

// Render Overview charts (Age Pyramid & Tenure by Dept)
function renderOverviewCharts() {
  const activeEmployees = filteredEmployees.filter(e => e.Status === 'Active');

  // Destory existing charts to prevent memory leaks / double rendering
  if (charts.ageChart) charts.ageChart.destroy();
  if (charts.tenureChart) charts.tenureChart.destroy();

  // --- Biểu đồ Cơ cấu độ tuổi (Tháp tuổi phát hiện già hóa) ---
  const ageBuckets = { '< 25': 0, '25 - 34': 0, '35 - 44': 0, '45 - 54': 0, '55+': 0 };
  activeEmployees.forEach(e => {
    if (e.Age < 25) ageBuckets['< 25']++;
    else if (e.Age < 35) ageBuckets['25 - 34']++;
    else if (e.Age < 45) ageBuckets['35 - 44']++;
    else if (e.Age < 55) ageBuckets['45 - 54']++;
    else ageBuckets['55+']++;
  });

  const ctxAge = document.getElementById('chart-age-pyramid').getContext('2d');
  charts.ageChart = new Chart(ctxAge, {
    type: 'bar',
    data: {
      labels: Object.keys(ageBuckets),
      datasets: [{
        label: 'Số lượng nhân sự',
        data: Object.values(ageBuckets),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderColor: '#6366f1',
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(99, 102, 241, 0.9)',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Outfit' },
          bodyFont: { family: 'Plus Jakarta Sans' },
          borderColor: 'rgba(99, 102, 241, 0.3)',
          borderWidth: 1
        }
      },
      scales: {
        x: { 
          grid: { display: false },
          ticks: { color: '#94a3b8' } 
        },
        y: { 
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', stepSize: 5 } 
        }
      }
    }
  });

  // --- Biểu đồ Cơ cấu thâm niên theo từng phòng ban ---
  // Tính thâm niên trung bình của nhân sự active theo từng phòng ban
  const deptTenures = {};
  DEPARTMENTS.forEach(d => { deptTenures[d] = { sum: 0, count: 0 }; });

  activeEmployees.forEach(e => {
    if (deptTenures[e.Department]) {
      deptTenures[e.Department].sum += e.Tenure_Months;
      deptTenures[e.Department].count++;
    }
  });

  const avgTenuresByDept = DEPARTMENTS.map(d => {
    const data = deptTenures[d];
    return data.count > 0 ? parseFloat((data.sum / data.count).toFixed(1)) : 0;
  });

  const ctxTenure = document.getElementById('chart-tenure-dept').getContext('2d');
  charts.tenureChart = new Chart(ctxTenure, {
    type: 'bar',
    data: {
      labels: DEPARTMENTS,
      datasets: [{
        label: 'Thâm niên trung bình (tháng)',
        data: avgTenuresByDept,
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: '#10b981',
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(16, 185, 129, 0.9)',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Outfit' },
          bodyFont: { family: 'Plus Jakarta Sans' },
          borderColor: 'rgba(16, 185, 129, 0.3)',
          borderWidth: 1
        }
      },
      scales: {
        x: { 
          grid: { display: false },
          ticks: { color: '#94a3b8' } 
        },
        y: { 
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8' } 
        }
      }
    }
  });
}


/* ==========================================================================
   LOGIC PHÂN HỆ 2: PHÂN TÍCH GỐC RỄ & RỦI RO CHIẾN LƯỢC (DEEP ANALYTICS)
   ========================================================================== */

function renderAnalyticsCharts() {
  if (charts.attritionChart) charts.attritionChart.destroy();
  if (charts.skillsGapChart) charts.skillsGapChart.destroy();

  // --- 1. LOGIC XỬ LÝ HAO HỤT NHÂN SỰ CHIẾN LƯỢC (ATTRITION ANALYTICS) ---
  
  // A. Hao hụt có hại (Dysfunctional Turnover Rate)
  // Tiêu chí: Performance_Score == 'Excellent' HOẶC Core_Skills == 'AI/Data'
  const dysfunctionalPool = filteredEmployees.filter(e => 
    e.Performance_Score === 'Excellent' || e.Core_Skills === 'AI/Data'
  );
  const dysfunctionalResigned = dysfunctionalPool.filter(e => e.Status === 'Resigned');
  const dysfunctionalRate = dysfunctionalPool.length > 0 
    ? (dysfunctionalResigned.length / dysfunctionalPool.length) * 100 
    : 0;

  // B. Hao hụt có lợi (Functional Turnover Rate)
  // Tiêu chí: Performance_Score == 'Poor'
  const functionalPool = filteredEmployees.filter(e => 
    e.Performance_Score === 'Poor'
  );
  const functionalResigned = functionalPool.filter(e => e.Status === 'Resigned');
  const functionalRate = functionalPool.length > 0 
    ? (functionalResigned.length / functionalPool.length) * 100 
    : 0;

  // Cập nhật UI & Cảnh báo hao hụt có hại
  const dysVal = document.getElementById('dysfunctional-turnover-val');
  const dysAlert = document.getElementById('dysfunctional-alert-box');
  
  dysVal.textContent = `${dysfunctionalRate.toFixed(1)}%`;
  
  if (dysfunctionalRate > 10) {
    dysVal.className = 'text-4xl font-extrabold text-rose-500 text-glow-rose';
    dysAlert.innerHTML = `
      <div class="danger-alert border-l-4 border-rose-500 p-4 rounded-r-lg flex items-start gap-3 animate-pulse-slow">
        <i class="fa-solid fa-triangle-exclamation text-rose-400 mt-1 flex-shrink-0"></i>
        <div>
          <h4 class="text-rose-400 font-bold text-sm">CẢNH BÁO RỦI RO NGHIÊM TRỌNG!</h4>
          <p class="text-rose-200 text-xs mt-1">Rủi ro chảy máu chất xám nhân tài cốt lõi. Tỷ lệ hao hụt nhân sự quan trọng vượt quá ngưỡng an toàn (>10%). Cần lập tức rà soát chính sách giữ chân nhân tài nhóm R&D, Tech/AI và nhân viên xuất sắc.</p>
        </div>
      </div>`;
  } else {
    dysVal.className = 'text-4xl font-extrabold text-indigo-400 text-glow-indigo';
    dysAlert.innerHTML = `
      <div class="success-alert border-l-4 border-indigo-500 p-4 rounded-r-lg flex items-start gap-3">
        <i class="fa-solid fa-circle-check text-indigo-400 mt-1 flex-shrink-0"></i>
        <div>
          <h4 class="text-indigo-400 font-bold text-sm">Hao hụt cốt lõi nằm trong tầm kiểm soát</h4>
          <p class="text-indigo-200 text-xs mt-1">Tỷ lệ mất nhân tài công nghệ/hiệu suất xuất sắc ở mức an toàn. Tiếp tục duy trì môi trường làm việc cạnh tranh.</p>
        </div>
      </div>`;
  }

  // Cập nhật UI & Chú thích hao hụt có lợi
  const funcVal = document.getElementById('functional-turnover-val');
  const funcAlert = document.getElementById('functional-alert-box');
  
  funcVal.textContent = `${functionalRate.toFixed(1)}%`;
  funcVal.className = 'text-4xl font-extrabold text-emerald-400 text-glow-emerald';
  funcAlert.innerHTML = `
    <div class="success-alert border-l-4 border-emerald-500 p-4 rounded-r-lg flex items-start gap-3">
      <i class="fa-solid fa-circle-check text-emerald-400 mt-1 flex-shrink-0"></i>
      <div>
        <h4 class="text-emerald-400 font-bold text-sm">Hao hụt có lợi hoạt động ổn định</h4>
        <p class="text-emerald-200 text-xs mt-1">Biến động lành mạnh giúp tối ưu hóa tổ chức. Sự dịch chuyển tự nhiên của nhóm hiệu suất kém giúp giảm tải chi phí vận hành và mở ra cơ hội tuyển dụng những nhân sự chất lượng hơn.</p>
      </div>
    </div>`;

  // Render Biểu đồ tròn so sánh Hao hụt
  const ctxAttr = document.getElementById('chart-attrition-types').getContext('2d');
  charts.attritionChart = new Chart(ctxAttr, {
    type: 'doughnut',
    data: {
      labels: ['Hao hụt có hại (Dysfunctional)', 'Hao hụt có lợi (Functional)', 'Nhân sự Active hiện tại'],
      datasets: [{
        data: [
          dysfunctionalResigned.length,
          functionalResigned.length,
          filteredEmployees.filter(e => e.Status === 'Active').length
        ],
        backgroundColor: ['rgba(244, 63, 94, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(99, 102, 241, 0.5)'],
        borderColor: ['#f43f5e', '#10b981', '#6366f1'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: 'bottom',
          labels: { color: '#e2e8f0', font: { family: 'Plus Jakarta Sans', size: 11 } }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Outfit' },
          bodyFont: { family: 'Plus Jakarta Sans' }
        }
      }
    }
  });

  // --- 2. LOGIC CẢNH BÁO TẮC NGHẼN THĂNG TIẾN (INTERNAL MOBILITY RISK) ---
  // Tìm phòng ban có tỷ lệ thăng chức < 5% nhưng tỷ lệ nghỉ việc của nhân viên thâm niên ngắn (<=18 tháng) > 20%
  const mobilityRiskContainer = document.getElementById('mobility-risk-alerts');
  mobilityRiskContainer.innerHTML = '';
  let activeMobilityRisks = 0;

  DEPARTMENTS.forEach(dept => {
    const deptEmployees = filteredEmployees.filter(e => e.Department === dept);
    const deptActive = deptEmployees.filter(e => e.Status === 'Active');
    
    // Tỷ lệ thăng chức trong 12 tháng qua (chỉ tính trên những nhân sự Active)
    const promotedActiveCount = deptActive.filter(e => e.Promoted_Last_12M === 'Yes').length;
    const promotionRate = deptActive.length > 0 ? (promotedActiveCount / deptActive.length) * 100 : 0;

    // Tỷ lệ nghỉ việc của nhân viên thâm niên ngắn (<= 18 tháng)
    const shortTenureEmployees = deptEmployees.filter(e => e.Tenure_Months <= 18);
    const shortTenureResigned = shortTenureEmployees.filter(e => e.Status === 'Resigned');
    const shortTenureTurnover = shortTenureEmployees.length > 0
      ? (shortTenureResigned.length / shortTenureEmployees.length) * 100
      : 0;

    // Đánh giá rủi ro
    if (promotionRate < 5 && shortTenureTurnover > 20) {
      activeMobilityRisks++;
      const alertDiv = document.createElement('div');
      alertDiv.className = 'danger-alert border border-rose-500/30 rounded-xl p-4 animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4';
      alertDiv.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="bg-rose-500/20 p-2 rounded-lg text-rose-400 mt-0.5">
            <i class="fa-solid fa-arrow-trend-down w-5 h-5"></i>
          </div>
          <div>
            <h4 class="font-bold text-slate-100 font-title text-base">Phòng ban: ${dept}</h4>
            <p class="text-rose-300 text-xs mt-1 font-semibold">Nguy cơ chảy máu chất xám do thiếu lộ trình phát triển.</p>
            <p class="text-slate-400 text-xs mt-1">Sự kết hợp giữa cơ hội thăng tiến thấp và tỷ lệ nghỉ việc của nhân viên mới gia tăng là dấu hiệu của việc thiếu lộ trình thăng tiến rõ ràng.</p>
          </div>
        </div>
        <div class="flex items-center gap-6 self-end md:self-auto">
          <div class="text-right">
            <span class="text-slate-400 text-xxs block uppercase font-bold tracking-wider">Tỷ lệ thăng chức</span>
            <span class="text-rose-400 font-extrabold text-sm">${promotionRate.toFixed(1)}% <span class="text-slate-500 font-normal">(<5%)</span></span>
          </div>
          <div class="text-right border-l border-slate-800 pl-6">
            <span class="text-slate-400 text-xxs block uppercase font-bold tracking-wider">Turnover thâm niên <18M</span>
            <span class="text-rose-400 font-extrabold text-sm">${shortTenureTurnover.toFixed(1)}% <span class="text-slate-500 font-normal">(>20%)</span></span>
          </div>
        </div>
      `;
      mobilityRiskContainer.appendChild(alertDiv);
    }
  });

  if (activeMobilityRisks === 0) {
    mobilityRiskContainer.innerHTML = `
      <div class="success-alert border border-emerald-500/20 rounded-xl p-6 text-center animate-fade-in">
        <i class="fa-solid fa-shield-halved text-emerald-400 text-2xl mx-auto mb-2 block"></i>
        <h4 class="font-bold text-slate-100 font-title">Không phát hiện rủi ro thăng tiến thắt nút cổ chai</h4>
        <p class="text-slate-400 text-xs mt-1">Tất cả các phòng ban đều có tỷ lệ thăng chức và tỷ lệ giữ chân nhân sự thâm niên ngắn ổn định.</p>
      </div>`;
  }

  // --- 3. MA TRẬN KHOẢNG CÁCH KỸ NĂNG (SKILLS GAP MATRIX) ---
  // Tính tỷ lệ kỹ năng và so sánh với mục tiêu số hóa
  const activeEmployees = filteredEmployees.filter(e => e.Status === 'Active');
  
  const skillGaps = DEPARTMENTS.map(dept => {
    const deptActive = activeEmployees.filter(e => e.Department === dept);
    const totalDept = deptActive.length;

    // AI/Data skill calculations
    const aiDataCount = deptActive.filter(e => e.Core_Skills === 'AI/Data').length;
    const aiCurrentPct = totalDept > 0 ? (aiDataCount / totalDept) * 100 : 0;
    const aiTarget = DIGITAL_TRANSFORMATION_TARGETS[dept]['AI/Data'];
    const aiGap = Math.max(0, aiTarget - aiCurrentPct);

    // Digital Literacy calculations
    const dlCount = deptActive.filter(e => e.Core_Skills === 'Digital Literacy').length;
    const dlCurrentPct = totalDept > 0 ? (dlCount / totalDept) * 100 : 0;
    const dlTarget = DIGITAL_TRANSFORMATION_TARGETS[dept]['Digital Literacy'];
    const dlGap = Math.max(0, dlTarget - dlCurrentPct);

    return {
      department: dept,
      aiCurrent: parseFloat(aiCurrentPct.toFixed(1)),
      aiTarget: aiTarget,
      aiGap: parseFloat(aiGap.toFixed(1)),
      dlCurrent: parseFloat(dlCurrentPct.toFixed(1)),
      dlTarget: dlTarget,
      dlGap: parseFloat(dlGap.toFixed(1))
    };
  });

  // Render Skills Gap Matrix Table UI
  const gapTableBody = document.getElementById('skills-gap-table-body');
  gapTableBody.innerHTML = '';
  
  skillGaps.forEach(gap => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-800 hover:bg-slate-900/40 transition-colors';
    
    // Style helper for Gaps
    const aiGapStyle = gap.aiGap > 20 ? 'text-rose-400 font-bold' : (gap.aiGap > 5 ? 'text-amber-400 font-bold' : 'text-emerald-400');
    const dlGapStyle = gap.dlGap > 20 ? 'text-rose-400 font-bold' : (gap.dlGap > 5 ? 'text-amber-400 font-bold' : 'text-emerald-400');

    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-200">${gap.department}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
        <div class="flex items-center justify-between gap-4">
          <span>${gap.aiCurrent}% <span class="text-slate-500 text-xs">/ ${gap.aiTarget}%</span></span>
          <div class="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div class="bg-indigo-500 h-1.5 rounded-full" style="width: ${gap.aiCurrent}%"></div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm ${aiGapStyle}">${gap.aiGap > 0 ? `-${gap.aiGap}%` : 'Đạt mục tiêu 🎉'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
        <div class="flex items-center justify-between gap-4">
          <span>${gap.dlCurrent}% <span class="text-slate-500 text-xs">/ ${gap.dlTarget}%</span></span>
          <div class="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${gap.dlCurrent}%"></div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm ${dlGapStyle}">${gap.dlGap > 0 ? `-${gap.dlGap}%` : 'Đạt mục tiêu 🎉'}</td>
    `;
    gapTableBody.appendChild(tr);
  });

  // Render Skills Gap Comparison Chart (Grouped Bar Chart)
  const ctxSkills = document.getElementById('chart-skills-gap').getContext('2d');
  charts.skillsGapChart = new Chart(ctxSkills, {
    type: 'bar',
    data: {
      labels: DEPARTMENTS,
      datasets: [
        {
          label: 'Hiện tại - AI/Data',
          data: skillGaps.map(g => g.aiCurrent),
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: '#6366f1',
          borderWidth: 1
        },
        {
          label: 'Mục tiêu - AI/Data',
          data: skillGaps.map(g => g.aiTarget),
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: 'rgba(99, 102, 241, 0.5)',
          borderWidth: 1,
          borderDash: [5, 5]
        },
        {
          label: 'Hiện tại - Digital Literacy',
          data: skillGaps.map(g => g.dlCurrent),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: '#10b981',
          borderWidth: 1
        },
        {
          label: 'Mục tiêu - Digital Literacy',
          data: skillGaps.map(g => g.dlTarget),
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgba(16, 185, 129, 0.5)',
          borderWidth: 1,
          borderDash: [5, 5]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: 'bottom',
          labels: { color: '#e2e8f0', font: { family: 'Plus Jakarta Sans', size: 10 } }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Outfit' },
          bodyFont: { family: 'Plus Jakarta Sans' }
        }
      },
      scales: {
        x: { ticks: { color: '#94a3b8' } },
        y: { 
          min: 0, 
          max: 100, 
          ticks: { color: '#94a3b8', callback: (v) => `${v}%` },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        }
      }
    }
  });
}


/* ==========================================================================
   LOGIC PHÂN HỆ 3: MÔ PHỎNG & DỰ BÁO TƯƠNG LAI (SWP)
   ========================================================================== */

function runStrategicSimulation() {
  const activeEmployees = allEmployees.filter(e => e.Status === 'Active');
  
  if (charts.workforceForecastChart) charts.workforceForecastChart.destroy();

  // 1. Xác định kịch bản Doanh thu & Tỷ lệ chuẩn (Ratio Analysis)
  let revenueChangeLabel = "+10% (Cơ sở)";
  let revenueMultiplier = 1.1;

  if (simSettings.scenario === 'optimistic') {
    revenueMultiplier = 1.3;
    revenueChangeLabel = "+30% (Lạc quan)";
  } else if (simSettings.scenario === 'pessimistic') {
    revenueMultiplier = 0.9;
    revenueChangeLabel = "-10% (Khó khăn)";
  }

  // Tỷ lệ chuẩn trung bình: 5 nhân sự cho mỗi 1 tỷ VNĐ doanh thu tăng thêm (ở đây giả định là quy đổi tỷ lệ trực tiếp từ doanh thu USD).
  // Hệ số doanh thu quy đổi: $1,000,000 doanh thu thì cần khoảng bao nhiêu nhân sự.
  // Tính tỷ lệ trung bình hiện tại: Tổng Active / Tổng Doanh thu hiện tại
  const totalCurrentRevenue = Object.values(DEFAULT_DEPT_REVENUE).reduce((sum, r) => sum + r, 0);
  const globalRatio = activeEmployees.length / (totalCurrentRevenue / 100000); // số nhân sự trên mỗi $100k doanh thu

  // Cập nhật nhãn kịch bản trên UI
  document.getElementById('sim-current-scenario').textContent = simSettings.scenario.toUpperCase();
  document.getElementById('sim-scenario-desc').textContent = `Mô phỏng doanh thu tăng/giảm ${revenueChangeLabel}. AI & Tự động hóa đạt ${simSettings.aiImpact}%.`;

  // 2. Dự báo nhu cầu nhân sự tương lai theo phòng ban & Kỹ năng
  const forecastResults = [];
  let totalCurrentActive = 0;
  let totalFutureDemand = 0;
  let totalSavings = 0;

  DEPARTMENTS.forEach(dept => {
    const deptActive = activeEmployees.filter(e => e.Department === dept);
    const deptRevenueCurrent = DEFAULT_DEPT_REVENUE[dept];
    const deptRevenueFuture = deptRevenueCurrent * revenueMultiplier;

    // Chi tiết nhân sự hiện tại theo kỹ năng
    const tradActive = deptActive.filter(e => e.Core_Skills === 'Traditional Skills').length;
    const aiActive = deptActive.filter(e => e.Core_Skills === 'AI/Data').length;
    const digitalActive = deptActive.filter(e => e.Core_Skills === 'Digital Literacy').length;
    
    // Tỷ lệ nhân sự hiện tại trên doanh thu của phòng ban
    // Ratio Analysis: Future Demand = (Dept Active) * Revenue Multiplier
    // Áp dụng Tác động Công nghệ & AI (AI Effect)
    // - Khấu trừ X% nhu cầu nhân sự thuộc nhóm Traditional Skills
    // - Tăng 5% nhu cầu nhân sự thuộc nhóm AI/Data (cho mỗi 10% tự động hóa, tức là tăng 0.5% * X)
    const aiReductionFactor = simSettings.aiImpact / 100;
    const aiIncreaseFactor = (simSettings.aiImpact / 10) * 0.05; // 5% tăng cho mỗi 10% AI slider

    const tradDemand = Math.round((tradActive * revenueMultiplier) * (1 - aiReductionFactor));
    const aiDemand = Math.round((aiActive * revenueMultiplier) * (1 + aiIncreaseFactor));
    const digitalDemand = Math.round(digitalActive * revenueMultiplier);

    const currentHeadcount = deptActive.length;
    const futureDemandHeadcount = tradDemand + aiDemand + digitalDemand;
    const gap = futureDemandHeadcount - currentHeadcount;

    // Tính toán tiết kiệm ngân sách từ cắt giảm Traditional Skills
    // Số nhân sự Traditional bị cắt giảm do tự động hóa
    const tradBaseDemand = tradActive * revenueMultiplier;
    const tradCutCount = Math.max(0, tradBaseDemand - tradDemand);
    const budgetSavings = tradCutCount * simSettings.avgSalaryTraditional;

    totalCurrentActive += currentHeadcount;
    totalFutureDemand += futureDemandHeadcount;
    totalSavings += budgetSavings;

    forecastResults.push({
      department: dept,
      current: currentHeadcount,
      future: futureDemandHeadcount,
      gap: gap,
      tradCurrent: tradActive,
      tradFuture: tradDemand,
      aiCurrent: aiActive,
      aiFuture: aiDemand,
      digCurrent: digitalActive,
      digFuture: digitalDemand,
      savings: budgetSavings
    });
  });

  // Hiển thị KPI Mô phỏng
  document.getElementById('sim-current-headcount').textContent = totalCurrentActive.toLocaleString();
  document.getElementById('sim-future-demand').textContent = totalFutureDemand.toLocaleString();
  
  const gapVal = totalFutureDemand - totalCurrentActive;
  const gapElement = document.getElementById('sim-gap-value');
  const gapStatusElement = document.getElementById('sim-gap-status');
  
  gapElement.textContent = (gapVal > 0 ? `+${gapVal}` : gapVal).toLocaleString();
  
  if (gapVal > 0) {
    gapElement.className = 'text-3xl font-extrabold text-rose-500 text-glow-rose';
    gapStatusElement.innerHTML = `
      <div class="danger-alert border border-rose-500/30 p-3 rounded-lg text-xs mt-2 text-rose-300">
        <i class="fa-solid fa-triangle-exclamation inline-block mr-1 align-text-bottom"></i>
        <strong>Thiếu hụt nhân sự!</strong> Đề xuất tuyển dụng thêm ${gapVal} vị trí mới hoặc bổ sung nguồn lực thuê ngoài.
      </div>`;
  } else if (gapVal < 0) {
    gapElement.className = 'text-3xl font-extrabold text-amber-400 text-glow-amber';
    gapStatusElement.innerHTML = `
      <div class="warning-alert border border-amber-500/30 p-3 rounded-lg text-xs mt-2 text-amber-300">
        <i class="fa-solid fa-circle-info inline-block mr-1 align-text-bottom"></i>
        <strong>Dư thừa nhân sự cơ học!</strong> Thặng dư ${Math.abs(gapVal)} Headcount. Đề xuất chiến lược đào tạo lại (Reskill) thay vì sa thải hàng loạt.
      </div>`;
  } else {
    gapElement.className = 'text-3xl font-extrabold text-emerald-400 text-glow-emerald';
    gapStatusElement.innerHTML = `
      <div class="success-alert border border-emerald-500/30 p-3 rounded-lg text-xs mt-2 text-emerald-300">
        <i class="fa-solid fa-circle-check inline-block mr-1 align-text-bottom"></i>
        Cân bằng nhân sự hoàn hảo.
      </div>`;
  }

  // Quỹ đào tạo Upskill / Reskill từ ngân sách cắt giảm
  document.getElementById('sim-upskill-budget').textContent = `$${totalSavings.toLocaleString()}`;

  // Render table dự báo
  const simTableBody = document.getElementById('sim-table-body');
  simTableBody.innerHTML = '';
  
  forecastResults.forEach(res => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-800 hover:bg-slate-900/40 transition-colors';
    
    // Status text for GAP
    let gapText = '';
    if (res.gap > 0) {
      gapText = `<span class="px-2 py-0.5 rounded text-xxs font-bold bg-rose-500/20 text-rose-400">Thiếu: +${res.gap}</span>`;
    } else if (res.gap < 0) {
      gapText = `<span class="px-2 py-0.5 rounded text-xxs font-bold bg-amber-500/20 text-amber-400">Dư: ${res.gap}</span>`;
    } else {
      gapText = `<span class="px-2 py-0.5 rounded text-xxs font-bold bg-emerald-500/20 text-emerald-400">Đủ</span>`;
    }

    tr.innerHTML = `
      <td class="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-200">${res.department}</td>
      <td class="px-4 py-3 whitespace-nowrap text-sm text-center text-slate-300 font-bold">${res.current}</td>
      <td class="px-4 py-3 whitespace-nowrap text-sm text-center text-indigo-400 font-bold">${res.future}</td>
      <td class="px-4 py-3 whitespace-nowrap text-center">${gapText}</td>
      <td class="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
        <div class="flex flex-col gap-1">
          <div class="flex justify-between"><span>Traditional:</span> <span class="font-semibold text-slate-300">${res.tradCurrent} ➔ ${res.tradFuture}</span></div>
          <div class="flex justify-between"><span>AI/Data:</span> <span class="font-semibold text-indigo-400">${res.aiCurrent} ➔ ${res.aiFuture}</span></div>
        </div>
      </td>
      <td class="px-4 py-3 whitespace-nowrap text-sm text-right text-emerald-400 font-semibold">$${res.savings.toLocaleString()}</td>
    `;
    simTableBody.appendChild(tr);
  });

  // Vẽ biểu đồ Stacked Bar thể hiện sự thay đổi cấu trúc lực lượng lao động trước & sau AI
  const ctxForecast = document.getElementById('chart-workforce-forecast').getContext('2d');
  
  const currentTraditionalTotal = forecastResults.reduce((sum, r) => sum + r.tradCurrent, 0);
  const futureTraditionalTotal = forecastResults.reduce((sum, r) => sum + r.tradFuture, 0);

  const currentAITotal = forecastResults.reduce((sum, r) => sum + r.aiCurrent, 0);
  const futureAITotal = forecastResults.reduce((sum, r) => sum + r.aiFuture, 0);

  const currentDigitalTotal = forecastResults.reduce((sum, r) => sum + r.digCurrent, 0);
  const futureDigitalTotal = forecastResults.reduce((sum, r) => sum + r.digFuture, 0);

  charts.workforceForecastChart = new Chart(ctxForecast, {
    type: 'bar',
    data: {
      labels: ['Hiện tại (Current Supply)', 'Dự báo Kế hoạch (SWP Demand)'],
      datasets: [
        {
          label: 'Kỹ năng thủ công (Traditional Skills)',
          data: [currentTraditionalTotal, futureTraditionalTotal],
          backgroundColor: 'rgba(244, 63, 94, 0.75)',
          borderColor: '#f43f5e',
          borderWidth: 1
        },
        {
          label: 'Chuyển đổi số (Digital Literacy)',
          data: [currentDigitalTotal, futureDigitalTotal],
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderColor: '#10b981',
          borderWidth: 1
        },
        {
          label: 'Năng lực cốt lõi AI (AI/Data Skills)',
          data: [currentAITotal, futureAITotal],
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: '#6366f1',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: 'bottom',
          labels: { color: '#e2e8f0', font: { family: 'Plus Jakarta Sans', size: 10 } }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Outfit' },
          bodyFont: { family: 'Plus Jakarta Sans' }
        }
      },
      scales: {
        x: { 
          stacked: true,
          ticks: { color: '#94a3b8' } 
        },
        y: { 
          stacked: true,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8' } 
        }
      }
    }
  });

  // Chạy thêm logic: Dự báo rủi ro kế nhiệm (Succession Risk)
  runPredictiveSuccessionAlerts();
}

/**
 * LOGIC DỰ BÁO RỦI RO KẾ NHIỆM (SUCCESSION RISK)
 * Tìm kiếm các phòng ban có lực lượng nòng cốt tuổi đời cao (>= 50 tuổi) và thâm niên lớn (>= 60 tháng)
 * chiếm tỷ trọng lớn (>30% nhóm Active), nhưng thiếu đội ngũ kế thừa trẻ (tuổi < 30) có năng lực cao (performance Good/Excellent)
 */
function runPredictiveSuccessionAlerts() {
  const activeEmployees = allEmployees.filter(e => e.Status === 'Active');
  const successionAlertsContainer = document.getElementById('succession-risk-alerts');
  successionAlertsContainer.innerHTML = '';
  
  let activeAlertsCount = 0;

  DEPARTMENTS.forEach(dept => {
    const deptActive = activeEmployees.filter(e => e.Department === dept);
    const totalDeptActive = deptActive.length;
    if (totalDeptActive === 0) return;

    // Senior Core Staff (Age >= 50 and Tenure >= 60 months)
    const seniorCore = deptActive.filter(e => e.Age >= 50 && e.Tenure_Months >= 60);
    const seniorPct = (seniorCore.length / totalDeptActive) * 100;

    // Potential Successors (Age < 35, performance Good/Excellent)
    const successors = deptActive.filter(e => e.Age < 35 && (e.Performance_Score === 'Excellent' || e.Performance_Score === 'Good'));
    
    // Alert Condition: Senior Core > 25% of department and successors count is very low (e.g. less than senior core count)
    if (seniorPct > 25 && successors.length < seniorCore.length) {
      activeAlertsCount++;
      const card = document.createElement('div');
      card.className = 'warning-alert border border-amber-500/30 rounded-xl p-4 animate-fade-in flex flex-col justify-between gap-3';
      card.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="bg-amber-500/20 p-2 rounded-lg text-amber-400 mt-0.5">
            <i class="fa-solid fa-triangle-exclamation w-5 h-5 text-center"></i>
          </div>
          <div class="flex-1">
            <h4 class="font-bold text-slate-100 font-title text-sm">Rủi ro Kế nhiệm: Phòng ${dept}</h4>
            <p class="text-amber-300 text-xs mt-0.5 font-semibold">Cảnh báo thiếu hụt lực lượng kế nhiệm triển vọng.</p>
            <p class="text-slate-400 text-xs mt-1">Phòng ban có tỷ trọng nhân sự lão thành sắp nghỉ hưu lớn nhưng số lượng nhân sự trẻ tài năng có năng lực kế nhiệm lại quá mỏng.</p>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 bg-slate-950/60 p-3 rounded-lg border border-slate-900">
          <div>
            <span class="text-slate-400 text-xxs block uppercase">Nhân sự lớn tuổi (Tuổi ≥50, Thâm niên ≥5 năm)</span>
            <span class="text-amber-400 font-extrabold text-sm">${seniorCore.length} nhân viên (${seniorPct.toFixed(0)}%)</span>
          </div>
          <div>
            <span class="text-slate-400 text-xxs block uppercase">Ứng viên kế nhiệm trẻ (Tuổi <35, Performance Good+)</span>
            <span class="text-rose-400 font-extrabold text-sm">${successors.length} nhân viên</span>
          </div>
        </div>
        
        <div class="text-xxs text-slate-500 italic">
          💡 Đề xuất: Lập tức triển khai chương trình Đào tạo kèm cặp (Mentorship) và thiết lập lộ trình Fast-track cho các nhân sự trẻ tiềm năng trong phòng.
        </div>
      `;
      successionAlertsContainer.appendChild(card);
    }
  });

  if (activeAlertsCount === 0) {
    successionAlertsContainer.innerHTML = `
      <div class="success-alert border border-emerald-500/20 rounded-xl p-6 text-center animate-fade-in col-span-full">
        <i class="fa-solid fa-face-smile text-emerald-400 text-2xl mx-auto mb-2 block"></i>
        <h4 class="font-bold text-slate-100 font-title">Chỉ số kế nhiệm an toàn</h4>
        <p class="text-slate-400 text-xs mt-1">Tất cả các phòng ban đều có tỷ lệ nhân sự trẻ triển vọng cân đối với nhóm nhân sự sắp nghỉ hưu.</p>
      </div>`;
  }
}


/* ==========================================================================
   LOGIC PHÂN HỆ EXTRA: DUYỆT CƠ SỞ DỮ LIỆU (EMPLOYEE EXPLORER)
   ========================================================================== */

let explorerPage = 1;
const rowsPerPage = 10;

function renderEmployeeExplorer() {
  const activeOnly = document.getElementById('explorer-active-only').checked;
  const searchId = document.getElementById('explorer-search-id').value.trim().toLowerCase();

  let list = [...allEmployees];

  if (activeOnly) {
    list = list.filter(e => e.Status === 'Active');
  }
  if (searchId) {
    list = list.filter(e => e.Employee_ID.toLowerCase().includes(searchId));
  }

  // Pagination calculation
  const totalRows = list.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  if (explorerPage > totalPages) explorerPage = totalPages;
  if (explorerPage < 1) explorerPage = 1;

  const startIdx = (explorerPage - 1) * rowsPerPage;
  const pageItems = list.slice(startIdx, startIdx + rowsPerPage);

  // Render Table
  const tableBody = document.getElementById('explorer-table-body');
  tableBody.innerHTML = '';

  pageItems.forEach(emp => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-800 hover:bg-slate-900/30 transition-colors';
    
    // Badges based on values
    const statusBadge = emp.Status === 'Active' 
      ? '<span class="px-2 py-1 text-xxs font-semibold bg-emerald-500/10 text-emerald-400 rounded-full">Active</span>'
      : '<span class="px-2 py-1 text-xxs font-semibold bg-slate-500/10 text-slate-400 rounded-full">Resigned</span>';
      
    const perfBadge = emp.Performance_Score === 'Excellent' 
      ? '<span class="px-2 py-1 text-xxs font-semibold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">Excellent</span>'
      : emp.Performance_Score === 'Good'
      ? '<span class="px-2 py-1 text-xxs font-semibold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">Good</span>'
      : emp.Performance_Score === 'Average'
      ? '<span class="px-2 py-1 text-xxs font-semibold bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">Average</span>'
      : '<span class="px-2 py-1 text-xxs font-semibold bg-rose-500/20 text-rose-300 rounded-full border border-rose-500/30">Poor</span>';

    const skillBadge = emp.Core_Skills === 'AI/Data'
      ? '<span class="text-indigo-400 font-bold text-xs"><i class="fa-solid fa-microchip inline-block w-3.5 h-3.5 mr-1 align-middle"></i>AI/Data</span>'
      : emp.Core_Skills === 'Digital Literacy'
      ? '<span class="text-emerald-400 font-bold text-xs"><i class="fa-solid fa-laptop inline-block w-3.5 h-3.5 mr-1 align-middle"></i>Digital Lit</span>'
      : '<span class="text-slate-400 text-xs"><i class="fa-solid fa-screwdriver-wrench inline-block w-3.5 h-3.5 mr-1 align-middle"></i>Traditional</span>';

    tr.innerHTML = `
      <td class="px-6 py-3 whitespace-nowrap text-sm font-semibold text-slate-200">${emp.Employee_ID}</td>
      <td class="px-6 py-3 whitespace-nowrap text-sm text-slate-300">${emp.Department}</td>
      <td class="px-6 py-3 whitespace-nowrap text-sm text-center text-slate-300">${emp.Age}</td>
      <td class="px-6 py-3 whitespace-nowrap text-sm text-center text-slate-300">${emp.Tenure_Months}</td>
      <td class="px-6 py-3 whitespace-nowrap text-center">${statusBadge}</td>
      <td class="px-6 py-3 whitespace-nowrap text-center">${perfBadge}</td>
      <td class="px-6 py-3 whitespace-nowrap">${skillBadge}</td>
      <td class="px-6 py-3 whitespace-nowrap text-center text-sm font-medium text-slate-300">${emp.Promoted_Last_12M}</td>
      <td class="px-6 py-3 whitespace-nowrap text-sm text-right text-slate-400">$${(emp.Department_Revenue / 1000000).toFixed(1)}M</td>
    `;
    tableBody.appendChild(tr);
  });

  // Render pagination controls
  document.getElementById('explorer-page-info').textContent = `Trang ${explorerPage} / ${totalPages}`;
  
  const btnPrev = document.getElementById('explorer-btn-prev');
  const btnNext = document.getElementById('explorer-btn-next');
  
  btnPrev.disabled = explorerPage === 1;
  btnNext.disabled = explorerPage === totalPages;
  
  btnPrev.onclick = () => { if (explorerPage > 1) { explorerPage--; renderEmployeeExplorer(); } };
  btnNext.onclick = () => { if (explorerPage < totalPages) { explorerPage++; renderEmployeeExplorer(); } };

  // Set up listeners for controls (search & checkbox)
  document.getElementById('explorer-active-only').onchange = () => { explorerPage = 1; renderEmployeeExplorer(); };
  document.getElementById('explorer-search-id').oninput = () => { explorerPage = 1; renderEmployeeExplorer(); };
}


/* ==========================================================================
   LOGIC IMPORT / EXPORT DỮ LIỆU
   ========================================================================== */

function exportDataToCSV() {
  const csvContent = convertToCSV(allEmployees);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'aegis_hr_workforce_data.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Đã tải xuống dữ liệu CSV!', 'success');
}

function importDataFromCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    try {
      const parsedData = parseCSV(text);
      if (parsedData && parsedData.length > 0) {
        allEmployees = parsedData;
        filterData();
        showToast(`Nhập dữ liệu thành công! Đã tải ${parsedData.length} nhân sự.`, 'success');
      } else {
        showToast('Tệp tin CSV rỗng hoặc sai định dạng.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Đã xảy ra lỗi khi phân tích cú pháp CSV.', 'error');
    }
  };
  reader.readAsText(file);
  // Clear the input value so user can import the same file again
  event.target.value = '';
}

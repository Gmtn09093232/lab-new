/**
 * Material Testing Laboratory — Application Logic
 * Vanilla JS | localStorage | Chart.js
 * Designed for easy migration to Supabase later.
 */

/* ============================================================
   STORAGE LAYER (localStorage — swap for Supabase later)
   ============================================================ */
const Storage = {
  KEYS: {
    samples: 'mtl_samples',
    utm: 'mtl_utm',
    composition: 'mtl_composition',
    hardness: 'mtl_hardness',
    microstructure: 'mtl_microstructure',
    impact: 'mtl_impact',
    roughness: 'mtl_roughness',
    settings: 'mtl_settings',
    reportCounter: 'mtl_report_counter'
  },

  get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Storage get error:', e);
      return [];
    }
  },

  set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      showToast('Storage error — data may not be saved.', 'error');
      return false;
    }
  },

  getSettings() {
    try {
      const raw = localStorage.getItem(this.KEYS.settings);
      return raw ? JSON.parse(raw) : {
        labName: 'Material Testing Laboratory',
        labAddress: '',
        labPhone: '',
        labEmail: '',
        reportPrefix: 'MTL'
      };
    } catch (e) {
      return { labName: 'Material Testing Laboratory', labAddress: '', labPhone: '', labEmail: '', reportPrefix: 'MTL' };
    }
  },

  saveSettings(s) {
    localStorage.setItem(this.KEYS.settings, JSON.stringify(s));
  },

  nextReportNumber() {
    const settings = this.getSettings();
    const year = new Date().getFullYear();
    let counter = parseInt(localStorage.getItem(this.KEYS.reportCounter) || '0', 10);
    counter += 1;
    localStorage.setItem(this.KEYS.reportCounter, String(counter));
    return (settings.reportPrefix || 'MTL') + '-' + year + '-' + String(counter).padStart(4, '0');
  }
};

/* ============================================================
   UTILITY FUNCTIONS
   ============================================================ */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatNumber(n, decimals) {
  if (decimals === undefined) decimals = 2;
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toFixed(decimals);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function showToast(msg, type) {
  type = type || '';
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(function() { t.className = 'toast'; }, 3200);
}

function confirmDialog(title, message) {
  return new Promise(function(resolve) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    modal.classList.add('show');
    const yes = document.getElementById('confirmYes');
    const no = document.getElementById('confirmNo');
    const cleanup = function() {
      modal.classList.remove('show');
      yes.onclick = null;
      no.onclick = null;
    };
    yes.onclick = function() { cleanup(); resolve(true); };
    no.onclick = function() { cleanup(); resolve(false); };
  });
}

function calculateAverage(arr) {
  const nums = arr.filter(function(v) { return v !== null && v !== undefined && !isNaN(v) && v !== ''; });
  if (!nums.length) return null;
  return nums.reduce(function(a, b) { return a + Number(b); }, 0) / nums.length;
}

function calculateMinimum(arr) {
  const nums = arr.filter(function(v) { return v !== null && v !== undefined && !isNaN(v) && v !== ''; }).map(Number);
  return nums.length ? Math.min.apply(null, nums) : null;
}

function calculateMaximum(arr) {
  const nums = arr.filter(function(v) { return v !== null && v !== undefined && !isNaN(v) && v !== ''; }).map(Number);
  return nums.length ? Math.max.apply(null, nums) : null;
}

function calculateStandardDeviation(arr) {
  const nums = arr.filter(function(v) { return v !== null && v !== undefined && !isNaN(v) && v !== ''; }).map(Number);
  if (nums.length < 2) return null;
  const avg = nums.reduce(function(a, b) { return a + b; }, 0) / nums.length;
  const variance = nums.reduce(function(s, v) { return s + Math.pow(v - avg, 2); }, 0) / (nums.length - 1);
  return Math.sqrt(variance);
}

function calculatePassFail(measured, minSpec, maxSpec) {
  if (measured === null || measured === undefined || isNaN(measured)) return 'NOT SPECIFIED';
  const hasMin = minSpec !== null && minSpec !== undefined && minSpec !== '' && !isNaN(minSpec);
  const hasMax = maxSpec !== null && maxSpec !== undefined && maxSpec !== '' && !isNaN(maxSpec);
  if (!hasMin && !hasMax) return 'NOT SPECIFIED';
  const m = Number(measured);
  if (hasMin && m < Number(minSpec)) return 'FAIL';
  if (hasMax && m > Number(maxSpec)) return 'FAIL';
  return 'PASS';
}

function badgeHTML(status) {
  const map = {
    PASS: 'badge-pass',
    FAIL: 'badge-fail',
    PENDING: 'badge-pending',
    WARNING: 'badge-warning',
    'NOT SPECIFIED': 'badge-ns'
  };
  const cls = map[status] || 'badge-ns';
  return '<span class="badge ' + cls + '">' + (status || 'N/A') + '</span>';
}

/* ============================================================
   ENGINEERING CALCULATIONS — UTM
   ============================================================ */
function calcCrossSectionArea(shape, diameter, width, thickness) {
  if (shape === 'Round') {
    if (!diameter || diameter <= 0) return null;
    return (Math.PI * diameter * diameter) / 4;
  }
  if (shape === 'Rectangular') {
    if (!width || !thickness || width <= 0 || thickness <= 0) return null;
    return width * thickness;
  }
  return null;
}

/** Stress (MPa) = (F_kN * 1000) / A_mm2 */
function calcStress(loadKN, areaMM2) {
  if (!loadKN || !areaMM2 || areaMM2 <= 0) return null;
  return (loadKN * 1000) / areaMM2;
}

function calcElongation(finalGauge, originalGauge) {
  if (!finalGauge || !originalGauge || originalGauge <= 0) return null;
  return ((finalGauge - originalGauge) / originalGauge) * 100;
}

function calcReductionOfArea(originalArea, finalDiameter) {
  if (!originalArea || originalArea <= 0 || !finalDiameter || finalDiameter <= 0) return null;
  const finalArea = (Math.PI * finalDiameter * finalDiameter) / 4;
  return ((originalArea - finalArea) / originalArea) * 100;
}

/* ============================================================
   CHART INSTANCES
   ============================================================ */
const Charts = {
  dashboard: null, utmLoad: null, utmStress: null,
  composition: null, hardness: null, impact: null, roughness: null
};

function destroyChart(key) {
  if (Charts[key]) {
    Charts[key].destroy();
    Charts[key] = null;
  }
}

/* ============================================================
   NAVIGATION
   ============================================================ */
function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');
  const nav = document.querySelector('.nav-item[data-page="' + pageId + '"]');
  if (nav) nav.classList.add('active');
  const titles = {
    dashboard: 'Dashboard', samples: 'Sample Registration', utm: 'UTM Testing',
    composition: 'Chemical Composition', hardness: 'Hardness Test',
    microstructure: 'Microstructure Examination', impact: 'Impact Test',
    roughness: 'Surface Roughness', reports: 'Test Reports',
    history: 'History & Search', settings: 'Settings'
  };
  document.getElementById('pageTitle').textContent = titles[pageId] || pageId;
  if (pageId === 'dashboard') refreshDashboard();
  if (pageId === 'samples') renderSamplesTable();
  if (pageId === 'utm') { populateSampleSelects(); renderUTMTable(); }
  if (pageId === 'composition') { populateSampleSelects(); renderCompTable(); }
  if (pageId === 'hardness') { populateSampleSelects(); renderHardnessTable(); }
  if (pageId === 'microstructure') { populateSampleSelects(); renderMicroTable(); }
  if (pageId === 'impact') { populateSampleSelects(); renderImpactTable(); }
  if (pageId === 'roughness') { populateSampleSelects(); renderRoughnessTable(); }
  if (pageId === 'reports') populateReportSelect();
  if (pageId === 'history') renderHistoryTable();
  if (pageId === 'settings') loadSettingsForm();
  document.getElementById('sidebar').classList.remove('open');
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function refreshDashboard() {
  const samples = Storage.get(Storage.KEYS.samples);
  const utm = Storage.get(Storage.KEYS.utm);
  const comp = Storage.get(Storage.KEYS.composition);
  const hard = Storage.get(Storage.KEYS.hardness);
  const micro = Storage.get(Storage.KEYS.microstructure);
  const impact = Storage.get(Storage.KEYS.impact);
  const rough = Storage.get(Storage.KEYS.roughness);

  const allTests = utm.concat(comp, hard, micro, impact, rough);
  const statuses = allTests.map(function(t) { return t.status || 'PENDING'; });
  const passed = statuses.filter(function(s) { return s === 'PASS'; }).length;
  const failed = statuses.filter(function(s) { return s === 'FAIL'; }).length;
  const pending = statuses.filter(function(s) { return s === 'PENDING' || s === 'NOT SPECIFIED' || !s; }).length;
  const completed = allTests.length - pending;

  document.getElementById('statTotalSamples').textContent = samples.length;
  document.getElementById('statTotalTests').textContent = allTests.length;
  document.getElementById('statCompleted').textContent = completed;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statPassed').textContent = passed;
  document.getElementById('statFailed').textContent = failed;

  destroyChart('dashboard');
  const ctx = document.getElementById('dashboardChart');
  if (ctx && typeof Chart !== 'undefined') {
    Charts.dashboard = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['UTM', 'Composition', 'Hardness', 'Microstructure', 'Impact', 'Roughness'],
        datasets: [{
          label: 'Tests',
          data: [utm.length, comp.length, hard.length, micro.length, impact.length, rough.length],
          backgroundColor: ['#3182ce', '#38b2ac', '#805ad5', '#d69e2e', '#e53e3e', '#718096']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  const tbody = document.querySelector('#recentReportsTable tbody');
  const recent = samples.slice().sort(function(a, b) {
    return (b.dateReceived || '').localeCompare(a.dateReceived || '');
  }).slice(0, 8);
  tbody.innerHTML = recent.map(function(s) {
    const status = getSampleOverallStatus(s.id);
    return '<tr><td>' + (s.reportNumber || '—') + '</td><td>' + (s.sampleId || '—') + '</td><td>' +
      (s.customerName || '—') + '</td><td>' + badgeHTML(status) + '</td><td>' + formatDate(s.dateReceived) + '</td></tr>';
  }).join('') || '<tr><td colspan="5">No samples yet</td></tr>';
}

function getSampleOverallStatus(sampleId) {
  const sample = Storage.get(Storage.KEYS.samples).find(function(s) { return s.id === sampleId; });
  const sid = sample ? sample.sampleId : null;
  if (!sid) return 'PENDING';
  const tests = []
    .concat(Storage.get(Storage.KEYS.utm).filter(function(t) { return t.sampleId === sid; }))
    .concat(Storage.get(Storage.KEYS.composition).filter(function(t) { return t.sampleId === sid; }))
    .concat(Storage.get(Storage.KEYS.hardness).filter(function(t) { return t.sampleId === sid; }))
    .concat(Storage.get(Storage.KEYS.impact).filter(function(t) { return t.sampleId === sid; }))
    .concat(Storage.get(Storage.KEYS.roughness).filter(function(t) { return t.sampleId === sid; }));
  if (!tests.length) return 'PENDING';
  if (tests.some(function(t) { return t.status === 'FAIL'; })) return 'FAIL';
  if (tests.every(function(t) { return t.status === 'PASS' || t.status === 'NOT SPECIFIED'; })) {
    if (tests.some(function(t) { return t.status === 'PASS'; })) return 'PASS';
    return 'NOT SPECIFIED';
  }
  return 'PENDING';
}

/* ============================================================
   SAMPLES
   ============================================================ */
function openSampleForm(editId) {
  document.getElementById('sampleFormCard').style.display = 'block';
  document.getElementById('sampleForm').reset();
  document.getElementById('sampleEditId').value = '';
  document.getElementById('sampleFormTitle').textContent = 'Register Sample';
  document.getElementById('dateReceived').value = todayISO();
  document.getElementById('reportNumber').value = Storage.nextReportNumber();
  document.getElementById('sampleId').value = 'SMP-' + Date.now().toString(36).toUpperCase();

  if (editId) {
    const samples = Storage.get(Storage.KEYS.samples);
    const s = samples.find(function(x) { return x.id === editId; });
    if (s) {
      document.getElementById('sampleFormTitle').textContent = 'Edit Sample';
      document.getElementById('sampleEditId').value = s.id;
      document.getElementById('reportNumber').value = s.reportNumber || '';
      document.getElementById('sampleId').value = s.sampleId || '';
      document.getElementById('customerName').value = s.customerName || '';
      document.getElementById('company').value = s.company || '';
      document.getElementById('projectName').value = s.projectName || '';
      document.getElementById('sampleDescription').value = s.sampleDescription || '';
      document.getElementById('materialType').value = s.materialType || '';
      document.getElementById('materialGrade').value = s.materialGrade || '';
      document.getElementById('heatNumber').value = s.heatNumber || '';
      document.getElementById('batchNumber').value = s.batchNumber || '';
      document.getElementById('manufacturer').value = s.manufacturer || '';
      document.getElementById('sampleQuantity').value = s.sampleQuantity || 1;
      document.getElementById('dateReceived').value = s.dateReceived || '';
      document.getElementById('testingDate').value = s.testingDate || '';
      document.getElementById('technician').value = s.technician || '';
      document.getElementById('engineer').value = s.engineer || '';
      document.getElementById('specification').value = s.specification || '';
      document.getElementById('remarks').value = s.remarks || '';
      document.querySelectorAll('#requestedTests input').forEach(function(cb) {
        cb.checked = (s.requestedTests || []).indexOf(cb.value) >= 0;
      });
    }
  }
  document.getElementById('sampleFormCard').scrollIntoView({ behavior: 'smooth' });
}

function closeSampleForm() {
  document.getElementById('sampleFormCard').style.display = 'none';
}

function saveSample(e) {
  e.preventDefault();
  const editId = document.getElementById('sampleEditId').value;
  const sampleId = document.getElementById('sampleId').value.trim();
  const reportNumber = document.getElementById('reportNumber').value.trim();

  if (!sampleId || !document.getElementById('customerName').value.trim()) {
    showToast('Please fill required fields.', 'error');
    return;
  }

  const samples = Storage.get(Storage.KEYS.samples);
  if (!editId && samples.some(function(s) { return s.reportNumber === reportNumber; })) {
    showToast('Report number already exists.', 'error');
    return;
  }

  const requestedTests = [];
  document.querySelectorAll('#requestedTests input:checked').forEach(function(cb) {
    requestedTests.push(cb.value);
  });

  const record = {
    id: editId || uid(),
    reportNumber: reportNumber,
    sampleId: sampleId,
    customerName: document.getElementById('customerName').value.trim(),
    company: document.getElementById('company').value.trim(),
    projectName: document.getElementById('projectName').value.trim(),
    sampleDescription: document.getElementById('sampleDescription').value.trim(),
    materialType: document.getElementById('materialType').value,
    materialGrade: document.getElementById('materialGrade').value.trim(),
    heatNumber: document.getElementById('heatNumber').value.trim(),
    batchNumber: document.getElementById('batchNumber').value.trim(),
    manufacturer: document.getElementById('manufacturer').value.trim(),
    sampleQuantity: Number(document.getElementById('sampleQuantity').value) || 1,
    dateReceived: document.getElementById('dateReceived').value,
    testingDate: document.getElementById('testingDate').value,
    technician: document.getElementById('technician').value.trim(),
    engineer: document.getElementById('engineer').value.trim(),
    requestedTests: requestedTests,
    specification: document.getElementById('specification').value.trim(),
    remarks: document.getElementById('remarks').value.trim(),
    createdAt: editId ? ((samples.find(function(s) { return s.id === editId; }) || {}).createdAt || new Date().toISOString()) : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (editId) {
    const idx = samples.findIndex(function(s) { return s.id === editId; });
    if (idx >= 0) samples[idx] = record;
  } else {
    samples.push(record);
  }
  Storage.set(Storage.KEYS.samples, samples);
  showToast('Sample saved successfully.', 'success');
  closeSampleForm();
  renderSamplesTable();
}

function deleteSampleById(id) {
  const samples = Storage.get(Storage.KEYS.samples);
  const sample = samples.find(function(s) { return s.id === id; });
  if (!sample) return;
  confirmDialog('Delete Sample', 'Delete sample ' + sample.sampleId + ' and related tests?').then(function(ok) {
    if (!ok) return;
    Storage.set(Storage.KEYS.samples, samples.filter(function(s) { return s.id !== id; }));
    const sid = sample.sampleId;
    ['utm', 'composition', 'hardness', 'microstructure', 'impact', 'roughness'].forEach(function(k) {
      const data = Storage.get(Storage.KEYS[k]).filter(function(t) { return t.sampleId !== sid; });
      Storage.set(Storage.KEYS[k], data);
    });
    showToast('Sample and related tests deleted.', 'success');
    renderSamplesTable();
    refreshDashboard();
  });
}

function renderSamplesTable(filter) {
  filter = filter || '';
  const samples = Storage.get(Storage.KEYS.samples);
  const q = filter.toLowerCase();
  const filtered = q ? samples.filter(function(s) {
    return (s.sampleId || '').toLowerCase().indexOf(q) >= 0 ||
      (s.reportNumber || '').toLowerCase().indexOf(q) >= 0 ||
      (s.customerName || '').toLowerCase().indexOf(q) >= 0 ||
      (s.materialType || '').toLowerCase().indexOf(q) >= 0 ||
      (s.materialGrade || '').toLowerCase().indexOf(q) >= 0;
  }) : samples;

  const tbody = document.querySelector('#samplesTable tbody');
  tbody.innerHTML = filtered.map(function(s) {
    const status = getSampleOverallStatus(s.id);
    return '<tr><td>' + (s.reportNumber || '—') + '</td><td>' + (s.sampleId || '—') + '</td><td>' +
      (s.customerName || '—') + '</td><td>' + (s.materialType || '—') + '</td><td>' +
      (s.materialGrade || '—') + '</td><td>' + formatDate(s.dateReceived) + '</td><td>' +
      badgeHTML(status) + '</td><td class="actions">' +
      '<button class="btn btn-sm btn-secondary" onclick="openSampleForm(\'' + s.id + '\')">Edit</button> ' +
      '<button class="btn btn-sm btn-danger" onclick="deleteSampleById(\'' + s.id + '\')">Delete</button></td></tr>';
  }).join('') || '<tr><td colspan="8">No samples registered</td></tr>';
}

function populateSampleSelects() {
  const samples = Storage.get(Storage.KEYS.samples);
  const opts = '<option value="">— Select Sample —</option>' +
    samples.map(function(s) {
      return '<option value="' + s.sampleId + '">' + s.sampleId + ' — ' + (s.customerName || '') + ' (' + (s.materialType || '') + ')</option>';
    }).join('');
  ['utmSampleId', 'compSampleId', 'hardnessSampleId', 'microSampleId', 'impactSampleId', 'roughSampleId'].forEach(function(id) {
    const el = document.getElementById(id);
    if (el) {
      const current = el.value;
      el.innerHTML = opts;
      if (current) el.value = current;
    }
  });
}

/* ============================================================
   UTM MODULE
   ============================================================ */
function openUTMForm(editId) {
  document.getElementById('utmFormCard').style.display = 'block';
  document.getElementById('utmForm').reset();
  document.getElementById('utmEditId').value = '';
  document.getElementById('utmTestDate').value = todayISO();
  document.getElementById('utmTemperature').value = 23;
  populateSampleSelects();
  updateUTMShapeFields();
  clearUTMResults();

  if (editId) {
    const data = Storage.get(Storage.KEYS.utm).find(function(t) { return t.id === editId; });
    if (data) {
      document.getElementById('utmEditId').value = data.id;
      document.getElementById('utmSampleId').value = data.sampleId || '';
      document.getElementById('utmSpecimenId').value = data.specimenId || '';
      document.getElementById('utmMaterial').value = data.material || '';
      document.getElementById('utmStandard').value = data.standard || '';
      document.getElementById('utmTestType').value = data.testType || 'Tensile';
      document.getElementById('utmSpecimenShape').value = data.specimenShape || 'Round';
      document.getElementById('utmGaugeLength').value = data.gaugeLength || '';
      document.getElementById('utmDiameter').value = data.diameter || '';
      document.getElementById('utmWidth').value = data.width || '';
      document.getElementById('utmThickness').value = data.thickness || '';
      document.getElementById('utmFinalGauge').value = data.finalGauge || '';
      document.getElementById('utmFinalDiameter').value = data.finalDiameter || '';
      document.getElementById('utmMaxLoad').value = data.maxLoad || '';
      document.getElementById('utmYieldLoad').value = data.yieldLoad || '';
      document.getElementById('utmFractureLoad').value = data.fractureLoad || '';
      document.getElementById('utmExtension').value = data.extension || '';
      document.getElementById('utmTemperature').value = data.temperature != null ? data.temperature : 23;
      document.getElementById('utmSpeed').value = data.speed || '';
      document.getElementById('utmMachineId').value = data.machineId || '';
      document.getElementById('utmOperator').value = data.operator || '';
      document.getElementById('utmTestDate').value = data.testDate || '';
      document.getElementById('utmSpecYS').value = data.specYS || '';
      document.getElementById('utmSpecUTS').value = data.specUTS || '';
      document.getElementById('utmSpecElong').value = data.specElong || '';
      document.getElementById('utmDataPoints').value = data.dataPoints || '';
      updateUTMShapeFields();
      calculateUTM();
    }
  }
  document.getElementById('utmFormCard').scrollIntoView({ behavior: 'smooth' });
}

function closeUTMForm() {
  document.getElementById('utmFormCard').style.display = 'none';
  destroyChart('utmLoad');
  destroyChart('utmStress');
}

function updateUTMShapeFields() {
  const shape = document.getElementById('utmSpecimenShape').value;
  document.getElementById('utmDiameterGroup').style.display = shape === 'Round' ? '' : 'none';
  document.getElementById('utmWidthGroup').style.display = shape === 'Rectangular' ? '' : 'none';
  document.getElementById('utmThicknessGroup').style.display = shape === 'Rectangular' ? '' : 'none';
  calcUTMArea();
}

function calcUTMArea() {
  const shape = document.getElementById('utmSpecimenShape').value;
  const d = parseFloat(document.getElementById('utmDiameter').value);
  const w = parseFloat(document.getElementById('utmWidth').value);
  const t = parseFloat(document.getElementById('utmThickness').value);
  const area = calcCrossSectionArea(shape, d, w, t);
  document.getElementById('utmArea').value = area !== null ? area.toFixed(4) : '';
  return area;
}

function clearUTMResults() {
  ['resArea', 'resYS', 'resUTS', 'resElong', 'resRA', 'resUTMStatus'].forEach(function(id) {
    document.getElementById(id).textContent = '—';
  });
}

function calculateUTM() {
  const shape = document.getElementById('utmSpecimenShape').value;
  const gauge = parseFloat(document.getElementById('utmGaugeLength').value);
  const diameter = parseFloat(document.getElementById('utmDiameter').value);
  const width = parseFloat(document.getElementById('utmWidth').value);
  const thickness = parseFloat(document.getElementById('utmThickness').value);
  const finalGauge = parseFloat(document.getElementById('utmFinalGauge').value);
  const finalDiameter = parseFloat(document.getElementById('utmFinalDiameter').value);
  const maxLoad = parseFloat(document.getElementById('utmMaxLoad').value);
  const yieldLoad = parseFloat(document.getElementById('utmYieldLoad').value);
  const specYS = parseFloat(document.getElementById('utmSpecYS').value);
  const specUTS = parseFloat(document.getElementById('utmSpecUTS').value);
  const specElong = parseFloat(document.getElementById('utmSpecElong').value);

  if (shape === 'Round' && (!diameter || diameter <= 0)) {
    showToast('Diameter must be greater than zero.', 'error');
    return null;
  }
  if (shape === 'Rectangular' && ((!width || width <= 0) || (!thickness || thickness <= 0))) {
    showToast('Width and thickness must be greater than zero.', 'error');
    return null;
  }
  if (!gauge || gauge <= 0) {
    showToast('Gauge length must be greater than zero.', 'error');
    return null;
  }
  if (isNaN(maxLoad) || maxLoad < 0) {
    showToast('Maximum load cannot be negative.', 'error');
    return null;
  }

  const area = calcCrossSectionArea(shape, diameter, width, thickness);
  document.getElementById('utmArea').value = area !== null ? area.toFixed(4) : '';

  const ys = calcStress(yieldLoad, area);
  const uts = calcStress(maxLoad, area);
  const elong = calcElongation(finalGauge, gauge);
  const ra = calcReductionOfArea(area, finalDiameter);

  document.getElementById('resArea').textContent = area !== null ? formatNumber(area, 4) + ' mm²' : '—';
  document.getElementById('resYS').textContent = ys !== null ? formatNumber(ys, 1) + ' MPa' : '—';
  document.getElementById('resUTS').textContent = uts !== null ? formatNumber(uts, 1) + ' MPa' : '—';
  document.getElementById('resElong').textContent = elong !== null ? formatNumber(elong, 1) + ' %' : '—';
  document.getElementById('resRA').textContent = ra !== null ? formatNumber(ra, 1) + ' %' : '—';

  var status = 'NOT SPECIFIED';
  var checks = [];
  if (!isNaN(specYS) && ys !== null) checks.push(calculatePassFail(ys, specYS, null));
  if (!isNaN(specUTS) && uts !== null) checks.push(calculatePassFail(uts, specUTS, null));
  if (!isNaN(specElong) && elong !== null) checks.push(calculatePassFail(elong, specElong, null));
  if (checks.length) {
    status = checks.indexOf('FAIL') >= 0 ? 'FAIL' : 'PASS';
  }
  document.getElementById('resUTMStatus').innerHTML = badgeHTML(status);

  renderUTMCharts(area, gauge);
  return { area: area, ys: ys, uts: uts, elong: elong, ra: ra, status: status };
}

function renderUTMCharts(area, gauge) {
  const raw = document.getElementById('utmDataPoints').value.trim();
  var loads = [], extensions = [], stresses = [], strains = [];

  if (raw) {
    raw.split('\n').forEach(function(line) {
      const parts = line.split(',').map(function(p) { return parseFloat(p.trim()); });
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        loads.push(parts[0]);
        extensions.push(parts[1]);
        if (area && area > 0) stresses.push((parts[0] * 1000) / area);
        if (gauge && gauge > 0) strains.push(parts[1] / gauge);
      }
    });
  }

  if (!loads.length) {
    const maxLoad = parseFloat(document.getElementById('utmMaxLoad').value);
    const ext = parseFloat(document.getElementById('utmExtension').value) || 0;
    if (!isNaN(maxLoad)) {
      loads = [0, maxLoad];
      extensions = [0, ext];
      if (area > 0) stresses = [0, (maxLoad * 1000) / area];
      if (gauge > 0) strains = [0, ext / gauge];
    }
  }

  destroyChart('utmLoad');
  destroyChart('utmStress');

  if (typeof Chart === 'undefined') return;

  const loadCtx = document.getElementById('utmLoadChart');
  if (loadCtx && loads.length) {
    Charts.utmLoad = new Chart(loadCtx, {
      type: 'line',
      data: {
        labels: extensions.map(function(e) { return formatNumber(e, 2); }),
        datasets: [{
          label: 'Load (kN)', data: loads, borderColor: '#3182ce',
          backgroundColor: 'rgba(49,130,206,.1)', fill: true, tension: 0.2, pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: 'Load vs Extension' } },
        scales: {
          x: { title: { display: true, text: 'Extension (mm)' } },
          y: { title: { display: true, text: 'Load (kN)' }, beginAtZero: true }
        }
      }
    });
  }

  const stressCtx = document.getElementById('utmStressChart');
  if (stressCtx && stresses.length) {
    Charts.utmStress = new Chart(stressCtx, {
      type: 'line',
      data: {
        labels: strains.map(function(s) { return formatNumber(s, 4); }),
        datasets: [{
          label: 'Stress (MPa)', data: stresses, borderColor: '#e53e3e',
          backgroundColor: 'rgba(229,62,62,.1)', fill: true, tension: 0.2, pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: 'Stress vs Strain' } },
        scales: {
          x: { title: { display: true, text: 'Strain' } },
          y: { title: { display: true, text: 'Stress (MPa)' }, beginAtZero: true }
        }
      }
    });
  }
}

function saveUTM(e) {
  e.preventDefault();
  const calc = calculateUTM();
  if (!calc) return;

  const editId = document.getElementById('utmEditId').value;
  const record = {
    id: editId || uid(),
    sampleId: document.getElementById('utmSampleId').value,
    specimenId: document.getElementById('utmSpecimenId').value.trim(),
    material: document.getElementById('utmMaterial').value.trim(),
    standard: document.getElementById('utmStandard').value,
    testType: document.getElementById('utmTestType').value,
    specimenShape: document.getElementById('utmSpecimenShape').value,
    gaugeLength: parseFloat(document.getElementById('utmGaugeLength').value),
    diameter: parseFloat(document.getElementById('utmDiameter').value) || null,
    width: parseFloat(document.getElementById('utmWidth').value) || null,
    thickness: parseFloat(document.getElementById('utmThickness').value) || null,
    area: calc.area,
    finalGauge: parseFloat(document.getElementById('utmFinalGauge').value) || null,
    finalDiameter: parseFloat(document.getElementById('utmFinalDiameter').value) || null,
    maxLoad: parseFloat(document.getElementById('utmMaxLoad').value),
    yieldLoad: parseFloat(document.getElementById('utmYieldLoad').value) || null,
    fractureLoad: parseFloat(document.getElementById('utmFractureLoad').value) || null,
    extension: parseFloat(document.getElementById('utmExtension').value) || null,
    temperature: parseFloat(document.getElementById('utmTemperature').value),
    speed: parseFloat(document.getElementById('utmSpeed').value) || null,
    machineId: document.getElementById('utmMachineId').value.trim(),
    operator: document.getElementById('utmOperator').value.trim(),
    testDate: document.getElementById('utmTestDate').value,
    specYS: parseFloat(document.getElementById('utmSpecYS').value) || null,
    specUTS: parseFloat(document.getElementById('utmSpecUTS').value) || null,
    specElong: parseFloat(document.getElementById('utmSpecElong').value) || null,
    dataPoints: document.getElementById('utmDataPoints').value.trim(),
    ys: calc.ys, uts: calc.uts, elong: calc.elong, ra: calc.ra, status: calc.status,
    createdAt: new Date().toISOString()
  };

  const data = Storage.get(Storage.KEYS.utm);
  if (editId) {
    const idx = data.findIndex(function(t) { return t.id === editId; });
    if (idx >= 0) data[idx] = record;
  } else {
    data.push(record);
  }
  Storage.set(Storage.KEYS.utm, data);
  showToast('UTM test saved.', 'success');
  closeUTMForm();
  renderUTMTable();
}

function renderUTMTable() {
  const data = Storage.get(Storage.KEYS.utm);
  const tbody = document.querySelector('#utmTable tbody');
  tbody.innerHTML = data.map(function(t) {
    return '<tr><td>' + (t.sampleId || '—') + '</td><td>' + (t.specimenId || '—') + '</td><td>' +
      (t.testType || '—') + '</td><td>' + (t.ys !== null ? formatNumber(t.ys, 1) : '—') + '</td><td>' +
      (t.uts !== null ? formatNumber(t.uts, 1) : '—') + '</td><td>' +
      (t.elong !== null ? formatNumber(t.elong, 1) : '—') + '</td><td>' + badgeHTML(t.status) +
      '</td><td class="actions"><button class="btn btn-sm btn-secondary" onclick="openUTMForm(\'' + t.id +
      '\')">Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteTest(\'utm\',\'' + t.id +
      '\')">Delete</button></td></tr>';
  }).join('') || '<tr><td colspan="8">No UTM tests recorded</td></tr>';
}

/* ============================================================
   COMPOSITION MODULE
   ============================================================ */
const DEFAULT_ELEMENTS = [
  { element: 'C', measured: '', min: '', max: '', unit: '%' },
  { element: 'Si', measured: '', min: '', max: '', unit: '%' },
  { element: 'Mn', measured: '', min: '', max: '', unit: '%' },
  { element: 'P', measured: '', min: '', max: '', unit: '%' },
  { element: 'S', measured: '', min: '', max: '', unit: '%' },
  { element: 'Cr', measured: '', min: '', max: '', unit: '%' },
  { element: 'Ni', measured: '', min: '', max: '', unit: '%' },
  { element: 'Mo', measured: '', min: '', max: '', unit: '%' },
  { element: 'Cu', measured: '', min: '', max: '', unit: '%' },
  { element: 'Al', measured: '', min: '', max: '', unit: '%' },
  { element: 'V', measured: '', min: '', max: '', unit: '%' },
  { element: 'Ti', measured: '', min: '', max: '', unit: '%' },
  { element: 'Nb', measured: '', min: '', max: '', unit: '%' },
  { element: 'B', measured: '', min: '', max: '', unit: '%' },
  { element: 'Fe', measured: '', min: '', max: '', unit: '%' }
];

function openCompForm(editId) {
  document.getElementById('compFormCard').style.display = 'block';
  document.getElementById('compForm').reset();
  document.getElementById('compEditId').value = '';
  document.getElementById('compTestDate').value = todayISO();
  populateSampleSelects();

  var elements = JSON.parse(JSON.stringify(DEFAULT_ELEMENTS));
  if (editId) {
    const data = Storage.get(Storage.KEYS.composition).find(function(t) { return t.id === editId; });
    if (data) {
      document.getElementById('compEditId').value = data.id;
      document.getElementById('compSampleId').value = data.sampleId || '';
      document.getElementById('compStandard').value = data.standard || '';
      document.getElementById('compMethod').value = data.method || 'OES';
      document.getElementById('compOperator').value = data.operator || '';
      document.getElementById('compTestDate').value = data.testDate || '';
      elements = data.elements || elements;
    }
  }
  renderCompElements(elements);
  document.getElementById('compFormCard').scrollIntoView({ behavior: 'smooth' });
}

function closeCompForm() {
  document.getElementById('compFormCard').style.display = 'none';
  destroyChart('composition');
}

function renderCompElements(elements) {
  const tbody = document.getElementById('compElementsBody');
  tbody.innerHTML = elements.map(function(el, i) {
    const status = calculatePassFail(
      el.measured !== '' ? parseFloat(el.measured) : null,
      el.min !== '' ? parseFloat(el.min) : null,
      el.max !== '' ? parseFloat(el.max) : null
    );
    return '<tr data-idx="' + i + '"><td><input type="text" class="comp-el" value="' + el.element +
      '" style="width:60px"></td><td><input type="number" class="comp-meas" value="' + el.measured +
      '" step="0.0001" style="width:90px"></td><td><input type="number" class="comp-min" value="' + el.min +
      '" step="0.0001" style="width:80px"></td><td><input type="number" class="comp-max" value="' + el.max +
      '" step="0.0001" style="width:80px"></td><td><input type="text" class="comp-unit" value="' +
      (el.unit || '%') + '" style="width:50px"></td><td class="comp-status">' + badgeHTML(status) +
      '</td><td><button type="button" class="btn-icon" onclick="removeCompRow(this)">✕</button></td></tr>';
  }).join('');
}

function getCompElementsFromDOM() {
  const rows = document.querySelectorAll('#compElementsBody tr');
  return Array.prototype.map.call(rows, function(row) {
    return {
      element: row.querySelector('.comp-el').value.trim(),
      measured: row.querySelector('.comp-meas').value,
      min: row.querySelector('.comp-min').value,
      max: row.querySelector('.comp-max').value,
      unit: row.querySelector('.comp-unit').value.trim() || '%'
    };
  });
}

function removeCompRow(btn) {
  btn.closest('tr').remove();
}

function addCompElement() {
  const tbody = document.getElementById('compElementsBody');
  const tr = document.createElement('tr');
  tr.innerHTML = '<td><input type="text" class="comp-el" value="" style="width:60px"></td>' +
    '<td><input type="number" class="comp-meas" value="" step="0.0001" style="width:90px"></td>' +
    '<td><input type="number" class="comp-min" value="" step="0.0001" style="width:80px"></td>' +
    '<td><input type="number" class="comp-max" value="" step="0.0001" style="width:80px"></td>' +
    '<td><input type="text" class="comp-unit" value="%" style="width:50px"></td>' +
    '<td class="comp-status">' + badgeHTML('NOT SPECIFIED') + '</td>' +
    '<td><button type="button" class="btn-icon" onclick="removeCompRow(this)">✕</button></td>';
  tbody.appendChild(tr);
}

function validateComposition() {
  const elements = getCompElementsFromDOM();
  var overall = 'NOT SPECIFIED';
  var statuses = [];
  elements.forEach(function(el, i) {
    if (el.min !== '' && el.max !== '' && parseFloat(el.min) > parseFloat(el.max)) {
      showToast('Element ' + el.element + ': Min cannot exceed Max.', 'error');
    }
    const st = calculatePassFail(
      el.measured !== '' ? parseFloat(el.measured) : null,
      el.min !== '' ? parseFloat(el.min) : null,
      el.max !== '' ? parseFloat(el.max) : null
    );
    statuses.push(st);
    const row = document.querySelectorAll('#compElementsBody tr')[i];
    if (row) row.querySelector('.comp-status').innerHTML = badgeHTML(st);
  });
  if (statuses.indexOf('FAIL') >= 0) overall = 'FAIL';
  else if (statuses.indexOf('PASS') >= 0) overall = 'PASS';

  destroyChart('composition');
  const withData = elements.filter(function(e) { return e.measured !== '' && !isNaN(parseFloat(e.measured)); });
  if (withData.length && typeof Chart !== 'undefined') {
    const ctx = document.getElementById('compChart');
    Charts.composition = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: withData.map(function(e) { return e.element; }),
        datasets: [
          { label: 'Measured %', data: withData.map(function(e) { return parseFloat(e.measured); }), backgroundColor: '#3182ce' },
          { label: 'Min Spec', data: withData.map(function(e) { return e.min !== '' ? parseFloat(e.min) : null; }), backgroundColor: '#48bb78' },
          { label: 'Max Spec', data: withData.map(function(e) { return e.max !== '' ? parseFloat(e.max) : null; }), backgroundColor: '#e53e3e' }
        ]
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: 'Chemical Composition Comparison' } },
        scales: { y: { beginAtZero: true, title: { display: true, text: '%' } } }
      }
    });
  }
  return { elements: elements, status: overall };
}

function saveComposition(e) {
  e.preventDefault();
  const result = validateComposition();
  const editId = document.getElementById('compEditId').value;
  const record = {
    id: editId || uid(),
    sampleId: document.getElementById('compSampleId').value,
    standard: document.getElementById('compStandard').value.trim(),
    method: document.getElementById('compMethod').value,
    operator: document.getElementById('compOperator').value.trim(),
    testDate: document.getElementById('compTestDate').value,
    elements: result.elements,
    status: result.status,
    createdAt: new Date().toISOString()
  };
  const data = Storage.get(Storage.KEYS.composition);
  if (editId) {
    const idx = data.findIndex(function(t) { return t.id === editId; });
    if (idx >= 0) data[idx] = record;
  } else {
    data.push(record);
  }
  Storage.set(Storage.KEYS.composition, data);
  showToast('Composition test saved.', 'success');
  closeCompForm();
  renderCompTable();
}

function renderCompTable() {
  const data = Storage.get(Storage.KEYS.composition);
  const tbody = document.querySelector('#compTable tbody');
  tbody.innerHTML = data.map(function(t) {
    return '<tr><td>' + (t.sampleId || '—') + '</td><td>' + (t.standard || '—') + '</td><td>' +
      (t.method || '—') + '</td><td>' + (t.elements || []).filter(function(e) { return e.measured !== ''; }).length +
      '</td><td>' + badgeHTML(t.status) + '</td><td>' + formatDate(t.testDate) +
      '</td><td class="actions"><button class="btn btn-sm btn-secondary" onclick="openCompForm(\'' + t.id +
      '\')">Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteTest(\'composition\',\'' + t.id +
      '\')">Delete</button></td></tr>';
  }).join('') || '<tr><td colspan="7">No composition tests recorded</td></tr>';
}

/* ============================================================
   HARDNESS MODULE
   ============================================================ */
function openHardnessForm(editId) {
  document.getElementById('hardnessFormCard').style.display = 'block';
  document.getElementById('hardnessForm').reset();
  document.getElementById('hardnessEditId').value = '';
  document.getElementById('hardnessTestDate').value = todayISO();
  populateSampleSelects();
  clearHardnessResults();

  if (editId) {
    const data = Storage.get(Storage.KEYS.hardness).find(function(t) { return t.id === editId; });
    if (data) {
      document.getElementById('hardnessEditId').value = data.id;
      document.getElementById('hardnessSampleId').value = data.sampleId || '';
      document.getElementById('hardnessMethod').value = data.method || 'Rockwell C';
      document.getElementById('hardnessScale').value = data.scale || '';
      document.getElementById('hardnessIndenter').value = data.indenter || '';
      document.getElementById('hardnessLoad').value = data.load || '';
      document.getElementById('hardnessLocation').value = data.location || '';
      document.getElementById('hardnessR1').value = (data.readings && data.readings[0] != null) ? data.readings[0] : '';
      document.getElementById('hardnessR2').value = (data.readings && data.readings[1] != null) ? data.readings[1] : '';
      document.getElementById('hardnessR3').value = (data.readings && data.readings[2] != null) ? data.readings[2] : '';
      document.getElementById('hardnessR4').value = (data.readings && data.readings[3] != null) ? data.readings[3] : '';
      document.getElementById('hardnessR5').value = (data.readings && data.readings[4] != null) ? data.readings[4] : '';
      document.getElementById('hardnessSpecMin').value = data.specMin != null ? data.specMin : '';
      document.getElementById('hardnessSpecMax').value = data.specMax != null ? data.specMax : '';
      document.getElementById('hardnessOperator').value = data.operator || '';
      document.getElementById('hardnessTestDate').value = data.testDate || '';
      calculateHardness();
    }
  }
  document.getElementById('hardnessFormCard').scrollIntoView({ behavior: 'smooth' });
}

function closeHardnessForm() {
  document.getElementById('hardnessFormCard').style.display = 'none';
  destroyChart('hardness');
}

function clearHardnessResults() {
  ['resHAvg', 'resHMin', 'resHMax', 'resHRange', 'resHStd', 'resHStatus'].forEach(function(id) {
    document.getElementById(id).textContent = '—';
  });
}

function getHardnessReadings() {
  return [1, 2, 3, 4, 5].map(function(i) {
    const v = document.getElementById('hardnessR' + i).value;
    return v !== '' ? parseFloat(v) : null;
  }).filter(function(v) { return v !== null && !isNaN(v); });
}

function calculateHardness() {
  const readings = getHardnessReadings();
  if (!readings.length) {
    showToast('Enter at least one hardness reading.', 'error');
    return null;
  }
  const avg = calculateAverage(readings);
  const min = calculateMinimum(readings);
  const max = calculateMaximum(readings);
  const range = max - min;
  const std = calculateStandardDeviation(readings);
  const specMin = parseFloat(document.getElementById('hardnessSpecMin').value);
  const specMax = parseFloat(document.getElementById('hardnessSpecMax').value);

  if (!isNaN(specMin) && !isNaN(specMax) && specMin > specMax) {
    showToast('Spec Min cannot be greater than Spec Max.', 'error');
    return null;
  }

  const status = calculatePassFail(avg, isNaN(specMin) ? null : specMin, isNaN(specMax) ? null : specMax);

  document.getElementById('resHAvg').textContent = formatNumber(avg, 1);
  document.getElementById('resHMin').textContent = formatNumber(min, 1);
  document.getElementById('resHMax').textContent = formatNumber(max, 1);
  document.getElementById('resHRange').textContent = formatNumber(range, 1);
  document.getElementById('resHStd').textContent = std !== null ? formatNumber(std, 2) : '—';
  document.getElementById('resHStatus').innerHTML = badgeHTML(status);

  destroyChart('hardness');
  if (typeof Chart !== 'undefined') {
    const ctx = document.getElementById('hardnessChart');
    Charts.hardness = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: readings.map(function(_, i) { return 'R' + (i + 1); }),
        datasets: [{ label: 'Hardness', data: readings, backgroundColor: '#805ad5' }]
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: 'Hardness Readings' }, legend: { display: false } },
        scales: { y: { beginAtZero: false } }
      }
    });
  }

  return { avg: avg, min: min, max: max, range: range, std: std, status: status, readings: readings };
}

function saveHardness(e) {
  e.preventDefault();
  const calc = calculateHardness();
  if (!calc) return;
  const editId = document.getElementById('hardnessEditId').value;
  const record = {
    id: editId || uid(),
    sampleId: document.getElementById('hardnessSampleId').value,
    method: document.getElementById('hardnessMethod').value,
    scale: document.getElementById('hardnessScale').value.trim(),
    indenter: document.getElementById('hardnessIndenter').value.trim(),
    load: document.getElementById('hardnessLoad').value.trim(),
    location: document.getElementById('hardnessLocation').value.trim(),
    readings: calc.readings,
    avg: calc.avg, min: calc.min, max: calc.max, range: calc.range, std: calc.std,
    specMin: parseFloat(document.getElementById('hardnessSpecMin').value) || null,
    specMax: parseFloat(document.getElementById('hardnessSpecMax').value) || null,
    status: calc.status,
    operator: document.getElementById('hardnessOperator').value.trim(),
    testDate: document.getElementById('hardnessTestDate').value,
    createdAt: new Date().toISOString()
  };
  const data = Storage.get(Storage.KEYS.hardness);
  if (editId) {
    const idx = data.findIndex(function(t) { return t.id === editId; });
    if (idx >= 0) data[idx] = record;
  } else {
    data.push(record);
  }
  Storage.set(Storage.KEYS.hardness, data);
  showToast('Hardness test saved.', 'success');
  closeHardnessForm();
  renderHardnessTable();
}

function renderHardnessTable() {
  const data = Storage.get(Storage.KEYS.hardness);
  const tbody = document.querySelector('#hardnessTable tbody');
  tbody.innerHTML = data.map(function(t) {
    return '<tr><td>' + (t.sampleId || '—') + '</td><td>' + (t.method || '—') + '</td><td>' +
      formatNumber(t.avg, 1) + '</td><td>' + formatNumber(t.min, 1) + '</td><td>' + formatNumber(t.max, 1) +
      '</td><td>' + badgeHTML(t.status) + '</td><td class="actions">' +
      '<button class="btn btn-sm btn-secondary" onclick="openHardnessForm(\'' + t.id +
      '\')">Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteTest(\'hardness\',\'' + t.id +
      '\')">Delete</button></td></tr>';
  }).join('') || '<tr><td colspan="7">No hardness tests recorded</td></tr>';
}

/* ============================================================
   MICROSTRUCTURE MODULE
   ============================================================ */
var microImages = [];

function openMicroForm(editId) {
  document.getElementById('microFormCard').style.display = 'block';
  document.getElementById('microForm').reset();
  document.getElementById('microEditId').value = '';
  document.getElementById('microTestDate').value = todayISO();
  document.getElementById('microTemp').value = 23;
  microImages = [];
  document.getElementById('microImagePreview').innerHTML = '';
  populateSampleSelects();

  if (editId) {
    const data = Storage.get(Storage.KEYS.microstructure).find(function(t) { return t.id === editId; });
    if (data) {
      document.getElementById('microEditId').value = data.id;
      document.getElementById('microSampleId').value = data.sampleId || '';
      document.getElementById('microSpecimenId').value = data.specimenId || '';
      document.getElementById('microMaterial').value = data.material || '';
      document.getElementById('microCutting').value = data.cutting || '';
      document.getElementById('microMounting').value = data.mounting || '';
      document.getElementById('microGrinding').value = data.grinding || '';
      document.getElementById('microPolishing').value = data.polishing || '';
      document.getElementById('microEtchant').value = data.etchant || '';
      document.getElementById('microEtchTime').value = data.etchTime || '';
      document.getElementById('microMicroscope').value = data.microscope || '';
      document.getElementById('microMagnification').value = data.magnification || '100X';
      document.getElementById('microIllumination').value = data.illumination || '';
      document.getElementById('microTemp').value = data.temperature != null ? data.temperature : 23;
      document.getElementById('microOperator').value = data.operator || '';
      document.getElementById('microTestDate').value = data.testDate || '';
      document.getElementById('microObservation').value = data.observation || '';
      microImages = data.images || [];
      renderMicroImagePreview();
    }
  }
  document.getElementById('microFormCard').scrollIntoView({ behavior: 'smooth' });
}

function closeMicroForm() {
  document.getElementById('microFormCard').style.display = 'none';
  microImages = [];
}

function handleMicroImageUpload(e) {
  const files = Array.prototype.slice.call(e.target.files || []);
  files.forEach(function(file) {
    if (!file.type.match(/^image\//)) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      const img = new Image();
      img.onload = function() {
        const maxW = 800;
        var w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        microImages.push(canvas.toDataURL('image/jpeg', 0.7));
        renderMicroImagePreview();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}

function renderMicroImagePreview() {
  const container = document.getElementById('microImagePreview');
  container.innerHTML = microImages.map(function(src, i) {
    return '<div class="image-preview-item"><img src="' + src + '" alt="Micro ' + (i + 1) +
      '"><button type="button" class="remove-img" onclick="removeMicroImage(' + i + ')">✕</button></div>';
  }).join('');
}

function removeMicroImage(idx) {
  microImages.splice(idx, 1);
  renderMicroImagePreview();
}

function saveMicro(e) {
  e.preventDefault();
  const editId = document.getElementById('microEditId').value;
  const record = {
    id: editId || uid(),
    sampleId: document.getElementById('microSampleId').value,
    specimenId: document.getElementById('microSpecimenId').value.trim(),
    material: document.getElementById('microMaterial').value.trim(),
    cutting: document.getElementById('microCutting').value.trim(),
    mounting: document.getElementById('microMounting').value.trim(),
    grinding: document.getElementById('microGrinding').value.trim(),
    polishing: document.getElementById('microPolishing').value.trim(),
    etchant: document.getElementById('microEtchant').value.trim(),
    etchTime: document.getElementById('microEtchTime').value.trim(),
    microscope: document.getElementById('microMicroscope').value.trim(),
    magnification: document.getElementById('microMagnification').value,
    illumination: document.getElementById('microIllumination').value.trim(),
    temperature: parseFloat(document.getElementById('microTemp').value),
    operator: document.getElementById('microOperator').value.trim(),
    testDate: document.getElementById('microTestDate').value,
    observation: document.getElementById('microObservation').value.trim(),
    images: microImages.slice(),
    status: 'NOT SPECIFIED',
    createdAt: new Date().toISOString()
  };
  const data = Storage.get(Storage.KEYS.microstructure);
  if (editId) {
    const idx = data.findIndex(function(t) { return t.id === editId; });
    if (idx >= 0) data[idx] = record;
  } else {
    data.push(record);
  }
  Storage.set(Storage.KEYS.microstructure, data);
  showToast('Microstructure examination saved.', 'success');
  closeMicroForm();
  renderMicroTable();
}

function renderMicroTable() {
  const data = Storage.get(Storage.KEYS.microstructure);
  const tbody = document.querySelector('#microTable tbody');
  tbody.innerHTML = data.map(function(t) {
    return '<tr><td>' + (t.sampleId || '—') + '</td><td>' + (t.magnification || '—') + '</td><td>' +
      (t.etchant || '—') + '</td><td>' + (t.operator || '—') + '</td><td>' + formatDate(t.testDate) +
      '</td><td class="actions"><button class="btn btn-sm btn-secondary" onclick="openMicroForm(\'' + t.id +
      '\')">Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteTest(\'microstructure\',\'' + t.id +
      '\')">Delete</button></td></tr>';
  }).join('') || '<tr><td colspan="6">No microstructure records</td></tr>';
}

/* ============================================================
   IMPACT MODULE
   ============================================================ */
function openImpactForm(editId) {
  document.getElementById('impactFormCard').style.display = 'block';
  document.getElementById('impactForm').reset();
  document.getElementById('impactEditId').value = '';
  document.getElementById('impactTestDate').value = todayISO();
  document.getElementById('impactTemp').value = 23;
  populateSampleSelects();
  clearImpactResults();

  if (editId) {
    const data = Storage.get(Storage.KEYS.impact).find(function(t) { return t.id === editId; });
    if (data) {
      document.getElementById('impactEditId').value = data.id;
      document.getElementById('impactSampleId').value = data.sampleId || '';
      document.getElementById('impactSpecimenId').value = data.specimenId || '';
      document.getElementById('impactStandard').value = data.standard || '';
      document.getElementById('impactMethod').value = data.method || 'Charpy V-notch';
      document.getElementById('impactNotch').value = data.notch || '';
      document.getElementById('impactDimensions').value = data.dimensions || '';
      document.getElementById('impactNotchDepth').value = data.notchDepth || '';
      document.getElementById('impactTemp').value = data.temperature != null ? data.temperature : 23;
      document.getElementById('impactPendulum').value = data.pendulum || '';
      document.getElementById('impactInitial').value = data.initialEnergy || '';
      document.getElementById('impactFinal').value = data.finalEnergy || '';
      document.getElementById('impactAbsorbed').value = data.absorbedEnergy || '';
      document.getElementById('impactFracture').value = data.fracture || '';
      document.getElementById('impactSpecMin').value = data.specMin || '';
      document.getElementById('impactOperator').value = data.operator || '';
      document.getElementById('impactTestDate').value = data.testDate || '';
      document.getElementById('impactMultiEnergies').value = (data.multiEnergies || []).join(', ');
      calculateImpact();
    }
  }
  document.getElementById('impactFormCard').scrollIntoView({ behavior: 'smooth' });
}

function closeImpactForm() {
  document.getElementById('impactFormCard').style.display = 'none';
  destroyChart('impact');
}

function clearImpactResults() {
  ['resIEnergy', 'resIAvg', 'resIMin', 'resIMax', 'resIStatus'].forEach(function(id) {
    document.getElementById(id).textContent = '—';
  });
}

function calculateImpact() {
  var absorbed = parseFloat(document.getElementById('impactAbsorbed').value);
  const initial = parseFloat(document.getElementById('impactInitial').value);
  const finalE = parseFloat(document.getElementById('impactFinal').value);

  if (!isNaN(initial) && !isNaN(finalE)) {
    absorbed = initial - finalE;
    document.getElementById('impactAbsorbed').value = absorbed.toFixed(1);
  }

  if (isNaN(absorbed) || absorbed < 0) {
    showToast('Absorbed energy must be a non-negative number.', 'error');
    return null;
  }

  const multiRaw = document.getElementById('impactMultiEnergies').value.trim();
  var multi = [];
  if (multiRaw) {
    multi = multiRaw.split(',').map(function(s) { return parseFloat(s.trim()); }).filter(function(v) { return !isNaN(v); });
  }
  if (!multi.length) multi = [absorbed];

  const avg = calculateAverage(multi);
  const min = calculateMinimum(multi);
  const max = calculateMaximum(multi);
  const specMin = parseFloat(document.getElementById('impactSpecMin').value);
  const status = calculatePassFail(avg, isNaN(specMin) ? null : specMin, null);

  document.getElementById('resIEnergy').textContent = formatNumber(absorbed, 1) + ' J';
  document.getElementById('resIAvg').textContent = formatNumber(avg, 1) + ' J';
  document.getElementById('resIMin').textContent = formatNumber(min, 1) + ' J';
  document.getElementById('resIMax').textContent = formatNumber(max, 1) + ' J';
  document.getElementById('resIStatus').innerHTML = badgeHTML(status);

  destroyChart('impact');
  if (typeof Chart !== 'undefined') {
    const ctx = document.getElementById('impactChart');
    Charts.impact = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: multi.map(function(_, i) { return 'Specimen ' + (i + 1); }),
        datasets: [{ label: 'Impact Energy (J)', data: multi, backgroundColor: '#e53e3e' }]
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: 'Impact Energy Comparison' }, legend: { display: false } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Energy (J)' } } }
      }
    });
  }

  return { absorbed: absorbed, avg: avg, min: min, max: max, status: status, multi: multi };
}

function saveImpact(e) {
  e.preventDefault();
  const calc = calculateImpact();
  if (!calc) return;
  const editId = document.getElementById('impactEditId').value;
  const record = {
    id: editId || uid(),
    sampleId: document.getElementById('impactSampleId').value,
    specimenId: document.getElementById('impactSpecimenId').value.trim(),
    standard: document.getElementById('impactStandard').value,
    method: document.getElementById('impactMethod').value,
    notch: document.getElementById('impactNotch').value.trim(),
    dimensions: document.getElementById('impactDimensions').value.trim(),
    notchDepth: parseFloat(document.getElementById('impactNotchDepth').value) || null,
    temperature: parseFloat(document.getElementById('impactTemp').value),
    pendulum: parseFloat(document.getElementById('impactPendulum').value) || null,
    initialEnergy: parseFloat(document.getElementById('impactInitial').value) || null,
    finalEnergy: parseFloat(document.getElementById('impactFinal').value) || null,
    absorbedEnergy: calc.absorbed,
    multiEnergies: calc.multi,
    avg: calc.avg, min: calc.min, max: calc.max,
    fracture: document.getElementById('impactFracture').value.trim(),
    specMin: parseFloat(document.getElementById('impactSpecMin').value) || null,
    status: calc.status,
    operator: document.getElementById('impactOperator').value.trim(),
    testDate: document.getElementById('impactTestDate').value,
    createdAt: new Date().toISOString()
  };
  const data = Storage.get(Storage.KEYS.impact);
  if (editId) {
    const idx = data.findIndex(function(t) { return t.id === editId; });
    if (idx >= 0) data[idx] = record;
  } else {
    data.push(record);
  }
  Storage.set(Storage.KEYS.impact, data);
  showToast('Impact test saved.', 'success');
  closeImpactForm();
  renderImpactTable();
}

function renderImpactTable() {
  const data = Storage.get(Storage.KEYS.impact);
  const tbody = document.querySelector('#impactTable tbody');
  tbody.innerHTML = data.map(function(t) {
    return '<tr><td>' + (t.sampleId || '—') + '</td><td>' + (t.method || '—') + '</td><td>' +
      (t.temperature != null ? t.temperature : '—') + '</td><td>' + formatNumber(t.absorbedEnergy, 1) +
      '</td><td>' + badgeHTML(t.status) + '</td><td class="actions">' +
      '<button class="btn btn-sm btn-secondary" onclick="openImpactForm(\'' + t.id +
      '\')">Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteTest(\'impact\',\'' + t.id +
      '\')">Delete</button></td></tr>';
  }).join('') || '<tr><td colspan="6">No impact tests recorded</td></tr>';
}

/* ============================================================
   SURFACE ROUGHNESS MODULE
   ============================================================ */
function openRoughnessForm(editId) {
  document.getElementById('roughnessFormCard').style.display = 'block';
  document.getElementById('roughnessForm').reset();
  document.getElementById('roughnessEditId').value = '';
  document.getElementById('roughTestDate').value = todayISO();
  populateSampleSelects();
  clearRoughnessResults();

  if (editId) {
    const data = Storage.get(Storage.KEYS.roughness).find(function(t) { return t.id === editId; });
    if (data) {
      document.getElementById('roughnessEditId').value = data.id;
      document.getElementById('roughSampleId').value = data.sampleId || '';
      document.getElementById('roughSpecimenId').value = data.specimenId || '';
      document.getElementById('roughLocation').value = data.location || '';
      document.getElementById('roughInstrument').value = data.instrument || '';
      document.getElementById('roughCutoff').value = data.cutoff || '';
      document.getElementById('roughEvalLen').value = data.evalLen || '';
      document.getElementById('roughFilter').value = data.filter || '';
      document.getElementById('roughSpeed').value = data.speed || '';
      document.getElementById('roughParam').value = data.parameter || 'Ra';
      document.getElementById('roughM1').value = (data.readings && data.readings[0] != null) ? data.readings[0] : '';
      document.getElementById('roughM2').value = (data.readings && data.readings[1] != null) ? data.readings[1] : '';
      document.getElementById('roughM3').value = (data.readings && data.readings[2] != null) ? data.readings[2] : '';
      document.getElementById('roughM4').value = (data.readings && data.readings[3] != null) ? data.readings[3] : '';
      document.getElementById('roughM5').value = (data.readings && data.readings[4] != null) ? data.readings[4] : '';
      document.getElementById('roughSpecMax').value = data.specMax || '';
      document.getElementById('roughOperator').value = data.operator || '';
      document.getElementById('roughTestDate').value = data.testDate || '';
      calculateRoughness();
    }
  }
  document.getElementById('roughnessFormCard').scrollIntoView({ behavior: 'smooth' });
}

function closeRoughnessForm() {
  document.getElementById('roughnessFormCard').style.display = 'none';
  destroyChart('roughness');
}

function clearRoughnessResults() {
  ['resRAvg', 'resRMin', 'resRMax', 'resRRange', 'resRStd', 'resRStatus'].forEach(function(id) {
    document.getElementById(id).textContent = '—';
  });
}

function getRoughnessReadings() {
  return [1, 2, 3, 4, 5].map(function(i) {
    const v = document.getElementById('roughM' + i).value;
    return v !== '' ? parseFloat(v) : null;
  }).filter(function(v) { return v !== null && !isNaN(v); });
}

function calculateRoughness() {
  const readings = getRoughnessReadings();
  if (!readings.length) {
    showToast('Enter at least one measurement.', 'error');
    return null;
  }
  const avg = calculateAverage(readings);
  const min = calculateMinimum(readings);
  const max = calculateMaximum(readings);
  const range = max - min;
  const std = calculateStandardDeviation(readings);
  const specMax = parseFloat(document.getElementById('roughSpecMax').value);
  const status = calculatePassFail(avg, null, isNaN(specMax) ? null : specMax);

  document.getElementById('resRAvg').textContent = formatNumber(avg, 2) + ' μm';
  document.getElementById('resRMin').textContent = formatNumber(min, 2) + ' μm';
  document.getElementById('resRMax').textContent = formatNumber(max, 2) + ' μm';
  document.getElementById('resRRange').textContent = formatNumber(range, 2);
  document.getElementById('resRStd').textContent = std !== null ? formatNumber(std, 3) : '—';
  document.getElementById('resRStatus').innerHTML = badgeHTML(status);

  destroyChart('roughness');
  if (typeof Chart !== 'undefined') {
    const ctx = document.getElementById('roughnessChart');
    Charts.roughness = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: readings.map(function(_, i) { return 'M' + (i + 1); }),
        datasets: [{ label: 'Roughness (μm)', data: readings, backgroundColor: '#718096' }]
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: 'Surface Roughness Measurements' }, legend: { display: false } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'μm' } } }
      }
    });
  }

  return { avg: avg, min: min, max: max, range: range, std: std, status: status, readings: readings };
}

function saveRoughness(e) {
  e.preventDefault();
  const calc = calculateRoughness();
  if (!calc) return;
  const editId = document.getElementById('roughnessEditId').value;
  const record = {
    id: editId || uid(),
    sampleId: document.getElementById('roughSampleId').value,
    specimenId: document.getElementById('roughSpecimenId').value.trim(),
    location: document.getElementById('roughLocation').value.trim(),
    instrument: document.getElementById('roughInstrument').value.trim(),
    cutoff: document.getElementById('roughCutoff').value.trim(),
    evalLen: document.getElementById('roughEvalLen').value.trim(),
    filter: document.getElementById('roughFilter').value.trim(),
    speed: document.getElementById('roughSpeed').value.trim(),
    parameter: document.getElementById('roughParam').value,
    readings: calc.readings,
    avg: calc.avg, min: calc.min, max: calc.max, range: calc.range, std: calc.std,
    specMax: parseFloat(document.getElementById('roughSpecMax').value) || null,
    status: calc.status,
    operator: document.getElementById('roughOperator').value.trim(),
    testDate: document.getElementById('roughTestDate').value,
    createdAt: new Date().toISOString()
  };
  const data = Storage.get(Storage.KEYS.roughness);
  if (editId) {
    const idx = data.findIndex(function(t) { return t.id === editId; });
    if (idx >= 0) data[idx] = record;
  } else {
    data.push(record);
  }
  Storage.set(Storage.KEYS.roughness, data);
  showToast('Surface roughness test saved.', 'success');
  closeRoughnessForm();
  renderRoughnessTable();
}

function renderRoughnessTable() {
  const data = Storage.get(Storage.KEYS.roughness);
  const tbody = document.querySelector('#roughnessTable tbody');
  tbody.innerHTML = data.map(function(t) {
    return '<tr><td>' + (t.sampleId || '—') + '</td><td>' + (t.parameter || '—') + '</td><td>' +
      formatNumber(t.avg, 2) + '</td><td>' + badgeHTML(t.status) + '</td><td class="actions">' +
      '<button class="btn btn-sm btn-secondary" onclick="openRoughnessForm(\'' + t.id +
      '\')">Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteTest(\'roughness\',\'' + t.id +
      '\')">Delete</button></td></tr>';
  }).join('') || '<tr><td colspan="5">No roughness tests recorded</td></tr>';
}

/* ============================================================
   GENERIC DELETE
   ============================================================ */
function deleteTest(type, id) {
  confirmDialog('Delete Test', 'Are you sure you want to delete this test record?').then(function(ok) {
    if (!ok) return;
    const key = Storage.KEYS[type];
    const data = Storage.get(key).filter(function(t) { return t.id !== id; });
    Storage.set(key, data);
    showToast('Test deleted.', 'success');
    if (type === 'utm') renderUTMTable();
    if (type === 'composition') renderCompTable();
    if (type === 'hardness') renderHardnessTable();
    if (type === 'microstructure') renderMicroTable();
    if (type === 'impact') renderImpactTable();
    if (type === 'roughness') renderRoughnessTable();
    refreshDashboard();
  });
}

/* ============================================================
   REPORT GENERATION
   ============================================================ */
function populateReportSelect() {
  const samples = Storage.get(Storage.KEYS.samples);
  const sel = document.getElementById('reportSampleSelect');
  sel.innerHTML = '<option value="">— Select Sample —</option>' +
    samples.map(function(s) {
      return '<option value="' + s.id + '">' + s.reportNumber + ' — ' + s.sampleId + ' (' + (s.customerName || '') + ')</option>';
    }).join('');
}

function generateReport() {
  const sampleRefId = document.getElementById('reportSampleSelect').value;
  if (!sampleRefId) {
    showToast('Please select a sample.', 'error');
    return;
  }
  const samples = Storage.get(Storage.KEYS.samples);
  const sample = samples.find(function(s) { return s.id === sampleRefId; });
  if (!sample) return;

  const sid = sample.sampleId;
  const utm = Storage.get(Storage.KEYS.utm).filter(function(t) { return t.sampleId === sid; });
  const comp = Storage.get(Storage.KEYS.composition).filter(function(t) { return t.sampleId === sid; });
  const hard = Storage.get(Storage.KEYS.hardness).filter(function(t) { return t.sampleId === sid; });
  const micro = Storage.get(Storage.KEYS.microstructure).filter(function(t) { return t.sampleId === sid; });
  const impact = Storage.get(Storage.KEYS.impact).filter(function(t) { return t.sampleId === sid; });
  const rough = Storage.get(Storage.KEYS.roughness).filter(function(t) { return t.sampleId === sid; });
  const settings = Storage.getSettings();
  const overall = getSampleOverallStatus(sample.id);

  const testedBy = document.getElementById('reportTestedBy').value || sample.technician || '—';
  const checkedBy = document.getElementById('reportCheckedBy').value || sample.engineer || '—';
  const approvedBy = document.getElementById('reportApprovedBy').value || '—';

  var summaryRows = '';
  utm.forEach(function(t) {
    summaryRows += '<tr><td>UTM (' + t.testType + ')</td><td>' + (t.standard || '—') +
      '</td><td>YS: ' + formatNumber(t.ys, 1) + ' MPa, UTS: ' + formatNumber(t.uts, 1) +
      ' MPa</td><td>' + badgeHTML(t.status) + '</td></tr>';
  });
  comp.forEach(function(t) {
    summaryRows += '<tr><td>Chemical Composition</td><td>' + (t.standard || '—') + '</td><td>' +
      (t.elements || []).filter(function(e) { return e.measured !== ''; }).length +
      ' elements</td><td>' + badgeHTML(t.status) + '</td></tr>';
  });
  hard.forEach(function(t) {
    summaryRows += '<tr><td>Hardness (' + t.method + ')</td><td>—</td><td>Avg: ' +
      formatNumber(t.avg, 1) + '</td><td>' + badgeHTML(t.status) + '</td></tr>';
  });
  micro.forEach(function(t) {
    summaryRows += '<tr><td>Microstructure</td><td>—</td><td>' + (t.magnification || '—') +
      '</td><td>' + badgeHTML(t.status) + '</td></tr>';
  });
  impact.forEach(function(t) {
    summaryRows += '<tr><td>Impact (' + t.method + ')</td><td>' + (t.standard || '—') +
      '</td><td>' + formatNumber(t.absorbedEnergy, 1) + ' J @ ' + t.temperature +
      '°C</td><td>' + badgeHTML(t.status) + '</td></tr>';
  });
  rough.forEach(function(t) {
    summaryRows += '<tr><td>Surface Roughness (' + t.parameter + ')</td><td>—</td><td>Avg: ' +
      formatNumber(t.avg, 2) + ' μm</td><td>' + badgeHTML(t.status) + '</td></tr>';
  });
  if (!summaryRows) summaryRows = '<tr><td colspan="4">No tests recorded for this sample</td></tr>';

  var utmHTML = '';
  utm.forEach(function(t) {
    utmHTML += '<div class="report-section"><h3>UTM Results — ' + t.testType + ' (' +
      (t.specimenId || '') + ')</h3><table>' +
      '<tr><th>Standard</th><td>' + (t.standard || '—') + '</td><th>Specimen Shape</th><td>' +
      (t.specimenShape || '—') + '</td></tr>' +
      '<tr><th>Gauge Length</th><td>' + (t.gaugeLength || '—') + ' mm</td><th>Cross-sectional Area</th><td>' +
      formatNumber(t.area, 4) + ' mm²</td></tr>' +
      '<tr><th>Max Load</th><td>' + (t.maxLoad || '—') + ' kN</td><th>Yield Load</th><td>' +
      (t.yieldLoad || '—') + ' kN</td></tr>' +
      '<tr><th>Yield Strength</th><td>' + formatNumber(t.ys, 1) + ' MPa</td><th>Ultimate Tensile Strength</th><td>' +
      formatNumber(t.uts, 1) + ' MPa</td></tr>' +
      '<tr><th>% Elongation</th><td>' + formatNumber(t.elong, 1) + ' %</td><th>% Reduction of Area</th><td>' +
      formatNumber(t.ra, 1) + ' %</td></tr>' +
      '<tr><th>Status</th><td colspan="3">' + badgeHTML(t.status) + '</td></tr></table></div>';
  });

  var compHTML = '';
  comp.forEach(function(t) {
    const rows = (t.elements || []).filter(function(e) { return e.measured !== ''; }).map(function(e) {
      const st = calculatePassFail(parseFloat(e.measured), e.min !== '' ? parseFloat(e.min) : null, e.max !== '' ? parseFloat(e.max) : null);
      return '<tr><td>' + e.element + '</td><td>' + e.measured + '</td><td>' + (e.min || '—') +
        '</td><td>' + (e.max || '—') + '</td><td>' + (e.unit || '%') + '</td><td>' + badgeHTML(st) + '</td></tr>';
    }).join('');
    compHTML += '<div class="report-section"><h3>Chemical Composition (' + (t.method || '') +
      ')</h3><p>Standard: ' + (t.standard || '—') + ' | Operator: ' + (t.operator || '—') +
      ' | Date: ' + formatDate(t.testDate) + '</p><table><thead><tr><th>Element</th><th>Measured</th><th>Min Spec</th><th>Max Spec</th><th>Unit</th><th>Status</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="6">No data</td></tr>') + '</tbody></table></div>';
  });

  var hardHTML = '';
  hard.forEach(function(t) {
    hardHTML += '<div class="report-section"><h3>Hardness Test — ' + t.method + '</h3><table>' +
      '<tr><th>Scale</th><td>' + (t.scale || '—') + '</td><th>Load</th><td>' + (t.load || '—') + '</td></tr>' +
      '<tr><th>Readings</th><td colspan="3">' + (t.readings || []).join(', ') + '</td></tr>' +
      '<tr><th>Average</th><td>' + formatNumber(t.avg, 1) + '</td><th>Std. Deviation</th><td>' +
      (t.std !== null ? formatNumber(t.std, 2) : '—') + '</td></tr>' +
      '<tr><th>Min / Max</th><td>' + formatNumber(t.min, 1) + ' / ' + formatNumber(t.max, 1) +
      '</td><th>Status</th><td>' + badgeHTML(t.status) + '</td></tr></table></div>';
  });

  var microHTML = '';
  micro.forEach(function(t) {
    const imgs = (t.images || []).map(function(src) {
      return '<img src="' + src + '" style="max-width:200px;margin:4px;border:1px solid #ccc;">';
    }).join('');
    microHTML += '<div class="report-section"><h3>Microstructure Examination</h3><table>' +
      '<tr><th>Magnification</th><td>' + (t.magnification || '—') + '</td><th>Etchant</th><td>' +
      (t.etchant || '—') + '</td></tr>' +
      '<tr><th>Etching Time</th><td>' + (t.etchTime || '—') + '</td><th>Operator</th><td>' +
      (t.operator || '—') + '</td></tr>' +
      '<tr><th>Observation</th><td colspan="3">' + (t.observation || '—') + '</td></tr></table>' +
      (imgs ? '<div style="margin-top:8px">' + imgs + '</div>' : '') + '</div>';
  });

  var impactHTML = '';
  impact.forEach(function(t) {
    impactHTML += '<div class="report-section"><h3>Impact Test — ' + t.method + '</h3><table>' +
      '<tr><th>Standard</th><td>' + (t.standard || '—') + '</td><th>Temperature</th><td>' +
      t.temperature + ' °C</td></tr>' +
      '<tr><th>Absorbed Energy</th><td>' + formatNumber(t.absorbedEnergy, 1) + ' J</td><th>Average</th><td>' +
      formatNumber(t.avg, 1) + ' J</td></tr>' +
      '<tr><th>Min / Max</th><td>' + formatNumber(t.min, 1) + ' / ' + formatNumber(t.max, 1) +
      ' J</td><th>Fracture</th><td>' + (t.fracture || '—') + '</td></tr>' +
      '<tr><th>Status</th><td colspan="3">' + badgeHTML(t.status) + '</td></tr></table></div>';
  });

  var roughHTML = '';
  rough.forEach(function(t) {
    roughHTML += '<div class="report-section"><h3>Surface Roughness — ' + t.parameter + '</h3><table>' +
      '<tr><th>Readings (μm)</th><td colspan="3">' + (t.readings || []).join(', ') + '</td></tr>' +
      '<tr><th>Average</th><td>' + formatNumber(t.avg, 2) + ' μm</td><th>Spec Max</th><td>' +
      (t.specMax !== null ? t.specMax + ' μm' : '—') + '</td></tr>' +
      '<tr><th>Status</th><td colspan="3">' + badgeHTML(t.status) + '</td></tr></table></div>';
  });

  var conclusionText;
  if (overall === 'PASS') {
    conclusionText = 'Based on the tests performed and the specifications provided by the customer, the tested material meets the specified requirements and is evaluated as PASS.';
  } else if (overall === 'FAIL') {
    conclusionText = 'Based on the tests performed and the specifications provided by the customer, one or more measured results do not meet the specified requirements. The material is evaluated as FAIL.';
  } else {
    conclusionText = 'Based on the tests performed, evaluation is limited to the available specification data. Some tests have no specification limits entered (NOT SPECIFIED). Overall status: ' + overall + '.';
  }

  const html = '<div class="report-header"><h1>' + (settings.labName || 'MATERIAL TESTING LABORATORY') +
    '</h1><h2>TEST REPORT</h2><div class="lab-info">' + (settings.labAddress || '') +
    (settings.labPhone ? ' | ' + settings.labPhone : '') +
    (settings.labEmail ? ' | ' + settings.labEmail : '') + '</div></div>' +
    '<dl class="report-meta">' +
    '<div><dt>Report Number:</dt><dd>' + (sample.reportNumber || '—') + '</dd></div>' +
    '<div><dt>Sample ID:</dt><dd>' + (sample.sampleId || '—') + '</dd></div>' +
    '<div><dt>Customer:</dt><dd>' + (sample.customerName || '—') + '</dd></div>' +
    '<div><dt>Company:</dt><dd>' + (sample.company || '—') + '</dd></div>' +
    '<div><dt>Project:</dt><dd>' + (sample.projectName || '—') + '</dd></div>' +
    '<div><dt>Material:</dt><dd>' + (sample.materialType || '—') +
    (sample.materialGrade ? ' / ' + sample.materialGrade : '') + '</dd></div>' +
    '<div><dt>Heat Number:</dt><dd>' + (sample.heatNumber || '—') + '</dd></div>' +
    '<div><dt>Batch Number:</dt><dd>' + (sample.batchNumber || '—') + '</dd></div>' +
    '<div><dt>Date Received:</dt><dd>' + formatDate(sample.dateReceived) + '</dd></div>' +
    '<div><dt>Test Date:</dt><dd>' + formatDate(sample.testingDate) + '</dd></div>' +
    '<div><dt>Specification:</dt><dd>' + (sample.specification || '—') + '</dd></div>' +
    '<div><dt>Overall Status:</dt><dd>' + badgeHTML(overall) + '</dd></div></dl>' +
    '<div class="report-section"><h3>Test Summary</h3><table><thead><tr><th>Test Type</th><th>Standard</th><th>Result</th><th>Status</th></tr></thead><tbody>' +
    summaryRows + '</tbody></table></div>' +
    utmHTML + compHTML + hardHTML + microHTML + impactHTML + roughHTML +
    '<div class="report-conclusion"><strong>Final Conclusion</strong><br>' + conclusionText +
    '<br><br><em>Note: This report does not claim compliance with any standard unless the applicable specification limits were entered and evaluated by the laboratory. Hardness conversions, if any, are approximate.</em></div>' +
    '<div class="report-approval">' +
    '<div class="approval-box"><div class="sig-line"></div><div><strong>Tested By</strong><br>' + testedBy + '</div></div>' +
    '<div class="approval-box"><div class="sig-line"></div><div><strong>Checked By</strong><br>' + checkedBy + '</div></div>' +
    '<div class="approval-box"><div class="sig-line"></div><div><strong>Approved By</strong><br>' + approvedBy + '</div></div>' +
    '</div><div class="report-footer">Generated on ' + formatDate(new Date().toISOString()) +
    ' | ' + (settings.labName || 'Material Testing Laboratory') + ' | Page 1</div>';

  const container = document.getElementById('reportContainer');
  container.innerHTML = html;
  container.style.display = 'block';
  document.getElementById('btnPrintReport').style.display = 'inline-flex';
  container.scrollIntoView({ behavior: 'smooth' });
  showToast('Report generated.', 'success');
}

/* ============================================================
   HISTORY
   ============================================================ */
function renderHistoryTable(filters) {
  filters = filters || {};
  var filtered = Storage.get(Storage.KEYS.samples);

  if (filters.reportNo) filtered = filtered.filter(function(s) {
    return (s.reportNumber || '').toLowerCase().indexOf(filters.reportNo.toLowerCase()) >= 0;
  });
  if (filters.sampleId) filtered = filtered.filter(function(s) {
    return (s.sampleId || '').toLowerCase().indexOf(filters.sampleId.toLowerCase()) >= 0;
  });
  if (filters.customer) filtered = filtered.filter(function(s) {
    return (s.customerName || '').toLowerCase().indexOf(filters.customer.toLowerCase()) >= 0;
  });
  if (filters.material) filtered = filtered.filter(function(s) {
    return (s.materialType || '').toLowerCase().indexOf(filters.material.toLowerCase()) >= 0 ||
      (s.materialGrade || '').toLowerCase().indexOf(filters.material.toLowerCase()) >= 0;
  });
  if (filters.status) filtered = filtered.filter(function(s) {
    return getSampleOverallStatus(s.id) === filters.status;
  });
  if (filters.dateFrom) filtered = filtered.filter(function(s) {
    return (s.dateReceived || '') >= filters.dateFrom;
  });
  if (filters.dateTo) filtered = filtered.filter(function(s) {
    return (s.dateReceived || '') <= filters.dateTo;
  });

  const tbody = document.querySelector('#historyTable tbody');
  tbody.innerHTML = filtered.map(function(s) {
    const status = getSampleOverallStatus(s.id);
    const tests = (s.requestedTests || []).join(', ') || '—';
    return '<tr><td>' + (s.reportNumber || '—') + '</td><td>' + (s.sampleId || '—') + '</td><td>' +
      (s.customerName || '—') + '</td><td>' + (s.materialType || '—') + '</td><td>' +
      (s.materialGrade || '—') + '</td><td>' + tests + '</td><td>' + badgeHTML(status) +
      '</td><td>' + formatDate(s.dateReceived) + '</td><td class="actions">' +
      '<button class="btn btn-sm btn-secondary" onclick="viewSampleReport(\'' + s.id +
      '\')">View</button> <button class="btn btn-sm btn-secondary" onclick="openSampleForm(\'' + s.id +
      '\');navigateTo(\'samples\')">Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteSampleById(\'' +
      s.id + '\')">Delete</button></td></tr>';
  }).join('') || '<tr><td colspan="9">No records found</td></tr>';
}

function viewSampleReport(sampleId) {
  navigateTo('reports');
  document.getElementById('reportSampleSelect').value = sampleId;
  generateReport();
}

function searchHistory() {
  renderHistoryTable({
    reportNo: document.getElementById('histReportNo').value.trim(),
    sampleId: document.getElementById('histSampleId').value.trim(),
    customer: document.getElementById('histCustomer').value.trim(),
    material: document.getElementById('histMaterial').value.trim(),
    status: document.getElementById('histStatus').value,
    dateFrom: document.getElementById('histDateFrom').value,
    dateTo: document.getElementById('histDateTo').value
  });
}

/* ============================================================
   SETTINGS
   ============================================================ */
function loadSettingsForm() {
  const s = Storage.getSettings();
  document.getElementById('setLabName').value = s.labName || '';
  document.getElementById('setLabAddress').value = s.labAddress || '';
  document.getElementById('setLabPhone').value = s.labPhone || '';
  document.getElementById('setLabEmail').value = s.labEmail || '';
  document.getElementById('setReportPrefix').value = s.reportPrefix || 'MTL';
  document.getElementById('labNameDisplay').textContent = s.labName || 'Material Testing Laboratory';
}

function saveSettings(e) {
  e.preventDefault();
  const s = {
    labName: document.getElementById('setLabName').value.trim(),
    labAddress: document.getElementById('setLabAddress').value.trim(),
    labPhone: document.getElementById('setLabPhone').value.trim(),
    labEmail: document.getElementById('setLabEmail').value.trim(),
    reportPrefix: document.getElementById('setReportPrefix').value.trim() || 'MTL'
  };
  Storage.saveSettings(s);
  document.getElementById('labNameDisplay').textContent = s.labName;
  showToast('Settings saved.', 'success');
}

/* ============================================================
   DEMO DATA
   ============================================================ */
function loadDemoData() {
  confirmDialog('Load Demo Data', 'This will add DEMO sample records. Existing data will be kept. Continue?').then(function(ok) {
    if (!ok) return;

    if (!localStorage.getItem(Storage.KEYS.reportCounter)) {
      localStorage.setItem(Storage.KEYS.reportCounter, '0');
    }

    const samples = Storage.get(Storage.KEYS.samples);
    const demoSamples = [
      {
        id: 'demo-s1', reportNumber: 'MTL-2026-DEMO1', sampleId: 'DEMO-CS-001',
        customerName: 'Acme Structural Ltd', company: 'Acme Structural Ltd',
        projectName: 'Bridge Pier Reinforcement',
        sampleDescription: 'Hot-rolled carbon steel plate, 12 mm thick',
        materialType: 'Carbon Steel', materialGrade: 'S355JR', heatNumber: 'HN-4521',
        batchNumber: 'B-2026-014', manufacturer: 'EuroSteel GmbH', sampleQuantity: 3,
        dateReceived: '2026-09-15', testingDate: '2026-09-18',
        technician: 'J. Smith', engineer: 'Dr. A. Patel',
        requestedTests: ['UTM', 'Composition', 'Hardness', 'Impact'],
        specification: 'EN 10025-2 S355JR',
        remarks: 'DEMO DATA — not actual laboratory measurements',
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-s2', reportNumber: 'MTL-2026-DEMO2', sampleId: 'DEMO-SS-002',
        customerName: 'Marine Fabricators Inc', company: 'Marine Fabricators Inc',
        projectName: 'Offshore Platform Piping',
        sampleDescription: 'Austenitic stainless steel pipe section',
        materialType: 'Stainless Steel', materialGrade: '316L', heatNumber: 'HN-8890',
        batchNumber: 'B-2026-022', manufacturer: 'Nordic Metals AB', sampleQuantity: 2,
        dateReceived: '2026-09-20', testingDate: '2026-09-22',
        technician: 'M. Chen', engineer: 'Dr. A. Patel',
        requestedTests: ['Composition', 'Hardness', 'Microstructure', 'Roughness'],
        specification: 'ASTM A312 TP316L',
        remarks: 'DEMO DATA — not actual laboratory measurements',
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-s3', reportNumber: 'MTL-2026-DEMO3', sampleId: 'DEMO-AL-003',
        customerName: 'AeroTech Components', company: 'AeroTech Components',
        projectName: 'Wing Spar Prototype',
        sampleDescription: 'Aluminum alloy extrusion, T6 temper',
        materialType: 'Aluminum Alloy', materialGrade: '6061-T6', heatNumber: 'HN-1102',
        batchNumber: 'B-2026-031', manufacturer: 'AluCorp USA', sampleQuantity: 5,
        dateReceived: '2026-09-25', testingDate: '2026-09-28',
        technician: 'J. Smith', engineer: 'Eng. R. Okonkwo',
        requestedTests: ['UTM', 'Hardness', 'Roughness'],
        specification: 'ASTM B221 6061-T6',
        remarks: 'DEMO DATA — not actual laboratory measurements',
        createdAt: new Date().toISOString()
      }
    ];

    demoSamples.forEach(function(ds) {
      if (!samples.find(function(s) { return s.id === ds.id; })) samples.push(ds);
    });
    Storage.set(Storage.KEYS.samples, samples);

    const utm = Storage.get(Storage.KEYS.utm);
    if (!utm.find(function(t) { return t.id === 'demo-utm1'; })) {
      utm.push({
        id: 'demo-utm1', sampleId: 'DEMO-CS-001', specimenId: 'T-01', material: 'S355JR',
        standard: 'ISO 6892', testType: 'Tensile', specimenShape: 'Round',
        gaugeLength: 50, diameter: 10, area: 78.5398, finalGauge: 62.5, finalDiameter: 7.8,
        maxLoad: 45.2, yieldLoad: 28.5, fractureLoad: 38.1, extension: 12.5, temperature: 23,
        operator: 'J. Smith', testDate: '2026-09-18',
        specYS: 355, specUTS: 470, specElong: 22,
        ys: 362.8, uts: 575.4, elong: 25.0, ra: 39.1, status: 'PASS',
        dataPoints: '0,0\n5,0.3\n15,0.8\n28.5,1.5\n35,3.2\n45.2,8.5\n38.1,12.5',
        createdAt: new Date().toISOString()
      });
      Storage.set(Storage.KEYS.utm, utm);
    }

    const comp = Storage.get(Storage.KEYS.composition);
    if (!comp.find(function(t) { return t.id === 'demo-comp1'; })) {
      comp.push({
        id: 'demo-comp1', sampleId: 'DEMO-CS-001', standard: 'EN 10025-2', method: 'OES',
        operator: 'J. Smith', testDate: '2026-09-18',
        elements: [
          { element: 'C', measured: '0.18', min: '0', max: '0.22', unit: '%' },
          { element: 'Si', measured: '0.35', min: '0', max: '0.55', unit: '%' },
          { element: 'Mn', measured: '1.42', min: '0', max: '1.60', unit: '%' },
          { element: 'P', measured: '0.018', min: '0', max: '0.035', unit: '%' },
          { element: 'S', measured: '0.012', min: '0', max: '0.035', unit: '%' },
          { element: 'Cr', measured: '0.08', min: '', max: '', unit: '%' },
          { element: 'Ni', measured: '0.05', min: '', max: '', unit: '%' },
          { element: 'Cu', measured: '0.12', min: '0', max: '0.55', unit: '%' },
          { element: 'Fe', measured: 'bal', min: '', max: '', unit: '%' }
        ],
        status: 'PASS', createdAt: new Date().toISOString()
      });
      Storage.set(Storage.KEYS.composition, comp);
    }

    const hard = Storage.get(Storage.KEYS.hardness);
    if (!hard.find(function(t) { return t.id === 'demo-hard1'; })) {
      hard.push({
        id: 'demo-hard1', sampleId: 'DEMO-CS-001', method: 'Rockwell C', scale: 'HRC',
        indenter: 'Diamond cone', load: '150 kgf', location: 'Mid-thickness',
        readings: [22, 23, 21, 22.5, 22], avg: 22.1, min: 21, max: 23, range: 2, std: 0.74,
        specMin: 18, specMax: 28, status: 'PASS', operator: 'J. Smith', testDate: '2026-09-18',
        createdAt: new Date().toISOString()
      });
      Storage.set(Storage.KEYS.hardness, hard);
    }

    const impact = Storage.get(Storage.KEYS.impact);
    if (!impact.find(function(t) { return t.id === 'demo-imp1'; })) {
      impact.push({
        id: 'demo-imp1', sampleId: 'DEMO-CS-001', specimenId: 'CVN-01', standard: 'ASTM E23',
        method: 'Charpy V-notch', notch: 'V-notch 2 mm', dimensions: '10 × 10 × 55 mm',
        notchDepth: 2, temperature: -20, absorbedEnergy: 48, multiEnergies: [48, 52, 45],
        avg: 48.3, min: 45, max: 52, fracture: 'Mixed', specMin: 27, status: 'PASS',
        operator: 'J. Smith', testDate: '2026-09-18', createdAt: new Date().toISOString()
      });
      Storage.set(Storage.KEYS.impact, impact);
    }

    const rough = Storage.get(Storage.KEYS.roughness);
    if (!rough.find(function(t) { return t.id === 'demo-rough1'; })) {
      rough.push({
        id: 'demo-rough1', sampleId: 'DEMO-SS-002', specimenId: 'SR-01', location: 'Outer surface',
        instrument: 'Mitutoyo SJ-210', cutoff: '0.8 mm', parameter: 'Ra',
        readings: [1.85, 1.92, 1.78, 1.88, 1.90], avg: 1.87, min: 1.78, max: 1.92,
        range: 0.14, std: 0.055, specMax: 3.2, status: 'PASS',
        operator: 'M. Chen', testDate: '2026-09-22', createdAt: new Date().toISOString()
      });
      Storage.set(Storage.KEYS.roughness, rough);
    }

    const micro = Storage.get(Storage.KEYS.microstructure);
    if (!micro.find(function(t) { return t.id === 'demo-micro1'; })) {
      micro.push({
        id: 'demo-micro1', sampleId: 'DEMO-SS-002', specimenId: 'MET-01', material: '316L',
        cutting: 'Abrasive cut-off', mounting: 'Hot compression mount',
        grinding: 'SiC 120–1200 grit', polishing: '1 μm diamond, then colloidal silica',
        etchant: 'Aqua regia (3:1 HCl:HNO₃)', etchTime: '20 s', microscope: 'Olympus BX53M',
        magnification: '200X', illumination: 'Brightfield', temperature: 23,
        operator: 'M. Chen', testDate: '2026-09-22',
        observation: 'DEMO: Austenitic grain structure with annealing twins. Fine equiaxed grains (ASTM grain size ~6–7). Minor delta ferrite stringers observed. No significant inclusions or porosity detected.',
        images: [], status: 'NOT SPECIFIED', createdAt: new Date().toISOString()
      });
      Storage.set(Storage.KEYS.microstructure, micro);
    }

    showToast('Demo data loaded. Labels marked DEMO.', 'success');
    refreshDashboard();
    renderSamplesTable();
  });
}

function clearAllData() {
  confirmDialog('Clear All Data', 'This will permanently delete ALL samples, tests, and settings. Are you sure?').then(function(ok) {
    if (!ok) return;
    Object.keys(Storage.KEYS).forEach(function(k) {
      localStorage.removeItem(Storage.KEYS[k]);
    });
    showToast('All data cleared.', 'success');
    refreshDashboard();
    renderSamplesTable();
  });
}

/* ============================================================
   INITIALIZATION
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });

  document.querySelectorAll('.nav-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      navigateTo(item.dataset.page);
    });
  });

  document.getElementById('mobileMenuBtn').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('open');
  });

  document.getElementById('btnNewSample').addEventListener('click', function() { openSampleForm(); });
  document.getElementById('btnCloseSampleForm').addEventListener('click', closeSampleForm);
  document.getElementById('btnCancelSample').addEventListener('click', closeSampleForm);
  document.getElementById('sampleForm').addEventListener('submit', saveSample);
  document.getElementById('sampleSearch').addEventListener('input', function(e) {
    renderSamplesTable(e.target.value);
  });

  document.getElementById('btnNewUTM').addEventListener('click', function() { openUTMForm(); });
  document.getElementById('btnCloseUTMForm').addEventListener('click', closeUTMForm);
  document.getElementById('btnCancelUTM').addEventListener('click', closeUTMForm);
  document.getElementById('utmForm').addEventListener('submit', saveUTM);
  document.getElementById('btnCalcUTM').addEventListener('click', calculateUTM);
  document.getElementById('utmSpecimenShape').addEventListener('change', updateUTMShapeFields);
  ['utmDiameter', 'utmWidth', 'utmThickness'].forEach(function(id) {
    document.getElementById(id).addEventListener('input', calcUTMArea);
  });

  document.getElementById('btnNewComp').addEventListener('click', function() { openCompForm(); });
  document.getElementById('btnCloseCompForm').addEventListener('click', closeCompForm);
  document.getElementById('btnCancelComp').addEventListener('click', closeCompForm);
  document.getElementById('compForm').addEventListener('submit', saveComposition);
  document.getElementById('btnAddElement').addEventListener('click', addCompElement);
  document.getElementById('btnCalcComp').addEventListener('click', validateComposition);

  document.getElementById('btnNewHardness').addEventListener('click', function() { openHardnessForm(); });
  document.getElementById('btnCloseHardnessForm').addEventListener('click', closeHardnessForm);
  document.getElementById('btnCancelHardness').addEventListener('click', closeHardnessForm);
  document.getElementById('hardnessForm').addEventListener('submit', saveHardness);
  document.getElementById('btnCalcHardness').addEventListener('click', calculateHardness);

  document.getElementById('btnNewMicro').addEventListener('click', function() { openMicroForm(); });
  document.getElementById('btnCloseMicroForm').addEventListener('click', closeMicroForm);
  document.getElementById('btnCancelMicro').addEventListener('click', closeMicroForm);
  document.getElementById('microForm').addEventListener('submit', saveMicro);
  document.getElementById('microImageInput').addEventListener('change', handleMicroImageUpload);

  document.getElementById('btnNewImpact').addEventListener('click', function() { openImpactForm(); });
  document.getElementById('btnCloseImpactForm').addEventListener('click', closeImpactForm);
  document.getElementById('btnCancelImpact').addEventListener('click', closeImpactForm);
  document.getElementById('impactForm').addEventListener('submit', saveImpact);
  document.getElementById('btnCalcImpact').addEventListener('click', calculateImpact);
  ['impactInitial', 'impactFinal'].forEach(function(id) {
    document.getElementById(id).addEventListener('input', function() {
      const ini = parseFloat(document.getElementById('impactInitial').value);
      const fin = parseFloat(document.getElementById('impactFinal').value);
      if (!isNaN(ini) && !isNaN(fin)) {
        document.getElementById('impactAbsorbed').value = (ini - fin).toFixed(1);
      }
    });
  });

  document.getElementById('btnNewRoughness').addEventListener('click', function() { openRoughnessForm(); });
  document.getElementById('btnCloseRoughnessForm').addEventListener('click', closeRoughnessForm);
  document.getElementById('btnCancelRoughness').addEventListener('click', closeRoughnessForm);
  document.getElementById('roughnessForm').addEventListener('submit', saveRoughness);
  document.getElementById('btnCalcRoughness').addEventListener('click', calculateRoughness);

  document.getElementById('btnGenerateReport').addEventListener('click', generateReport);
  document.getElementById('btnPrintReport').addEventListener('click', function() { window.print(); });

  document.getElementById('btnSearchHistory').addEventListener('click', searchHistory);
  document.getElementById('btnClearHistory').addEventListener('click', function() {
    ['histReportNo', 'histSampleId', 'histCustomer', 'histMaterial', 'histStatus', 'histDateFrom', 'histDateTo'].forEach(function(id) {
      document.getElementById(id).value = '';
    });
    renderHistoryTable();
  });

  document.getElementById('settingsForm').addEventListener('submit', saveSettings);
  document.getElementById('btnClearAllData').addEventListener('click', clearAllData);
  document.getElementById('btnLoadDemo').addEventListener('click', loadDemoData);

  loadSettingsForm();
  refreshDashboard();
});

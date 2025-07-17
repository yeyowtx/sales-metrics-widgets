// widget.js — Sales Metrics Widget Engine (CST + MTD defaults)
(async () => {
  console.log('🚀 Sales Widget Loading…');

  // ——— CONFIG ———
  const WORKER_URL  = 'https://raspy-firefly-102f.laurencio.workers.dev';
  const urlParams   = new URLSearchParams(window.location.search);
  const designerId  = urlParams.get('designer');
  const isTeam      = urlParams.get('team') === 'true';
  const yearlyGoal  = parseFloat(urlParams.get('yearlyGoal'))  || 800000;
  const monthlyGoal = parseFloat(urlParams.get('monthlyGoal')) || 66667;

  // Determine metric
  let metric = urlParams.get('metric');
  if (!metric) {
    const fn = location.pathname.split('/').pop();
    if (fn.includes('ytd-sales'))           metric = 'ytd_sales_total';
    else if (fn.includes('monthly-sales'))  metric = 'monthly_sales';
    else if (fn.includes('dig-performance'))metric = 'dig_performance';
    else if (fn.includes('unit-sales'))     metric = 'unit_sales';
    else if (fn.includes('average-project-sale')) metric = 'average_project_sale';
    else if (fn.includes('lead-generation'))      metric = 'lead_generation';
  }
  console.log(`🎯 Metric → ${metric}`);

  // Designer names
  const designers = {
    '1avdHsezyj8F13jdoajF': 'Bradley Marquez',
    'yWDJbBcBXvPf1nY4Isma': 'Christian Thomas',
    '0esj2698VuyUgwigmnoL': 'Dylan Ervin',
    'ENkWUp8rRf6YF3iqR9qv': 'Erick Gavaldon',
    'kfm1oYty788FPfk1Odko': 'Laurencio Montes Jr',
    'EM8YRRRMePDUiaRxjXoI': 'Tara Yeager',
    'x5JTU601PUdVdpH2B9R9': 'Zach Rodriguez'
  };

  try {
    showLoading();

    // — Load data (fetch or fallback to embedded window._oppData) —
    let data;
    try {
      const res = await fetch(WORKER_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch {
      data = window._oppData;
      if (!data) throw new Error('Failed to load opportunities');
    }
    if (!data.success || !Array.isArray(data.opportunities)) {
      throw new Error('Invalid payload');
    }

    // — Designer filter —
    let opps = data.opportunities;
    if (designerId && !isTeam) {
      opps = opps.filter(o => o.assignedTo === designerId);
      console.log(`👤 ${designers[designerId]} → ${opps.length} opps`);
    }

    // — Compute & display —
    const result = calculateMetric(opps, metric, yearlyGoal, monthlyGoal);
    displayResult(result, metric, designerId, isTeam);
    console.log('✅ Widget loaded successfully');

  } catch (err) {
    console.error('❌ Widget error:', err);
    showError(err.message);
  }
})();

// ——————————————
// Metric calculations (CST + MTD default)
// ——————————————
function calculateMetric(opps, metric, yearlyGoal, monthlyGoal) {
  // Get CST “now”
  const tzOpts     = { timeZone: 'America/Chicago' };
  const nowCST     = new Date(new Date().toLocaleString('en-US', tzOpts));
  const thisYear   = nowCST.getFullYear();
  const thisMonth  = nowCST.getMonth(); // 0–11

  // Helper: only “won” (case-insensitive)
  const wonOpps = opps.filter(o => String(o.status).toLowerCase() === 'won');

  switch (metric) {
    case 'ytd_sales_total': {
      // YTD won
      const ytd = wonOpps.filter(o =>
        new Date(o.lastStatusChangeAt).getFullYear() === thisYear
      );
      return {
        value: ytd.reduce((sum, o) => sum + (o.monetaryValue || 0), 0),
        format: 'currency',
        label: 'YTD Sales Total'
      };
    }

    case 'average_project_sale': {
      // YTD won
      const ytd = wonOpps.filter(o =>
        new Date(o.lastStatusChangeAt).getFullYear() === thisYear
      );
      const total = ytd.reduce((sum, o) => sum + (o.monetaryValue || 0), 0);
      return {
        value: ytd.length ? total / ytd.length : 0,
        format: 'currency',
        label: 'Average Project Sale'
      };
    }

    case 'monthly_sales': {
      // MTD won
      const mtd = wonOpps.filter(o => {
        const d = new Date(o.lastStatusChangeAt);
        return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
      });
      return {
        value: mtd.reduce((sum, o) => sum + (o.monetaryValue || 0), 0),
        format: 'currency',
        label: 'Monthly Sales'
      };
    }

    case 'unit_sales': {
      // MTD won count
      const mtd = wonOpps.filter(o => {
        const d = new Date(o.lastStatusChangeAt);
        return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
      });
      return {
        value: mtd.length,
        format: 'number',
        label: 'Unit Sales'
      };
    }

    case 'dig_performance': {
      // MTD won & completed
      const mtdWon = wonOpps.filter(o => {
        const d = new Date(o.lastStatusChangeAt);
        return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
      });
      const completed = mtdWon.filter(o =>
        Array.isArray(o.contact?.tags) && o.contact.tags.includes('job completed')
      );
      const pct = mtdWon.length
        ? (completed.length / mtdWon.length) * 100
        : 0;
      return {
        value: pct,
        format: 'percentage',
        label: 'Dig Performance',
        additional: `${completed.length} completed / ${mtdWon.length} won this month`
      };
    }

    case 'lead_generation': {
      // MTD by createdAt
      const leads = opps.filter(o => {
        const d = new Date(o.createdAt);
        return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
      });
      return {
        value: leads.length,
        format: 'number',
        label: 'Lead Generation'
      };
    }

    default:
      return { value: 0, format: 'number', label: 'Unknown Metric' };
  }
}

// ——————————————
// Display & format
// ——————————————
function formatValue(v, fmt) {
  if (fmt === 'currency') {
    return new Intl.NumberFormat('en-US',{
      style: 'currency', currency: 'USD', minimumFractionDigits: 0
    }).format(v);
  }
  if (fmt === 'percentage') {
    return `${v.toFixed(1)}%`;
  }
  return new Intl.NumberFormat('en-US').format(v);
}

function displayResult(res, metric, designerId, isTeam) {
  const setText = (sel, txt) => {
    const el = document.querySelector(sel);
    if (el) { el.textContent = txt; el.style.display = ''; }
  };

  setText('.value', formatValue(res.value, res.format));
  setText('.label', res.label);
  if (res.additional) setText('.additional', res.additional);

  if (designerId || isTeam) {
    const name = isTeam
      ? 'Team Performance'
      : (designers[designerId] || 'Designer');
    setText('.designer-name', name);
  }

  setText('.last-updated',
    `Updated: ${new Date().toLocaleTimeString('en-US', {timeZone:'America/Chicago'})}`
  );
}

function showLoading() {
  const v = document.querySelector('.value');
  if (v) { v.textContent = '…'; v.classList.add('loading'); }
}

function showError(msg) {
  const v = document.querySelector('.value');
  if (v) { v.textContent = 'Error'; v.classList.add('error'); }
  const e = document.querySelector('.error');
  if (e) { e.textContent = msg; e.style.display = ''; }
}

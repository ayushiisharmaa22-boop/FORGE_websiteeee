(() => {
  'use strict';
  const D = window.FORGE_DATA;
  const { EXPERT, SECTORS, SYN } = window.FORGE_TAXONOMY;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => n.toLocaleString('en-IN');
  const PAGE = 24;

  /* ---------- Prepare data ---------- */
  const OTHER = SECTORS.length - 1;
  const expById = Object.fromEntries(EXPERT.map(e => [e.id, e]));
  const secIdxById = Object.fromEntries(SECTORS.map((s, i) => [s.id, i]));
  const divToSector = new Map();
  SECTORS.forEach((s, i) => s.div.forEach(d => divToSector.set(d, i)));
  const sectorOf = code => { const v = divToSector.get(parseInt(code.slice(0, 2), 10)); return v === undefined ? OTHER : v; };

  const B = D.biz.map((r, i) => {
    const acts = r[5].map(c => D.nic[c] || '').filter(Boolean);
    const secs = [...new Set(r[5].map(sectorOf))];
    if (!secs.length) secs.push(OTHER);
    const kw = secs.map(s => SECTORS[s].name + ' ' + SECTORS[s].kw).join(' ');
    return {
      i, name: r[0], d: r[1], pin: r[2], yr: r[3], addr: r[4], acts, secs,
      nameL: r[0].toLowerCase(),
      actL: (acts.join(' | ') + ' | ' + kw).toLowerCase(),
      locL: (r[4] + ' ' + D.districts[r[1]] + ' ' + r[2]).toLowerCase(),
    };
  });

  const F = D.faculty.map((f, i) => {
    const text = [f.field, f.spec, f.dept, f.role].join(' ').toLowerCase();
    const tags = EXPERT.filter(e => e.re.test(text)).map(e => e.id);
    const sec = SECTORS.map((s, si) => ({
      si, score: s.help.reduce((a, [t], k) => a + (tags.includes(t) ? s.help.length - k : 0), 0),
    })).filter(x => x.score > 0 && x.si !== OTHER).sort((a, b) => b.score - a.score).slice(0, 3).map(x => x.si);
    return {
      ...f, i, tags, sec,
      specs: f.spec ? f.spec.split(/;\s*/).filter(Boolean) : [],
      nameL: f.name.toLowerCase(),
      specL: (f.field + ' ' + f.spec + ' ' + tags.map(t => expById[t].label).join(' ')).toLowerCase(),
      metaL: (f.dept + ' ' + f.role + ' ' + f.inst).toLowerCase(),
    };
  });
  const institutions = [...new Set(F.map(f => f.inst))];

  const secCountAll = SECTORS.map(() => 0);
  B.forEach(b => b.secs.forEach(s => secCountAll[s]++));

  /* ---------- Query matching ---------- */
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stem = w => (w.length > 4 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);
  function matcher(a) {
    if (a.length <= 3) { const re = new RegExp('\\b' + reEsc(a) + '\\b'); return { a, test: h => re.test(h) }; }
    return { a, test: h => h.includes(a) };
  }
  function parseQuery(q) {
    return q.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 1).map(t => {
      const s = stem(t);
      return (SYN[t] || SYN[s] || [s]).map(matcher);
    });
  }
  function score(groups, fields) {
    let total = 0;
    for (const g of groups) {
      let best = 0;
      for (const [h, w] of fields) {
        if (w > best && g.some(m => m.test(h))) best = w;
      }
      if (!best) return -1;
      total += best;
    }
    return total;
  }
  function highlighter(groups) {
    const parts = [...new Set(groups.flat().map(m => m.a))].map(a => (a.length <= 3 ? '\\b' + reEsc(a) + '\\b' : reEsc(a)));
    if (!parts.length) return t => esc(t);
    const re = new RegExp('(' + parts.join('|') + ')', 'gi');
    return t => t.split(re).map((p, i) => (i % 2 ? '<mark>' + esc(p) + '</mark>' : esc(p))).join('');
  }

  const searchBiz = groups => (groups.length
    ? B.reduce((out, b) => { const sc = score(groups, [[b.actL, 3], [b.nameL, 2], [b.locL, 1]]); if (sc > 0) out.push({ b, sc }); return out; }, [])
    : B.map(b => ({ b, sc: 0 })));

  /* Rank faculty for one or more sectors. secWeights: [[sectorIndex, weight], ...] */
  function expertsFor(secWeights) {
    const tagScore = new Map(), reason = new Map();
    for (const [si, w] of secWeights) {
      const help = SECTORS[si].help;
      help.forEach(([t, why], k) => {
        tagScore.set(t, (tagScore.get(t) || 0) + w * (help.length - k));
        if (!reason.has(t)) reason.set(t, why);
      });
    }
    return F.map(f => {
      let sc = 0; const hit = [];
      for (const t of f.tags) if (tagScore.has(t)) { sc += tagScore.get(t); hit.push(t); }
      hit.sort((a, b) => tagScore.get(b) - tagScore.get(a));
      return { f, sc, reasons: hit.slice(0, 2).map(t => ({ label: expById[t].label, why: reason.get(t) })) };
    }).filter(x => x.sc > 0).sort((a, b) => b.sc - a.sc || (a.f.name < b.f.name ? -1 : 1));
  }

  /* ---------- State ---------- */
  const S = { mode: 'biz', q: '', dist: new Set(), sector: '', tag: '', inst: '', limit: PAGE };
  const QUICK = {
    biz: ['wool', 'garment', 'bamboo', 'poultry', 'honey', 'chemical', 'software'],
    fac: ['machine learning', 'IoT', 'marketing', 'nanotechnology', 'finance', 'data analytics'],
  };
  const PLACEHOLDERS = {
    biz: ['wool', 'garment', 'chemical', 'bamboo furniture', 'fish', 'weaving in Ukhrul'],
    fac: ['machine learning', 'IoT sensors', 'marketing', 'chemistry', 'accounting', 'computer vision'],
  };

  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    S.mode = p.get('m') === 'fac' ? 'fac' : 'biz';
    S.q = p.get('q') || '';
    S.dist = new Set((p.get('d') || '').split(',').filter(x => D.districts.includes(x)));
    S.sector = secIdxById[p.get('s')] !== undefined ? p.get('s') : '';
    S.tag = expById[p.get('t')] ? p.get('t') : '';
    S.inst = institutions.includes(p.get('i')) ? p.get('i') : '';
  }
  function writeHash() {
    const p = new URLSearchParams();
    if (S.mode === 'fac') p.set('m', 'fac');
    if (S.q) p.set('q', S.q);
    if (S.dist.size) p.set('d', [...S.dist].join(','));
    if (S.sector) p.set('s', S.sector);
    if (S.tag) p.set('t', S.tag);
    if (S.inst) p.set('i', S.inst);
    const h = p.toString();
    history.replaceState(null, '', h ? '#' + h : location.pathname + location.search);
  }

  /* ---------- Elements ---------- */
  const el = {
    q: $('#q'), clear: $('#clear'), quick: $('#quick'), filters: $('#filters'), results: $('#results'),
    tabs: [...document.querySelectorAll('.tabs button')], dlg: $('#help'), dlgBody: $('#help-body'),
  };

  /* ---------- Rendering ---------- */
  const countText = (n, one, many) => `<b>${fmt(n)}</b> ${n === 1 ? one : many}`;

  function renderQuick() {
    el.quick.innerHTML = '<span class="lbl">Try:</span>' + QUICK[S.mode].map(t => `<button class="chip" data-q="${esc(t)}">${esc(t)}</button>`).join('');
  }

  function renderBizFilters(distCounts, secCounts) {
    const dChips = D.districts.map((d, i) => ({ d, n: distCounts[i] || 0 })).sort((a, b) => b.n - a.n)
      .map(({ d, n }) => `<button class="chip" data-dist="${esc(d)}" aria-pressed="${S.dist.has(d)}" ${n === 0 && !S.dist.has(d) ? 'disabled' : ''}>${esc(d)}<span class="n">${fmt(n)}</span></button>`).join('');
    const opts = SECTORS.map((s, i) => ({ s, i, n: secCounts[i] || 0 })).filter(x => x.n > 0 || S.sector === x.s.id)
      .sort((a, b) => b.n - a.n)
      .map(({ s, n }) => `<option value="${s.id}" ${S.sector === s.id ? 'selected' : ''}>${esc(s.name)} (${fmt(n)})</option>`).join('');
    el.filters.innerHTML = `
      <div class="grp"><span class="lbl">District</span>${dChips}</div>
      <div class="grp"><label class="lbl" for="sec">Sector</label>
        <select id="sec"><option value="">All sectors</option>${opts}</select></div>`;
  }

  function renderFacFilters() {
    const tagCounts = {};
    F.forEach(f => f.tags.forEach(t => (tagCounts[t] = (tagCounts[t] || 0) + 1)));
    const chips = EXPERT.filter(e => tagCounts[e.id]).sort((a, b) => tagCounts[b.id] - tagCounts[a.id])
      .map(e => `<button class="chip" data-tag="${e.id}" aria-pressed="${S.tag === e.id}">${esc(e.label)}<span class="n">${tagCounts[e.id]}</span></button>`).join('');
    const inst = institutions.length > 1
      ? `<div class="grp"><label class="lbl" for="inst">Institution</label><select id="inst"><option value="">All</option>${institutions.map(i => `<option ${S.inst === i ? 'selected' : ''}>${esc(i)}</option>`).join('')}</select></div>` : '';
    el.filters.innerHTML = `<div class="grp"><span class="lbl">Expertise</span>${chips}</div>${inst}`;
  }

  function bizCard(b, hl) {
    const acts = b.acts.length
      ? `<ul class="acts">${b.acts.map(a => `<li><span class="clamp" title="${esc(a)}">${hl(a)}</span></li>`).join('')}</ul>`
      : '<p class="note">No activity listed</p>';
    return `<article class="card biz">
      <div><h3>${hl(b.name)}</h3>
        <div class="where"><span class="pill">${esc(D.districts[b.d])}</span>${b.pin ? `<span>PIN ${esc(b.pin)}</span>` : ''}</div></div>
      ${acts}
      ${b.addr ? `<p class="addr">${hl(b.addr)}</p>` : ''}
      <div class="cfoot"><span>${b.yr ? 'Registered ' + b.yr : ''}</span>
        <button class="link" data-help="${b.i}">Who can help</button></div>
    </article>`;
  }

  function facCard(f, hl, reasons) {
    const email = f.email ? `<a href="mailto:${esc(f.email)}">${esc(f.email)}</a>` : '';
    const prof = f.profile ? `<a href="${esc(f.profile)}" target="_blank" rel="noopener">Official profile</a>` : '';
    return `<article class="card fac">
      <div><h3>${hl(f.name)}</h3>
        <p class="role">${esc(f.role)}${f.dept ? ', ' + esc(f.dept) : ''}</p>
        <div class="where" style="margin-top:6px"><span class="pill">${esc(f.inst)}</span></div></div>
      ${f.specs.length ? `<ul class="tags">${f.specs.map(s => `<li>${hl(s)}</li>`).join('')}</ul>` : (f.field ? `<p class="note">${hl(f.field)}</p>` : '')}
      ${reasons && reasons.length ? `<ul class="why">${reasons.map(r => `<li><b>${esc(r.label)}:</b> ${esc(r.why)}</li>`).join('')}</ul>` : ''}
      ${f.sec.length ? `<div class="helps"><span>Fits businesses in</span>${f.sec.map(si => `<button data-sector="${SECTORS[si].id}">${esc(SECTORS[si].name)}</button>`).join('')}</div>` : ''}
      <div class="cfoot"><div class="contacts">${email}${prof}</div></div>
    </article>`;
  }

  function moreButton(shown, total) {
    return shown < total ? `<div class="more"><button class="btn solid" data-more>Show ${Math.min(PAGE, total - shown)} more</button></div>` : '';
  }

  function emptyState(what) {
    return `<div class="empty"><h2>No ${what} found</h2>
      <p>Nothing matches “${esc(S.q)}” with the current filters.</p>
      <ul><li>Try one word, such as <b>wool</b> instead of <b>wool shawl</b>.</li><li>Remove a district or sector filter.</li><li>Check the spelling.</li></ul></div>`;
  }

  let lastRows = [];   // for CSV export

  function renderBiz() {
    const groups = parseQuery(S.q);
    const hl = highlighter(groups);
    const base = searchBiz(groups);

    const distCounts = [], secCounts = [];
    const dOk = r => !S.dist.size || S.dist.has(D.districts[r.b.d]);
    const sOk = r => !S.sector || r.b.secs.includes(secIdxById[S.sector]);
    for (const r of base) {
      if (sOk(r)) distCounts[r.b.d] = (distCounts[r.b.d] || 0) + 1;
      if (dOk(r)) r.b.secs.forEach(s => (secCounts[s] = (secCounts[s] || 0) + 1));
    }
    renderBizFilters(distCounts, secCounts);

    const browsing = !groups.length && !S.dist.size && !S.sector;
    if (browsing) {
      lastRows = [];
      const max = Math.max(...secCountAll);
      const tiles = SECTORS.map((s, i) => ({ s, n: secCountAll[i] })).filter(x => x.n).sort((a, b) => b.n - a.n)
        .map(({ s, n }) => `<button class="tile" data-sector="${s.id}"><span class="top-row"><span class="nm">${esc(s.name)}</span><span class="ct">${fmt(n)}</span></span><span class="bar"><i style="width:${Math.max(3, n / max * 100)}%"></i></span></button>`).join('');
      el.results.innerHTML = `<section class="browse"><h2>Browse by sector</h2>
        <p>${fmt(B.length)} registered businesses across ${D.districts.length} districts. Pick a sector, or search above for a specific product.</p>
        <div class="tiles">${tiles}</div></section>`;
      return;
    }

    const rows = base.filter(r => dOk(r) && sOk(r))
      .sort((a, b) => b.sc - a.sc || (a.b.nameL < b.b.nameL ? -1 : a.b.nameL > b.b.nameL ? 1 : 0));
    lastRows = rows;
    const scope = [S.sector && SECTORS[secIdxById[S.sector]].name, S.dist.size && 'in ' + [...S.dist].join(', ')].filter(Boolean).join(' ');
    if (!rows.length) { el.results.innerHTML = emptyState('businesses'); return; }

    el.results.innerHTML = `<div class="rhead"><h2 aria-live="polite">${countText(rows.length, 'business', 'businesses')}${S.q ? ` matching “${esc(S.q)}”` : ''}${scope ? `<span class="note" style="font:400 1rem var(--font-body)"> (${esc(scope)})</span>` : ''}</h2>
      <button class="btn" data-csv>Download as CSV</button></div>
      <div class="grid">${rows.slice(0, S.limit).map(r => bizCard(r.b, hl)).join('')}</div>
      ${moreButton(Math.min(S.limit, rows.length), rows.length)}`;
  }

  function renderFac() {
    renderFacFilters();
    const groups = parseQuery(S.q);
    const hl = highlighter(groups);
    const pool = F.filter(f => (!S.tag || f.tags.includes(S.tag)) && (!S.inst || f.inst === S.inst));
    const direct = [];
    for (const f of pool) {
      if (!groups.length) { direct.push({ f, sc: 0 }); continue; }
      const sc = score(groups, [[f.specL, 3], [f.nameL, 2], [f.metaL, 1]]);
      if (sc > 0) direct.push({ f, sc });
    }
    direct.sort((a, b) => b.sc - a.sc || (a.f.nameL < b.f.nameL ? -1 : 1));

    // Faculty who are not a text match but suit the sectors where this query finds businesses
    let related = [], relSectors = [];
    if (groups.length) {
      const counts = {};
      for (const r of searchBiz(groups)) r.b.secs.forEach(s => (counts[s] = (counts[s] || 0) + 1));
      relSectors = Object.entries(counts).map(([s, n]) => [+s, n]).filter(([s, n]) => n >= 3 && s !== OTHER)
        .sort((a, b) => b[1] - a[1]).slice(0, 2);
      if (relSectors.length) {
        const have = new Set(direct.map(d => d.f.i));
        related = expertsFor(relSectors).filter(x => !have.has(x.f.i) && pool.includes(x.f)).slice(0, 9);
      }
    }
    lastRows = direct.map(d => ({ f: d.f })).concat(related.map(r => ({ f: r.f })));

    if (!direct.length && !related.length) { el.results.innerHTML = emptyState('faculty'); return; }

    let html = '';
    if (direct.length) {
      html += `<div class="rhead"><h2 aria-live="polite">${countText(direct.length, 'faculty member', 'faculty')}${S.q ? ` with “${esc(S.q)}” in their specialisation` : ''}</h2>
        <button class="btn" data-csv>Download as CSV</button></div>
        <div class="grid">${direct.slice(0, S.limit).map(d => facCard(d.f, hl)).join('')}</div>
        ${moreButton(Math.min(S.limit, direct.length), direct.length)}`;
    } else {
      html += `<div class="rhead"><h2 aria-live="polite">No faculty have “${esc(S.q)}” as a specialisation</h2></div>`;
    }
    if (related.length) {
      html += `<h3 class="sub">Could help businesses that work with “${esc(S.q)}”<small>Suggested from the sectors where this search finds businesses: ${relSectors.map(([s]) => esc(SECTORS[s].name)).join(' and ')}.</small></h3>
        <div class="grid">${related.map(r => facCard(r.f, t => esc(t), r.reasons)).join('')}</div>`;
    }
    el.results.innerHTML = html;
  }

  /* ---------- Orchestration ---------- */
  function syncControls() {
    el.tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.mode === S.mode)));
    if (el.q.value !== S.q) el.q.value = S.q;
    el.clear.hidden = !S.q;
    renderQuick();
    $('#lede').textContent = S.mode === 'biz'
      ? 'Type a product, material or service to see which registered MSMEs make or do it, and where.'
      : 'Type a skill or specialisation to find faculty, or a product to see who could help the businesses making it.';
    setPlaceholder();
  }

  function render() {
    syncControls();
    if (S.mode === 'biz') renderBiz(); else renderFac();
    writeHash();
  }
  function renderResultsOnly() {
    el.clear.hidden = !S.q;
    if (S.mode === 'biz') renderBiz(); else renderFac();
    writeHash();
  }

  let phTimer, phIdx = 0;
  function setPlaceholder() {
    clearInterval(phTimer);
    const list = PLACEHOLDERS[S.mode];
    el.q.placeholder = 'Try ' + list[0];
    phIdx = 0;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    phTimer = setInterval(() => {
      if (document.activeElement === el.q || el.q.value) return;
      phIdx = (phIdx + 1) % list.length;
      el.q.placeholder = 'Try ' + list[phIdx];
    }, 2600);
  }

  function setMode(m) {
    if (S.mode === m) return;
    S.mode = m; S.dist = new Set(); S.sector = ''; S.tag = ''; S.inst = ''; S.limit = PAGE;
    render();
  }

  /* ---------- Help dialog ---------- */
  function openHelp(i) {
    const b = B[i];
    const ex = expertsFor(b.secs.map(s => [s, 1])).slice(0, 8);
    const secNames = b.secs.map(s => SECTORS[s].name);
    const cards = ex.length
      ? ex.map(x => facCard(x.f, t => esc(t), x.reasons)).join('')
      : '<p class="note">No faculty in the directory match this sector yet. More institutions will be added.</p>';
    el.dlgBody.innerHTML = `<h2 id="help-title">Faculty who can help ${esc(b.name)}</h2>
      <p class="dlg-lead">Sector: ${esc(secNames.join(', '))}.${b.acts.length ? ' Activity: ' + esc(b.acts[0]) : ''}</p>
      <div class="dlg-list">${cards}</div>
      <p class="dlg-note">Suggestions are based on the business sector and each faculty member's listed specialisation. Check their profile before getting in touch.</p>`;
    el.dlg.showModal();
    el.dlg.scrollTop = 0;
  }

  /* ---------- CSV ---------- */
  function downloadCsv() {
    const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    let head, lines;
    if (S.mode === 'biz') {
      head = ['Enterprise', 'District', 'Pincode', 'Address', 'Registered', 'Activities'];
      lines = lastRows.map(r => [r.b.name, D.districts[r.b.d], r.b.pin, r.b.addr, r.b.yr || '', r.b.acts.join(' | ')]);
    } else {
      head = ['Name', 'Designation', 'Institution', 'Department', 'Field', 'Specialisation', 'Email', 'Profile'];
      lines = lastRows.map(r => [r.f.name, r.f.role, r.f.inst, r.f.dept, r.f.field, r.f.spec, r.f.email, r.f.profile]);
    }
    const csv = '\ufeff' + [head, ...lines].map(l => l.map(q).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `forge-${S.mode === 'biz' ? 'businesses' : 'faculty'}${S.q ? '-' + S.q.replace(/\W+/g, '-') : ''}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* ---------- Events ---------- */
  let raf;
  el.q.addEventListener('input', () => {
    S.q = el.q.value.trim(); S.limit = PAGE;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => setTimeout(renderResultsOnly, 40));
  });
  el.clear.addEventListener('click', () => { S.q = ''; el.q.value = ''; S.limit = PAGE; render(); el.q.focus(); });
  el.tabs.forEach(t => t.addEventListener('click', () => setMode(t.dataset.mode)));
  $('#help-x').addEventListener('click', () => el.dlg.close());
  el.dlg.addEventListener('click', e => { if (e.target === el.dlg) el.dlg.close(); });

  document.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.q) { S.q = t.dataset.q; S.limit = PAGE; render(); return; }
    if (t.dataset.dist) {
      S.dist.has(t.dataset.dist) ? S.dist.delete(t.dataset.dist) : S.dist.add(t.dataset.dist);
      S.limit = PAGE; render(); return;
    }
    if (t.dataset.tag) { S.tag = S.tag === t.dataset.tag ? '' : t.dataset.tag; S.limit = PAGE; render(); return; }
    if (t.dataset.sector) {   // jump to businesses in a sector (from a tile or a faculty card)
      if (el.dlg.open) el.dlg.close();
      const sec = t.dataset.sector;
      if (S.mode !== 'biz') { S.mode = 'biz'; S.dist = new Set(); S.tag = ''; S.inst = ''; S.q = ''; }
      S.sector = sec; S.limit = PAGE; render();
      $('#panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (t.dataset.help) { openHelp(+t.dataset.help); return; }
    if (t.hasAttribute('data-more')) { S.limit += PAGE; renderResultsOnly(); return; }
    if (t.hasAttribute('data-csv')) { downloadCsv(); }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'sec') { S.sector = e.target.value; S.limit = PAGE; render(); }
    if (e.target.id === 'inst') { S.inst = e.target.value; S.limit = PAGE; render(); }
  });
  window.addEventListener('hashchange', () => { readHash(); render(); });

  /* ---------- Footer note ---------- */
  $('#datanote').textContent =
    `Currently listing ${fmt(B.length)} registered MSMEs from ${D.districts.length} Manipur districts (${[...D.districts].sort().join(', ')}) and ${F.length} faculty from ${institutions.join(', ')}.`;

  readHash();
  render();
})();

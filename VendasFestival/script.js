function v(id) { return parseFloat(document.getElementById(id).value) || 0; }
function fmt(n) { return n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }

function calc(resetSlider) {
  const slider = document.getElementById('soldSlider');

  const barrelCost = v('barrelCost');
  const barrelL    = v('barrelL');
  const copoCL     = v('copoCL');
  const sinRate    = v('sinRate') / 100;
  const nBarrels   = v('nBarrels') || 1;
  const nReturned  = Math.min(v('nReturned') || 0, nBarrels - 1);
  const nUsed      = nBarrels - nReturned;
  const copoL = copoCL / 100;
  const usableL = barrelL * (1 - sinRate);
  const totalFinos = Math.floor(usableL / copoL);
  const finosBrutosPorBarril = Math.floor(barrelL / copoL); // sem sinistros
  const finosSinistros = (finosBrutosPorBarril - totalFinos) * nBarrels; // perdidos por sinistros
  const totalFinosBrutoEvento = totalFinos * nUsed;
  const finosOferecidosTunas = Math.round((v('nTunas') || 0) * (v('avgPessoas') || 0) * (v('nSenhas') || 3));
  const finosOferecidos = finosOferecidosTunas;
  const totalFinosEvento = Math.max(0, totalFinosBrutoEvento - finosOferecidosTunas);
  const finosPagos = Math.round(totalFinosEvento / nBarrels);
  const totalCost = barrelCost * nUsed;
  const custoPorFino = totalFinos > 0 ? barrelCost / totalFinos : 0;
  const custoTunas = finosOferecidosTunas * custoPorFino; // custo de oportunidade (informativo)

  // Happy Hour (Plano A only)
  const hhActive  = document.getElementById('hhActive').checked;
  const hhActiveB = document.getElementById('hhActiveB') ? document.getElementById('hhActiveB').checked : false;
  const hhFinos  = v('hhFinos') || 100;
  const hhPrice  = v('hhPrice') || 0.50;

  const sliderMax = Math.max(200, totalFinosEvento + 30);
  slider.max = sliderMax;
  document.getElementById('sliderMax').textContent = sliderMax;
  // Quick-set buttons


  const ownCupRate = v('ownCup') / 100;
  const packFinos   = v('packFinos') || 10;
  const packPrice   = v('packPrice');
  const packRate    = v('packRate') / 100;
  const packActiveA = document.getElementById('packActiveA').checked;
  const packActiveB = document.getElementById('packActiveB').checked;
  const cupCost  = v('cupCost');
  const packCups  = v('packCups') || 1;
  const rpfPack = (packPrice - cupCost * packCups) / packFinos;

  const plans = {
    A: { fino: v('aFino'), copo: v('aCopo'), ret: 0 }, // venda, sem retorno
    B: { fino: v('bFino'), copo: v('bCopo'), ret: v('bRet') / 100 },
  };

  const res = {};
  for (const [k, p] of Object.entries(plans)) {
    const caucaoRetida = p.copo * (1 - p.ret);
    // 50% trazem copo próprio → não pagam copo; 50% pagam copo
    const rpfIndiv = p.fino + caucaoRetida * (1 - ownCupRate);
    const packOn = k === 'A' ? packActiveA : packActiveB;
    const effPackRate = packOn ? packRate : 0;
    // Happy Hour: only Plan A, hhFinos out of totalFinosEvento
    const hhOn = k === 'A' ? hhActive : hhActiveB;
    const hhRate = hhOn ? Math.min(hhFinos / totalFinosEvento, 1 - effPackRate) : 0;
    const effIndivRate = 1 - effPackRate - hhRate;
    const rpf = effIndivRate * rpfIndiv + effPackRate * rpfPack + hhRate * hhPrice;
    const be = rpf > 0 ? Math.ceil(totalCost / rpf) : Infinity;
    const beOfPagos = totalFinosEvento > 0 ? (be / totalFinosEvento) * 100 : 0;
    res[k] = { p, rpf, rpfIndiv, effPackRate, effIndivRate, hhRate, be, caucaoRetida, beOfPagos };
  }

  // Plan cards
  for (const k of ['A', 'B']) {
    const r = res[k];
    document.getElementById(`be${k}`).textContent = isFinite(r.be) ? r.be : '∞';
    document.getElementById(`be${k}Tot`).textContent = '';
    document.getElementById(`meta${k}`).innerHTML =
      (k === 'A' ? `fino ${fmt(r.p.fino)} + venda copo ${fmt(r.p.copo)} · ${Math.round(ownCupRate*100)}% copo próprio<br>` : `fino ${fmt(r.p.fino)} · caução ${fmt(r.p.copo)} · devolve ${Math.round(r.p.ret*100)}% · ${Math.round(ownCupRate*100)}% copo próprio<br>`) +
      `pack ${Math.round(r.effPackRate*100)}% (${fmt(rpfPack)}/fino) · indiv ${Math.round(r.effIndivRate*100)}%<br>` +
      `receita/fino: <strong>${fmt(r.rpf)}</strong>`;
    document.getElementById(`stats${k}`).innerHTML = `
      <div class="mini-row"><span>Finos disponíveis (evento)</span><span class="v">${totalFinosEvento}</span></div>
      <div class="mini-row"><span>Finos oferecidos</span><span class="v">${finosOferecidos}</span></div>
      <div class="mini-row"><span>BE (${fmt(totalCost)} / ${fmt(r.rpf)})</span><span class="v">${isFinite(r.be) ? r.be + ' finos' : '∞'}</span></div>
      <div class="mini-row"><span>% dos ${totalFinosEvento} disp. para BE</span><span class="v">${isFinite(r.beOfPagos) ? r.beOfPagos.toFixed(1) + '%' : '—'}</span></div>
    `;
  }

  // Badges
  const beA = res['A'].be, beB = res['B'].be;
  // Quick buttons
  const _curSold = parseInt(slider.value) || 0;
  const _beMin = Math.min(isFinite(beA)?beA:Infinity, isFinite(beB)?beB:Infinity);
  const pctPresets = [25, 50, 75, 100];
  const _btns = pctPresets.map(pct => {
    const val = Math.round(totalFinosEvento * pct / 100);
    return `<button class="quick-btn ${_curSold===val?'active':''}" onclick="document.getElementById('soldSlider').value=${val};window._sliderTriggered=true;calc();window._sliderTriggered=false;">${pct}%</button>`;
  });
  _btns.unshift(`<button class="quick-btn ${_curSold===_beMin?'active':''}" style="border-color:rgba(92,232,154,0.4);color:var(--green)" onclick="document.getElementById('soldSlider').value=${isFinite(_beMin)?_beMin:0};window._sliderTriggered=true;calc();window._sliderTriggered=false;">BE mín</button>`);
  document.getElementById('quickBtns').innerHTML = _btns.join('');
  const better = beA < beB ? 'A' : beB < beA ? 'B' : null;
  const minBoth = Math.min(isFinite(beA) ? beA : Infinity, isFinite(beB) ? beB : Infinity);
  if (!window._sliderTriggered && isFinite(minBoth) && minBoth > 0) {
    slider.value = minBoth;
  }

  let sold = parseInt(slider.value) || 0;
  document.getElementById('soldVal').textContent = sold + ' finos';
  document.getElementById('profitN').textContent = sold;

  for (const k of ['A', 'B']) {
    const el = document.getElementById(`badge${k}`);
    if (!better) { el.textContent = ''; el.className = 'status-badge'; }
    else if (k === better) { el.textContent = 'Melhor BE'; el.className = 'status-badge badge-better'; }
    else { el.textContent = 'Pior BE'; el.className = 'status-badge badge-worse'; }
  }

  // Progress bars
  for (const k of ['A', 'B']) {
    const r = res[k];
    const pct = isFinite(r.be) && r.be > 0 ? Math.min((sold / r.be) * 100, 100) : 0;
    document.getElementById(`bar${k}`).style.width = pct + '%';
    const remaining = isFinite(r.be) ? Math.max(r.be - sold, 0) : '∞';
    const _sc = Math.min(sold, totalFinosEvento);
    const moneyIn = _sc * r.rpf;
    const moneyLeft = Math.max(totalCost - moneyIn, 0);
    document.getElementById(`pLabel${k}`).textContent =
      isFinite(r.be) && sold >= r.be
        ? `✓ BE atingido (+${sold - r.be} finos · +${fmt(moneyIn - totalCost)} lucro)`
        : `faltam ${remaining} finos · ${fmt(moneyLeft)}`;
  }

  // Profit table
  const soldCapped = Math.min(sold, totalFinosEvento);
  const soldIndivA = soldCapped * res['A'].effIndivRate;
  const soldPackA  = soldCapped * res['A'].effPackRate;
  const soldIndivB = soldCapped * res['B'].effIndivRate;
  const soldPackB  = soldCapped * res['B'].effPackRate;
  const rows = [];

  for (const k of ['A', 'B']) {
    const r = res[k];
    const _soldIndiv = k === 'A' ? soldIndivA : soldIndivB;
    const _soldPack  = k === 'A' ? soldPackA  : soldPackB;
    const coposPagos = _soldIndiv * (1 - ownCupRate);
    rows.push({
      label: k,
      soldIndiv: _soldIndiv,
      soldPack: _soldPack,
      revFino: _soldIndiv * r.p.fino,
      caucaoCobrada: coposPagos * r.p.copo,
      caucaoDevolvida: coposPagos * r.p.copo * r.p.ret,
      caucaoRetida: coposPagos * r.p.copo * (1 - r.p.ret),
      total: soldCapped * r.rpf,
      profit: soldCapped * r.rpf - totalCost,
    });
  }

  const rA = rows[0], rB = rows[1];

  function pRow(label, vA, vB, neg=false, isTot=false) {
    const sign = neg ? '−' : '';
    const colorA = neg ? 'var(--red)' : (isTot ? (vA >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--A)');
    const colorB = neg ? 'var(--red)' : (isTot ? (vB >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--B)');
    const fA = neg ? `−${fmt(Math.abs(vA))}` : (isTot ? (vA >= 0 ? `+${fmt(vA)}` : fmt(vA)) : fmt(vA));
    const fB = neg ? `−${fmt(Math.abs(vB))}` : (isTot ? (vB >= 0 ? `+${fmt(vB)}` : fmt(vB)) : fmt(vB));
    return `<div class="p-row${isTot?' total':''}">
      <span class="k">${label}</span>
      <div class="vals">
        <span style="color:${colorA}">${fA}</span>
        <span style="color:${colorB}">${fB}</span>
      </div>
    </div>`;
  }

  const copoLabelA = `Venda copo (${100-Math.round(v('ownCup'))}% pagam)`;
  const copoLabelB = `Caução copo (${100-Math.round(v('ownCup'))}% pagam)`;
  document.getElementById('profitTable').innerHTML =

    pRow(`Finos individuais`, rA.revFino, rB.revFino) +
    pRow(`Pack @ ${fmt(rpfPack)}/fino (bruto ${fmt(packPrice/packFinos)})`, rA.soldPack * rpfPack, rB.soldPack * rpfPack) +
    (cupCost > 0 && v('packCups') > 0 ? pRow(`Custo copos pack (${v('packCups')}×${fmt(cupCost)})`, -(rA.soldPack / packFinos * v('packCups') * cupCost), -(rB.soldPack / packFinos * v('packCups') * cupCost), true) : '') +
    `<div class="p-row">
      <span class="k">${copoLabelA} / ${copoLabelB}</span>
      <div class="vals">
        <span style="color:var(--A)">${fmt(rA.caucaoCobrada)}</span>
        <span style="color:var(--B)">${fmt(rB.caucaoCobrada)}</span>
      </div>
    </div>` +
    `<div class="p-row">
      <span class="k">Caução devolvida (só B)</span>
      <div class="vals">
        <span style="color:var(--muted)">—</span>
        <span style="color:var(--red)">−${fmt(rB.caucaoDevolvida)}</span>
      </div>
    </div>` +
    pRow('Receita total', rA.total, rB.total) +
    (hhActive ? pRow(`HH (${hhFinos} senhas @ ${fmt(hhPrice)})`, rA.soldPack > 0 || true ? Math.min(hhFinos, totalFinosEvento * res['A'].hhRate) * hhPrice : 0, 0) : '') +
    pRow(`Custo ${nUsed}×barris${nReturned > 0 ? ' ('+nReturned+' devolvidos)' : ''}`, totalCost, totalCost, true) +

    pRow('Lucro / Prejuízo', rA.profit, rB.profit, false, true);
}

calc();

function calcBE(barrelCost, finosPagos, finoPrice, copoPrice, ret, ownCup, packRate, packActiveForPlan, rpfPack, hhRate=0, hhPrice=0) {
  const caucaoRetida = copoPrice * (1 - ret);
  const rpfIndiv = finoPrice + caucaoRetida * (1 - ownCup);
  const effPackRate = packActiveForPlan ? packRate : 0;
  const effIndivRate = 1 - effPackRate - hhRate;
  const rpf = effIndivRate * rpfIndiv + effPackRate * rpfPack + hhRate * hhPrice;
  return rpf > 0 ? Math.ceil(barrelCost / rpf) : Infinity;
}

function updateSensitivity() {
  const barrelCost = v('barrelCost');
  const barrelL    = v('barrelL');
  const copoCL     = v('copoCL');
  const sinRate    = v('sinRate') / 100;
  const copoL      = copoCL / 100;
  const usableL    = barrelL * (1 - sinRate);
  const totalFinos = Math.floor(usableL / copoL);
  const _totalFinosEvento2 = totalFinos * (v('nBarrels') || 1);
  const finosPagos = Math.max(_totalFinosEvento2 - Math.round(v('nTunas') * v('avgPessoas') * v('nSenhas')), 0);

  const aFino = v('aFino'); const aCopo = v('aCopo');
  const bFino = v('bFino'); const bCopo = v('bCopo'); const bRet = v('bRet') / 100;
  const ownCup  = v('ownCup') / 100;
  const packRate = v('packRate') / 100;
  const packActiveA = document.getElementById('packActiveA').checked;
  const packActiveB = document.getElementById('packActiveB').checked;
  const _cupCost = v('cupCost'); const _packCups = v('packCups') || 1;
  const rpfPack = ((v('packPrice') || 8) - _cupCost * _packCups) / (v('packFinos') || 10);

  const _nBarrels = v('nBarrels') || 1;
  const _totalFinosEvento = Math.max(Math.floor(v('barrelL')*(1-v('sinRate')/100)/(v('copoCL')/100)) * _nBarrels - Math.round(v('nTunas')*v('avgPessoas')*v('nSenhas')), 0);
  const _hhActive = document.getElementById('hhActive').checked;
  const _hhFinos = v('hhFinos') || 100;
  const _hhPrice = v('hhPrice') || 0.50;
  const _hhRateA = (_hhActive && _totalFinosEvento > 0) ? Math.min(_hhFinos / _totalFinosEvento, 1 - (packActiveA ? packRate : 0)) : 0;
  const _nReturned = Math.min(v('nReturned') || 0, _nBarrels - 1);
  const _nUsed = _nBarrels - _nReturned;
  const _totalCost = (v('barrelCost') || 95) * _nUsed;
  const baseA = calcBE(_totalCost, _totalFinosEvento, aFino, aCopo, 0,    ownCup,  packRate, packActiveA, rpfPack, _hhRateA, _hhPrice);
  const baseB = calcBE(_totalCost, _totalFinosEvento, bFino, bCopo, bRet, ownCup,  packRate, packActiveB, rpfPack);
  const maxBE = Math.max(baseA, baseB, 1);

  function sensRows(elId, steps, calcA, calcB, currentVal) {
    const el = document.getElementById(elId);
    const beValues = steps.map(s => ({ s, a: calcA(s), b: calcB(s) }));

    // Marginal % change: each line vs the immediately previous line
    const margA = beValues.map(({a}, i) => {
      if (i === 0) return null;
      const prev = beValues[i-1].a;
      if (!isFinite(a) || !isFinite(prev) || prev === 0) return null;
      return (a - prev) / prev * 100;
    });
    const margB = beValues.map(({b}, i) => {
      if (i === 0) return null;
      const prev = beValues[i-1].b;
      if (!isFinite(b) || !isFinite(prev) || prev === 0) return null;
      return (b - prev) / prev * 100;
    });

    // Diminishing returns: marginal improvement shrinking vs previous step
    const dimA = margA.map((m, i) => {
      if (i <= 1 || m === null || margA[i-1] === null) return false;
      const impCur = -m, impPrev = -margA[i-1];
      return impCur > 0 && impPrev > 0 && impCur < impPrev;
    });
    const dimB = margB.map((m, i) => {
      if (i <= 1 || m === null || margB[i-1] === null) return false;
      const impCur = -m, impPrev = -margB[i-1];
      return impCur > 0 && impPrev > 0 && impCur < impPrev;
    });

    const fmtMarg = (m) => {
      if (m === null) return '—';
      const r = Math.round(m * 10) / 10;
      if (Math.abs(r) < 0.05) return '—';
      return (r > 0 ? '+' : '') + r + '%';
    };

    el.innerHTML = beValues.map(({ s, a, b }, i) => {
      const isActive = Math.abs(s - currentVal) < 0.001;
      const mA = margA[i], mB = margB[i];
      const isDimA = dimA[i], isDimB = dimB[i];
      const colorA = isActive ? 'sens-highlight' : isDimA ? 'sens-bad' : (mA === null ? 'sens-neut' : mA > 0 ? 'sens-bad' : mA < 0 ? 'sens-good' : 'sens-neut');
      const colorB = isActive ? 'sens-highlight' : isDimB ? 'sens-bad' : (mB === null ? 'sens-neut' : mB > 0 ? 'sens-bad' : mB < 0 ? 'sens-good' : 'sens-neut');
      return `<div class="sens-row">
        <span class="sens-val-label ${isActive ? 'active' : ''}">${Math.round(s * 100)}%</span>
        <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;flex:1">
          <span style="font-size:0.68rem;color:var(--muted);min-width:32px;text-align:right">${isFinite(a)?a:'∞'}</span>
          <span class="sens-num ${colorA}">${isActive ? '●' : fmtMarg(mA)}</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;flex:1">
          <span style="font-size:0.68rem;color:var(--muted);min-width:32px;text-align:right">${isFinite(b)?b:'∞'}</span>
          <span class="sens-num ${colorB}">${isActive ? '●' : fmtMarg(mB)}</span>
        </div>
      </div>`;
    }).join('');
  }

  // Copo próprio: 0% → 100%
  const ownSteps = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  sensRows('sensCopoProprio', ownSteps,
    s => calcBE(barrelCost, finosPagos, aFino, aCopo, 0,    s,      packRate, packActiveA, rpfPack),
    s => calcBE(barrelCost, finosPagos, bFino, bCopo, bRet, s,      packRate, packActiveB, rpfPack),
    ownCup);

  // Devolução de copos: só afecta B (A tem ret=0 fixo)
  const retSteps = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  sensRows('sensDevolver', retSteps,
    s => calcBE(barrelCost, finosPagos, aFino, aCopo, 0, ownCup, packRate, packActiveA, rpfPack),
    s => calcBE(barrelCost, finosPagos, bFino, bCopo, s, ownCup, packRate, packActiveB, rpfPack),
    bRet);

  // % vendas em pack: 0% → 80%
  const packSteps = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
  sensRows('sensPack', packSteps,
    s => calcBE(barrelCost, finosPagos, aFino, aCopo, 0,    ownCup, s, packActiveA, rpfPack),
    s => calcBE(barrelCost, finosPagos, bFino, bCopo, bRet, ownCup, s, packActiveB, rpfPack),
    packRate);
}

const _origCalc = calc;
calc = function() { _origCalc(); updateSensitivity(); };
calc();
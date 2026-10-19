// "Today": the daily gift, the daily trivia question, the mini games and the prize counter.
// Missing a day never loses anything; everything simply refreshes on a new day.

import { DAILY, TRIVIA_REWARD, SKEEBALL, MATCHING, PRIZES } from '../data/arcade.js';
import { TRIVIA } from '../data/trivia.js';
import { playSkeeBall, playMatching } from './minigames.js';
import { MINIGOLF, HOLES } from '../data/minigolf.js';
import { playGolfHole, drawHolePreview } from './minigolf.js';
import { ICONS } from './art.js';

const pad = n => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); };
const $ = sel => document.querySelector(sel);

// Shuffle a question's answers the same way every time (so it doesn't change on reopen).
function shuffled(list, seed) {
  let s = seed * 9301 + 49297;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return list.map((v, i) => ({ v, i, k: rand() })).sort((a, b) => a.k - b.k);
}

export function createArcade(api) {
  // api: getS, save, renderAll, celebrate, toast, buzz, openSheet, closeSheets, placeFoods, placeWild, freeCells, artPool, checkBadges
  const S = () => api.getS();
  let stopGame = null;
  let current = null; // the game being played: { kind, modeKey }

  function daily() {
    const s = S();
    if (!s.daily || s.daily.day !== dayKey()) s.daily = { day: dayKey(), gift: false, trivia: null, plays: { skee: 0, match: 0, golf: 0 } };
    s.daily.plays.golf ??= 0;
    return s.daily;
  }
  const freePlays = kind => kind === 'golf' ? MINIGOLF.freeHoles : DAILY.freePlays;
  const playsLeft = kind => Math.max(0, freePlays(kind) - daily().plays[kind]);
  const somethingNew = () => { const d = daily(); return !d.gift || !d.trivia || playsLeft('skee') > 0 || playsLeft('match') > 0 || playsLeft('golf') > 0; };

  // Mini golf progress: her best score on each hole.
  const golf = () => (S().golf ??= { best: {} });
  // Stars: under par (or a hole in one) 3, par 2, up to par + 2 one, more none.
  function starsFor(hole, strokes) {
    if (strokes == null) return 0;
    const diff = strokes - hole.par;
    return strokes === 1 || diff < 0 ? 3 : diff === 0 ? 2 : diff <= 2 ? 1 : 0;
  }
  const holeOpen = i => i === 0 || starsFor(HOLES[i - 1], golf().best[HOLES[i - 1].id]) >= MINIGOLF.unlockStars;
  const starText = n => '\u2605'.repeat(n) + '\u2606'.repeat(3 - n);

  function give(g) {
    const s = S();
    if (g.dollars) { s.dollars += g.dollars; s.stats.earned += g.dollars; }
    if (g.gems) s.gems += g.gems;
    if (g.charges) s.charges += g.charges;
    if (g.wildcards) s.wildcards += g.wildcards;
    if (g.decor && !s.decor.includes(g.decor)) s.decor.push(g.decor);
    if (g.foods) api.placeFoods(g.foods.tier, g.foods.count);
    api.save();
  }

  // ---------- the Today panel ----------
  function render() {
    const s = S(), d = daily();
    const gameCard = (kind, title, blurb, cfg) => {
      const left = playsLeft(kind);
      const modeKey = s.settings[`${kind}Mode`] || 'relaxed';
      const modes = Object.entries(cfg.modes).map(([k, m]) =>
        `<button class="mode${k === modeKey ? ' on' : ''}" data-mode="${kind}:${k}">${m.name}</button>`).join('');
      const play = left > 0 ? `Play (${left} left)` : `Play: ${DAILY.extraPlayGems} gem`;
      return `<li class="today-card"><div class="today-text"><b>${title}</b><span>${blurb}</span>
        <div class="modes">${modes}</div></div>
        <button class="btn primary" data-play="${kind}"${left === 0 && s.gems < DAILY.extraPlayGems ? ' disabled' : ''}>${play}</button></li>`;
    };
    const golfCard = () => {
      const left = playsLeft('golf'), modeKey = s.settings.golfMode || 'relaxed';
      const opened = HOLES.filter((h, i) => holeOpen(i)).length;
      const modes = Object.entries(MINIGOLF.modes).map(([k, m]) =>
        `<button class="mode${k === modeKey ? ' on' : ''}" data-mode="golf:${k}">${m.name}</button>`).join('');
      return `<li class="today-card"><div class="today-text"><b>Mini golf</b>
        <span>A sunny Florida course with a restaurant on every hole. Get par to open the next one. ${opened} of ${HOLES.length} holes open.</span>
        <div class="modes">${modes}</div></div>
        <button class="btn primary" data-play="golf">${left > 0 ? `Play (${left} free)` : 'Play'}</button></li>`;
    };
    $('#today-list').innerHTML = `
      <li class="today-card${d.gift ? ' done' : ' glow'}"><div class="today-text"><b>Daily gift</b>
        <span>${d.gift ? 'Opened. A new gift tomorrow!' : `$${DAILY.gift.dollars}, ${DAILY.gift.gems} gem and a wild card.`}</span></div>
        ${d.gift ? `<span class="upg-done">${ICONS.check}</span>` : '<button class="btn primary" data-today="gift">Open</button>'}</li>
      <li class="today-card${d.trivia ? ' done' : ' glow'}"><div class="today-text"><b>Daily food trivia</b>
        <span>${d.trivia ? `Answered${s.triviaStreak > 1 ? `. ${s.triviaStreak} days in a row!` : '.'} A new question tomorrow.` : 'One question a day. Win gems.'}</span></div>
        ${d.trivia ? `<span class="upg-done">${ICONS.check}</span>` : '<button class="btn primary" data-today="trivia">Play</button>'}</li>
      ${gameCard('skee', 'Skee ball', 'Grab a ball, flick it up the hill and into the rings. Win gems.', SKEEBALL)}
      ${gameCard('match', 'Food match', 'Flip cards to find the pairs. Win gems.', MATCHING)}
      ${golfCard()}
      <li class="today-card"><div class="today-text"><b>Gem shop</b><span>Wild cards, foods and decorations. You have ${s.gems} gems.</span></div>
        <button class="btn" data-today="prizes">Open</button></li>
      <li class="today-card"><div class="today-text"><b>Wild cards: ${s.wildcards}</b><span>Drop one on any food to make a copy.</span></div>
        <button class="btn" data-today="wild"${s.wildcards ? '' : ' disabled'}>Use one</button></li>`;
  }

  function open() { render(); api.openSheet('#today'); }

  $('#today-list').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const s = S();
    if (b.dataset.mode) {
      const [kind, m] = b.dataset.mode.split(':');
      s.settings[`${kind}Mode`] = m;
      api.buzz('tap');
      render(); api.save();
    } else if (b.dataset.play) startGame(b.dataset.play);
    else if (b.dataset.today === 'gift') openGift();
    else if (b.dataset.today === 'trivia') openTrivia();
    else if (b.dataset.today === 'prizes') openPrizes();
    else if (b.dataset.today === 'wild') {
      if (s.wildcards > 0 && api.placeWild()) { s.wildcards--; api.closeSheets(); api.toast('Wild card on the board. Drop it on any food!'); api.renderAll(); api.save(); }
      else api.toast('No room on the board. Make some space first.');
    }
  });

  function openGift() {
    const d = daily();
    if (d.gift) return;
    d.gift = true;
    give({ dollars: DAILY.gift.dollars, gems: DAILY.gift.gems, wildcards: DAILY.gift.wildcards });
    render();
    api.celebrate({ art: `<div class="cele-emoji">${ICONS.gift}</div>`, title: 'Your daily gift!', name: 'See you tomorrow', line: `Plus a wild card: tap "Use one" under Wild cards to put it on your board.`, reward: DAILY.gift.dollars, gems: DAILY.gift.gems });
    api.renderAll();
  }

  // ---------- daily trivia ----------
  function openTrivia() {
    const s = S(), d = daily();
    if (d.trivia) return;
    const idx = s.triviaIndex % TRIVIA.length, q = TRIVIA[idx];
    const opts = shuffled(q.a, idx + 7);
    $('#trivia-q').textContent = q.q;
    $('#trivia-opts').innerHTML = opts.map(o => `<button class="btn trivia-opt" data-right="${o.i === 0}">${o.v}</button>`).join('');
    $('#trivia-result').hidden = true;
    api.openSheet('#trivia');
  }
  $('#trivia-opts').addEventListener('click', e => {
    const b = e.target.closest('.trivia-opt');
    const s = S(), d = daily();
    if (!b || d.trivia) return;
    const right = b.dataset.right === 'true';
    const q = TRIVIA[s.triviaIndex % TRIVIA.length];
    document.querySelectorAll('.trivia-opt').forEach(o => {
      o.disabled = true;
      if (o.dataset.right === 'true') o.classList.add('right');
    });
    if (!right) b.classList.add('wrong');
    let reward;
    if (right) {
      s.triviaStreak = s.triviaLastRight === yesterdayKey() ? s.triviaStreak + 1 : 1;
      s.triviaLastRight = dayKey();
      s.stats.triviaRight++;
      const bonus = Math.min(TRIVIA_REWARD.streakBonusMax, TRIVIA_REWARD.streakBonus * (s.triviaStreak - 1));
      reward = { gems: TRIVIA_REWARD.right.gems + bonus };
    } else {
      s.triviaStreak = 0;
      reward = { gems: TRIVIA_REWARD.wrong.gems };
    }
    give(reward);
    d.trivia = right ? 'right' : 'wrong';
    s.triviaIndex++;
    api.buzz(right ? 'serve' : 'tap');
    const streak = right && s.triviaStreak > 1 ? ` ${s.triviaStreak} days in a row!` : '';
    $('#trivia-result').innerHTML = `<b>${right ? 'Right!' : 'Not quite.'}${streak}</b><span>${q.fact}</span>
      <span class="trivia-win">+${reward.gems} gem${reward.gems > 1 ? 's' : ''}</span>`;
    $('#trivia-result').hidden = false;
    api.checkBadges();
    api.renderAll();
    api.save();
  });

  // ---------- prize counter ----------
  function openPrizes() {
    const s = S();
    $('#prize-count').textContent = `You have ${s.gems} gems.`;
    $('#prize-list').innerHTML = PRIZES.map(p => {
      const owned = p.give.decor && s.decor.includes(p.give.decor);
      return `<li class="today-card${owned ? ' done' : ''}"><div class="today-text"><b>${p.name}</b>
        <span>${owned ? 'On your restaurant!' : `${p.cost} gems`}</span></div>
        ${owned ? `<span class="upg-done">${ICONS.check}</span>` : `<button class="btn primary" data-prize="${p.id}"${s.gems < p.cost ? ' disabled' : ''}>Get</button>`}</li>`;
    }).join('');
    api.openSheet('#prizes');
  }
  $('#prize-list').addEventListener('click', e => {
    const b = e.target.closest('[data-prize]');
    if (!b) return;
    const s = S(), p = PRIZES.find(x => x.id === b.dataset.prize);
    if (!p || s.gems < p.cost) return;
    // Don't take gems for foods that won't fit.
    if (p.give.foods && api.freeCells() < p.give.foods.count) {
      api.toast(`Make room for ${p.give.foods.count} foods on your board first.`);
      return;
    }
    s.gems -= p.cost;
    give(p.give);
    api.buzz('serve');
    api.toast(p.give.decor ? `${p.name} added. Have a look in the restaurant!` : `${p.name}: yours!`);
    openPrizes();
    api.renderAll();
  });

  // ---------- playing a mini game ----------
  function startGame(kind) {
    if (kind === 'golf') { api.closeSheets(); openCourse(); return; }
    const s = S(), d = daily();
    let paid;
    if (playsLeft(kind) > 0) { d.plays[kind]++; paid = 'free'; }
    else if (s.gems >= DAILY.extraPlayGems) { s.gems -= DAILY.extraPlayGems; paid = 'gem'; }
    else return;
    const cfg = kind === 'skee' ? SKEEBALL : MATCHING;
    const modeKey = s.settings[`${kind}Mode`] || 'relaxed';
    current = { kind, modeKey, paid, finished: false };
    api.closeSheets();
    api.save();
    const overlay = $('#game');
    overlay.hidden = false;
    $('#game-title').textContent = kind === 'skee' ? 'Skee ball' : 'Food match';
    const stage = $('#game-stage');
    const hooks = {
      buzz: api.buzz,
      status: t => { $('#game-status').textContent = t; },
      finish: r => finishGame(r),
    };
    // Start right away (the overlay is already showing, so the stage has its size).
    stopGame = kind === 'skee'
      ? playSkeeBall(stage, cfg.modes[modeKey], cfg, hooks)
      : playMatching(stage, cfg.modes[modeKey], cfg, hooks, api.artPool());
  }

  function finishGame(r) {
    if (current.kind === 'golf') { finishGolf(r); return; }
    const s = S();
    const { kind, modeKey } = current;
    current.finished = true;
    let reward, title, line, win = false;
    if (kind === 'skee') {
      const m = SKEEBALL.modes[modeKey];
      win = r.score >= m.winScore;
      reward = { gems: Math.floor(r.score / SKEEBALL.pointsPerGem) * m.gemsTimes + (r.score >= SKEEBALL.gemScore ? 1 : 0) };
      title = `${r.score} points!`;
      line = win ? 'A winning roll!' : `Nice rolling. Every ${SKEEBALL.pointsPerGem} points earns a gem.`;
    } else {
      const m = MATCHING.modes[modeKey];
      win = r.all;
      reward = { gems: Math.floor(r.found / MATCHING.pairsPerGem) * m.rewardTimes };
      let line2 = `${MATCHING.allPairsFoods} bonus foods are on your board.`;
      if (win) {
        // Foods that don't fit are paid out as gems instead, so nothing is lost.
        const missed = MATCHING.allPairsFoods - api.placeFoods(2, MATCHING.allPairsFoods);
        if (missed) { reward.gems += missed * MATCHING.fullBoardGems; line2 = `Your board was full, so you got ${missed * MATCHING.fullBoardGems} extra gems instead of ${missed} bonus foods.`; }
      }
      title = r.all ? 'All pairs found!' : `${r.found} pairs found`;
      line = r.all ? line2 : 'You keep everything you found.';
    }
    if (win) s.stats.arcadeWins++;
    give(reward);
    api.checkBadges();
    $('#game-stage').innerHTML = `<div class="game-result">
      <p class="cele-title">${title}</p><p class="cele-line">${line}</p>
      <p class="cele-reward">${reward.dollars ? `${ICONS.coin}<span>+${reward.dollars}</span>` : ''}
        ${reward.gems ? `${ICONS.gem}<span>+${reward.gems}</span>` : ''}</p>
      <div class="btn-row"><button class="btn" id="game-again">Play again</button><button class="btn primary" id="game-done">Done</button></div></div>`;
    const left = playsLeft(kind);
    $('#game-again').textContent = left > 0 ? `Play again (${left} free)` : `Again for ${DAILY.extraPlayGems} gem`;
    $('#game-again').disabled = left === 0 && s.gems < DAILY.extraPlayGems;
    api.renderAll();
  }

  // Stop whatever is playing. Leaving before the end gives the play (or the gem) back.
  function stopCurrent() {
    stopGame?.();
    stopGame = null;
    if (current && !current.finished) {
      const s = S();
      if (current.paid === 'free') daily().plays[current.kind] = Math.max(0, daily().plays[current.kind] - 1);
      else if (current.paid === 'gem') s.gems += DAILY.extraPlayGems;
      current.finished = true;
      api.save();
    }
  }

  function leaveGame() {
    stopCurrent();
    $('#game').hidden = true;
    $('#game-stage').innerHTML = '';
    api.renderAll();
  }

  // ---------- mini golf ----------
  const golfHooks = {
    buzz: (...a) => api.buzz(...a),
    status: t => { $('#game-status').textContent = t; },
    finish: r => finishGame(r),
  };

  // The course map: every hole, its stars, and which ones are still locked.
  function openCourse(msg = '') {
    stopCurrent();
    current = { kind: 'golf', screen: 'course', finished: true };
    const s = S(), g = golf(), left = playsLeft('golf');
    const modeKey = s.settings.golfMode || 'relaxed';
    const total = HOLES.reduce((t, h) => t + starsFor(h, g.best[h.id]), 0);
    $('#game').hidden = false;
    $('#game-title').textContent = 'Mini golf';
    $('#game-status').textContent = `\u2605 ${total} of ${HOLES.length * 3}`;
    const stage = $('#game-stage');
    stage.innerHTML = `<div class="golf-course">
      <p class="golf-note">${left > 0 ? `${left} free ${left === 1 ? 'hole' : 'holes'} left today` : `Free holes are used up today. One more costs ${DAILY.extraPlayGems} gem.`} · ${MINIGOLF.modes[modeKey].name}</p>
      <p class="golf-msg" id="golf-msg"${msg ? '' : ' hidden'}>${msg}</p>
      <div class="golf-grid">${HOLES.map((h, i) => {
        const open = holeOpen(i), best = g.best[h.id];
        return `<button class="golf-tile${open ? '' : ' locked'}" data-hole="${i}" aria-label="Hole ${i + 1}, ${h.name}${open ? '' : ', locked'}">
          <canvas aria-hidden="true"></canvas><span class="golf-num">${i + 1}</span>
          <b>${h.name}</b>
          ${open ? `<span class="golf-stars">${starText(starsFor(h, best))}</span><small>Par ${h.par}${best ? ` · best ${best}` : ''}</small>`
                 : `<span class="golf-lock">Get par on hole ${i} to open</span>`}
        </button>`;
      }).join('')}</div></div>`;
    stage.querySelectorAll('.golf-tile canvas').forEach((c, i) => drawHolePreview(c, HOLES[i]));
  }

  function startHole(i) {
    const s = S(), d = daily();
    const showMsg = t => { const el = $('#golf-msg'); if (el) { el.textContent = t; el.hidden = false; } else openCourse(t); };
    if (!holeOpen(i)) { api.buzz('nope'); showMsg(`Hole ${i + 1} is locked. Get par on hole ${i} (${HOLES[i - 1].name}) to open it.`); return; }
    let paid;
    if (playsLeft('golf') > 0) { d.plays.golf++; paid = 'free'; }
    else if (s.gems >= DAILY.extraPlayGems) { s.gems -= DAILY.extraPlayGems; paid = 'gem'; }
    else { api.buzz('nope'); showMsg('No free holes left today, and no gems. Come back tomorrow for more!'); return; }
    const modeKey = s.settings.golfMode || 'relaxed';
    current = { kind: 'golf', screen: 'hole', hole: i, modeKey, paid, finished: false };
    api.save();
    $('#game-title').textContent = `Hole ${i + 1}`;
    stopGame = playGolfHole($('#game-stage'), HOLES[i], MINIGOLF.modes[modeKey], golfHooks);
  }

  function finishGolf(r) {
    const s = S(), g = golf(), i = current.hole, hole = HOLES[i], m = MINIGOLF.modes[current.modeKey];
    current.finished = true;
    stopGame = null;
    const stars = starsFor(hole, r.strokes);
    const last = i === HOLES.length - 1;
    const wasOpen = last || holeOpen(i + 1);
    const best = g.best[hole.id];
    if (r.strokes != null && (best == null || r.strokes < best)) g.best[hole.id] = r.strokes;
    const opened = !wasOpen && holeOpen(i + 1);
    const reward = { gems: MINIGOLF.gems[stars] * m.gemsTimes + (r.holeInOne ? MINIGOLF.holeInOneGems : 0) };
    if (stars >= MINIGOLF.unlockStars) s.stats.arcadeWins++;
    give(reward);
    api.checkBadges();
    const title = r.strokes == null ? 'Out of shots' : r.holeInOne ? 'Hole in one!' : `${r.strokes} shots`;
    let line;
    if (opened) line = `New hole open: ${HOLES[i + 1].name}!`;
    else if (stars >= MINIGOLF.unlockStars) line = last ? 'You beat the whole course!' : 'Great putting!';
    else line = last ? `Get par (${hole.par} shots) to beat the whole course!` : `Get par (${hole.par} shots) to open the next hole.`;
    const next = !last && holeOpen(i + 1);
    const left = playsLeft('golf');
    $('#game-stage').innerHTML = `<div class="game-result">
      <p class="cele-title">${title}</p><p class="golf-big-stars">${starText(stars)}</p><p class="cele-line">${line}</p>
      <p class="cele-reward">${reward.dollars ? `${ICONS.coin}<span>+${reward.dollars}</span>` : ''}
        ${reward.gems ? `${ICONS.gem}<span>+${reward.gems}</span>` : ''}</p>
      <div class="btn-row"><button class="btn" data-hole="${i}">Try again</button>
        ${next ? `<button class="btn primary" data-hole="${i + 1}">Next hole</button>` : ''}</div>
      <button class="btn ghost" id="golf-course">See the course</button>
      <p class="muted small">${left > 0 ? `${left} free ${left === 1 ? 'hole' : 'holes'} left today` : `Each hole costs ${DAILY.extraPlayGems} gem now`}</p></div>`;
    api.renderAll();
  }

  $('#game').addEventListener('click', e => {
    const hole = e.target.closest('[data-hole]');
    if (hole) { stopCurrent(); startHole(+hole.dataset.hole); }
    else if (e.target.closest('#golf-course')) openCourse();
    else if (e.target.closest('#game-leave') && current?.kind === 'golf' && current.screen === 'hole') openCourse();
    else if (e.target.closest('#game-leave') || e.target.closest('#game-done')) leaveGame();
    else if (e.target.closest('#game-again')) { const k = current.kind; leaveGame(); startGame(k); }
  });

  return { open, openPrizes, somethingNew, dayKey };
}

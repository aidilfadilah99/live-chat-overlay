const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

let total = 0;
let timer = null;
let liveStartTime = null;
let tiktokConnected = false;
let youtubeConnected = false;

let tiktokStats = { viewers: 0, likes: 0 };
let youtubeStats = { viewers: 0, likes: 0 };

const formatNumber = n => new Intl.NumberFormat('id-ID', {
  notation: n >= 10000 ? 'compact' : 'standard',
  maximumFractionDigits: 1
}).format(n || 0);

function createAvatar(data, customUrl = data.avatar) {
  if (customUrl) {
    const img = document.createElement('img');
    img.className = 'avatar';
    img.src = customUrl;
    img.alt = '';
    return img;
  }
  const div = document.createElement('div');
  div.className = `avatar ${data.platform || ''}`;
  const initial = (data.nickname || data.username || '?')[0].toUpperCase();
  div.textContent = initial;
  return div;
}

function trimFeed() {
  const feed = $('#feed');
  while (feed.children.length > 150) {
    feed.firstElementChild.remove();
  }
  feed.scrollTop = feed.scrollHeight;
}

function renderAggregatedStats() {
  const viewersEl = $('#viewers');
  const likesEl = $('#likes');

  if (tiktokConnected && youtubeConnected) {
    // Mode Dual: Jumlahkan penonton & likes dari TikTok dan YouTube
    const totalViewers = (tiktokStats.viewers || 0) + (youtubeStats.viewers || 0);
    const totalLikes = (tiktokStats.likes || 0) + (youtubeStats.likes || 0);

    viewersEl.textContent = totalViewers > 0 ? formatNumber(totalViewers) : '—';
    likesEl.textContent = formatNumber(totalLikes);

    viewersEl.parentElement.title = `Total Penonton: ${formatNumber(totalViewers)} (TT: ${formatNumber(tiktokStats.viewers)} | YT: ${formatNumber(youtubeStats.viewers)})`;
    likesEl.parentElement.title = `Total Likes: ${formatNumber(totalLikes)} (TT: ${formatNumber(tiktokStats.likes)} | YT: ${formatNumber(youtubeStats.likes)})`;
  } else if (tiktokConnected) {
    // Mode TikTok Saja
    viewersEl.textContent = tiktokStats.viewers > 0 ? formatNumber(tiktokStats.viewers) : '—';
    likesEl.textContent = formatNumber(tiktokStats.likes);

    viewersEl.parentElement.title = `Penonton TikTok: ${formatNumber(tiktokStats.viewers)}`;
    likesEl.parentElement.title = `Likes TikTok: ${formatNumber(tiktokStats.likes)}`;
  } else if (youtubeConnected) {
    // Mode YouTube Saja
    viewersEl.textContent = youtubeStats.viewers > 0 ? formatNumber(youtubeStats.viewers) : '—';
    likesEl.textContent = formatNumber(youtubeStats.likes);

    viewersEl.parentElement.title = `Penonton YouTube: ${formatNumber(youtubeStats.viewers)}`;
    likesEl.parentElement.title = `Likes YouTube: ${formatNumber(youtubeStats.likes)}`;

    // Sembunyikan top viewers & joins TikTok jika hanya YouTube yang aktif
    $('#top').hidden = true;
    $('#join').hidden = true;
  } else {
    // Keduanya Offline
    viewersEl.textContent = '—';
    likesEl.textContent = '0';
    viewersEl.parentElement.title = 'Penonton aktif saat ini';
    likesEl.parentElement.title = 'Total like siaran';
    $('#top').hidden = true;
    $('#join').hidden = true;
  }
}

function updateDurationTimer() {
  const isAnyConnected = tiktokConnected || youtubeConnected;
  $('#disconnect-all').hidden = !isAnyConnected;

  if (isAnyConnected) {
    if (!liveStartTime) liveStartTime = Date.now();
    if (!timer) {
      const tick = () => {
        const diff = Math.floor((Date.now() - liveStartTime) / 1000);
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        $('#duration').textContent = [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
      };
      tick();
      timer = setInterval(tick, 1000);
    }
  } else {
    clearInterval(timer);
    timer = null;
    liveStartTime = null;
    $('#duration').textContent = '00:00:00';
  }

  renderAggregatedStats();
}

// Platform Tabs Logic
$$('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tabName = btn.dataset.tab;

    $('#form-tiktok').hidden = tabName !== 'tiktok';
    $('#form-youtube').hidden = tabName !== 'youtube';
    $('#pane-dual').hidden = tabName !== 'dual';
  });
});

// Sync Inputs between single & dual tabs
$('#tiktok-username').addEventListener('input', e => {
  $('#dual-tiktok-username').value = e.target.value;
});
$('#dual-tiktok-username').addEventListener('input', e => {
  $('#tiktok-username').value = e.target.value;
});
$('#youtube-input').addEventListener('input', e => {
  $('#dual-youtube-input').value = e.target.value;
});
$('#dual-youtube-input').addEventListener('input', e => {
  $('#youtube-input').value = e.target.value;
});

// TikTok Connect / Disconnect Handler
async function handleTiktokAction() {
  $('#tiktok-error').textContent = '';
  $('#dual-tiktok-error').textContent = '';

  if (tiktokConnected) {
    await window.overlay.disconnectTiktok();
    return;
  }

  const username = ($('#tiktok-username').value || $('#dual-tiktok-username').value || '').trim();
  if (!username) {
    const msg = 'Masukkan username TikTok.';
    $('#tiktok-error').textContent = msg;
    $('#dual-tiktok-error').textContent = msg;
    return;
  }

  const result = await window.overlay.connectTiktok(username);
  if (!result.ok) {
    const isOffline = /offline|not live|isn't live/i.test(result.error);
    const msg = isOffline ? 'Akun ini sedang tidak LIVE atau LIVE tidak publik.' : result.error;
    $('#tiktok-error').textContent = msg;
    $('#dual-tiktok-error').textContent = msg;
  }
}

$('#form-tiktok').addEventListener('submit', e => {
  e.preventDefault();
  handleTiktokAction();
});
$('#dual-tiktok-connect').addEventListener('click', handleTiktokAction);

// YouTube Connect / Disconnect Handler
async function handleYoutubeAction() {
  $('#youtube-error').textContent = '';
  $('#dual-youtube-error').textContent = '';

  if (youtubeConnected) {
    await window.overlay.disconnectYoutube();
    return;
  }

  const input = ($('#youtube-input').value || $('#dual-youtube-input').value || '').trim();
  if (!input) {
    const msg = 'Masukkan link video, ID live, atau handle YouTube.';
    $('#youtube-error').textContent = msg;
    $('#dual-youtube-error').textContent = msg;
    return;
  }

  const result = await window.overlay.connectYoutube(input);
  if (!result.ok) {
    const msg = result.error || 'Gagal terhubung ke live stream YouTube.';
    $('#youtube-error').textContent = msg;
    $('#dual-youtube-error').textContent = msg;
  }
}

$('#form-youtube').addEventListener('submit', e => {
  e.preventDefault();
  handleYoutubeAction();
});
$('#dual-youtube-connect').addEventListener('click', handleYoutubeAction);

// Disconnect All
$('#disconnect-all').addEventListener('click', async () => {
  await window.overlay.disconnect();
});

// Status Updates from Backend
window.overlay.onStatus(data => {
  const platform = data.platform;
  const isTiktok = platform === 'tiktok';
  const isYoutube = platform === 'youtube';

  if (isTiktok) {
    tiktokConnected = data.state === 'connected';
    if (!tiktokConnected) {
      tiktokStats = { viewers: 0, likes: 0 };
    }
    const pill = $('#status-tiktok');
    pill.className = `status-pill ${data.state}`;
    pill.querySelector('.status-txt').textContent = data.state === 'connected' ? 'Live' : (data.state === 'connecting' ? 'Connecting' : 'Offline');

    const btnText = data.state === 'connected' ? 'Putuskan' : (data.state === 'connecting' ? 'Menghubungkan…' : 'Hubungkan');
    const isConnecting = data.state === 'connecting';

    $('#tiktok-connect').textContent = btnText;
    $('#tiktok-connect').disabled = isConnecting;
    $('#tiktok-connect').classList.toggle('danger', tiktokConnected);

    $('#dual-tiktok-connect').textContent = btnText;
    $('#dual-tiktok-connect').disabled = isConnecting;
    $('#dual-tiktok-connect').classList.toggle('danger', tiktokConnected);
  }

  if (isYoutube) {
    youtubeConnected = data.state === 'connected';
    if (!youtubeConnected) {
      youtubeStats = { viewers: 0, likes: 0 };
    }
    const pill = $('#status-youtube');
    pill.className = `status-pill ${data.state}`;
    pill.querySelector('.status-txt').textContent = data.state === 'connected' ? 'Live' : (data.state === 'connecting' ? 'Connecting' : 'Offline');

    const btnText = data.state === 'connected' ? 'Putuskan' : (data.state === 'connecting' ? 'Menghubungkan…' : 'Hubungkan');
    const isConnecting = data.state === 'connecting';

    $('#youtube-connect').textContent = btnText;
    $('#youtube-connect').disabled = isConnecting;
    $('#youtube-connect').classList.toggle('danger', youtubeConnected);

    $('#dual-youtube-connect').textContent = btnText;
    $('#dual-youtube-connect').disabled = isConnecting;
    $('#dual-youtube-connect').classList.toggle('danger', youtubeConnected);
  }

  updateDurationTimer();
});

// Chat Stream Event Handler
window.overlay.onChat(data => {
  if (!data.comment) return;
  $('#empty')?.remove();

  const item = document.createElement('article');
  const platform = data.platform || 'tiktok';
  item.className = `entry ${platform}`;
  if (data.isSuperChat) item.classList.add('superchat');

  const body = document.createElement('div');
  body.className = 'body';

  const name = document.createElement('div');
  name.className = 'name';

  // Badge TT (hitam, tulisan putih) & YT (merah, tulisan putih)
  const badge = document.createElement('span');
  badge.className = `platform-tag ${platform}`;
  badge.textContent = platform === 'youtube' ? 'YT' : 'TT';

  const b = document.createElement('b');
  b.textContent = data.nickname || data.username;

  const handle = document.createElement('span');
  handle.className = 'handle';
  handle.textContent = platform === 'tiktok' ? `@${data.username}` : '';

  name.append(badge, b);
  if (handle.textContent) name.append(handle);

  if (data.isSuperChat && data.superChatAmount) {
    const scBadge = document.createElement('span');
    scBadge.className = 'sc-badge';
    scBadge.textContent = data.superChatAmount;
    name.append(scBadge);
  }

  const p = document.createElement('p');
  p.className = 'text';
  p.textContent = data.comment;

  body.append(name, p);
  item.append(createAvatar(data), body);

  $('#feed').append(item);
  total++;
  $('#count').textContent = `${total} komentar`;
  trimFeed();
});

// Member join notification (TikTok)
window.overlay.onMember(data => {
  if (!tiktokConnected) return;
  const box = $('#join');
  const a = $('#join-avatar');
  $('#join-name').textContent = data.nickname || `@${data.username}`;
  a.replaceChildren();

  if (data.avatar) {
    const img = document.createElement('img');
    img.src = data.avatar;
    a.append(img);
  } else {
    a.textContent = (data.nickname || data.username || '?')[0].toUpperCase();
  }

  box.hidden = false;
  box.style.animation = 'none';
  requestAnimationFrame(() => {
    box.style.animation = '';
  });
});

// Live Stats Handler (Viewers & Likes)
window.overlay.onStats(data => {
  if (data.platform === 'tiktok') {
    if (Number.isFinite(data.viewers)) tiktokStats.viewers = data.viewers;
    if (Number.isFinite(data.likes)) tiktokStats.likes = data.likes;

    if (data.topViewers?.length && tiktokConnected) {
      const list = $('#top-list');
      list.replaceChildren(...data.topViewers.map(v => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = v.nickname || `@${v.username}`;
        return chip;
      }));
      $('#top').hidden = false;
    }
  } else if (data.platform === 'youtube') {
    if (Number.isFinite(data.viewers)) youtubeStats.viewers = data.viewers;
    if (Number.isFinite(data.likes)) youtubeStats.likes = data.likes;
  }

  renderAggregatedStats();
});

// Activity Stream Event Handler (Gifts, Super Chat, Shares, Follows)
window.overlay.onActivity(data => {
  if (!data.nickname && !data.username) return;
  $('#empty')?.remove();

  const item = document.createElement('article');
  item.className = `entry activity ${data.type} ${data.platform || ''}`;

  const body = document.createElement('div');
  body.className = 'body';

  const p = document.createElement('p');
  p.className = 'text';

  const prefix = data.platform === 'youtube' ? '[YouTube] ' : '[TikTok] ';

  if (data.type === 'gift') {
    p.textContent = `${prefix}${data.nickname} mengirim ${data.giftName} ×${data.amount}`;
  } else if (data.type === 'superchat') {
    p.textContent = `${prefix}${data.nickname} mengirim Super Chat ${data.amount}`;
  } else if (data.type === 'share') {
    p.textContent = `${prefix}${data.nickname} membagikan LIVE`;
  } else if (data.type === 'follow') {
    p.textContent = `${prefix}${data.nickname} mulai mengikuti host`;
  }

  body.append(p);
  item.append(createAvatar(data, data.image || data.avatar), body);
  $('#feed').append(item);
  trimFeed();
});

// Settings & Controls
$('#gear').onclick = () => {
  $('#settings').hidden = !$('#settings').hidden;
};
$('#settings-close').onclick = () => {
  $('#settings').hidden = true;
};
$('#font').oninput = e => {
  document.documentElement.style.setProperty('--size', `${e.target.value}px`);
};
$('#opacity').oninput = e => {
  document.documentElement.style.setProperty('--opacity', e.target.value / 100);
};
$('#topmost').onchange = e => {
  window.overlay.alwaysOnTop(e.target.checked);
};
$('#passthrough').onchange = e => {
  window.overlay.clickThrough(e.target.checked);
};

document.querySelectorAll('[data-size]').forEach(button => {
  button.onclick = () => window.overlay.setSize(button.dataset.size);
});

window.overlay.onClickThroughState(enabled => {
  $('#passthrough').checked = enabled;
  document.body.classList.toggle('passthrough', enabled);
  if (enabled) $('#settings').hidden = true;
});

$('#min').onclick = () => window.overlay.minimize();
$('#close').onclick = () => window.overlay.close();

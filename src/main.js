import { app, BrowserWindow, ipcMain, screen, globalShortcut } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import axios from 'axios';
import { TikTokLiveConnection, WebcastEvent, ControlEvent } from 'tiktok-live-connector';
import { LiveChat } from 'youtube-chat';
import { fetchLivePage } from 'youtube-chat/dist/requests.js';

const here = path.dirname(fileURLToPath(import.meta.url));
let win;
let liveTiktok;
let liveYoutube;
let intentionalDisconnectTiktok = false;
let intentionalDisconnectYoutube = false;
let clickThrough = false;

let youtubeStatsInterval = null;
let currentYoutubeOptions = null;

const send = (channel, payload) => {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
};

function normalizeTiktokUser(user = {}) {
  const image = user.profilePicture || user.avatarThumb || user.avatarMedium || user.avatarLarge;
  return {
    platform: 'tiktok',
    username: user.uniqueId || user.displayId || user.display_id || 'penonton',
    nickname: user.nickname || user.uniqueId || user.displayId || 'Penonton',
    avatar: image?.urlList?.[0] || image?.url?.[0] || ''
  };
}

function normalizeYoutubeUser(author = {}) {
  return {
    platform: 'youtube',
    username: author.name || 'penonton',
    nickname: author.name || 'Penonton',
    avatar: author.thumbnail?.url || ''
  };
}

function parseYoutubeInput(input) {
  const str = String(input || '').trim();
  if (!str) return null;
  const vMatch = str.match(/(?:v=|\/live\/|\/v\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (vMatch) return { liveId: vMatch[1] };
  const cMatch = str.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (cMatch) return { channelId: cMatch[1] };
  const hMatch = str.match(/(?:youtube\.com\/)?@([a-zA-Z0-9_.-]+)/);
  if (hMatch) return { handle: '@' + hMatch[1] };
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(str)) return { channelId: str };
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return { liveId: str };
  return { handle: str.startsWith('@') ? str : '@' + str };
}

function createWindow() {
  const area = screen.getPrimaryDisplay().workArea;
  win = new BrowserWindow({
    width: 440, height: Math.min(760, area.height - 70),
    x: area.x + area.width - 475, y: area.y + 35,
    minWidth: 320, minHeight: 300,
    transparent: true, frame: false, resizable: true,
    alwaysOnTop: true, backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(here, 'preload.cjs'),
      contextIsolation: true, nodeIntegration: false
    }
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.loadFile(path.join(here, 'index.html'));
}

function setClickThrough(enabled) {
  clickThrough = Boolean(enabled);
  win?.setIgnoreMouseEvents(clickThrough, { forward: true });
  send('window:click-through-state', clickThrough);
}

function setWindowSize(preset) {
  if (!win) return;
  const sizes = { small: [320, 420], medium: [440, 680], large: [560, 820] };
  const requested = sizes[preset] || sizes.medium;
  const area = screen.getDisplayMatching(win.getBounds()).workArea;
  const width = Math.min(requested[0], area.width);
  const height = Math.min(requested[1], area.height);
  win.setSize(width, height, true);
  const bounds = win.getBounds();
  win.setPosition(
    Math.min(Math.max(bounds.x, area.x), area.x + area.width - width),
    Math.min(Math.max(bounds.y, area.y), area.y + area.height - height),
    true
  );
}

async function disconnectTiktok() {
  intentionalDisconnectTiktok = true;
  const current = liveTiktok;
  liveTiktok = undefined;
  if (current) try { await current.disconnect(); } catch {}
  send('live:status', { platform: 'tiktok', state: 'idle', text: 'TikTok terputus' });
}

function disconnectYoutube() {
  intentionalDisconnectYoutube = true;
  if (youtubeStatsInterval) {
    clearInterval(youtubeStatsInterval);
    youtubeStatsInterval = null;
  }
  currentYoutubeOptions = null;
  const current = liveYoutube;
  liveYoutube = undefined;
  if (current) try { current.stop(); } catch {}
  send('live:status', { platform: 'youtube', state: 'idle', text: 'YouTube terputus' });
}

async function disconnectAll() {
  await Promise.allSettled([disconnectTiktok(), Promise.resolve(disconnectYoutube())]);
}

async function pollYoutubeStats() {
  if (!currentYoutubeOptions || !liveYoutube) return;
  try {
    const res = await axios.post(`https://www.youtube.com/youtubei/v1/updated_metadata?key=${currentYoutubeOptions.apiKey}`, {
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: currentYoutubeOptions.clientVersion
        }
      },
      videoId: currentYoutubeOptions.liveId
    });

    let viewers = 0;
    const actions = res.data?.actions || [];
    const viewership = actions.find(a => a.updateViewershipAction)?.updateViewershipAction;
    const viewText = viewership?.viewCount?.videoViewCountRenderer?.viewCount?.simpleText || '';
    if (viewText) {
      viewers = parseInt(viewText.replace(/[^0-9]/g, ''), 10) || 0;
    }

    let likes = 0;
    const raw = JSON.stringify(res.data || {});
    const matchNum = raw.match(/"likeCountIfIndifferentNumber":"(\d+)"/);
    if (matchNum) {
      likes = parseInt(matchNum[1], 10) || 0;
    } else {
      const matchContent = raw.match(/"expandedLikeCountIfIndifferent":\{"content":"([^"]+)"\}/);
      if (matchContent) {
        likes = parseInt(matchContent[1].replace(/[^0-9]/g, ''), 10) || 0;
      }
    }

    send('live:stats', {
      platform: 'youtube',
      viewers,
      likes,
      updatedAt: Date.now()
    });
  } catch (err) {
    // silently ignore network jitter
  }
}

function bindTiktokEvents(connection) {
  connection.on(WebcastEvent.CHAT, data => send('live:chat', {
    ...normalizeTiktokUser(data.user), comment: data.comment || data.content || ''
  }));

  connection.on(WebcastEvent.MEMBER, data => {
    send('live:member', normalizeTiktokUser(data.user));
  });

  connection.on(WebcastEvent.ROOM_USER, data => {
    const currentViewers = data.viewerCount ?? data.total;
    const ranks = data.ranksList ?? data.ranks ?? data.topViewers ?? [];
    send('live:stats', {
      platform: 'tiktok',
      viewers: Number(currentViewers ?? 0),
      topViewers: ranks.slice(0, 3).map(item => normalizeTiktokUser(item.user || item)),
      updatedAt: Date.now()
    });
  });

  connection.on(WebcastEvent.LIKE, data => send('live:stats', {
    platform: 'tiktok',
    likes: Number(data.totalLikeCount || data.total || 0)
  }));

  connection.on(WebcastEvent.GIFT, data => {
    const giftType = data.giftDetails?.giftType ?? data.gift?.type;
    if (giftType === 1 && !data.repeatEnd) return;
    send('live:activity', {
      platform: 'tiktok',
      type: 'gift', ...normalizeTiktokUser(data.user),
      giftName: data.giftDetails?.giftName || data.gift?.name || 'Gift',
      amount: Number(data.repeatCount || data.comboCount || 1),
      image: data.giftDetails?.giftPictureUrl || data.gift?.image?.urlList?.[0] || data.gift?.icon?.urlList?.[0] || ''
    });
  });

  connection.on(WebcastEvent.SHARE, data => send('live:activity', {
    platform: 'tiktok', type: 'share', ...normalizeTiktokUser(data.user)
  }));

  connection.on(WebcastEvent.FOLLOW, data => send('live:activity', {
    platform: 'tiktok', type: 'follow', ...normalizeTiktokUser(data.user)
  }));

  connection.on(WebcastEvent.STREAM_END, () => send('live:status', {
    platform: 'tiktok', state: 'ended', text: 'TikTok LIVE telah selesai'
  }));

  connection.on(ControlEvent.DISCONNECTED, () => {
    if (!intentionalDisconnectTiktok) send('live:status', { platform: 'tiktok', state: 'error', text: 'Koneksi TikTok terputus' });
  });

  connection.on('error', error => send('live:debug', { platform: 'tiktok', message: String(error?.message || error) }));
}

function bindYoutubeEvents(liveChat) {
  liveChat.on('start', liveId => {
    send('live:status', {
      platform: 'youtube',
      state: 'connected',
      text: `YouTube LIVE terhubung (${liveId})`,
      connectedAt: Date.now(),
      liveId
    });
    // Trigger immediate stats poll
    pollYoutubeStats();
  });

  liveChat.on('chat', item => {
    const messageText = (item.message || []).map(m => m.text || m.emojiText || '').join('');
    if (item.superchat) {
      send('live:activity', {
        platform: 'youtube',
        type: 'superchat',
        ...normalizeYoutubeUser(item.author),
        giftName: 'Super Chat',
        amount: item.superchat.amount,
        color: item.superchat.color || '#ffb703',
        image: item.superchat.sticker?.url || ''
      });
    }

    send('live:chat', {
      ...normalizeYoutubeUser(item.author),
      comment: messageText,
      isSuperChat: Boolean(item.superchat),
      superChatAmount: item.superchat?.amount || ''
    });
  });

  liveChat.on('end', reason => {
    send('live:status', {
      platform: 'youtube',
      state: 'ended',
      text: `YouTube LIVE berakhir ${reason ? '(' + reason + ')' : ''}`
    });
    if (youtubeStatsInterval) {
      clearInterval(youtubeStatsInterval);
      youtubeStatsInterval = null;
    }
  });

  liveChat.on('error', error => {
    if (!intentionalDisconnectYoutube) {
      send('live:status', {
        platform: 'youtube',
        state: 'error',
        text: String(error?.message || error || 'Koneksi YouTube terputus')
      });
    }
  });
}

// IPC Handlers: TikTok
ipcMain.handle('tiktok:connect', async (_event, input) => {
  const username = String(input || '').trim().replace(/^https?:\/\/[^/]+\/@/, '').replace(/\/live.*$/, '').replace(/^@/, '');
  if (!username) return { ok: false, error: 'Masukkan username TikTok.' };
  await disconnectTiktok();
  intentionalDisconnectTiktok = false;
  send('live:status', { platform: 'tiktok', state: 'connecting', text: `Menghubungkan TikTok @${username}…` });
  const connection = new TikTokLiveConnection(username, { processInitialData: true, fetchRoomInfoOnConnect: true });
  liveTiktok = connection;
  bindTiktokEvents(connection);
  try {
    const state = await connection.connect();
    send('live:status', { platform: 'tiktok', state: 'connected', text: `TikTok: @${username}`, connectedAt: Date.now() });
    return { ok: true, roomId: state.roomId };
  } catch (error) {
    if (liveTiktok === connection) liveTiktok = undefined;
    const message = error?.message || 'Tidak dapat terhubung ke TikTok.';
    send('live:status', { platform: 'tiktok', state: 'error', text: message });
    return { ok: false, error: message };
  }
});

ipcMain.handle('tiktok:disconnect', disconnectTiktok);

// IPC Handlers: YouTube
ipcMain.handle('youtube:connect', async (_event, input) => {
  const parsed = parseYoutubeInput(input);
  if (!parsed) return { ok: false, error: 'Masukkan URL video, ID live, atau handle YouTube.' };
  disconnectYoutube();
  intentionalDisconnectYoutube = false;
  const label = parsed.liveId || parsed.channelId || parsed.handle || input;
  send('live:status', { platform: 'youtube', state: 'connecting', text: `Menghubungkan YouTube ${label}…` });

  try {
    const options = await fetchLivePage(parsed);
    currentYoutubeOptions = options;

    const liveChat = new LiveChat(parsed);
    liveYoutube = liveChat;
    bindYoutubeEvents(liveChat);
    const ok = await liveChat.start();
    if (!ok) {
      if (liveYoutube === liveChat) liveYoutube = undefined;
      currentYoutubeOptions = null;
      const message = 'Tidak dapat memulai chat YouTube. Pastikan stream sedang LIVE.';
      send('live:status', { platform: 'youtube', state: 'error', text: message });
      return { ok: false, error: message };
    }

    // Start live stats polling loop every 10 seconds
    if (youtubeStatsInterval) clearInterval(youtubeStatsInterval);
    youtubeStatsInterval = setInterval(pollYoutubeStats, 10000);
    pollYoutubeStats();

    return { ok: true, liveId: liveChat.liveId };
  } catch (error) {
    if (liveYoutube) liveYoutube = undefined;
    currentYoutubeOptions = null;
    const message = error?.message || 'Gagal terhubung ke live stream YouTube.';
    send('live:status', { platform: 'youtube', state: 'error', text: message });
    return { ok: false, error: message };
  }
});

ipcMain.handle('youtube:disconnect', disconnectYoutube);

// Unified & Window Controls
ipcMain.handle('live:connect', async (event, param) => {
  if (typeof param === 'object' && param.platform === 'youtube') {
    return ipcMain.handlers['youtube:connect'](event, param.input);
  }
  return ipcMain.handlers['tiktok:connect'](event, typeof param === 'object' ? param.input : param);
});

ipcMain.handle('live:disconnect', disconnectAll);
ipcMain.on('window:close', () => win?.close());
ipcMain.on('window:minimize', () => win?.minimize());
ipcMain.on('window:click-through', (_e, enabled) => setClickThrough(enabled));
ipcMain.on('window:top', (_e, enabled) => win?.setAlwaysOnTop(Boolean(enabled), enabled ? 'screen-saver' : 'normal'));
ipcMain.on('window:size', (_e, preset) => setWindowSize(preset));

app.whenReady().then(() => {
  createWindow();
  globalShortcut.register('CommandOrControl+Shift+X', () => setClickThrough(!clickThrough));
});
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => { disconnectAll(); if (process.platform !== 'darwin') app.quit(); });

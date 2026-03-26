// ═══════════════════════════════════════════════════
// CORE CIPHER
// ═══════════════════════════════════════════════════

function getOrigin(password) {
  const p = password.padEnd(3, '!');
  return [p.charCodeAt(0), p.charCodeAt(1), p.charCodeAt(2)];
}

function getMagic(password) {
  const p = password.padEnd(3, '!');
  return [
    (p.charCodeAt(0) + 7)  % 256,
    (p.charCodeAt(1) + 13) % 256,
    (p.charCodeAt(2) + 17) % 256,
  ];
}

function getSalt(password, index) {
  const sum = password.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return [
    (sum * (index + 1) * 7)  % 256,
    (sum * (index + 1) * 13) % 256,
    (sum * (index + 1) * 17) % 256,
  ];
}

function calcChecksum(message) {
  let cs = 0;
  for (let i = 0; i < message.length; i++)
    cs = (cs + message.charCodeAt(i) * (i + 1)) % 65536;
  return cs;
}

const PRINTABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

function padMessage(message) {
  const minLen = Math.max(30, Math.ceil(message.length / 3) * 3);
  let padded = message;
  while (padded.length < minLen || padded.length % 3 !== 0)
    padded += PRINTABLE[Math.floor(Math.random() * PRINTABLE.length)];
  return padded;
}

function encodeToBytes(message, password) {
  const [ox, oy, oz] = getOrigin(password);
  const [m1, m2, m3] = getMagic(password);
  const checksum     = calcChecksum(message);
  const padded       = padMessage(message);
  const realLength   = message.length;
  const bytes        = [];

  bytes.push(m1, m2, m3);
  bytes.push((realLength >> 8) & 0xff, realLength & 0xff);

  for (let i = 0; i < padded.length / 3; i++) {
    const c1 = padded.charCodeAt(i * 3);
    const c2 = padded.charCodeAt(i * 3 + 1);
    const c3 = padded.charCodeAt(i * 3 + 2);
    const [sx, sy, sz] = getSalt(password, i);
    bytes.push(
      (c1 + ox + sx) % 256,
      (c2 + oy + sy) % 256,
      (c3 + oz + sz) % 256,
    );
  }

  bytes.push((checksum >> 8) & 0xff, checksum & 0xff);
  return bytes;
}

function decodeFromBytes(bytes, password) {
  const [ox, oy, oz] = getOrigin(password);
  const [m1, m2, m3] = getMagic(password);

  if (bytes[0] !== m1 || bytes[1] !== m2 || bytes[2] !== m3)
    return { success: false, error: 'Wrong password — or no hidden message in this image.' };

  const realLength = (bytes[3] << 8) | bytes[4];
  if (realLength === 0 || realLength > 65535)
    return { success: false, error: 'Could not read message. Image may be corrupted.' };

  const coordBytes = bytes.slice(5, bytes.length - 2);
  let padded = '';

  for (let i = 0; i < Math.floor(coordBytes.length / 3); i++) {
    const x = coordBytes[i * 3];
    const y = coordBytes[i * 3 + 1];
    const z = coordBytes[i * 3 + 2];
    const [sx, sy, sz] = getSalt(password, i);
    padded += String.fromCharCode(
      ((x - ox - sx) % 256 + 256) % 256,
      ((y - oy - sy) % 256 + 256) % 256,
      ((z - oz - sz) % 256 + 256) % 256,
    );
  }

  const message    = padded.slice(0, realLength);
  const storedCs   = (bytes[bytes.length - 2] << 8) | bytes[bytes.length - 1];
  const checksumOk = storedCs === calcChecksum(message);

  return { success: true, message, checksumOk };
}

// ═══════════════════════════════════════════════════
// LSB STEGANOGRAPHY
// ═══════════════════════════════════════════════════

function bytesToBits(bytes) {
  const bits = [];
  for (const byte of bytes)
    for (let b = 7; b >= 0; b--) bits.push((byte >> b) & 1);
  return bits;
}

function lsbEncode(imageData, bytes) {
  const bits = bytesToBits(bytes);
  const data  = new Uint8ClampedArray(imageData.data);
  if (bits.length > Math.floor((data.length / 4) * 3))
    throw new Error('Message is too long for this image. Please use a larger image.');
  let bi = 0;
  for (let i = 0; i < data.length && bi < bits.length; i++) {
    if ((i + 1) % 4 === 0) continue;
    data[i] = (data[i] & 0xfe) | bits[bi++];
  }
  return new ImageData(data, imageData.width, imageData.height);
}

function lsbDecode(imageData, byteCount) {
  const data   = imageData.data;
  const bits   = [];
  const needed = byteCount * 8;
  for (let i = 0; i < data.length && bits.length < needed; i++) {
    if ((i + 1) % 4 === 0) continue;
    bits.push(data[i] & 1);
  }
  const bytes = [];
  for (let i = 0; i + 7 < bits.length; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b++) byte = (byte << 1) | bits[i + b];
    bytes.push(byte);
  }
  return bytes;
}

// ═══════════════════════════════════════════════════
// IMAGE HELPERS
// ═══════════════════════════════════════════════════

function readFileAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = e => res(e.target.result);
    r.onerror = () => rej(new Error('Could not read file.'));
    r.readAsDataURL(file);
  });
}

function drawToCanvas(dataURL) {
  return new Promise((res, rej) => {
    const img    = new Image();
    const canvas = document.getElementById('canvas');
    img.onload = () => {
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      res(ctx);
    };
    img.onerror = () => rej(new Error('Could not render image.'));
    img.src = dataURL;
  });
}

// ═══════════════════════════════════════════════════
// UI STATE
// ═══════════════════════════════════════════════════

let currentMode   = 'encode';
let currentImgURL = null;
let showPassword  = false;

function switchTab(mode) {
  currentMode   = mode;
  currentImgURL = null;

  document.getElementById('preview-img').style.display     = 'none';
  document.getElementById('file-name').textContent         = '';
  document.getElementById('password').value                = '';
  document.getElementById('message').value                 = '';
  document.getElementById('strength-label').textContent    = '';
  document.getElementById('char-count').textContent        = '';
  document.getElementById('encode-result').style.display   = 'none';
  document.getElementById('decode-result').style.display   = 'none';
  document.getElementById('error-box').style.display       = 'none';

  document.getElementById('tab-encode').className = 'tab' + (mode === 'encode' ? ' active' : '');
  document.getElementById('tab-decode').className = 'tab' + (mode === 'decode' ? ' active' : '');

  document.getElementById('message-block').style.display = mode === 'encode' ? 'block' : 'none';
  document.getElementById('pass-label').textContent      = mode === 'encode' ? 'Step 2 — Set a password' : 'Step 2 — Enter the password';
  document.getElementById('action-btn').textContent      = mode === 'encode' ? '🔒 Hide Message in Image' : '🔍 Reveal Hidden Message';
}

function togglePassword() {
  showPassword = !showPassword;
  document.getElementById('password').type = showPassword ? 'text' : 'password';
  document.querySelector('.show-btn').textContent = showPassword ? 'Hide' : 'Show';
}

function onPasswordChange() {
  const pw = document.getElementById('password').value;
  if (pw.length < 3) {
    document.getElementById('strength-label').textContent = 'Too short';
    document.getElementById('strength-label').style.color = '#ef4444';
    return;
  }
  const score  = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(r => r.test(pw)).length;
  const labels = ['', 'Weak', 'Fair', 'Good ✅', 'Strong 💪'];
  const colors  = ['', '#ef4444', '#f59e0b', '#16a34a', '#2563eb'];
  document.getElementById('strength-label').textContent = 'Strength: ' + (labels[score] || 'Weak');
  document.getElementById('strength-label').style.color = colors[score] || '#ef4444';
}

function onMessageChange() {
  const len = document.getElementById('message').value.length;
  document.getElementById('char-count').textContent = len > 0 ? `${len} characters` : '';
}

function showError(msg) {
  const el = document.getElementById('error-box');
  el.textContent   = '⚠️ ' + msg;
  el.style.display = 'block';
}

function clearError() {
  document.getElementById('error-box').style.display = 'none';
}

// ═══════════════════════════════════════════════════
// FILE UPLOAD
// ═══════════════════════════════════════════════════

document.getElementById('file-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { showError('Please upload a valid image.'); return; }
  clearError();
  document.getElementById('encode-result').style.display = 'none';
  document.getElementById('decode-result').style.display = 'none';
  try {
    currentImgURL = await readFileAsDataURL(file);
    const img = document.getElementById('preview-img');
    img.src           = currentImgURL;
    img.style.display = 'block';
    document.getElementById('file-name').textContent = '✅ ' + file.name;
  } catch(err) { showError(err.message); }
});

// ═══════════════════════════════════════════════════
// MAIN ACTION
// ═══════════════════════════════════════════════════

async function handleAction() {
  clearError();
  const password = document.getElementById('password').value;
  const btn      = document.getElementById('action-btn');

  if (!currentImgURL)       { showError('Upload an image first.'); return; }
  if (password.length < 3)  { showError('Password must be at least 3 characters.'); return; }

  btn.disabled    = true;
  btn.textContent = '⏳ Working...';

  try {
    currentMode === 'encode' ? await doEncode(password) : await doDecode(password);
  } catch(err) {
    showError(err.message);
  } finally {
    btn.disabled    = false;
    btn.textContent = currentMode === 'encode' ? '🔒 Hide Message in Image' : '🔍 Reveal Hidden Message';
  }
}

async function doEncode(password) {
  const message = document.getElementById('message').value;
  if (!message.trim()) { showError('Enter a secret message.'); return; }

  const canvas  = document.getElementById('canvas');
  const ctx     = await drawToCanvas(currentImgURL);
  const idata   = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const bytes   = encodeToBytes(message, password);
  const encoded = lsbEncode(idata, bytes);
  ctx.putImageData(encoded, 0, 0);

  const outputURL = canvas.toDataURL('image/png');
  const resultEl  = document.getElementById('encode-result');
  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    <div class="result-box success">
      <p class="result-title green">✅ Message hidden successfully!</p>
      <img src="${outputURL}" style="width:100%;max-height:160px;object-fit:contain;border-radius:4px;margin-bottom:12px;" />
      <p style="font-size:12px;color:#555;margin-bottom:12px;">
        The image looks identical to the original. Share it freely — only someone with the correct password and this tool can read it.
      </p>
      <a class="download-link" href="${outputURL}" download="secret_image.png">⬇ Download Image</a>
      <p style="font-size:11px;color:#888;margin-top:10px;">
        ⚠️ Share the image and password separately — never together.
      </p>
    </div>
  `;
  document.getElementById('decode-result').style.display = 'none';
}

async function doDecode(password) {
  const canvas   = document.getElementById('canvas');
  const ctx      = await drawToCanvas(currentImgURL);
  const idata    = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const maxBytes = 3 + 2 + (Math.ceil(10000 / 3) * 3) + 2;
  const rawBytes = lsbDecode(idata, maxBytes);
  const decoded  = decodeFromBytes(rawBytes, password);

  if (!decoded.success) { showError(decoded.error); return; }

  const resultEl = document.getElementById('decode-result');
  resultEl.style.display = 'block';

  if (decoded.checksumOk) {
    resultEl.innerHTML = `
      <div class="result-box decode-ok">
        <p class="result-title blue">🔓 Message revealed successfully!</p>
        <div class="message-box">${escapeHtml(decoded.message)}</div>
        <div class="decode-meta">${decoded.message.length} characters</div>
      </div>
    `;
  } else {
    resultEl.innerHTML = `
      <div class="result-box warning">
        <p class="result-title amber">🔓 Message recovered — ⚠️ integrity check failed</p>
        <div class="warn-detail">
          The image may have been compressed or modified after the message was hidden.
          The message is shown below but may contain errors.
        </div>
        <div class="message-box">${escapeHtml(decoded.message)}</div>
        <div class="decode-meta">${decoded.message.length} characters</div>
      </div>
    `;
  }

  document.getElementById('encode-result').style.display = 'none';
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

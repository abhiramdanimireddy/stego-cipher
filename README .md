# 🔐 StegoCipher — Secret Message Hider

> Hide secret messages invisibly inside any image. Password-protected. Exclusively decryptable by this tool.

---

## What it does

StegoCipher hides secret text messages inside ordinary image files. The image looks completely identical before and after — no visible change to anyone who sees it.

Only someone with the correct password and this tool can reveal the message. Share the image anywhere publicly — nobody will know a message is hidden inside.

---

## Why no other tool can decrypt it

Any image encoded with StegoCipher can only be decoded by StegoCipher. No other steganography tool, decoder, or forensic software can recover the message — even if they know a message exists, even if they extract every byte from the image.

The message is processed through a custom encryption method unique to this tool before being hidden. What gets stored in the image is not text, not standard cipher output, and not anything another tool is built to handle. Even if someone extracts the raw hidden bytes, they see nothing but random unreadable symbols. The password, the encryption method, and this tool must all be present at the same time — and no other tool in existence satisfies all three.

---

## How it works

The message is converted to numbers and those numbers are scattered inside a 3D mathematical space using the password as the anchor point. The scattered values are then stored invisibly inside the image pixels. Without the correct password, the anchor point is unknown and the values cannot be reassembled into the original message.

**Salt** — every character produces a unique value even if it appears multiple times in the message, preventing pattern-based attacks.

**Magic** — a secret signature derived from the password is embedded in the hidden data. Wrong password or wrong tool means the signature does not match and decoding is rejected immediately.

**Modulo** — all stored values are kept within pixel range, preventing any overflow patterns that could reveal the encryption.

**Padding** — the message is padded with random characters before hiding so the true length cannot be determined from the image.

**Checksum** — a verification value is stored alongside the message. When decoding, it confirms the image was not modified or compressed after the message was hidden.

---

## How to use

1. Open `index.html` in any browser
2. Upload a PNG image
3. Set a password — mix letters, numbers, and symbols
4. Type your secret message
5. Click **Hide Message** and download the image
6. To reveal — upload the image, enter the same password, click **Reveal**

Works completely offline. No data ever leaves your device.

---

## Important

- Always share as **PNG** — JPEG compression destroys the hidden data
- Share the image and password **separately** — never send both together
- Send as a file attachment — platforms that compress images will destroy the hidden data

---

## Author

**Abhiram Danimireddy**

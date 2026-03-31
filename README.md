 # 🔐 StegoCipher — Secret Message Hider

> Hide secret messages invisibly inside any image. Password-protected. Exclusively decryptable by this tool.

---

## What it does

StegoCipher hides secret text messages inside ordinary image files. The image looks completely identical before and after — no visible change to anyone who sees it.

Only someone with the correct password and this tool can reveal the message. Share the image anywhere publicly — nobody will know a message is hidden inside.

---

## Why  other tool cannot decrypt it

Any image encoded with StegoCipher can only be decoded by StegoCipher. other online tools cannot decode it 

The message is processed through a custom encryption method unique to this tool before being hidden. What gets stored in the image is not text . Even if someone extracts the raw hidden bytes, they see nothing but random unreadable symbols. The password, the encryption method, and this tool must all be present at the same time 

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

**To hide a message:**
1. Go to the Hide Message tab.
2. upload a PNG file
3. Set a password — mix letters, numbers, and symbols e.g. `1'Jk#w`
4. Type your secret message
5. Click Hide Message in Image
6. Click Download Image — save the PNG and share it
 
**To reveal a message:**
1. Go to the Reveal Message tab
2. Upload the encoded PNG file
3. Enter the same password used when hiding
4. Click Reveal Hidden Message
5. Your original message appears on screen

## Installation

### 1) Single HTML File (easiest offline option)
 

**Download the file StegoCipher.html**

 Opens in your browser 
 
> This file works completely offline. No internet required after downloading.

### 2) online
 Visit: **[abhiramdanimireddy.github.io/stego-cipher](https://abhiramdanimireddy.github.io/stego-cipher)**

### 3)  Download HTML + CSS + JS files
1) Download the project ZIP file from GitHub
2) Extract the ZIP file
3) Place all extracted files in a single folder
4) Open index.html in your browser

Ensure these files are together

index.html

style.css

script.js  

### 4) Python (cd)
 
For running the tool directly from terminal using Python.
 
**1 — Install Python**
 
Download and install Python (3.8 or higher)
 
**2 — Get the project**
 
A — using Git:
```
git clone https://github.com/abhiramdanimireddy/stego-cipher
cd stego-cipher
```
 
B — download ZIP:
```
Download ZIP from GitHub → extract → open terminal inside the folder
```
 
**3 — Install Dependencies**

```
pip install -r requirements.txt
```
 
**4 — Hide a message**
```
python hide.py
```

Follow the prompts:
```
Image path: meme.png
Password: 1'Jk#w
Secret message: your message here
```
Output saved as `secret_image.png`
 
**5 — Reveal a message**
```
python reveal.py
```
Follow the prompts:
```
Image path: secret_image.png
Password: 1'Jk#w
```
Your hidden message appears in the terminal.


---

## Important

- Always share as **PNG** — JPEG compression destroys the hidden data
- Share the image and password **separately** — never send both together
- Send as a file attachment — platforms that compress images will destroy the hidden data

---



**Abhiram Danimireddy**

# reveal.py
# Reveal a hidden message from an image using 3D Coordinate Cipher + LSB Steganography
#
# Usage:
#   python reveal.py

from PIL import Image
from cipher import decode_from_bytes


def lsb_decode(image_path, byte_count):
    img    = Image.open(image_path).convert('RGB')
    pixels = list(img.getdata())
    bits   = []
    needed = byte_count * 8

    for r, g, b in pixels:
        if len(bits) >= needed:
            break
        bits.append(r & 1)
        if len(bits) >= needed:
            break
        bits.append(g & 1)
        if len(bits) >= needed:
            break
        bits.append(b & 1)

    # Convert bits to bytes
    byte_list = []
    for i in range(0, len(bits) - 7, 8):
        byte = 0
        for b in range(8):
            byte = (byte << 1) | bits[i + b]
        byte_list.append(byte)

    return byte_list


def main():
    print('=== 3D Coordinate Cipher — Reveal Message ===')
    print()

    image_path = input('Image path (e.g. secret_image.png): ').strip()
    password   = input('Password: ').strip()

    if len(password) < 3:
        print('Error: Password must be at least 3 characters.')
        return

    print()
    print('Decoding...')

    # Read enough bytes for any reasonable message (up to 10000 chars)
    max_bytes = 3 + 2 + (((10000 + 2) // 3) * 3) + 2
    byte_list = lsb_decode(image_path, max_bytes)
    result    = decode_from_bytes(byte_list, password)

    if not result['success']:
        print(f'Error: {result["error"]}')
        return

    print()
    if result['checksum_ok']:
        print('Checksum verified ✓ — message is intact')
    else:
        print('WARNING: Checksum mismatch — image may have been compressed or modified.')
        print('Message shown but may contain errors.')

    print()
    print('Hidden message:')
    print('─' * 40)
    print(result['message'])
    print('─' * 40)
    print(f'Characters decoded: {len(result["message"])}')


if __name__ == '__main__':
    main()

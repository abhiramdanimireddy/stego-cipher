# hide.py
# Hide a secret message inside an image using 3D Coordinate Cipher + LSB Steganography
#
# Usage:
#   python hide.py

from PIL import Image
from cipher import encode_to_bytes


def bytes_to_bits(byte_list):
    bits = []
    for byte in byte_list:
        for b in range(7, -1, -1):
            bits.append((byte >> b) & 1)
    return bits


def lsb_encode(image_path, byte_list, output_path):
    img  = Image.open(image_path).convert('RGB')
    pixels = list(img.getdata())
    bits = bytes_to_bits(byte_list)

    # Check image is large enough
    available_bits = len(pixels) * 3
    if len(bits) > available_bits:
        print('Error: Message is too long for this image. Use a larger image.')
        return False

    new_pixels = []
    bit_index  = 0

    for r, g, b in pixels:
        if bit_index < len(bits):
            r = (r & 0xfe) | bits[bit_index]; bit_index += 1
        if bit_index < len(bits):
            g = (g & 0xfe) | bits[bit_index]; bit_index += 1
        if bit_index < len(bits):
            b = (b & 0xfe) | bits[bit_index]; bit_index += 1
        new_pixels.append((r, g, b))

    new_img = Image.new('RGB', img.size)
    new_img.putdata(new_pixels)
    new_img.save(output_path, 'PNG')
    return True


def main():
    print('=== 3D Coordinate Cipher — Hide Message ===')
    print()

    image_path = input('Image path (e.g. meme.png): ').strip()
    password   = input('Password (min 3 chars, mix letters+numbers+symbols): ').strip()
    message    = input('Secret message: ').strip()

    if len(password) < 3:
        print('Error: Password must be at least 3 characters.')
        return

    if not message:
        print('Error: Message cannot be empty.')
        return

    output_path = 'secret_image.png'

    print()
    print('Encoding...')
    byte_list = encode_to_bytes(message, password)
    success   = lsb_encode(image_path, byte_list, output_path)

    if success:
        print(f'Done! Message hidden in: {output_path}')
        print(f'Characters hidden: {len(message)}')
        print(f'Bytes stored: {len(byte_list)}')
        print()
        print('Share secret_image.png — it looks identical to the original.')
        print('Receiver needs this tool + correct password to decode.')


if __name__ == '__main__':
    main()

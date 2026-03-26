# cipher.py
# 3D Coordinate Cipher — Core Logic


PRINTABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'


def get_origin(password):
    """Password first 3 chars → 3D origin point (ox, oy, oz)"""
    p = password.ljust(3, '!')
    return [ord(p[0]), ord(p[1]), ord(p[2])]


def get_magic(password):
    """3 bytes derived from password — secret tool signature"""
    p = password.ljust(3, '!')
    return [
        (ord(p[0]) + 7)  % 256,
        (ord(p[1]) + 13) % 256,
        (ord(p[2]) + 17) % 256,
    ]


def get_salt(password, index):
    """Unique salt per coordinate position — derived from full password"""
    total = sum(ord(c) for c in password)
    return [
        (total * (index + 1) * 7)  % 256,
        (total * (index + 1) * 13) % 256,
        (total * (index + 1) * 17) % 256,
    ]


def calc_checksum(message):
    """Position-weighted checksum — detects tampering"""
    cs = 0
    for i, c in enumerate(message):
        cs = (cs + ord(c) * (i + 1)) % 65536
    return cs


def pad_message(message):
    """Pad to minimum 30 chars (multiple of 3) — hides true length"""
    import random
    min_len = max(30, -(-len(message) // 3) * 3)
    padded  = message
    while len(padded) < min_len or len(padded) % 3 != 0:
        padded += random.choice(PRINTABLE)
    return padded


def encode_to_bytes(message, password):
    """
    Convert message + password → list of bytes using 3D coordinate cipher.

    Structure:
        [magic x3] [real_length x2] [coordinates: x,y,z per 3 chars] [checksum x2]

    Each coordinate:
        x = (char1_ASCII + ox + salt_x) % 256
        y = (char2_ASCII + oy + salt_y) % 256
        z = (char3_ASCII + oz + salt_z) % 256
    """
    ox, oy, oz = get_origin(password)
    m1, m2, m3 = get_magic(password)
    checksum   = calc_checksum(message)
    padded     = pad_message(message)
    real_len   = len(message)
    bytes_out  = []

    # Magic (3 bytes)
    bytes_out += [m1, m2, m3]

    # Real length (2 bytes)
    bytes_out += [(real_len >> 8) & 0xff, real_len & 0xff]

    # Coordinates — 3 chars per coordinate
    for i in range(len(padded) // 3):
        c1 = ord(padded[i * 3])
        c2 = ord(padded[i * 3 + 1])
        c3 = ord(padded[i * 3 + 2])
        sx, sy, sz = get_salt(password, i)
        bytes_out += [
            (c1 + ox + sx) % 256,
            (c2 + oy + sy) % 256,
            (c3 + oz + sz) % 256,
        ]

    # Checksum (2 bytes)
    bytes_out += [(checksum >> 8) & 0xff, checksum & 0xff]

    return bytes_out


def decode_from_bytes(bytes_in, password):
    """
    Convert byte list + password → original message.

    Returns:
        dict with keys: success, message, checksum_ok, error
    """
    ox, oy, oz = get_origin(password)
    m1, m2, m3 = get_magic(password)

    # Check magic
    if bytes_in[0] != m1 or bytes_in[1] != m2 or bytes_in[2] != m3:
        return {'success': False, 'error': 'Wrong password or no hidden message found.'}

    # Read real length
    real_len = (bytes_in[3] << 8) | bytes_in[4]
    if real_len == 0 or real_len > 65535:
        return {'success': False, 'error': 'Could not read message length. Image may be corrupted.'}

    # Decode coordinates
    coord_bytes = bytes_in[5:-2]
    padded = ''
    for i in range(len(coord_bytes) // 3):
        x = coord_bytes[i * 3]
        y = coord_bytes[i * 3 + 1]
        z = coord_bytes[i * 3 + 2]
        sx, sy, sz = get_salt(password, i)
        c1 = ((x - ox - sx) % 256 + 256) % 256
        c2 = ((y - oy - sy) % 256 + 256) % 256
        c3 = ((z - oz - sz) % 256 + 256) % 256
        padded += chr(c1) + chr(c2) + chr(c3)

    # Extract real message
    message = padded[:real_len]

    # Verify checksum
    stored_cs     = (bytes_in[-2] << 8) | bytes_in[-1]
    calculated_cs = calc_checksum(message)
    checksum_ok   = stored_cs == calculated_cs

    return {
        'success':      True,
        'message':      message,
        'checksum_ok':  checksum_ok,
        'error':        None,
    }

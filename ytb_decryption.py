# ytInitialPlayerResponse.streamingData
# ---------------------------------------------------------------------------
# YouTube signature / n-parameter decryption (reuses yt-dlp solver)
# ---------------------------------------------------------------------------

# Load yt-dlp's built-in JS challenge solver core script
_CORE_JS = None
try:
    from yt_dlp.extractor.youtube.jsc._builtin.vendor import load_script as _load_solver_script
    _CORE_JS = _load_solver_script('yt.solver.core.js')
except Exception as _e:
    logger.warning(f"Failed to load yt.solver.core.js: {_e}")


def _solve_yt_js_challenge(player_js_code, challenge_type, challenges):
    """
    Run yt-dlp's JS challenge solver via Node.js.

    Args:
        player_js_code: Raw source of YouTube base.js
        challenge_type: 'sig' or 'n'
        challenges: List of challenge strings

    Returns:
        dict mapping each challenge to its decrypted result
    """
    if not _CORE_JS:
        raise RuntimeError("yt.solver.core.js not found; yt-dlp may need updating")

    input_data = {
        'type': 'player',
        'player': player_js_code,
        'requests': [{
            'type': challenge_type,
            'challenges': challenges
        }],
        'output_preprocessed': True,
    }

    js_code = (
        "const meriyah = require('meriyah');\n"
        "const astring = require('astring');\n"
        f"{_CORE_JS}\n"
        f"const input = {json.dumps(input_data)};\n"
        "console.log(JSON.stringify(jsc(input)));\n"
    )

    result = subprocess.run(
        ['node', '-'],
        input=js_code,
        capture_output=True,
        text=True,
        timeout=60,
    )

    if result.returncode != 0:
        stderr = result.stderr.strip()
        raise RuntimeError(
            f"Node.js error (code {result.returncode}): {stderr[:500]}")

    output = json.loads(result.stdout)

    if output.get('type') == 'error':
        raise RuntimeError(f"Solver error: {output.get('error')}")

    response = output['responses'][0]
    if response.get('type') == 'error':
        raise RuntimeError(f"Challenge error: {response.get('error')}")

    return response['data']


def decrypt_youtube_sig(player_js_url, signature_cipher):
    """
    Decrypt a YouTube signatureCipher URL using yt-dlp's JS solver.

    Args:
        player_js_url: YouTube player JS URL, e.g.
            https://www.youtube.com/s/player/xxxxx/base.js
        signature_cipher: signatureCipher parameter string containing
            url, s, sp fields (as returned by YouTube's API).

    Returns:
        Decrypted direct download URL.
    """
    sc = parse_qs(signature_cipher)
    base_url = sc.get('url', [''])[0]
    encrypted_sig = sc.get('s', [''])[0]
    sig_param = sc.get('sp', ['signature'])[-1]

    if not encrypted_sig:
        return unquote(base_url)

    if not player_js_url:
        raise ValueError("player_js_url is required for signature decryption")

    resp = requests.get(player_js_url, timeout=30)
    resp.raise_for_status()
    player_js = resp.text

    # Challenge string: chr(0) + chr(1) + ... + chr(N-1)
    # yt-dlp feeds this into the player JS sig function to learn the
    # index permutation (spec) used to unscramble real signatures.
    challenge = ''.join(chr(i) for i in range(len(encrypted_sig)))

    results = _solve_yt_js_challenge(player_js, 'sig', [challenge])
    sig_result = results[challenge]

    # sig_result[i] is a character whose codepoint = original index of
    # decrypted character i.  Build the permutation spec and apply it.
    spec = [ord(c) for c in sig_result]
    decrypted_sig = ''.join(encrypted_sig[i] for i in spec)

    final_url = unquote(base_url)
    sep = '&' if '?' in final_url else '?'
    final_url += f'{sep}{sig_param}={decrypted_sig}'
    return final_url


def decrypt_youtube_n(player_js_url, n_value):
    """
    Decrypt a YouTube URL's n parameter to avoid throttling.

    Args:
        player_js_url: YouTube player JS URL
        n_value: Raw n parameter value

    Returns:
        Decrypted n parameter value.
    """
    if not player_js_url or not n_value:
        return n_value

    resp = requests.get(player_js_url, timeout=30)
    resp.raise_for_status()
    player_js = resp.text

    results = _solve_yt_js_challenge(player_js, 'n', [n_value])
    return results[n_value]


def decrypt_youtube_url(player_js_url, url_or_sig_cipher, n_value=None):
    """
    Convenience wrapper: decrypt both signature and n parameter.

    Args:
        player_js_url: YouTube player JS URL
        url_or_sig_cipher: Either a full YouTube URL (with n param) or a
            signatureCipher string. If it contains '&s=' or starts with
            'url=', it's treated as signatureCipher. Otherwise it's treated
            as a full URL whose n parameter needs decryption.
        n_value: Optional n parameter value. If not provided and url_or_sig_cipher
            is a full URL, n is extracted from the URL.

    Returns:
        Fully decrypted URL, or empty string if no URL available.
    """
    if '&s=' in url_or_sig_cipher or url_or_sig_cipher.startswith('url='):
        # signatureCipher mode
        final_url = decrypt_youtube_sig(player_js_url, url_or_sig_cipher)
        if not n_value:
            # Try to extract n from the base_url inside signatureCipher
            sc = parse_qs(url_or_sig_cipher)
            base_url = sc.get('url', [''])[0]
            if 'n=' in base_url:
                from urllib.parse import parse_qs as _pq, urlparse as _up
                n_value = _pq(_up(base_url).query).get('n', [''])[0]
    else:
        # Full URL mode
        final_url = url_or_sig_cipher
        if not n_value and 'n=' in final_url:
            from urllib.parse import parse_qs as _pq, urlparse as _up
            n_value = _pq(_up(final_url).query).get('n', [''])[0]

    if n_value and final_url:
        decrypted_n = decrypt_youtube_n(player_js_url, n_value)
        final_url = final_url.replace(f'n={n_value}', f'n={decrypted_n}')

    return final_url

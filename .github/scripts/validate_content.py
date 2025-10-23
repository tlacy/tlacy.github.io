#!/usr/bin/env python3
import json, sys, os
import urllib.request
import urllib.error
import ssl

path = 'content.json'
if not os.path.exists(path):
    print('content.json not found in repository root')
    sys.exit(1)
try:
    data = json.load(open(path))
except Exception as e:
    print('Failed to parse content.json:', e)
    sys.exit(1)

errors = []

def check_file(key):
    v = data.get(key)
    if v:
        if not os.path.exists(v):
            errors.append(f'{key} references missing file: {v}')

check_file('profileImage')
check_file('resume')

# passions sanity checks
if 'passions' in data:
    if not isinstance(data['passions'], list):
        errors.append('passions should be an array')
    else:
        for i,p in enumerate(data['passions']):
            if not isinstance(p, dict):
                errors.append(f'passions[{i}] should be an object')
            else:
                if 'label' not in p or not isinstance(p['label'], str):
                    errors.append(f'passions[{i}].label missing or not a string')
                if 'feed' in p:
                    if not isinstance(p['feed'], str):
                        errors.append(f'passions[{i}].feed must be a string URL')
                    else:
                        # Basic URL sanity check
                        if not (p['feed'].startswith('http://') or p['feed'].startswith('https://')):
                            errors.append(f'passions[{i}].feed does not look like a valid URL: {p["feed"]}')
                        else:
                            # Try fetching the feed with a short timeout; warn but don't fail on network issues
                            try:
                                ctx = ssl.create_default_context()
                                req = urllib.request.Request(p['feed'], headers={'User-Agent':'tlacy-validator/1.0'})
                                with urllib.request.urlopen(req, timeout=5, context=ctx) as resp:
                                    code = resp.getcode()
                                    if code >= 400:
                                        print(f'Warning: feed {p["feed"]} returned HTTP {code}')
                            except urllib.error.HTTPError as he:
                                print(f'Warning: feed {p["feed"]} HTTPError: {he.code}')
                            except Exception as e:
                                print(f'Warning: could not reach feed {p["feed"]}: {e}')

if errors:
    print('\n'.join(errors))
    sys.exit(1)
print('content.json looks valid and referenced files exist (if any).')

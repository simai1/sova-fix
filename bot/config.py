from dotenv import load_dotenv
from os import getenv

import pytz

load_dotenv(dotenv_path='.env')

BOT_TOKEN = getenv('BOT_TOKEN')
API_URL = getenv('API_URL')
WEBSOKET_URL = getenv('WEBSOKET_URL')
WEB_URL = getenv('WEB_URL')

print(API_URL, WEBSOKET_URL)

TIMEZONE = pytz.timezone('Europe/Moscow')

IMG_PATH = '/resources/images'

# Proxy для Telegram API
PROXY_ENABLED = getenv('PROXY_ENABLED', 'false').lower() in ('true', '1', 'yes')
PROXY_HOST = getenv('PROXY_HOST', '')
PROXY_PORT = getenv('PROXY_PORT', '')
PROXY_LOGIN = getenv('PROXY_LOGIN', '')
PROXY_PASSWORD = getenv('PROXY_PASSWORD', '')
PROXY_TYPE = getenv('PROXY_TYPE', 'socks5').lower()


def get_proxy_url() -> str | None:
    if not PROXY_ENABLED or not PROXY_HOST or not PROXY_PORT:
        return None
    scheme = 'socks5' if PROXY_TYPE == 'socks5' else 'http'
    if PROXY_LOGIN and PROXY_PASSWORD:
        return f"{scheme}://{PROXY_LOGIN}:{PROXY_PASSWORD}@{PROXY_HOST}:{PROXY_PORT}"
    return f"{scheme}://{PROXY_HOST}:{PROXY_PORT}"

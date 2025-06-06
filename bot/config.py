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

import asyncio
from pprint import pprint

from aiogram import Bot
from aiogram.types import FSInputFile

from bot import config as cf

from bot.util import crm, logger

import requests


dev = 'http://localhost:3000'

async def test() -> None:
    url = f'{dev}/requests/'

    values = {
        'unit': 'unit1',
        'object': 'obj1',
        'problemDescription': 'desc',
        'urgency': 'urg1',
        'tgUserId': 'f74fcceb-c385-43b1-99d6-b609ca215223'
    }
    with open('../api/uploads/0ae2ac1b-59e6-45b4-aa34-afd007d9265e.jpg', 'rb') as photo:
        photo_file = {'file': ('img.jpg', photo, 'image/jpeg')}
        request = requests.post(url=url, data=values, files=photo_file)

    if request.status_code == 200:
        logger.info(f'new repair request! {values}')
        return values
    else:
        logger.error('could not create repair request', f'{request.status_code} \n{values}')
        return None


if __name__ == '__main__':
    asyncio.run(test())

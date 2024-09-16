import asyncio
from pprint import pprint

import requests
import websocket
import config as cf
from bot.util import crm


async def test() -> None:
    await crm.get_all_requests_with_params("number=19,20")


if __name__ == '__main__':
    asyncio.run(test())

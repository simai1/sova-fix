import asyncio
from pprint import pprint

import requests
import websocket
import config as cf
from bot.util import crm
from util import logger


async def test() -> None:
    logger.info("some info")
    logger.warn("warning!")
    logger.error("error rrrrrrrrrrrrrrrrrr")


if __name__ == '__main__':
    asyncio.run(test())

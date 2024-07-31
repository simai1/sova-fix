import asyncio
from asyncio.exceptions import CancelledError

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

import config as cf
from code.util import logger
# routers
from code.command.start.start_command import router as start_command_router
from code.command.register.register_command import router as register_command_router
from code.command.customer.create_repair_request import router as create_repair_request_command_router
from code.handler.pagination import router as pagination_router

routers = [
    start_command_router,
    register_command_router,
    create_repair_request_command_router,
    pagination_router,
]

dp = Dispatcher()


async def include_routers() -> None:
    for router in routers:
        dp.include_router(router)


async def main() -> None:
    bot = Bot(token=cf.TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    await include_routers()

    try:
        logger.info('bot is running!')
        await dp.start_polling(bot)
    except (CancelledError, KeyboardInterrupt, SystemExit):
        dp.shutdown()
        logger.info('stopping')


if __name__ == '__main__':
    asyncio.run(main())

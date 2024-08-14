import asyncio
from asyncio.exceptions import CancelledError

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from bot import config as cf
from bot.util import logger
# routers
from bot.command.start.start_command import router as start_command_router
from bot.command.register.register_command import router as register_command_router
from bot.command.customer.create_repair_request import router as create_repair_request_command_router
from bot.command.customer.show_customer_requests import router as show_customer_requests_command_router
from bot.command.customer.request_not_relevant import router as customer_request_not_relevant_router
from bot.command.contractor.show_contractor_requests import router as show_contractor_requests_command_router
from bot.command.contractor.request_done import router as contractor_request_done_router
from bot.command.common.add_comment import router as add_comment_router
from bot.handler.pagination import router as pagination_router

routers = [
    start_command_router,
    register_command_router,
    create_repair_request_command_router,
    show_customer_requests_command_router,
    customer_request_not_relevant_router,
    show_contractor_requests_command_router,
    contractor_request_done_router,
    add_comment_router,
    pagination_router
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

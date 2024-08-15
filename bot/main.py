import asyncio
from asyncio.exceptions import CancelledError

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

import config as cf
from command.common.add_comment import router as add_comment_router
from command.contractor.request_done import router as contractor_request_done_router
from command.contractor.show_contractor_requests import router as show_contractor_requests_command_router
from command.contractor.show_itinerary import router as show_itinerary_router
from command.customer.create_repair_request import router as create_repair_request_command_router
from command.customer.request_not_relevant import router as customer_request_not_relevant_router
from command.customer.show_customer_requests import router as show_customer_requests_command_router
from command.register.register_command import router as register_command_router
# routers
from command.start.start_command import router as start_command_router
from handler.pagination import router as pagination_router
from util import logger

routers = [
    start_command_router,
    register_command_router,
    create_repair_request_command_router,
    show_customer_requests_command_router,
    customer_request_not_relevant_router,
    show_contractor_requests_command_router,
    show_itinerary_router,
    contractor_request_done_router,
    add_comment_router,
    pagination_router
]

dp = Dispatcher()

logger.init()


async def include_routers() -> None:
    for router in routers:
        dp.include_router(router)


async def main() -> None:
    bot = Bot(token=cf.BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    await include_routers()

    try:
        logger.info('bot is running')
        await dp.start_polling(bot)
    except (CancelledError, KeyboardInterrupt, SystemExit):
        dp.shutdown()
        logger.info('stopping')


if __name__ == '__main__':
    asyncio.run(main())
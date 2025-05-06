import asyncio
from asyncio.exceptions import CancelledError

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

import config as cf
from util.websocket_worker import WebSocketWorker
# routers
from command.common.add_comment import router as add_comment_router
from command.common.request_done import router as request_done_router
from command.contractor.show_contractor_requests import router as show_contractor_requests_command_router
from command.contractor.show_itinerary import router as show_itinerary_router
from command.common.create_repair_request import router as create_repair_request_command_router
from command.common.request_not_relevant import router as customer_request_not_relevant_router
from command.customer.show_customer_requests import router as show_customer_requests_command_router
from command.register.register_command import router as register_command_router
from command.start.start_command import router as start_command_router
from command.admin.show_admin_requests import router as show_requests_admin_router
from handler.pagination import router as pagination_router
from command.common.send_one_request import router as send_one_request_router
from command.common.add_check import router as add_check_router
from command.common.send_request_by_number import router as request_by_number_router
from command.common.show_without_check import router as show_without_check_router
from command.admin.set_contractor_command import router as set_contractor_router
from command.common.show_manager_requests import router as show_manager_requests_router
from inline_query.base_inline_query_handler import router as base_inline_query_router
from util import logger

routers = [
    start_command_router,
    register_command_router,
    create_repair_request_command_router,
    show_customer_requests_command_router,
    customer_request_not_relevant_router,
    show_contractor_requests_command_router,
    show_itinerary_router,
    request_done_router,
    add_comment_router,
    show_requests_admin_router,
    pagination_router,
    send_one_request_router,
    add_check_router,
    request_by_number_router,
    show_without_check_router,
    set_contractor_router,
    show_manager_requests_router,
    base_inline_query_router
]

dp = Dispatcher()

logger.init()


async def include_routers() -> None:
    for router in routers:
        dp.include_router(router)


async def main() -> None:
    bot = Bot(token=cf.BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    await include_routers()

    loop = asyncio.get_event_loop()

    ws_worker = WebSocketWorker(bot, loop)
    ws_worker.open_connection()

    try:
        logger.info('bot is running')
        await dp.start_polling(bot)
    except (CancelledError, KeyboardInterrupt, SystemExit):
        dp.shutdown()
        ws_worker.close_connection()
        logger.info('stopping')


if __name__ == '__main__':
    asyncio.run(main())

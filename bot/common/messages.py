import asyncio
from typing import Callable

from aiogram.exceptions import TelegramNetworkError
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, FSInputFile
from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM
from aiogram.utils.media_group import MediaGroupBuilder

from common.text import repair_request_text
from handler import pagination
from util import logger

from common.keyboard import to_start_kb, rr_admin_kb, rr_customer_kb, rr_contractor_kb


async def you_cant_do_that(message: Message) -> None:
    await message.answer('Вы не можете этого сделать')


async def send_back_to_start(message: Message) -> None:
    await message.answer("Вернуться на главную?", reply_markup=to_start_kb())


async def send_repair_request(message: Message, repair_request: dict, kb: IKM) -> None:
    text = repair_request_text(repair_request)

    uploads_path = "../api/uploads/"
    photo_filename = repair_request['fileName']
    rr_check_filename = repair_request['checkPhoto']

    try:
        photo_path = f"{uploads_path}/{photo_filename}"

        photo = FSInputFile(path=photo_path, filename="фото.jpg")

        if rr_check_filename is None:
            await message.answer_photo(photo, text, reply_markup=kb)
            return

        check_photo_path = f"{uploads_path}/{rr_check_filename}"

        check_photo = FSInputFile(path=check_photo_path, filename="чек.jpg")

        album = MediaGroupBuilder()
        album.add(type='photo', media=photo)
        album.add(type='photo', media=check_photo)

        await message.answer_media_group(album.build())
        await message.answer(text, reply_markup=kb)

    except TelegramNetworkError:
        logger.error(f"photo or check not found", f"photo: {photo_filename}, check: {rr_check_filename}")
        return


async def send_several_requests(repair_requests: list, message: Message, state: FSMContext, send_func: Callable) -> None:
    page = await pagination.get_page_in_state(state)

    bound_ = page * pagination.requests_per_page
    _bound = bound_ + pagination.requests_per_page

    for rr in repair_requests[::-1][bound_:_bound]:
        await send_func(message, rr)
        await asyncio.sleep(0.2)


async def send_rr_for_contractor(message: Message, repair_request: dict) -> None:
    await send_repair_request(message, repair_request, rr_contractor_kb(repair_request))


async def send_many_rr_for_contractor(repair_requests: list, message: Message, state: FSMContext) -> None:
    await send_several_requests(repair_requests, message, state, send_rr_for_contractor)


async def send_rr_for_customer(message: Message, repair_request: dict) -> None:
    await send_repair_request(message, repair_request, rr_customer_kb(repair_request))


async def send_many_rr_for_customer(repair_requests: list, message: Message, state: FSMContext) -> None:
    await send_several_requests(repair_requests, message, state, send_rr_for_customer)


async def send_rr_for_admin(message: Message, repair_request: dict) -> None:
    await send_repair_request(message, repair_request, rr_admin_kb(repair_request))

async def send_many_rr_for_admin(repair_requests: list, message: Message, state: FSMContext) -> None:
    await send_several_requests(repair_requests, message, state, send_rr_for_admin)

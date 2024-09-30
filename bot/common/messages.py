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


async def to_start_msg(message: Message) -> None:
    await message.answer("Вернуться на главную?", reply_markup=to_start_kb())


async def send_repair_request(message: Message, repair_request: dict, kb: IKM | None = None) -> None:
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


async def page0_show_many_requests(
        message: Message,
        state: FSMContext,
        repair_requests: list[dict],
        send_many_func: Callable,
        prefix: str,
        params: str = ""
) -> None:
    if not repair_requests and prefix != "it":
        await message.answer('Здесь пока что нет заявок', reply_markup=to_start_kb())

    await pagination.set_page_in_state(state, 0)
    await send_many_func(repair_requests, message, state)
    await pagination.send_next_button_if_needed(len(repair_requests), message, state, prefix=prefix, params=params)

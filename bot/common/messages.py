import asyncio
from typing import Callable

from aiogram.exceptions import TelegramNetworkError
from aiogram.fsm.context import FSMContext
from aiogram.types import InlineKeyboardMarkup as IKM, BufferedInputFile
from aiogram.types import Message, FSInputFile
from aiogram.utils.media_group import MediaGroupBuilder

from common.keyboard import to_start_kb
from common.text import repair_request_text
from handler import pagination
from util import logger, crm


async def you_cant_do_that(message: Message) -> None:
    await message.answer('Вы не можете этого сделать')


async def to_start_msg(message: Message) -> None:
    await message.answer("Вернуться на главную?", reply_markup=to_start_kb())


async def add_media_to_album(media_filename: str, caption: str, album: MediaGroupBuilder) -> None:
    file_ext = media_filename.split('.')[-1]
    media_type: str = {"jpg": "photo", "mp4": "video", "10": "video"}[file_ext]

    file = await crm.get_static_content(media_filename)

    input_file = BufferedInputFile(file=file, filename=f"{caption}.{file_ext}")

    album.add(type=media_type, media=input_file, caption=f"<i>{caption}</i>")


async def send_repair_request(message: Message, repair_request: dict, kb: IKM | None = None) -> None:
    text = repair_request_text(repair_request)

    file_filename = repair_request['fileName']
    rr_check_filename = repair_request['checkPhoto']
    rr_comment_attachment_filename = repair_request['commentAttachment']

    try:
        album = MediaGroupBuilder()

        await add_media_to_album(
            media_filename=file_filename,
            caption="Описание проблемы",
            album=album
        )

        if rr_check_filename is not None:
            await add_media_to_album(
                media_filename=rr_check_filename,
                caption="Чек",
                album=album
            )

        if rr_comment_attachment_filename is not None:
            await add_media_to_album(
                media_filename=rr_comment_attachment_filename,
                caption="Вложение комментария",
                album=album
            )

        await message.answer_media_group(album.build())
        await message.answer(text, reply_markup=kb)

    except TelegramNetworkError:
        logger.error(f"could not find some photos", f"photo: {file_filename}, check: {rr_check_filename}, comment_attachment: {rr_comment_attachment_filename}")
        return


async def send_several_requests(repair_requests: list, message: Message, state: FSMContext, send_func: Callable) -> None:
    page = await pagination.get_page_in_state(state)

    bound_ = page * pagination.requests_per_page
    _bound = bound_ + pagination.requests_per_page

    for rr in repair_requests[bound_:_bound]:
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
    if not repair_requests:
        match prefix:
            case "it":
                no_rr_text = "В маршрутном листе пока что нет заявок"
            case _:
                no_rr_text = "Здесь пока что нет заявок"

        await message.answer(no_rr_text, reply_markup=to_start_kb())

    await pagination.set_page_in_state(state, 0)
    await send_many_func(repair_requests, message, state)
    await pagination.send_next_button_if_needed(len(repair_requests), message, state, prefix=prefix, params=params)

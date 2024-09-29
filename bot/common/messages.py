import asyncio
from typing import Callable

from aiogram.exceptions import TelegramNetworkError
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, FSInputFile
from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM
from aiogram.utils.media_group import MediaGroupBuilder

from data.const import statuses_ru_with_emoji
from handler import pagination
from util import logger

from common.keyboard import to_start_kb


async def you_cant_do_that(message: Message) -> None:
    await message.answer('Вы не можете этого сделать')


async def send_back_to_start(message: Message) -> None:
    await message.answer("Вернуться на главную?", reply_markup=to_start_kb())


def get_repair_request_text(repair_reqest: dict) -> str:
    lots_of_spaces = ' ' * 100
    return f"""
<b>Заявка №{repair_reqest['number']}{lots_of_spaces}&#x200D;</b>
<b>▶️Подразделение</b>: 
{repair_reqest['unit']}

<b>▶️Объект</b>: 
📍{repair_reqest['object']}

<b>▶️Описание проблемы</b>:
✍️{repair_reqest['problemDescription']}

<b>👨‍🔧Исполнитель</b>: 
👤{repair_reqest['contractor']['name'] if repair_reqest['contractor'] is not None else '<i>не указан</i>'}

<b>▶️Статус заявки</b>: {statuses_ru_with_emoji[repair_reqest['status']]}
{("<b>💰Цена ремонта: </b>" + str(repair_reqest['repairPrice']) + "\n") if repair_reqest['repairPrice'] is not None else ""}
<b>❗️Срочность</b>: <i>{repair_reqest['urgency']}</i>

<b>💬Комментарии</b>:
{repair_reqest['comment'] if repair_reqest['comment'] is not None else '<i>нет</i>'}
"""


async def send_repair_request(message: Message, repair_reqest: dict, kb: IKM) -> None:
    text = get_repair_request_text(repair_reqest)

    uploads_path = "../api/uploads/"
    photo_filename = repair_reqest['fileName']
    rr_check_filename = repair_reqest['checkPhoto']

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


async def send_rr_for_contractor(message: Message, repair_reqest: dict) -> None:
    arr_kb = []

    if repair_reqest['status'] != 3:
        row = [IKB(text='Выполнено ✅', callback_data=f"con:done:{repair_reqest['id']}")]
        arr_kb.append(row)

    if repair_reqest['checkPhoto'] is None:
        row = [IKB(text='Добавить чек 🧾', callback_data=f"con:check:{repair_reqest['id']}")]
        arr_kb.append(row)

    row = [IKB(text='Добавить комментарий 📝', callback_data=f"add_comment:{repair_reqest['id']}")]
    arr_kb.append(row)

    kb = IKM(inline_keyboard=arr_kb)

    await send_repair_request(message, repair_reqest, kb)


async def send_many_rr_for_contractor(repair_requests: list, message: Message, state: FSMContext) -> None:
    await send_several_requests(repair_requests, message, state, send_rr_for_contractor)


async def send_rr_for_customer(message: Message, repair_reqest: dict) -> None:
    arr_kb = []

    if repair_reqest['status'] != 4:
        row = [IKB(text='Неактуально ❌', callback_data=f"cus:not_relevant:{repair_reqest['id']}")]
        arr_kb.append(row)

    row = [IKB(text='Добавить комментарий 📝', callback_data=f"add_comment:{repair_reqest['id']}")]
    arr_kb.append(row)

    kb = IKM(inline_keyboard=arr_kb)

    await send_repair_request(message, repair_reqest, kb)


async def send_many_rr_for_customer(repair_requests: list, message: Message, state: FSMContext) -> None:
    await send_several_requests(repair_requests, message, state, send_rr_for_customer)


async def send_rr_for_admin(message: Message, repair_reqest: dict) -> None:
    kb = IKM(inline_keyboard=[[IKB(text='Добавить комментарий 📝', callback_data=f"add_comment:{repair_reqest['id']}")]])
    await send_repair_request(message, repair_reqest, kb)


async def send_many_rr_for_admin(repair_requests: list, message: Message, state: FSMContext) -> None:
    await send_several_requests(repair_requests, message, state, send_rr_for_admin)

import asyncio
from typing import Callable

from aiogram.exceptions import TelegramNetworkError
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, FSInputFile
from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM

from data.const import statuses_ru_locale
from handler import pagination
from util import logger

from common.keyboard import to_start_kb


async def you_cant_do_that(message: Message) -> None:
    await message.answer('Вы не можете этого сделать')


async def send_back_to_start(message: Message) -> None:
    await message.answer("Вернуться на главную?", reply_markup=to_start_kb())


def get_repair_request_text(repair_reqest: dict) -> str:
    return f"""
<b>Заявка №{repair_reqest['number']}</b>

<b>▶️Подразделение</b>: 
{repair_reqest['unit']}

<b>▶️Объект</b>: 
📍{repair_reqest['object']}

<b>▶️Описание проблемы</b>:
✍️{repair_reqest['problemDescription']}

<b>👨‍🔧Исполнитель</b>: 
👤{repair_reqest['contractor']['name'] if repair_reqest['contractor'] is not None else '<i>не указан</i>'}

<b>▶️Статус заявки</b>: {statuses_ru_locale[repair_reqest['status']]}

<b>❗️Срочность</b>: <i>{repair_reqest['urgency']}</i>

<b>💬Комментарии</b>:
{repair_reqest['comment'] if repair_reqest['comment'] is not None else '<i>нет</i>'}
"""


async def send_repair_request(message: Message, repair_reqest: dict, kb: IKM) -> None:
    text = get_repair_request_text(repair_reqest)

    photo_path = f"../api/uploads/{repair_reqest['fileName']}"

    try:
        photo = FSInputFile(path=photo_path, filename='фото.jpg')
        await message.answer_photo(photo, text, reply_markup=kb)
    except TelegramNetworkError:
        logger.error(f"photo not found", f"{photo_path}")
        return


async def send_several_requests(repair_requests: list, message: Message, state: FSMContext, send_func: Callable) -> None:
    page = await pagination.get_page_in_state(state)

    bound_ = page * pagination.requests_per_page
    _bound = bound_ + pagination.requests_per_page

    for rr in repair_requests[::-1][bound_:_bound]:
        await send_func(message, rr)
        await asyncio.sleep(0.2)


async def send_rr_for_contractor(message: Message, repair_reqest: dict) -> None:
    if repair_reqest['status'] == 3:
        kb = IKM(inline_keyboard=[[IKB(text='Добавить комментарий 📝', callback_data=f"add_comment:{repair_reqest['id']}")]])
    else:
        kb = IKM(inline_keyboard=[
            [IKB(text='Выполнено ✅', callback_data=f"con:done:{repair_reqest['id']}")],
            [IKB(text='Добавить комментарий 📝', callback_data=f"add_comment:{repair_reqest['id']}")]
        ])

    await send_repair_request(message, repair_reqest, kb)


async def send_many_rr_for_contractor(repair_requests: list, message: Message, state: FSMContext) -> None:
    await send_several_requests(repair_requests, message, state, send_rr_for_contractor)


async def send_rr_for_customer(message: Message, repair_reqest: dict) -> None:
    if repair_reqest['status'] == 4:
        kb = IKM(inline_keyboard=[[IKB(text='Добавить комментарий 📝', callback_data=f"add_comment:{repair_reqest['id']}")]])
    else:
        kb = IKM(inline_keyboard=[
            [IKB(text='Неактуально ❌', callback_data=f"cus:not_relevant:{repair_reqest['id']}")],
            [IKB(text='Добавить комментарий 📝', callback_data=f"add_comment:{repair_reqest['id']}")]
        ])

    await send_repair_request(message, repair_reqest, kb)


async def send_many_rr_for_customer(repair_requests: list, message: Message, state: FSMContext) -> None:
    await send_several_requests(repair_requests, message, state, send_rr_for_customer)

import asyncio
import datetime

from aiogram import Router, F
from aiogram.exceptions import TelegramNetworkError
from aiogram.filters import Command
from aiogram.fsm.state import StatesGroup, State
from aiogram.types import Message, CallbackQuery, FSInputFile
from aiogram.fsm.context import FSMContext
from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM

from bot.common.keyboard import to_start_kb
from bot.common.messages import send_several_requests, send_repair_request
from bot.handler import pagination
from bot.util import logger, crm
from bot.util.crm import roles
from bot.util.verification import verify_user, VerificationError
from bot import config as cf

router = Router(name=__name__)


class FSMComment(StatesGroup):
    ask_comment = State()


@router.callback_query(F.data.startswith('add_comment'))
async def ask_comment(query: CallbackQuery, state: FSMContext) -> None:
    request_id = query.data.split(':')[-1]

    await state.update_data(request_id=request_id)

    await state.set_state(FSMComment.ask_comment)
    await query.message.answer('Введите комментарий✏️')

    await query.answer()


@router.message(FSMComment.ask_comment)
async def write_comment(message: Message, state: FSMContext) -> None:
    data = await state.get_data()
    request_id = data['request_id']
    user = await crm.get_user(message.from_user.id)
    role = roles.m_roles_list_ru_locale[roles.get_num(user['role'])]
    name = user['name']

    old_comment = await crm.get_repair_request_comment(request_id)
    if old_comment is None:
        old_comment = ''

    await state.clear()

    if message.text is not None:
        comment = f'{name} [{role.upper()}]:\n- {message.text}'
        new_comment = f'{old_comment}\n{comment}\n'

        if len(new_comment) > 255:
            await message.answer('Невозможно добавить комментарий, т.к. превышен лимит символов')
            return

        success = await crm.change_repair_request_comment(request_id, new_comment)

        if success:
            await message.answer('Комментарий успешно добавлен ✅', reply_markup=to_start_kb())
        else:
            await message.answer('Что-то пошло не так. Попробуйте снова позже')
        return
    
    await message.answer('Что-то пошло не так. Возможно, вы не ввели текст комментария')




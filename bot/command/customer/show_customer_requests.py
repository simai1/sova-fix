from aiogram import Router, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM
from aiogram.types import Message, CallbackQuery

from bot.common.keyboard import to_start_kb
from bot.common.messages import send_several_requests, send_repair_request
from bot.handler import pagination
from bot.util import crm
from bot.util.crm import roles
from bot.util.verification import verify_user, VerificationError

router = Router(name=__name__)


@router.message(Command('customer_requests'))
async def show_customer_requests_command_handler(message: Message, state: FSMContext) -> None:
    await show_customer_requests_handler(message.from_user.id, message, state)


@router.callback_query(F.data == 'customer_requests')
async def show_customer_requests_callback_handler(query: CallbackQuery, state: FSMContext) -> None:
    await show_customer_requests_handler(query.from_user.id, query.message, state)
    await query.answer()


async def show_customer_requests_handler(user_id: int, message: Message, state: FSMContext) -> None:
    await state.clear()

    try:
        await verify_user(user_id, message, role=roles.CUSTOMER)
    except VerificationError:
        return

    repair_requests = await crm.get_customer_requests(user_id)

    if not repair_requests:
        await message.answer('У вас пока что нет заявок', reply_markup=to_start_kb())

    await pagination.set_page_in_state(state, 0)
    await send_many_rr_for_customer(repair_requests, message, state)
    await pagination.send_next_button_if_needed(len(repair_requests), message, state)


@router.callback_query(F.data == 'show_more')
async def show_more_requests(query: CallbackQuery, state: FSMContext) -> None:
    await pagination.next_page_in_state(state)

    repair_requests = await crm.get_customer_requests(query.from_user.id)
    await send_many_rr_for_customer(repair_requests, query.message, state)
    await pagination.send_next_button_if_needed(len(repair_requests), query.message, state)

    await query.message.delete()
    await query.answer()


async def send_rr_for_customer(message: Message, repair_reqest: dict) -> None:
    if repair_reqest['status'] == 4:
        kb = IKM(inline_keyboard=[[IKB(text='Добавить комментарий 📝', callback_data=f'add_comment:{repair_reqest['id']}')]])
    else:
        kb = IKM(inline_keyboard=[
            [IKB(text='Неактуально ❌', callback_data=f'cus:not_relevant:{repair_reqest['id']}')],
            [IKB(text='Добавить комментарий 📝', callback_data=f'add_comment:{repair_reqest['id']}')]
        ])

    await send_repair_request(message, repair_reqest, kb)


async def send_many_rr_for_customer(repair_requests: list, message: Message, state: FSMContext) -> None:
    await send_several_requests(repair_requests, message, state, send_rr_for_customer)

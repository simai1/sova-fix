from aiogram import Router, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM
from aiogram.types import Message, CallbackQuery

from common.keyboard import to_start_kb
from common.messages import send_several_requests, send_repair_request
from handler import pagination
from util import crm
from util.crm import roles
from util.verification import verify_user, VerificationError

from common.messages import send_many_rr_for_contractor

router = Router(name=__name__)


@router.message(Command('contractor_requests'))
async def show_contractor_requests_command_handler(message: Message, state: FSMContext) -> None:
    await show_contractor_requests_handler(message.from_user.id, '', message, state)


@router.callback_query(F.data.startswith('contractor_requests'))
async def show_contractor_requests_callback_handler(query: CallbackQuery, state: FSMContext) -> None:
    params = query.data.split(':')[-1]
    await show_contractor_requests_handler(query.from_user.id, params, query.message, state)
    await query.answer()


async def show_contractor_requests_handler(user_id: int, params: str, message: Message, state: FSMContext) -> None:
    await state.clear()

    try:
        await verify_user(user_id, message, role=roles.CONTRACTOR)
    except VerificationError:
        return

    repair_requests = await crm.get_contractor_requests(user_id, params=params)

    if not repair_requests:
        await message.answer('Здесь пока что нет заявок', reply_markup=to_start_kb())

    await pagination.set_page_in_state(state, 0)
    await send_many_rr_for_contractor(repair_requests, message, state)
    await pagination.send_next_button_if_needed(len(repair_requests), message, state, prefix='con', params=params)


@router.callback_query(F.data.startswith('con:show_more'))
async def show_more_requests(query: CallbackQuery, state: FSMContext) -> None:
    await pagination.next_page_in_state(state)

    params = query.data.split(':')[-1]
    repair_requests = await crm.get_contractor_requests(query.from_user.id, params=params)
    await send_many_rr_for_contractor(repair_requests, query.message, state)
    await pagination.send_next_button_if_needed(len(repair_requests), query.message, state, prefix='con', params=params)

    await query.message.delete()
    await query.answer()

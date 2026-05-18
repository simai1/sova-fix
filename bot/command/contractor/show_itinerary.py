from aiogram import Router, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM
from aiogram.types import Message, CallbackQuery

from command.contractor.show_contractor_requests import send_many_rr_for_contractor
from common.messages import send_several_requests, send_repair_request, page0_show_many_requests
from handler import pagination
from util import crm
from util.crm import roles
from util.verification import verify_user, VerificationError

router = Router(name=__name__)


@router.message(Command('contractor_itinerary'))
async def show_contractor_requests_command_handler(message: Message, state: FSMContext) -> None:
    await show_contractor_requests_handler(message.from_user.id, message, state)


@router.callback_query(F.data == 'contractor_itinerary')
async def show_contractor_requests_callback_handler(query: CallbackQuery, state: FSMContext) -> None:
    await show_contractor_requests_handler(query.from_user.id, query.message, state)
    await query.answer()


async def page0_show_many_rr_for_itinerary(message: Message, state: FSMContext, repair_requests: list[dict], params: str = ""):
    await page0_show_many_requests(message, state, repair_requests, send_many_rr_for_contractor, prefix="it", params=params)


async def show_contractor_requests_handler(user_id: int, message: Message, state: FSMContext) -> None:
    await state.clear()

    try:
        await verify_user(user_id, role=roles.CONTRACTOR, message=message)
    except VerificationError:
        return

    itinerary = await crm.get_itinerary(user_id)

    await page0_show_many_rr_for_itinerary(message, state, itinerary)


@router.callback_query(F.data == 'it:show_more')
async def show_more_requests(query: CallbackQuery, state: FSMContext) -> None:
    await pagination.next_page_in_state(state)

    itinerary = await crm.get_itinerary(query.from_user.id)
    await send_many_rr_for_itinerary(itinerary, query.message, state)
    await pagination.send_next_button_if_needed(len(itinerary), query.message, state, prefix='it')

    await query.message.delete()
    await query.answer()


async def send_rr_for_itinerary(message: Message, repair_reqest: dict) -> None:
    if repair_reqest['status'] == 3:
        kb = IKM(inline_keyboard=[[IKB(text='Добавить комментарий 📝', callback_data=f'add_comment:{repair_reqest["id"]}')]])
    elif repair_reqest['status'] == 5:
        kb = IKM(inline_keyboard=[
            [IKB(text='Выполнено ✅', callback_data=f'con:done:{repair_reqest["id"]}')],
            [IKB(text='Добавить комментарий 📝', callback_data=f'add_comment:{repair_reqest["id"]}')]
        ])
    else:
        kb = IKM(inline_keyboard=[
            [IKB(text='Выезд без выполнения 🚫', callback_data=f'con:exit_not_done:{repair_reqest["id"]}')],
            [IKB(text='Выполнено ✅', callback_data=f'con:done:{repair_reqest["id"]}')],
            [IKB(text='Добавить комментарий 📝', callback_data=f'add_comment:{repair_reqest["id"]}')]
        ])

    await send_repair_request(message, repair_reqest, kb)


async def send_many_rr_for_itinerary(itinerary: list, message: Message, state: FSMContext) -> None:
    await send_several_requests(itinerary, message, state, send_rr_for_itinerary)

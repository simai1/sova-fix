from aiogram import Router, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, CallbackQuery

from common.keyboard import rr_contractor_kb
from common.messages import send_several_requests, send_repair_request, page0_show_many_requests
from handler import pagination
from util import crm
from util.crm import roles
from util.verification import verify_user, VerificationError

from data.const import statuses_keys

router = Router(name=__name__)


@router.message(Command('contractor_requests'))
async def show_contractor_requests_command_handler(message: Message, state: FSMContext) -> None:
    await show_contractor_requests_handler(message.from_user.id, '', message, state)


@router.callback_query(F.data.startswith('contractor_requests'))
async def show_contractor_requests_callback_handler(query: CallbackQuery, state: FSMContext) -> None:
    params = query.data.split(':')[-1]
    await show_contractor_requests_handler(query.from_user.id, params, query.message, state)
    await query.answer()


# send repair request functions
async def send_rr_for_contractor(message: Message, repair_request: dict) -> None:
    await send_repair_request(message, repair_request, rr_contractor_kb(repair_request))

async def send_many_rr_for_contractor(repair_requests: list, message: Message, state: FSMContext) -> None:
    await send_several_requests(repair_requests, message, state, send_rr_for_contractor)

async def page0_show_many_rr_for_contractor(message: Message, state: FSMContext, repair_requests: list[dict], params: str = ""):
    await page0_show_many_requests(message, state, repair_requests, send_many_rr_for_contractor, prefix="con", params=params)


async def show_contractor_requests_handler(user_id: int, params: str, message: Message, state: FSMContext) -> None:
    await state.clear()

    # изменение статусов индексов на сами статусы
    # НУЖНО ПЕРЕДЕЛАТЬ
    for status_k in statuses_keys:
        status_found_index = params.find(str(status_k))
        if status_found_index != -1:
            params = params.replace(status_k, statuses_keys[status_k])

    try:
        await verify_user(user_id, role=roles.CONTRACTOR, message=message)
    except VerificationError:
        return

    repair_requests = await crm.get_contractor_requests(user_id, params=params)

    await page0_show_many_rr_for_contractor(message, state, repair_requests, params)


@router.callback_query(F.data.startswith('con:show_more'))
async def show_more_requests(query: CallbackQuery, state: FSMContext) -> None:
    await pagination.next_page_in_state(state)

    params = query.data.split(':')[-1]

    # изменение статусов индексов на сами статусы
    # НУЖНО ПЕРЕДЕЛАТЬ
    for status_k in statuses_keys:
        status_found_index = params.find(str(status_k))
        if status_found_index != -1:
            params = params.replace(status_k, statuses_keys[status_k])

    repair_requests = await crm.get_contractor_requests(query.from_user.id, params=params)
    await send_many_rr_for_contractor(repair_requests, query.message, state)
    await pagination.send_next_button_if_needed(len(repair_requests), query.message, state, prefix='con', params=params)

    await query.message.delete()
    await query.answer()

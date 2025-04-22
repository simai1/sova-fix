from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message

from common.keyboard import rr_admin_kb
from common.messages import send_repair_request, send_several_requests, page0_show_many_requests
from handler import pagination
from util import crm
from util.crm import roles
from util.verification import VerificationError
from util.verification import verify_user
from data.const import statuses_keys

router = Router(name=__name__)


# send repair request functions
async def send_rr_for_admin(message: Message, repair_request: dict) -> None:
    await send_repair_request(message, repair_request, rr_admin_kb(repair_request))

async def send_many_rr_for_admin(repair_requests: list, message: Message, state: FSMContext) -> None:
    await send_several_requests(repair_requests, message, state, send_rr_for_admin)

async def page0_show_many_rr_for_admin(message: Message, state: FSMContext, repair_requests: list[dict], params: str = ""):
    await page0_show_many_requests(message, state, repair_requests, send_many_rr_for_admin, prefix="adm", params=params)


@router.callback_query(F.data.startswith("requests_admin:"))
async def show_all_requests_admin_callback_handler(query: CallbackQuery, state: FSMContext) -> None:
    await state.clear()

    params = query.data.split(':')[-1]
    params_for_request = params

    # изменение статусов индексов на сами статусы
    # НУЖНО ПЕРЕДЕЛАТЬ
    for status_k in statuses_keys:
        status_found_index = params_for_request.find(str(status_k))
        if status_found_index != -1:
            params_for_request = params_for_request.replace(status_k, statuses_keys[status_k])

    user_id = query.from_user.id

    try:
        await verify_user(user_id, role=roles.ADMIN, message=query.message)
    except VerificationError:
        return

    repair_requests = await crm.get_all_requests_with_params(params=params_for_request)

    await page0_show_many_rr_for_admin(query.message, state, repair_requests, params)

    await query.answer()


@router.callback_query(F.data.startswith('adm:show_more'))
async def show_more_requests(query: CallbackQuery, state: FSMContext) -> None:
    await pagination.next_page_in_state(state)

    params = query.data.split(':')[-1]
    params_for_request = params

    # изменение статусов индексов на сами статусы
    # НУЖНО ПЕРЕДЕЛАТЬ
    for status_k in statuses_keys:
        status_found_index = params_for_request.find(str(status_k))
        if status_found_index != -1:
            params_for_request = params_for_request.replace(status_k, statuses_keys[status_k])

    repair_requests = await crm.get_all_requests_with_params(params=params_for_request)
    await send_many_rr_for_admin(repair_requests, query.message, state)
    await pagination.send_next_button_if_needed(len(repair_requests), query.message, state, prefix='adm', params=params)

    await query.message.delete()
    await query.answer()

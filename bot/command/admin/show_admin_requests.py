from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery

from util import crm
from util.verification import verify_user
from util.crm import roles
from util.verification import VerificationError
from handler import pagination
from common.messages import send_many_rr_for_admin
from common.keyboard import to_start_kb

router = Router(name=__name__)


@router.callback_query(F.data.startswith("requests_admin:"))
async def show_all_requests_admin_callback_handler(query: CallbackQuery, state: FSMContext) -> None:
    await state.clear()

    params = query.data.split(':')[-1]

    user_id = query.from_user.id

    try:
        await verify_user(user_id, query.message, role=roles.ADMIN)
    except VerificationError:
        return

    repair_requests = await crm.get_all_requests_with_params(params=params)

    if not repair_requests:
        await query.message.answer('Пока что список заявок пуст', reply_markup=to_start_kb())

    await pagination.set_page_in_state(state, 0)
    await send_many_rr_for_admin(repair_requests, query.message, state)
    await pagination.send_next_button_if_needed(len(repair_requests), query.message, state, prefix='adm')

    await query.answer()

@router.callback_query(F.data.startwith('adm:show_more'))
async def show_more_requests(query: CallbackQuery, state: FSMContext) -> None:
    await pagination.next_page_in_state(state)

    params = query.data.split(':')[-1]

    repair_requests = await crm.get_all_requests_with_params(params=params)
    await send_many_rr_for_admin(repair_requests, query.message, state)
    await pagination.send_next_button_if_needed(len(repair_requests), query.message, state, prefix='adm', params=params)

    await query.message.delete()
    await query.answer()

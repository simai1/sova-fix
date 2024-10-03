from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery

from command.admin.show_admin_requests import page0_show_many_rr_for_admin
from command.contractor.show_contractor_requests import page0_show_many_rr_for_contractor
from common.keyboard import to_start_kb
from util import crm

router = Router(name=__name__)


@router.callback_query(F.data == 'show_requests_without_check')
async def request_by_number_callback_handler(query: CallbackQuery, state: FSMContext) -> None:
    user_id = query.from_user.id
    params = f"checkPhoto=null"

    user = await crm.get_user(user_id)
    role = crm.roles.get_num(user['role'])

    match role:
        case crm.roles.CONTRACTOR:
            repair_requests = await crm.get_contractor_requests(user_id, params)
            await page0_show_many_rr_for_contractor(query.message, state, repair_requests, params)

        case crm.roles.ADMIN:
            repair_requests = await crm.get_all_requests_with_params(params)
            await page0_show_many_rr_for_admin(query.message, state, repair_requests, params)

        case _:
            await query.message.answer("Вы не можете этого сделать", reply_markup=to_start_kb())
            return

    await query.answer()

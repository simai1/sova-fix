from aiogram import Bot, Router, F
from aiogram.types import CallbackQuery

from common.messages import send_rr_for_customer, send_rr_for_contractor, send_back_to_start

from util import crm

router = Router(name=__name__)


@router.callback_query(F.data.startswith('send1rr'))
async def send_one_repair_request_handler(query: CallbackQuery) -> None:
    request_id, role = query.data.split(':')[1:]
    rr = await crm.get_repair_request(request_id)

    match int(role):
        case crm.roles.CUSTOMER:
            await send_rr_for_customer(query.message, rr)
        case crm.roles.CONTRACTOR:
            await send_rr_for_contractor(query.message, rr)
        case _:
            print(request_id, role)

    await send_back_to_start(query.message)
    await query.answer()




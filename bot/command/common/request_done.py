from aiogram import Router, F
from aiogram.types import CallbackQuery

from util import crm

router = Router(name=__name__)


@router.callback_query(F.data.startswith('done'))
async def request_done_callback_handler(query: CallbackQuery) -> None:
    request_id = query.data.split(':')[-1]

    await crm.change_repair_request_status(request_id, 3)

    await query.message.answer('Статус заявки изменён ✅')
    await query.answer()

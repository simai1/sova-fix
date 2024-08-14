from aiogram import Router, F
from aiogram.types import CallbackQuery

from bot.util import crm

router = Router(name=__name__)


@router.callback_query(F.data.startswith('cus:not_relevant'))
async def request_not_relevant_callback_handler(query: CallbackQuery) -> None:
    request_id = query.data.split(':')[-1]

    await crm.change_repair_request_status(request_id, 4)

    await query.message.answer('Статус заявки изменён ✅')
    await query.answer()

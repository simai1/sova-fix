from aiogram import Router, F
from aiogram.types import CallbackQuery

from util import crm
from util import logger
from common.keyboard import is_manager_executor

router = Router(name=__name__)


@router.callback_query(F.data.startswith('done'))
async def request_done_callback_handler(query: CallbackQuery) -> None:
    request_id = query.data.split(':')[-1]
    user_id = query.from_user.id
    
    request = await crm.get_repair_request(request_id)
    if not request:
        logger.error(f"Не удалось получить данные заявки {request_id}")
        await query.message.answer('Не удалось получить данные заявки ❌')
        await query.answer()
        return
    
    user_data = await crm.get_user(user_id)
    if not user_data:
        await query.message.answer('У вас нет прав на выполнение этой заявки ❌')
        await query.answer()
        return
    
    user_role = crm.User(user_data).role if user_data else None
    
    is_executor = await is_manager_executor(user_id, request)
    
    can_complete = (
        is_executor or 
        user_role == crm.roles.ADMIN or
        user_role == crm.roles.CONTRACTOR
    )
    
    if not can_complete:
        await query.message.answer('У вас нет прав на выполнение этой заявки ❌')
        await query.answer()
        return
    
    result = await crm.change_repair_request_status(request_id, 3)
    
    if result:
        await query.message.answer('Статус заявки изменён на "Выполнена" ✅')
        
        updated_request = await crm.get_repair_request(request_id)
        if updated_request:
            display_role = user_role if user_role else crm.roles.USER
            
            from command.common.send_one_request import send_rr
            await send_rr(updated_request, query.message, display_role)
    else:
        await query.message.answer('Не удалось изменить статус заявки ❌')
    
    await query.answer()

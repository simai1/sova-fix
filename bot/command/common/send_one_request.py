from aiogram import Bot, Router, F
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message

from command.admin.show_admin_requests import send_rr_for_admin
from command.contractor.show_contractor_requests import send_rr_for_contractor
from command.customer.show_customer_requests import send_rr_for_customer
from common.messages import to_start_msg, send_repair_request
from util import crm, logger
from common.keyboard import is_manager_executor

router = Router(name=__name__)

@router.callback_query(F.data.startswith('send1rr'))
async def send_one_repair_request_callback_handler(query: CallbackQuery) -> None:
    parts = query.data.split(':')
    
    user_id = query.from_user.id
    chat_id = query.message.chat.id
    
    if len(parts) < 3:
        await query.answer("Ошибка при получении данных заявки")
        return
    
    request_id = parts[1]
    role = parts[2]
    
    rr = await crm.get_repair_request(request_id)
    
    if not rr:
        await query.answer("Заявка не найдена")
        return
    
    try:
        await send_rr(rr, query.message, int(role))
    except Exception as e:
        logger.error(f"Ошибка при отправке заявки: {str(e)}")
        await query.message.answer("Произошла ошибка при отображении заявки")
    
    await query.answer()


@router.message(Command("rr"))
async def send_one_repair_request_command_handler(message: Message) -> None:
    params = message.text.split()[1:]
    user_data = await crm.get_user(message.from_user.id)

    if user_data is None:
        await message.answer("Что-то пошло не так")
        return

    request_number: str = params[0]

    rrs = await crm.get_rrs_for_user(
        user_data=user_data,
        params=f"number={request_number}"
    )

    if len(rrs) == 0:
        return

    await send_rr(rrs[0], message, crm.User(user_data).role)


async def send_rr(rr: dict, msg_to_answer: Message, role: int | None = None) -> None:
    from util import logger
    
    user_id = msg_to_answer.chat.id
    
    if role == crm.roles.ADMIN or role == crm.roles.USER:
        is_executor = await is_manager_executor(user_id, rr)
        
        if is_executor:
            from command.common.show_manager_requests import send_rr_for_manager
            await send_rr_for_manager(msg_to_answer, rr)
            await to_start_msg(msg_to_answer)
            return
    
    match role:
        case crm.roles.USER:
            await send_rr_for_admin(msg_to_answer, rr)
        case crm.roles.CUSTOMER:
            await send_rr_for_customer(msg_to_answer, rr)
        case crm.roles.CONTRACTOR:
            await send_rr_for_contractor(msg_to_answer, rr)
        case crm.roles.ADMIN:
            await send_rr_for_admin(msg_to_answer, rr)
        case None:
            await send_repair_request(msg_to_answer, rr)
        case _:
            logger.error(f"Неизвестная роль: {role}")
            await send_repair_request(msg_to_answer, rr)

    await to_start_msg(msg_to_answer)
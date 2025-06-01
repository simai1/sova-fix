from aiogram import Router, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, CallbackQuery

from common.keyboard import rr_manager_assigned_kb, is_manager_executor, rr_admin_kb
from common.messages import send_repair_request, send_several_requests, page0_show_many_requests
from handler import pagination
from util import crm
from util.crm import roles
from util.verification import verify_user, VerificationError
from util import logger

router = Router(name=__name__)

async def send_rr_for_manager(message: Message, repair_request: dict) -> None:
    try:
        user_id = message.chat.id
        if not repair_request or 'id' not in repair_request:
            await message.answer("Не удалось загрузить данные заявки")
            return
        
        is_executor = await is_manager_executor(user_id, repair_request)
        
        if is_executor:
            kb = rr_manager_assigned_kb(repair_request)
        else:
            kb = rr_admin_kb(repair_request)
            
        # Используем стандартную функцию отправки заявки с медиа
        await send_repair_request(message, repair_request, kb)
        
    except Exception as e:
        logger.error(f"Ошибка при отображении заявки для менеджера: {str(e)}")
        await message.answer("Произошла ошибка при отображении заявки")


async def send_many_rr_for_manager(repair_requests: list[dict], message: Message, state: FSMContext) -> None:
    await send_several_requests(repair_requests, message, state, send_rr_for_manager)


async def page0_show_many_rr_for_manager(message: Message, state: FSMContext, repair_requests: list[dict], params: str = ""):
    await page0_show_many_requests(message, state, repair_requests, send_many_rr_for_manager, prefix="manager", params=params)

@router.message(Command("assigned_tasks"))
async def manager_assigned_tasks_command_handler(message: Message, state: FSMContext) -> None:
    try:
        user = await verify_user(message.from_user.id, [roles.USER, roles.ADMIN])
    except VerificationError as e:
        await message.answer(f"{e}")
        return

    repair_requests = await crm.get_manager_assigned_requests(message.from_user.id)

    if not repair_requests or len(repair_requests) == 0:
        await message.answer("У вас нет назначенных задач 🤷‍♂️")
        return

    if len(repair_requests) == 1:
        await send_rr_for_manager(message, repair_requests[0])
    else:
        await page0_show_many_rr_for_manager(message, state, repair_requests)


@router.callback_query(F.data == "show_manager_assigned_tasks")
async def manager_assigned_tasks_callback_handler(query: CallbackQuery, state: FSMContext) -> None:
    try:
        user = await verify_user(query.from_user.id, [roles.USER, roles.ADMIN])
    except VerificationError as e:
        await query.message.answer(f"{e}")
        await query.answer()
        return

    logger.info(f"Запрос назначенных задач для пользователя: {query.from_user.id}")
    
    repair_requests = await crm.get_manager_assigned_requests(query.from_user.id)
    
    logger.info(f"Получено заявок для пользователя {query.from_user.id}: {len(repair_requests) if repair_requests else 0}")
    
    if repair_requests:
        for i, req in enumerate(repair_requests):
            logger.info(f"Заявка {i+1}: ID={req.get('id')}, статус={req.get('status')}, managerId={req.get('managerId')}, managerTgId={req.get('managerTgId')}")

    if not repair_requests or len(repair_requests) == 0:
        await query.message.answer("У вас нет назначенных задач 🤷‍♂️")
        await query.answer()
        return

    if len(repair_requests) == 1:
        await send_rr_for_manager(query.message, repair_requests[0])
    else:
        await page0_show_many_rr_for_manager(query.message, state, repair_requests)
    
    await query.answer()


@router.callback_query(F.data.startswith("manager:show_more"))
async def manager_show_more_callback_handler(query: CallbackQuery, state: FSMContext) -> None:
    try:
        user = await verify_user(query.from_user.id, [roles.USER, roles.ADMIN])
    except VerificationError as e:
        await query.message.answer(f"{e}")
        await query.answer()
        return
    
    data = await state.get_data()
    page = data.get("page", 0) + 1
    await state.update_data(page=page)
    
    callback_parts = query.data.split(":")
    params = callback_parts[-1] if len(callback_parts) > 2 else ""
    
    repair_requests = await crm.get_manager_assigned_requests(query.from_user.id)
    
    if not repair_requests:
        await query.answer("Не удалось загрузить задачи")
        return
    
    try:
        await query.message.delete()
    except Exception:
        pass
    
    await send_many_rr_for_manager(repair_requests[(page-1)*3:page*3], query.message, state)
    
    from handler.pagination import send_next_button_if_needed
    await send_next_button_if_needed(len(repair_requests), query.message, state, "manager", params)
    
    await query.answer() 
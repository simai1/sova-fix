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
        
        text = await get_request_text(repair_request)
        
        if is_executor:
            kb = rr_manager_assigned_kb(repair_request)
            await message.answer(text, reply_markup=kb, parse_mode="Markdown", disable_web_page_preview=True)
        else:
            kb = rr_admin_kb(repair_request)
            await message.answer(text, reply_markup=kb, parse_mode="Markdown", disable_web_page_preview=True)
    except Exception as e:
        await message.answer("Произошла ошибка при отображении заявки")


async def send_many_rr_for_manager(message: Message, repair_requests: list[dict], params: str = "") -> None:
    await send_several_requests(message, repair_requests, send_rr_for_manager)


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

    repair_requests = await crm.get_manager_assigned_requests(query.from_user.id)

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
    
    await send_many_rr_for_manager(query.message, repair_requests[(page-1)*3:page*3], params)
    
    from handler.pagination import send_next_button_if_needed
    await send_next_button_if_needed(len(repair_requests), query.message, state, "manager", params)
    
    await query.answer()


async def get_request_text(repair_request: dict) -> str:
    """
    Формирует текст для отображения информации о заявке.
    
    Args:
        repair_request: Словарь с данными заявки
        
    Returns:
        Отформатированный текст заявки
    """
    try:
        status_num = repair_request.get('status')
        if isinstance(status_num, str):
            try:
                status_num = int(status_num)
            except (ValueError, TypeError):
                logger.error(f"Ошибка преобразования статуса {status_num} в число")
                status_num = 2  # По умолчанию "В работе"
        
        status_map = {
            1: "🆕 Новая",
            2: "🔄 В работе",
            3: "✅ Выполнена",
            4: "❌ Неактуальна"
        }
        status_str = status_map.get(status_num, f"Статус {status_num}")
        
        text = f"🔍 *Заявка №{repair_request.get('number')}*\n"
        text += f"📊 *Статус:* {status_str}\n\n"
        
        if repair_request.get('Object'):
            text += f"📍 *Объект:* {repair_request['Object'].get('name', 'Не указан')}\n"
        elif repair_request.get('object'):
            text += f"📍 *Объект:* {repair_request.get('object', 'Не указан')}\n"
        
        if repair_request.get('LegalEntity'):
            text += f"🏢 *Юр. лицо:* {repair_request['LegalEntity'].get('name', 'Не указано')}\n"
        
        if repair_request.get('Unit'):
            text += f"🏛 *Подразделение:* {repair_request['Unit'].get('name', 'Не указано')}\n"
        elif repair_request.get('unit'):
            text += f"🏛 *Подразделение:* {repair_request.get('unit', 'Не указано')}\n"
        
        text += f"\n📋 *Описание проблемы:*\n{repair_request.get('problemDescription', 'Не указано')}\n"
        
        text += f"\n⏱ *Срочность:* {repair_request.get('urgency', 'Не указана')}\n"
        
        executor = "не указан"
        if repair_request.get('contractor') is not None:
            executor = repair_request['contractor'].get('name', 'Подрядчик')
        elif repair_request.get('builder'):
            executor = repair_request.get('builder')
        
        text += f"👨‍🔧 *Исполнитель:* {executor}\n"
        
        if repair_request.get('repairPrice'):
            text += f"💰 *Стоимость:* {repair_request.get('repairPrice')}\n"
        
        if repair_request.get('comment'):
            text += f"\n💬 *Комментарий:*\n{repair_request.get('comment')}\n"
        
        if repair_request.get('checkPhoto'):
            text += "\n🧾 Прикреплен чек\n"
        
        return text
    except Exception as e:
        logger.error(f"Ошибка при формировании текста заявки: {str(e)}")
        return "Ошибка при формировании информации о заявке" 
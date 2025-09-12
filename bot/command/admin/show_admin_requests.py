from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message
from aiogram.fsm.state import State, StatesGroup

from common.keyboard import rr_admin_kb, is_manager_executor
from common.messages import send_repair_request, send_several_requests, page0_show_many_requests
from handler import pagination
from util import crm
from util.crm import roles
from util.verification import VerificationError
from util.verification import verify_user
from data.const import statuses_keys
from util import logger
from data import data_loader
from common.keyboard import to_start_kb
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

router = Router(name=__name__)

class FSMAdminRequestsFilter(StatesGroup):
    unit_input = State()
    object_input = State()

async def process_object_selection(message: Message, state: FSMContext, object_id: str | None, user_id: int | None = None):
    await state.update_data(object=object_id)
    await state.update_data(page=0)

    tg_user_id = await crm.get_tg_user_id(user_id)
    unit_id = (await state.get_data()).get("unit")

    repair_requests = await crm.get_actual_admin_requests_by_objects(
        tg_user_id=tg_user_id,
        unit_id=unit_id,
        object_id=object_id
    )
    await page0_show_many_rr_for_admin(message, state, repair_requests, object_id)

async def ask_unit(message: Message, state: FSMContext, user_id: int) -> None:
    await state.clear()

    tg_user_id = await crm.get_tg_user_id(user_id)
    if not tg_user_id:
        await message.answer(
            "Не удалось найти вашу учетную запись. Пожалуйста, свяжитесь с поддержкой.",
            reply_markup=to_start_kb()
        )
        return

    units_with_objects = await data_loader.get_user_objects_by_units_with_count_request_manager(tg_user_id)
    if not units_with_objects:
        await message.answer(
            "У вас нет доступа к объектам. Обратитесь к менеджеру для получения доступа.",
            reply_markup=to_start_kb()
        )
        return

    if len(units_with_objects) == 1:
        unit_id = list(units_with_objects.keys())[0]
        objects_data = units_with_objects[unit_id]
        await state.update_data(unit=unit_id)

        if not objects_data:
            await message.answer(
                "У вас нет доступа к объектам в этом подразделении. Обратитесь к менеджеру.",
                reply_markup=to_start_kb()
            )
            return

        if len(objects_data) == 1:
            object_id = list(objects_data.values())[0]
            await process_object_selection(message, state, object_id, user_id)
            return

        buttons = {"Все объекты": None}
        buttons.update(objects_data)
        names = await pagination.set_pages_data(buttons, state)
        kb = pagination.make_kb(0, names, prefix='object')
        
        # Если подразделений больше одного, добавляем кнопку "Назад"
        if len(units_with_objects) > 1:
            back_btn = InlineKeyboardButton(text="⬅️ Назад", callback_data="object:back")
            kb.inline_keyboard.append([back_btn])
        
        home_btn = InlineKeyboardButton(text="На главную ↩️", callback_data="start_remove_kb")
        kb.inline_keyboard.append([home_btn])

        await state.set_state(FSMAdminRequestsFilter.object_input)
        await message.answer("Выберите объект", reply_markup=kb)

    else:
        await state.set_state(FSMAdminRequestsFilter.unit_input)
        units_data = await data_loader.get_units_data()
        filtered_units_data = {k: v for k, v in units_data.items() if v in units_with_objects}

        if not filtered_units_data:
            await message.answer(
                "Ошибка при получении списка подразделений. Обратитесь в поддержку.",
                reply_markup=to_start_kb()
            )
            return

        names = await pagination.set_pages_data(filtered_units_data, state)
        kb = pagination.make_kb(0, names, prefix='unit')
        await message.answer("Выберите подразделение", reply_markup=kb)


@router.callback_query(FSMAdminRequestsFilter.unit_input, F.data.startswith('unit'))
async def ask_object(query: CallbackQuery, state: FSMContext) -> None:
    unit_id = await pagination.get_selected_value(query, state)
    await state.update_data(unit=unit_id)

    user_id = query.from_user.id
    tg_user_id = await crm.get_tg_user_id(user_id)

    objects_data = (await data_loader.get_user_objects_by_units_with_count_request_manager(tg_user_id)).get(unit_id, {})
    if not objects_data:
        await query.message.answer(
            "У вас нет доступа к объектам в этом подразделении.",
            reply_markup=to_start_kb()
        )
        await state.clear()
        return

    if len(objects_data) == 1:
        object_id = list(objects_data.values())[0]
        await process_object_selection(query.message, state, object_id, user_id)
        await query.answer()
        return

    buttons = {"Все объекты": None}
    buttons.update(objects_data)
    names = await pagination.set_pages_data(buttons, state)
    kb = pagination.make_kb(0, names, prefix='object')
    
    back_btn = InlineKeyboardButton(text="⬅️ Назад", callback_data="object:back")
    kb.inline_keyboard.append([back_btn])
    
    await state.set_state(FSMAdminRequestsFilter.object_input)
    await query.message.answer("Выберите объект", reply_markup=kb)
    await query.answer()


# обработка выбора объекта (исключаем кнопку "Назад")
@router.callback_query(
    FSMAdminRequestsFilter.object_input,
    F.data.startswith('object'),
    ~F.data.endswith('back')
)
async def after_object_selected(query: CallbackQuery, state: FSMContext) -> None:
    object_id = await pagination.get_selected_value(query, state)
    await process_object_selection(query.message, state, object_id, query.from_user.id)
    await query.answer()


# обработка кнопки "Назад" на экране выбора объекта
@router.callback_query(FSMAdminRequestsFilter.object_input, F.data == "object:back")
async def back_to_units(query: CallbackQuery, state: FSMContext) -> None:
    user_id = query.from_user.id
    tg_user_id = await crm.get_tg_user_id(user_id)

    # получаем доступные подразделения
    units_with_objects = await data_loader.get_user_objects_by_units_with_count_request_manager(tg_user_id)
    if not units_with_objects:
        await query.message.answer(
            "У вас нет доступа к объектам. Обратитесь к менеджеру.",
            reply_markup=to_start_kb()
        )
        await state.clear()
        await query.answer()
        return

    await state.set_state(FSMAdminRequestsFilter.unit_input)
    units_data = await data_loader.get_units_data()
    filtered_units_data = {k: v for k, v in units_data.items() if v in units_with_objects}

    if not filtered_units_data:
        await query.message.answer(
            "Ошибка при получении списка подразделений. Обратитесь в поддержку.",
            reply_markup=to_start_kb()
        )
        await query.answer()
        return

    names = await pagination.set_pages_data(filtered_units_data, state)
    kb = pagination.make_kb(0, names, prefix='unit')

    await query.message.edit_text("Выберите подразделение", reply_markup=kb)
    await query.answer()

async def after_object_selected(query: CallbackQuery, state: FSMContext) -> None:
    object_id = await pagination.get_selected_value(query, state)
    await process_object_selection(query.message, state, object_id, query.from_user.id)
    await query.answer()

async def send_rr_for_admin(message: Message, repair_request: dict) -> None:
    user_id = message.chat.id
    is_executor = await is_manager_executor(user_id, repair_request)
    
    if is_executor:
        from command.common.show_manager_requests import send_rr_for_manager
        await send_rr_for_manager(message, repair_request)
        return

    kb = rr_admin_kb(repair_request)
    await send_repair_request(message, repair_request, kb)

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

    await ask_unit(query.message, state, user_id)
    await query.answer()

@router.callback_query(F.data.startswith('adm:show_more'))
async def show_more_requests(query: CallbackQuery, state: FSMContext) -> None:
    await pagination.next_page_in_state(state)

    data = await state.get_data()
    object_id = data.get("object")
    unit_id = data.get("unit")

    user_id = query.from_user.id
    tg_user_id = await crm.get_tg_user_id(user_id)

    repair_requests = await crm.get_actual_admin_requests_by_objects(
        tg_user_id=tg_user_id,
        unit_id=unit_id,
        object_id=object_id
    )

    await send_many_rr_for_admin(repair_requests, query.message, state)
    await pagination.send_next_button_if_needed(
        len(repair_requests), query.message, state, prefix='adm', params=object_id
    )

    await query.message.delete()
    await query.answer()

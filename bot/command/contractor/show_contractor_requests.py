from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message
from aiogram.fsm.state import State, StatesGroup

from common.keyboard import rr_contractor_kb, to_start_kb
from common.messages import send_repair_request, send_several_requests, page0_show_many_requests
from handler import pagination
from util import crm
from util.crm import roles
from util.verification import VerificationError
from util.verification import verify_user
from data import data_loader
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

router = Router(name=__name__)

class FSMContractorRequestsFilter(StatesGroup):
    unit_input = State()
    object_input = State()


async def send_rr_for_contractor(message: Message, repair_request: dict) -> None:
    kb = rr_contractor_kb(repair_request)
    await send_repair_request(message, repair_request, kb)

async def send_many_rr_for_contractor(repair_requests: list, message: Message, state: FSMContext) -> None:
    await send_several_requests(repair_requests, message, state, send_rr_for_contractor)

async def page0_show_many_rr_for_contractor(message: Message, state: FSMContext, repair_requests: list[dict], params: str = ""):
    await page0_show_many_requests(message, state, repair_requests, send_many_rr_for_contractor, prefix="con", params=params)


async def process_object_selection(message: Message, state: FSMContext, object_id: str | None, user_id: int | None = None):
    await state.update_data(object=object_id)
    await state.update_data(page=0)

    data = await state.get_data()
    unit_id = data.get("unit")

    repair_requests = await crm.get_actual_contractor_requests_by_objects(
        user_id=str(user_id),
        unit_id=unit_id,
        object_id=object_id
    )
    await page0_show_many_rr_for_contractor(message, state, repair_requests, object_id)


async def ask_unit(message: Message, state: FSMContext, user_id: int) -> None:
    await state.clear()

    tg_user_id = await crm.get_tg_user_id(user_id)
    if not tg_user_id:
        await message.answer(
            "Не удалось найти вашу учетную запись. Пожалуйста, свяжитесь с поддержкой.",
            reply_markup=to_start_kb()
        )
        return
    units_with_objects = await data_loader.get_user_objects_by_units_with_count_request_contractor(tg_user_id)
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

        await state.set_state(FSMContractorRequestsFilter.object_input)
        await message.answer("Выберите объект", reply_markup=kb)

    else:
        await state.set_state(FSMContractorRequestsFilter.unit_input)
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


@router.callback_query(FSMContractorRequestsFilter.unit_input, F.data.startswith('unit'))
async def ask_object(query: CallbackQuery, state: FSMContext):
    unit_id = await pagination.get_selected_value(query, state)
    await state.update_data(unit=unit_id)

    user_id = query.from_user.id
    tg_user_id = await crm.get_tg_user_id(user_id)
    if not tg_user_id:
        await query.message.answer(
            "Не удалось найти вашу учетную запись. Свяжитесь с поддержкой.",
            reply_markup=to_start_kb()
        )
        await query.answer()
        await query.message.edit_reply_markup(reply_markup=None)
        await state.clear()
        return

    units_with_objects = await data_loader.get_user_objects_by_units_with_count_request_contractor(tg_user_id)
    if unit_id not in units_with_objects:
        await query.message.answer(
            "У вас нет доступа к объектам в этом подразделении. Обратитесь к менеджеру.",
            reply_markup=to_start_kb()
        )
        await query.answer()
        await query.message.edit_reply_markup(reply_markup=None)
        await state.clear()
        return

    objects_data = units_with_objects[unit_id]
    if not objects_data:
        await query.message.answer(
            "В этом подразделении нет доступных объектов. Обратитесь к менеджеру.",
            reply_markup=to_start_kb()
        )
        await query.answer()
        await query.message.edit_reply_markup(reply_markup=None)
        await state.clear()
        return

    if len(objects_data) == 1:
        object_id = list(objects_data.values())[0]
        await process_object_selection(query.message, state, object_id, user_id)
        await query.answer()
        await query.message.edit_reply_markup(reply_markup=None)
        return

    buttons = {"Все объекты": None}
    buttons.update(objects_data)
    names = await pagination.set_pages_data(buttons, state)
    kb = pagination.make_kb(0, names, prefix='object')

    back_btn = InlineKeyboardButton(text="⬅️ Назад", callback_data="object:back")
    kb.inline_keyboard.append([back_btn])

    await state.set_state(FSMContractorRequestsFilter.object_input)
    await query.message.answer("Выберите объект", reply_markup=kb)
    await query.answer()
    await query.message.edit_reply_markup(reply_markup=None)

@router.callback_query(
    FSMContractorRequestsFilter.object_input,
    F.data.startswith('object'),
    ~F.data.endswith('back')   # исключаем "Назад"
)
async def after_object_selected(query: CallbackQuery, state: FSMContext) -> None:
    object_id = await pagination.get_selected_value(query, state)
    await process_object_selection(query.message, state, object_id, query.from_user.id)
    await query.answer()
    await query.message.edit_reply_markup(reply_markup=None)

@router.callback_query(FSMContractorRequestsFilter.object_input, F.data == "object:back")
async def back_to_units(query: CallbackQuery, state: FSMContext):
    await state.set_state(FSMContractorRequestsFilter.unit_input)

    units_data = await data_loader.get_units_data()
    user_id = query.from_user.id
    tg_user_id = await crm.get_tg_user_id(user_id)

    if not tg_user_id:
        await query.message.answer(
            "Не удалось найти вашу учетную запись. Свяжитесь с поддержкой.",
            reply_markup=to_start_kb()
        )
        await query.answer()
        await query.message.edit_reply_markup(reply_markup=None)
        await state.clear()
        return

    units_with_objects = await data_loader.get_user_objects_by_units_with_count_request_contractor(tg_user_id)
    filtered_units_data = {k: v for k, v in units_data.items() if v in units_with_objects}

    names = await pagination.set_pages_data(filtered_units_data, state)
    kb = pagination.make_kb(0, names, prefix='unit')

    await query.message.answer("Выберите подразделение", reply_markup=kb)
    await query.answer()
    await query.message.edit_reply_markup(reply_markup=None)

@router.message(F.text == "/contractor_requests")
async def show_contractor_requests_command_handler(message: Message, state: FSMContext):
    await ask_unit(message, state, message.from_user.id)

@router.callback_query(F.data.startswith('contractor_requests'))
async def show_contractor_requests_callback_handler(query: CallbackQuery, state: FSMContext):
    await ask_unit(query.message, state, query.from_user.id)
    await query.answer()


@router.callback_query(F.data.startswith('con:show_more'))
async def show_more_requests(query: CallbackQuery, state: FSMContext):
    await pagination.next_page_in_state(state)
    data = await state.get_data()
    object_id = data.get("object")
    unit_id = data.get("unit")
    user_id = query.from_user.id

    repair_requests = await crm.get_actual_contractor_requests_by_objects(
        user_id=str(user_id),
        unit_id=unit_id,
        object_id=object_id
    )
    await send_many_rr_for_contractor(repair_requests, query.message, state)
    await pagination.send_next_button_if_needed(
        len(repair_requests), query.message, state, prefix='con', params=object_id or ''
    )
    await query.message.delete()
    await query.answer()

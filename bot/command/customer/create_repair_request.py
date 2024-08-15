from aiogram import Router, F
from aiogram.filters import Command
from aiogram.filters.state import StatesGroup, State
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, CallbackQuery

from common.keyboard import to_start_kb
from data import data_loader
from data.const import urgencies_ru_locale
from handler import pagination
from util import crm
from util.crm import roles
from util.verification import verify_user, VerificationError

router = Router(name=__name__)


class FSMRepairRequest(StatesGroup):
    unit_input = State()
    object_input = State()
    category_input = State()
    problemn_description_input = State()
    unregncy_input = State()
    repair_price_input = State()
    comment_input = State()
    legal_entity_input = State()
    photo_input = State()
    add_photo_input = State()


@router.message(Command('create_repair_request'))
async def create_repair_request_command_handler(message: Message, state: FSMContext) -> None:
    await create_repair_request(message.from_user.id, message, state)


@router.callback_query(F.data == 'create_repair_request')
async def create_repair_request_callback_handler(query: CallbackQuery, state: FSMContext) -> None:
    await create_repair_request(query.from_user.id, query.message, state)
    await query.answer()


async def create_repair_request(user_id: int, message: Message, state: FSMContext) -> None:
    await state.clear()

    # проверка
    try:
        await verify_user(user_id, message, role=roles.CUSTOMER)
    except VerificationError:
        return

    # анкета
    await ask_unit(user_id, message, state)


async def ask_unit(user_id: int, message: Message, state: FSMContext) -> None:
    await state.clear()
    await state.set_state(FSMRepairRequest.unit_input)

    data = await pagination.set_pages_data(data_loader.get_units(), state)
    kb = pagination.make_kb(0, data, prefix='unit')

    await message.answer('Выберите подразделение', reply_markup=kb)


@router.callback_query(FSMRepairRequest.unit_input, F.data.startswith('unit'))
async def ask_object(query: CallbackQuery, state: FSMContext) -> None:
    await state.update_data(unit=await pagination.get_selected(query, state))

    data = await pagination.set_pages_data(data_loader.get_objects(), state)
    kb = pagination.make_kb(0, data, prefix='object')
    await state.set_state(FSMRepairRequest.object_input)
    await query.message.answer('Выберите объект', reply_markup=kb)

    await query.answer()
    await query.message.edit_reply_markup(reply_markup=None)


@router.callback_query(FSMRepairRequest.object_input, F.data.startswith('object'))
async def ask_problem_description(query: CallbackQuery, state: FSMContext) -> None:
    await state.update_data(object=await pagination.get_selected(query, state))

    await state.set_state(FSMRepairRequest.problemn_description_input)
    await query.message.answer('Введите описание проблемы')

    await query.answer()
    await query.message.edit_reply_markup(reply_markup=None)


@router.message(FSMRepairRequest.problemn_description_input)
async def ask_photo(message: Message, state: FSMContext) -> None:
    text = message.text
    if not text:
        await message.answer('Введите описание проблемы')
        return

    await state.update_data(problem_description=text)

    await state.set_state(FSMRepairRequest.photo_input)
    await message.answer(f'Пришлите фото')


@router.message(FSMRepairRequest.photo_input)
async def check_photo(message: Message, state: FSMContext) -> None:
    photo_sizes = message.photo

    if photo_sizes is None:
        await message.answer('Что-то не так, попробуйте ещё раз')
        return

    photo_id = photo_sizes[-1].file_id

    await state.update_data(photo_id=photo_id)

    await ask_urgency(message, state)


async def ask_urgency(message: Message, state: FSMContext) -> None:
    data = await pagination.set_pages_data(urgencies_ru_locale, state)
    kb = pagination.make_kb(0, data, prefix='urgency', make_pages=False)
    await state.set_state(FSMRepairRequest.unregncy_input)
    await message.answer(f'Выберите срочность', reply_markup=kb)


@router.callback_query(FSMRepairRequest.unregncy_input, F.data.startswith('urgency'))
async def create_request(query: CallbackQuery, state: FSMContext) -> None:
    await state.update_data(urgency=await pagination.get_selected(query, state))

    await pagination.remove_page_list(state)

    data = await state.get_data()

    photo_id = data['photo_id']

    photo = await query.bot.download(photo_id)

    if photo is None:
        await query.message.answer('Ошибка при загрузке фото')
        await query.answer()
        return

    user_id = query.from_user.id
    tg_user_id = await crm.get_tg_user_id(user_id)

    if tg_user_id is None:
        await query.message.answer('Что-то пошло не так :(')
        return

    rr = await crm.create_repair_request(
        tg_user_id,
        photo,
        data['unit'],
        data['object'],
        data['problem_description'],
        data['urgency'],
    )

    if rr is None:
        await query.message.answer('Что-то пошло не так :(')
    else:
        await query.message.answer('Успешно', reply_markup=to_start_kb())

    await query.answer()
    await query.message.edit_reply_markup(reply_markup=None)

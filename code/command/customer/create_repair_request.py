import io
import pprint

from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext
from aiogram.filters.state import StatesGroup, State
from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM

from code.data import data_loader
from code.handler import pagination
from code.util import crm
from code.util.crm import roles

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
    user = await crm.get_user(user_id)

    if user is None:
        await you_cant_do_that(message)
        return
    if user['role'] != roles.get_str(roles.CUSTOMER):
        await you_cant_do_that(message)
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
async def ask_category(query: CallbackQuery, state: FSMContext) -> None:
    await state.update_data(object=await pagination.get_selected(query, state))

    data = await pagination.set_pages_data(data_loader.get_categories(), state)
    kb = pagination.make_kb(0, data, prefix='category')
    await state.set_state(FSMRepairRequest.category_input)
    await query.message.answer(f'Выберите категорию', reply_markup=kb)

    await query.answer()
    await query.message.edit_reply_markup(reply_markup=None)


@router.callback_query(FSMRepairRequest.category_input, F.data.startswith('category'))
async def ask_problem_description(query: CallbackQuery, state: FSMContext) -> None:
    await state.update_data(category=await pagination.get_selected(query, state))

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
    data = await pagination.set_pages_data(data_loader.get_urgencies(), state)
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

    await crm.create_repair_request(data['unit'], data['object'], data['problem_description'], photo,  data['urgency'], '', '', '')

    await query.message.answer(f'Успешно')

    await query.answer()
    await query.message.edit_reply_markup(reply_markup=None)


async def you_cant_do_that(message: Message) -> None:
    await message.answer('Вы не можете этого сделать')



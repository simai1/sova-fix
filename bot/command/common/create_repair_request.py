from aiogram import Router, F
from aiogram.enums import ContentType
from aiogram.filters import Command
from aiogram.filters.state import StatesGroup, State
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, CallbackQuery, FSInputFile

import config as cf
from common.keyboard import to_start_kb
from data import data_loader
from data.const import urgencies_ru_locale_dict, MAX_VIDEO_SIZE_BYTES, MAX_VIDEO_SIZE_MB
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
        await verify_user(user_id, message, role=[roles.CUSTOMER, roles.ADMIN])
    except VerificationError:
        return

    # анкета
    await ask_unit(message, state)


async def ask_unit(message: Message, state: FSMContext) -> None:
    await state.clear()
    await state.set_state(FSMRepairRequest.unit_input)

    units_data = await data_loader.get_units_data()
    names = await pagination.set_pages_data(units_data, state)
    kb = pagination.make_kb(0, names, prefix='unit')

    await message.answer("Выберите подразделение", reply_markup=kb)


@router.callback_query(FSMRepairRequest.unit_input, F.data.startswith('unit'))
async def ask_object(query: CallbackQuery, state: FSMContext) -> None:
    unit_id = await pagination.get_selected_value(query, state)
    await state.update_data(unit=unit_id)

    objects_data = await data_loader.get_objects_data(unit_id)
    names = await pagination.set_pages_data(objects_data, state)
    kb = pagination.make_kb(0, names, prefix='object')
    await state.set_state(FSMRepairRequest.object_input)
    await query.message.answer("Выберите объект", reply_markup=kb)

    await query.answer()
    await query.message.edit_reply_markup(reply_markup=None)


@router.callback_query(FSMRepairRequest.object_input, F.data.startswith('object'))
async def ask_problem_description(query: CallbackQuery, state: FSMContext) -> None:
    await state.update_data(object=await pagination.get_selected_value(query, state))

    await state.set_state(FSMRepairRequest.problemn_description_input)
    await query.message.answer('Введите описание проблемы')

    await query.answer()
    await query.message.edit_reply_markup(reply_markup=None)


@router.message(FSMRepairRequest.problemn_description_input)
async def ask_photo(message: Message, state: FSMContext) -> None:
    text = message.text
    if not text:
        await message.answer('Введите описание проблемы ✏️')
        return

    await state.update_data(problem_description=text)

    await state.set_state(FSMRepairRequest.photo_input)
    await message.answer('Пришлите фото или видео 📸')


@router.message(FSMRepairRequest.photo_input)
async def check_photo(message: Message, state: FSMContext) -> None:
    match message.content_type:
        case ContentType.TEXT:
            await message.answer("Пришлите фото или видео 📸")
            return

        case ContentType.VIDEO:
            file = message.video

            if file.file_size > MAX_VIDEO_SIZE_BYTES:
                await message.answer(f"Файл слишком большой (больше {MAX_VIDEO_SIZE_MB}Мб)\nПопробуйте другой")
                return

            await state.update_data({"file_id": file.file_id, "file_content_type": ContentType.VIDEO})

        case ContentType.PHOTO:
            index = -1
            file = message.photo[index]
            while file.file_size > MAX_VIDEO_SIZE_BYTES and -index <= len(message.photo):
                index -= 1
                file = message.photo[index]

            if file.file_size > MAX_VIDEO_SIZE_BYTES:
                await message.answer(f"Файл слишком большой (больше {MAX_VIDEO_SIZE_MB}Мб)\nПопробуйте другой")
                return

            await state.update_data({"file_id": file.file_id, "file_content_type": ContentType.PHOTO})

        case _:
            await message.answer('Что-то не так, попробуйте ещё раз 🔄️')
            return

    await ask_urgency(message, state)


async def ask_urgency(message: Message, state: FSMContext) -> None:
    data = await pagination.set_pages_data(urgencies_ru_locale_dict, state)
    kb = pagination.make_kb(0, data, prefix='urgency', make_pages=False)
    await state.set_state(FSMRepairRequest.unregncy_input)
    await message.answer('Выберите срочность', reply_markup=kb)


@router.callback_query(FSMRepairRequest.unregncy_input, F.data.startswith('urgency'))
async def create_request(query: CallbackQuery, state: FSMContext) -> None:
    await state.update_data(urgency=await pagination.get_selected_value(query, state))

    await pagination.remove_page_list(state)

    data = await state.get_data()

    file_id = data['file_id']
    file_content_type = data['file_content_type']

    file = await query.bot.download(file_id)

    if file is None:
        await query.message.answer('Ошибка при загрузке файла')
        await query.answer()
        return

    user_id = query.from_user.id
    tg_user_id = await crm.get_tg_user_id(user_id)

    if tg_user_id is None:
        await query.message.answer('Что-то пошло не так :(')
        return

    rr = await crm.create_repair_request(
        tg_user_id,
        file,
        file_content_type,
        data['object'],
        data['problem_description'],
        data['urgency']
    )

    if rr is None:
        await query.message.answer('Что-то пошло не так 😢. Попробуйте снова позже')
    else:
        file = FSInputFile(path=f"./{cf.IMG_PATH}/photo_2024-08-21_17-47-11.jpg", filename="фото.jpg")
        await query.message.answer_photo(
            photo=file,
            caption=f"✅Ваша заявка №{rr['number']} успешно отправлена менеджеру",
            reply_markup=to_start_kb()
        )

    await query.answer()
    await query.message.edit_reply_markup(reply_markup=None)

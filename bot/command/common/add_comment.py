from aiogram import Router, F
from aiogram.enums import ContentType
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import StatesGroup, State
from aiogram.types import Message, CallbackQuery

from common.keyboard import to_start_kb, skip_kb
from data.const import MAX_VIDEO_SIZE_BYTES, MAX_VIDEO_SIZE_MB
from util import crm
from util.crm import roles

router = Router(name=__name__)


class FSMComment(StatesGroup):
    ask_comment = State()
    ask_media = State()


@router.callback_query(F.data.startswith("add_comment"))
async def ask_comment(query: CallbackQuery, state: FSMContext) -> None:
    request_id = query.data.split(':')[-1]

    await state.update_data(request_id=request_id)

    await state.set_state(FSMComment.ask_comment)
    await query.message.answer("Введите комментарий✏️")

    await query.answer()


async def send_send_photo_msg(message: Message) -> None:
    await message.answer("Пришлите фото 📸", reply_markup=skip_kb())


@router.message(FSMComment.ask_comment)
async def store_comment_text(message: Message, state: FSMContext) -> None:

    if not message.text:
        await message.answer("Введите текст комментария ✏️")
        return

    comment_text = message.text

    await state.update_data({'comment_text': comment_text})

    await state.set_state(FSMComment.ask_media)

    await send_send_photo_msg(message)


@router.message(FSMComment.ask_media)
async def store_file(message: Message, state: FSMContext) -> None:
    match message.content_type:
        case ContentType.TEXT:
            await send_send_photo_msg(message)
            return

        case ContentType.VIDEO:
            file = message.video

            if file.file_size > MAX_VIDEO_SIZE_BYTES:
                await message.answer(
                    text=f"Файл слишком большой (больше {MAX_VIDEO_SIZE_MB}Мб)\nПопробуйте другой",
                    reply_markup=skip_kb()
                )
                return

            await state.update_data({"file_id": file.file_id, "file_content_type": ContentType.VIDEO})

        case ContentType.PHOTO:
            index = -1
            file = message.photo[index]
            while file.file_size > MAX_VIDEO_SIZE_BYTES and -index <= len(message.photo):
                index -= 1
                file = message.photo[index]

            if file.file_size > MAX_VIDEO_SIZE_BYTES:
                await message.answer(
                    text=f"Файл слишком большой (больше {MAX_VIDEO_SIZE_MB}Мб)\nПопробуйте другой",
                    reply_markup=skip_kb()
                )
                return

            await state.update_data({"file_id": file.file_id, "file_content_type": ContentType.PHOTO})

        case _:
            await send_send_photo_msg(message)
            return

    await write_comment(message.from_user.id, message, state)


@router.callback_query(FSMComment.ask_media, F.data == "skip")
async def skip_file_handler(query: CallbackQuery, state: FSMContext) -> None:
    await write_comment(query.from_user.id, query.message, state)
    await query.answer()


async def write_comment(user_id: int, message: Message, state: FSMContext) -> None:
    data = await state.get_data()

    if "file_id" in data.keys() and "file_content_type" in data.keys():
        file_id = data['file_id']
        file_content_type = data['file_content_type']
    else:
        file_id = None
        file_content_type = None

    comment_text = data['comment_text']

    request_id = data['request_id']
    user = await crm.get_user(user_id)
    role = roles.m_roles_list_ru_locale[roles.get_num(user['role']) - 1]
    name = user['name']

    old_comment = await crm.get_repair_request_comment(request_id)
    if old_comment is None:
        old_comment = ''

    await state.clear()

    if comment_text is None:
        await message.answer("Что-то пошло не так 😢. Возможно, вы не ввели текст комментария")
        return

    comment = f'{name} [{role.upper()}]:\n- {comment_text}'
    new_comment = f'{old_comment}\n{comment}\n'

    if len(new_comment) > 255:
        await message.answer("Невозможно добавить комментарий, т.к. превышен лимит символов")
        return

    # change comment
    success = await crm.set_repair_request_comment(request_id, new_comment)

    if not success:
        await message.answer("Что-то пошло не так 😢. Попробуйте снова позже")
        return

    # attach file
    if file_id is None:
        await message.answer("Комментарий успешно добавлен ✅", reply_markup=to_start_kb())
        return

    file = await message.bot.download(file_id)

    success = await crm.set_rr_comment_attachment(request_id, file, file_content_type)

    if not success:
        await message.answer("Что-то пошло не так 😢. Не удалось прикрепить файл к комментарию")
        return

    await message.answer("Комментарий успешно добавлен ✅", reply_markup=to_start_kb())






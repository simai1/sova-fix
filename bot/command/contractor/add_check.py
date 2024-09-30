from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, Message
from aiogram.enums.content_type import ContentType

from util import crm

router = Router(name=__name__)


class FSMAddCheck(StatesGroup):
    await_check_photo = State()
    await_repair_price = State()


@router.callback_query(F.data.startswith('check'))
async def request_add_check_callback_handler(query: CallbackQuery, state: FSMContext) -> None:
    await state.clear()
    await state.set_state(FSMAddCheck.await_check_photo)

    request_id = query.data.split(':')[-1]
    await state.update_data({'request_id': request_id})

    await query.message.answer('Пришлите ваш чек фотографией')
    await query.answer()


@router.message(FSMAddCheck.await_check_photo, F.content_type != ContentType.PHOTO)
async def add_check_not_photo(message: Message) -> None:
    await message.answer("Вам нужно прислать фото чека. Попробуйте ещё раз.")


@router.message(FSMAddCheck.await_check_photo, F.content_type == ContentType.PHOTO)
async def ask_repair_price(message: Message, state: FSMContext) -> None:
    photo_id = message.photo[-1].file_id

    await state.update_data({'check_photo_id': photo_id})

    await state.set_state(FSMAddCheck.await_repair_price)
    await message.answer("Введите общую цену ремонта")


@router.message(FSMAddCheck.await_repair_price, F.content_type != ContentType.TEXT)
async def not_repair_price(message: Message) -> None:
    await message.answer("Вам нужно прислать цену ремонта. Попробуйте ещё раз.")


@router.message(FSMAddCheck.await_repair_price, F.content_type == ContentType.TEXT)
async def add_check_handler(message: Message, state: FSMContext) -> None:
    repair_price = message.text

    if not repair_price.isdigit():
        await message.answer("Вам нужно прислать число - общую цену ремонта. Попробуйте ещё раз.")
        return

    states_data = await state.get_data()

    request_id = states_data['request_id']
    photo_id = states_data['check_photo_id']

    photo = await message.bot.download(photo_id)

    add_check_photo_success = await crm.add_check(request_id, file=photo)

    update_repair_price_success = await crm.update_repair_request(
        request_id,
        {
            'repairPrice': repair_price
        }
    )

    if add_check_photo_success and update_repair_price_success:
        await message.answer("Чек успешно добавлен ✅")
        await state.clear()
    else:
        await message.answer("Что-то пошло не так 😢. Попробуйте снова позже")


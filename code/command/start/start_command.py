from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message
from aiogram.fsm.context import FSMContext

from code.command.start.start_keyboard import get_start_kb
from code.util import crm

router = Router(name=__name__)


@router.message(CommandStart())
async def start_command_handler(message: Message, state: FSMContext) -> None:
    await state.clear()

    # проверить зарегистрирован ли юзер и на основе этого отправлять разные сообщения
    await crm.get_user(message.from_user.id)

    await send_registration_menu(message)


async def send_registration_menu(message: Message) -> None:
    await message.answer('Привет! Я бот', reply_markup=get_start_kb())

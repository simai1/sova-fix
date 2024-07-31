from aiogram import Router, F
from aiogram.filters import CommandStart
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext

from code.command.contractor.contractor_menu import send_contractor_menu
from code.command.start.start_keyboard import get_start_kb
from code.util import crm
from code.util.crm import roles
from code.command.customer.customer_menu import send_customer_menu

router = Router(name=__name__)


@router.callback_query(F.data == 'start')
async def start_callback_handler(query: CallbackQuery, state: FSMContext) -> None:
    await start_handler(query.from_user.id, query.message, state)
    await query.answer()


@router.message(CommandStart())
async def start_command_handler(message: Message, state: FSMContext) -> None:
    await start_handler(message.from_user.id, message, state)


async def start_handler(user_id: int, message: Message, state: FSMContext) -> None:
    await state.clear()

    # проверить зарегистрирован ли юзер и на основе этого отправлять разные сообщения
    user = await crm.get_user(user_id)

    if user is None:
        await send_registration_menu(message)
        return

    role: str = user['role']

    if role == roles.get_str(roles.CONTRACTOR):
        await send_contractor_menu(message)
    elif role == roles.get_str(roles.CUSTOMER):
        await send_customer_menu(message)


async def send_registration_menu(message: Message) -> None:
    await message.answer('Привет! Я бот', reply_markup=get_start_kb())

from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import StatesGroup, State

from code.command.register.registration_keyboard import get_roles_kb
from code.util import crm


class RegistrationStates(StatesGroup):
    await_name = State()
    await_role = State()


router = Router(name=__name__)


@router.callback_query(F.data == 'register')
async def register_callback_handler(query: CallbackQuery, state: FSMContext) -> None:
    await register_handler(query, state)
    await query.answer()


@router.message(Command('register'))
async def register_command_handler(message: Message, state: FSMContext) -> None:
    await register_handler(message, state)


async def register_handler(message_or_query: Message | CallbackQuery, state: FSMContext) -> None:
    message: Message
    if isinstance(message_or_query, CallbackQuery):
        message = message_or_query.message
    else:
        message = message_or_query

    user_id = message_or_query.from_user.id

    # запрос на проверку наличия юзера в базе
    await ask_name(message, state)


async def ask_name(message: Message, state: FSMContext) -> None:
    await state.set_state(RegistrationStates.await_name)

    await message.answer('Регистрация\nВведите своё ФИО')


@router.message(RegistrationStates.await_name)
async def ask_role(message: Message, state: FSMContext) -> None:
    await state.update_data(name=message.text)
    await state.set_state(RegistrationStates.await_role)

    await message.answer('Выберите роль', reply_markup=get_roles_kb())


@router.callback_query(RegistrationStates.await_role)
async def finish_registration(query: CallbackQuery, state: FSMContext) -> None:
    await state.update_data(role=query.data)
    user_id = query.from_user.id

    data = await state.get_data()
    await state.clear()

    # зарегистрировать пользователя через апи
    await crm.register_user(user_id, data['name'], data['role'])

    await query.message.answer('Регистриция окончена')

    await query.answer()






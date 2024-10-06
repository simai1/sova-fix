from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import StatesGroup, State

from command.register.registration_keyboard import get_roles_kb
from common.keyboard import to_start_kb
from util import crm

from util import logger


class RegistrationStates(StatesGroup):
    await_name = State()
    await_role = State()
    await_login = State()
    await_password = State()


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

    user_id: int = message_or_query.from_user.id

    if await crm.user_already_exists(user_id):
        await send_already_registered(message, state)
        return

    await ask_name(message, state)


async def ask_name(message: Message, state: FSMContext) -> None:
    await state.set_state(RegistrationStates.await_name)
    await message.answer('<b>Регистрация</b>\nВведите своё ФИО')


@router.message(RegistrationStates.await_name)
async def ask_role(message: Message, state: FSMContext) -> None:
    await state.update_data(name=message.text)
    await state.set_state(RegistrationStates.await_role)

    await message.answer(
        'Выберите, под какой ролью вы хотите зарегистрироваться',
        reply_markup=get_roles_kb()
    )


@router.callback_query(RegistrationStates.await_role)
async def switch_ask(query: CallbackQuery, state: FSMContext) -> None:
    role = crm.roles.get_num(query.data)
    await state.update_data(role=role)

    match role:
        case crm.roles.CUSTOMER:
            await finish_registration(query, state)
        case crm.roles.CONTRACTOR:
            await finish_registration(query, state)
        case crm.roles.ADMIN:
            await ask_login(query, state)
        case _:
            logger.error(f"unknown role: {role}")

    await query.answer()


async def ask_login(query: CallbackQuery, state: FSMContext) -> None:
    await state.set_state(RegistrationStates.await_login)
    await query.message.answer('Введите свой логин, с помощью которого вы регистрировались на сайте')


@router.message(RegistrationStates.await_login)
async def ask_password(message: Message, state: FSMContext) -> None:
    await state.update_data(login=message.text)
    await state.set_state(RegistrationStates.await_password)

    await message.answer('Введите пароль')


@router.message(RegistrationStates.await_password)
async def finish_registration_admin(message: Message, state: FSMContext) -> None:
    await state.update_data(password=message.text)

    data = await state.get_data()
    await state.clear()

    user_id = message.from_user.id
    username = message.from_user.username

    admin = await crm.sync_manager(data['login'], data['password'], data['name'], user_id, username)

    if admin is None:
        await message.answer('Неверные логин или пароль', reply_markup=to_start_kb())
        return

    await message.answer('Успех', reply_markup=to_start_kb())


async def finish_registration(query: CallbackQuery, state: FSMContext) -> None:
    user_id = query.from_user.id
    username = query.from_user.username

    data = await state.get_data()
    await state.clear()

    # зарегистрировать пользователя через апи
    user = await crm.register_user(user_id, data['name'], data['role'], username)

    if user is None:
        await send_already_registered(query.message, state)
    else:
        text = """
Заявка на регистрацию успешно подана. ✅ 
Ожидайте, когда её одобрит менеджер"""
        await query.message.answer(text, reply_markup=to_start_kb())

    await query.message.edit_reply_markup(reply_markup=None)
    await query.answer()


async def send_already_registered(message: Message, state: FSMContext) -> None:
    await state.clear()
    await message.answer('Вы уже зарегистрированы', reply_markup=to_start_kb())





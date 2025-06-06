from aiogram.fsm.state import StatesGroup, State
from aiogram.fsm.context import FSMContext
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from util.crm import register_customer_crm
import config as cf

router = Router(name=__name__)

class FSMCrmAccess(StatesGroup):
    await_crm_login = State()


@router.callback_query(F.data == 'get_crm_access')
async def get_crm_access_handler(query: CallbackQuery, state: FSMContext) -> None:
    await state.clear()
    await query.message.answer("Введите вашу почту для доступа к CRM:")
    await state.set_state(FSMCrmAccess.await_crm_login)
    await query.answer()

@router.message(FSMCrmAccess.await_crm_login, F.text)
async def handle_crm_login(message: Message, state: FSMContext) -> None:
    login = message.text.strip()
    user_id = message.from_user.id

    if not login:
        await message.answer("Логин не должен быть пустым. Попробуйте ещё раз:")
        return

    success = await register_customer_crm(login, user_id)

    if success:
        await message.answer("✅ На вашу почту отправлен одноразовый пароль для регистрации в CRM.")
    else:
        await message.answer("❌ Не удалось отправить заявку. Повторите попытку позже.")

    await state.clear()

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

@router.callback_query(F.data == 'open_crm')
async def handle_open_crm(callback: CallbackQuery):
    await callback.answer()
    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Перейти в CRM", url=cf.WEB_URL)]
        ]
    )
    await callback.message.answer("🔗 Нажмите кнопку ниже для перехода в CRM", reply_markup=kb)

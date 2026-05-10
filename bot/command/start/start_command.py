from aiogram import Router, F
from aiogram.filters import CommandStart, CommandObject
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext

from command.contractor.contractor_menu import send_contractor_menu
from command.start.start_keyboard import get_start_kb
from util import crm, logger
from util.crm import roles
from command.customer.customer_menu import send_customer_menu

from command.admin.admin_menu import send_admin_menu

router = Router(name=__name__)

# Префикс payload-а deep-link для привязки TG → web-User.
# Сервер генерирует ссылку вида `t.me/<bot>?start=link_<token>` в
# api/src/services/userTgBinding.service.ts:57. Токен — 32-символьный hex.
TG_BIND_PAYLOAD_PREFIX = 'link_'


@router.callback_query(F.data == 'start_remove_kb')
async def start_callback_handler(query: CallbackQuery, state: FSMContext) -> None:
    await start_handler(query.from_user.id, query.message, state)
    await query.message.edit_reply_markup(reply_markup=None)
    await query.answer()


@router.callback_query(F.data == 'start')
async def start_callback_handler(query: CallbackQuery, state: FSMContext) -> None:
    await start_handler(query.from_user.id, query.message, state)
    await query.answer()


@router.message(CommandStart(deep_link=True))
async def start_deep_link_handler(message: Message, command: CommandObject, state: FSMContext) -> None:
    payload = (command.args or '').strip()

    if payload.startswith(TG_BIND_PAYLOAD_PREFIX):
        token = payload[len(TG_BIND_PAYLOAD_PREFIX):]
        await handle_tg_bind(message, state, token)
        return

    # Незнакомый payload — фолбэк к обычному /start, чтобы не ломать UX,
    # если в будущем заведутся другие deep-link-флоу.
    logger.warn(f'unknown /start payload: {payload!r} from tg_id={message.from_user.id}')
    await start_handler(message.from_user.id, message, state)


@router.message(CommandStart())
async def start_command_handler(message: Message, state: FSMContext) -> None:
    await start_handler(message.from_user.id, message, state)


async def handle_tg_bind(message: Message, state: FSMContext, token: str) -> None:
    """
    Обрабатывает /start link_<token> — попытку привязать TG к web-User.

    После успешного bind серверный consume() уже создал/обновил TgUser
    с isConfirmed=true и для CONTRACTOR прописал Contractor.tgUserId.
    Поэтому сразу после ответа делаем обычный start_handler, чтобы юзер
    увидел корректное меню по своей роли.
    """
    await state.clear()

    if not token:
        await message.answer('Ссылка для привязки повреждена. Перейдите в веб-ЛК и сгенерируйте новую.')
        return

    result = await crm.bind_tg(
        token=token,
        tg_id=message.from_user.id,
        username=message.from_user.username,
    )

    if result.get('ok'):
        await message.answer(
            '✅ Telegram успешно привязан к вашему аккаунту в веб-ЛК.\n'
            'Теперь уведомления по заявкам будут приходить сюда.'
        )
        # После привязки серверная сторона сделала TgUser.isConfirmed=true,
        # `get_user(tg_id)` его найдёт и start_handler покажет роль-меню.
        await start_handler(message.from_user.id, message, state)
        return

    status = result.get('status')
    if status == 400:
        await message.answer(
            '⌛ Ссылка для привязки недействительна или истекла (срок жизни — 15 минут).\n'
            'Откройте веб-ЛК и сгенерируйте новую.'
        )
    elif status == 409:
        await message.answer(
            '⚠️ Этот Telegram уже привязан к другому пользователю.\n'
            'Если это ошибка — обратитесь к менеджеру.'
        )
    else:
        await message.answer(
            '❌ Не удалось привязать Telegram. Попробуйте позже или обратитесь к менеджеру.'
        )


async def start_handler(user_id: int, message: Message, state: FSMContext) -> None:
    await state.clear()

    # проверить зарегистрирован ли юзер и на основе этого отправлять разные сообщения
    user = await crm.get_user(user_id)

    if user is None:
        await send_registration_menu(message)
        return

    if not user["isConfirmed"]:
        await message.answer("Ваша заявка на регистрацию ещё рассматривается.\nОжидайте одобрения менеджера 🕒")
        return

    role: str = user['role']

    if role == roles.get_str(roles.CONTRACTOR):
        await send_contractor_menu(message)

    elif role == roles.get_str(roles.CUSTOMER):
        await send_customer_menu(message)

    elif role == roles.get_str(roles.ADMIN):
        await send_admin_menu(message)


async def send_registration_menu(message: Message) -> None:
    await message.answer('Привет! Я бот SOVA-fix', reply_markup=get_start_kb())

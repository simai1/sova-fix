import time
from typing import Any, Awaitable, Callable

from aiogram import BaseMiddleware
from aiogram.types import CallbackQuery, InlineQuery, Message, TelegramObject

from common.messages import ACCESS_DISABLED_TEXT
from util import crm, logger

# Отключение доступа выполняется администратором вручную и редко, поэтому
# короткого TTL достаточно: он убирает лишний HTTP-запрос к CRM на каждый
# апдейт, но отключение всё равно применяется почти сразу.
CACHE_TTL_SECONDS = 30

_cache: dict[int, tuple[float, bool]] = {}


async def _is_disabled(tg_id: int) -> bool:
    cached = _cache.get(tg_id)
    now = time.monotonic()
    if cached is not None and now - cached[0] < CACHE_TTL_SECONDS:
        return cached[1]

    user = await crm.get_user(tg_id)
    # Незарегистрированный пользователь проходит дальше: его встретит меню
    # регистрации в /start.
    disabled = bool(user.get('isDisabled')) if user else False
    _cache[tg_id] = (now, disabled)
    return disabled


def invalidate(tg_id: int) -> None:
    _cache.pop(tg_id, None)


class AccessGuardMiddleware(BaseMiddleware):
    """
    Единая точка отказа для пользователей с отключённым доступом.

    Веб-аккаунт и Telegram-аккаунт отключаются вместе (api user.service.setUserDisabled),
    поэтому проверять достаточно флаг isDisabled из GET /tgUsers/{tgId}.
    """

    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        tg_user = data.get('event_from_user')
        if tg_user is None:
            return await handler(event, data)

        if not await _is_disabled(tg_user.id):
            return await handler(event, data)

        logger.info(f'access guard: blocked update from disabled tgId={tg_user.id}')

        if isinstance(event, Message):
            await event.answer(ACCESS_DISABLED_TEXT)
        elif isinstance(event, CallbackQuery):
            await event.answer(ACCESS_DISABLED_TEXT, show_alert=True)
        elif isinstance(event, InlineQuery):
            await event.answer([], cache_time=1, is_personal=True)

        return None

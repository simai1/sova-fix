from aiogram import Router, F
from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, Message
from aiogram.enums.content_type import ContentType

from common.keyboard import to_start_kb
from util import crm

router = Router(name=__name__)


@router.callback_query(F.data == "rr_list_filters")
async def send_rr_list_filters(query: CallbackQuery) -> None:

    kb = IKM(inline_keyboard=[
        [IKB(text="Новая заявка 🆕", switch_inline_query_current_chat="rr status=1")]
    ])


    # 1: 'новая заявка 🆕',
    # 2: 'в работе 🛠',
    # 3: 'выполнена ✅',
    # 4: 'неактуальна ❌',
    # 5: 'выезд без выполнения 🚐',

    await query.message.answer(
        text="Выберите категорию:",
        reply_markup=kb
    )
    await query.answer()



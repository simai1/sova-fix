from aiogram.types import Message
from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM


async def send_contractor_menu(message: Message) -> None:

    menu_text = 'меню ИСПОЛНИТЕЛЬ'

    kb = IKM(inline_keyboard=[
        []
    ])

    await message.answer(menu_text, reply_markup=kb)

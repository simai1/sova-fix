from aiogram.types import Message
from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM


async def send_customer_menu(message: Message) -> None:

    menu_text = 'меню ЗАКАЗЧИК'

    kb = IKM(inline_keyboard=[
        [IKB(text='Мои заявки 📋', callback_data='customer_requests')],
        [IKB(text='Подать заявку ➕', callback_data='create_repair_request')]
    ])

    await message.answer(menu_text, reply_markup=kb)

from aiogram.types import Message
from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM


async def send_contractor_menu(message: Message) -> None:

    menu_text = 'меню ИСПОЛНИТЕЛЬ'

    kb = IKM(inline_keyboard=[
        [IKB(text='Посмотреть заявки 📋', callback_data='contractor_requests')],
        [IKB(text='Посмотреть маршрутный лист 📍', callback_data='contractor_itinerary')]
    ])

    await message.answer(menu_text, reply_markup=kb)

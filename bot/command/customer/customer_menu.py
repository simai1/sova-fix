from aiogram.types import Message, FSInputFile
from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM

import config as cf

async def send_customer_menu(message: Message) -> None:

    menu_text = """
<b>меню ЗАКАЗЧИК</b>

Здесь вы можете подать заявку на ремонт вашего оборудования.
"""

    kb = IKM(inline_keyboard=[
        [IKB(text='Мои заявки 📋', callback_data='customer_requests:status=1,2')],
        [IKB(text='Выполненные заявки ✅', callback_data='customer_requests:status=3')],
        [IKB(text='Найти заявку по номеру 🔎', callback_data='request_by_number')],
        [IKB(text='Подать заявку ➕', callback_data='create_repair_request')]
    ])

    file = FSInputFile(path=f"./{cf.IMG_PATH}/photo_2024-08-21_17-47-14.jpg", filename="фото.jpg")
    await message.answer_photo(photo=file, caption=menu_text, reply_markup=kb)

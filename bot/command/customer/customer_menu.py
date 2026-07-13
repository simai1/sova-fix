import asyncio

from aiogram.types import Message, FSInputFile
from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM
from util import crm


async def send_customer_menu(message: Message) -> None:
    tg_id = message.from_user.id
    login_exists = False

    try:
        user_data = await asyncio.to_thread(crm.get_web_user_by_tg_id, tg_id)
        login_exists = bool(user_data and user_data.get('login'))
    except Exception as e:
        print(f'Ошибка при получении пользователя: {e}')

    menu_text = """
<b>меню ЗАКАЗЧИК</b>

Здесь вы можете подать заявку на ремонт вашего оборудования.
"""

    kb_buttons = [
        [IKB(text='Подать заявку ➕', callback_data='create_repair_request')],
        [
            IKB(text='Мои заявки *️⃣', callback_data='customer_requests:status=1,2,5'),
            IKB(text='Выполненные заявки ✅', callback_data='customer_requests:status=3')
        ],
        [IKB(text='Найти заявку по номеру 🔎', callback_data='request_by_number')],
    ]

    if login_exists:
        kb_buttons.append([
            IKB(text='Открыть CRM', callback_data='open_crm')
        ])
    else:
        kb_buttons.append([
            IKB(text='Получить доступ к CRM', callback_data='get_crm_access')
        ])

    file = FSInputFile(path=f"./{cf.IMG_PATH}/photo_2024-08-21_17-47-14.jpg", filename="фото.jpg")
    await message.answer_photo(photo=file, caption=menu_text, reply_markup=IKM(inline_keyboard=kb_buttons))

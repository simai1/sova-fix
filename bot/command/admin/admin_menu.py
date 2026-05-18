from aiogram.types import Message, FSInputFile
from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM

import config as cf
import logging

logger = logging.getLogger(__name__)


async def send_admin_menu(message: Message) -> None:

    menu_text = '''
<b>МЕНЮ "МЕНЕДЖЕР" 👩‍💻</b>

Здесь вы можете посмотреть все актуальные заявки.

Также вы будете получать уведомления об изменении в заявках и регистрации новых пользователей.
'''

    kb = IKM(inline_keyboard=[
        [IKB(text="Подать заявку ➕", callback_data="create_repair_request")],
        [
            IKB(text="Актуальные заявки *️⃣", callback_data="requests_admin:status=S^a,S^b,S^e"),
            IKB(text="Выполненные заявки ✅", callback_data="requests_admin:status=S^c")
        ],
        [IKB(text="Заявки без чека ❗️🧾", callback_data="show_requests_without_check")],
        [IKB(text="Мои назначенные задачи 📌", callback_data="show_manager_assigned_tasks")],
        [IKB(text="Найти заявку по номеру 🔎", callback_data="request_by_number")]
    ])

    file = FSInputFile(path=f"./{cf.IMG_PATH}/manager_icon.png", filename="фото.jpg")
    await message.answer_photo(photo=file, caption=menu_text, reply_markup=kb)

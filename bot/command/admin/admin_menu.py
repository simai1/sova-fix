from aiogram.types import Message, FSInputFile
from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM

import config as cf


async def send_admin_menu(message: Message) -> None:

    menu_text = '''
<b>МЕНЮ "МЕНЕДЖЕР" 👩‍💻</b>

Здесь вы можете посмотреть все актуальные заявки. 

Также вы будете получать уведомления об изменении в заявках и регистрации новых пользователей.
'''

    kb = IKM(inline_keyboard=[
        [IKB(text='Посмотреть все актуальные заявки 📋', callback_data='show_active_requests_admin')],
    ])

    file = FSInputFile(path=f"./{cf.IMG_PATH}/manager_icon.png", filename="фото.jpg")
    await message.answer_photo(photo=file, caption=menu_text, reply_markup=kb)

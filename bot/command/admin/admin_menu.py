from aiogram.types import Message, FSInputFile
from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM

import config as cf


async def send_admin_menu(message: Message) -> None:

    menu_text = '''
<b>МЕНЮ "МЕНЕДЖЕР" 👩‍💻</b>


'''

    kb = IKM(inline_keyboard=[
        [IKB(text='Посмотреть все заявки', callback_data='show_all_requests')],
    ])

    file = FSInputFile(path=f"./{cf.IMG_PATH}/manager_icon.png", filename="фото.jpg")
    await message.answer_photo(photo=file, caption=menu_text, reply_markup=kb)

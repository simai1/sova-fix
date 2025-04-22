from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM


def get_start_kb() -> IKM:
    return IKM(inline_keyboard=[
        [IKB(text='Подать заявку на регистрацию', callback_data='register')]
    ])

from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM

def to_start_kb() -> IKM:
    return IKM(inline_keyboard=[
        [to_start_btn()]
    ])

def to_start_btn() -> IKB:
    return IKB(text='На главную ↩️', callback_data='start')


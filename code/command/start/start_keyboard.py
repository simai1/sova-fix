from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM


def get_start_kb() -> IKM:
    return IKM(inline_keyboard=[
        [IKB(text='Зарегистрироваться', callback_data='register')]
    ])


def get_contractor_kb() -> IKM:
    return IKM(inline_keyboard=[
        [IKB(text='Показать заявки', callback_data='show_repair_requests')]
    ])


def get_customer_kb() -> IKM:
    return IKM(inline_keyboard=[
        [IKB(text='Подать заявку', callback_data='create_repair_request')]
    ])

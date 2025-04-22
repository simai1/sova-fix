from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM


def get_roles_kb() -> IKM:
    return IKM(inline_keyboard=[
        [IKB(text='Заказчик', callback_data='CUSTOMER')],
        [IKB(text='Исполнитель', callback_data='CONTRACTOR')],
        [IKB(text='Менеджер', callback_data='ADMIN')]
    ])

from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM

def to_start_kb() -> IKM:
    return IKM(inline_keyboard=[
        [to_start_btn()]
    ])


def to_start_btn() -> IKB:
    return IKB(text='На главную ↩️', callback_data='start')


# keyboards for repair request message:
def rr_admin_kb(repair_request: dict) -> IKM:
    arr_kb = []

    if repair_request['checkPhoto'] is None:
        row = [IKB(text='Добавить чек 🧾', callback_data=f"check:{repair_request['id']}")]
        arr_kb.append(row)

    row = [IKB(text='Добавить комментарий 📝', callback_data=f"add_comment:{repair_request['id']}")]
    arr_kb.append(row)

    return IKM(inline_keyboard=arr_kb)


def rr_customer_kb(repair_request: dict) -> IKM:
    arr_kb = []

    if repair_request['status'] != 4:
        row = [IKB(text='Неактуально ❌', callback_data=f"cus:not_relevant:{repair_request['id']}")]
        arr_kb.append(row)

    row = [IKB(text='Добавить комментарий 📝', callback_data=f"add_comment:{repair_request['id']}")]
    arr_kb.append(row)

    return IKM(inline_keyboard=arr_kb)


def rr_contractor_kb(repair_request: dict) -> IKM:
    arr_kb = []

    if repair_request['status'] != 3:
        row = [IKB(text='Выполнено ✅', callback_data=f"done:{repair_request['id']}")]
        arr_kb.append(row)

    if repair_request['checkPhoto'] is None:
        row = [IKB(text='Добавить чек 🧾', callback_data=f"check:{repair_request['id']}")]
        arr_kb.append(row)

    row = [IKB(text='Добавить комментарий 📝', callback_data=f"add_comment:{repair_request['id']}")]
    arr_kb.append(row)

    return IKM(inline_keyboard=arr_kb)


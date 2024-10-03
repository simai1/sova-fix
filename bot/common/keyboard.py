from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM


# common message buttons:
def to_start_kb() -> IKM:
    return IKM(inline_keyboard=[
        [to_start_btn()]
    ])


def to_start_btn() -> IKB:
    return IKB(text='На главную ↩️', callback_data='start')


# menu buttons:
def check_btn(repair_request: dict) -> IKB:
    return IKB(text='Добавить чек 🧾', callback_data=f"check:{repair_request['id']}")


def comment_btn(repair_request: dict) -> IKB:
    return IKB(text='Добавить комментарий 📝', callback_data=f"add_comment:{repair_request['id']}")


def not_relevant_btn(repair_request: dict) -> IKB:
    return IKB(text='Неактуально ❌', callback_data=f"not_relevant:{repair_request['id']}")


def done_btn(repair_request: dict) -> IKB:
    return IKB(text='Выполнено ✅', callback_data=f"done:{repair_request['id']}")


# keyboards for repair request message:
def rr_admin_kb(repair_request: dict) -> IKM:
    arr_kb = []

    if repair_request['checkPhoto'] is None:
        row = [check_btn(repair_request)]
        arr_kb.append(row)

    row = [comment_btn(repair_request)]
    arr_kb.append(row)

    return IKM(inline_keyboard=arr_kb)


def rr_customer_kb(repair_request: dict) -> IKM:
    arr_kb = []

    if repair_request['status'] != 4:
        row = [not_relevant_btn(repair_request)]
        arr_kb.append(row)

    row = [comment_btn(repair_request)]
    arr_kb.append(row)

    return IKM(inline_keyboard=arr_kb)


def rr_contractor_kb(repair_request: dict) -> IKM:
    arr_kb = []

    if repair_request['status'] != 3:
        row = [done_btn(repair_request)]
        arr_kb.append(row)

    if repair_request['checkPhoto'] is None:
        row = [check_btn(repair_request)]
        arr_kb.append(row)

    row = [comment_btn(repair_request)]
    arr_kb.append(row)

    return IKM(inline_keyboard=arr_kb)


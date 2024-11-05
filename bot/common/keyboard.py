from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM


# common message buttons:
def to_start_kb() -> IKM:
    return IKM(inline_keyboard=[
        [to_start_btn()]
    ])


def to_start_btn() -> IKB:
    return IKB(text='На главную ↩️', callback_data='start')


def skip_btn() -> IKB:
    return IKB(text="Пропустить ▶️", callback_data="skip")


# menu buttons:
def check_btn(repair_request: dict) -> IKB:
    return IKB(text='Добавить чек 🧾', callback_data=f"check:{repair_request['id']}")


def comment_btn(repair_request: dict) -> IKB:
    return IKB(text='Добавить комментарий 📝', callback_data=f"add_comment:{repair_request['id']}")


def not_relevant_btn(repair_request: dict) -> IKB:
    return IKB(text='Неактуально ❌', callback_data=f"not_relevant:{repair_request['id']}")


def done_btn(repair_request: dict) -> IKB:
    return IKB(text='Выполнено ✅', callback_data=f"done:{repair_request['id']}")


def set_contractor_btn(repair_request: dict) -> IKB:
    return IKB(text="Назначить исполнителя 👨‍🔧", callback_data=f"set_con:{repair_request['id']}")


# common keyboards
def skip_kb() -> IKM:
    return IKM(inline_keyboard=[[skip_btn()]])


# keyboards for repair request message:
def rr_admin_kb(repair_request: dict) -> IKM:
    arr_kb = []

    if repair_request['contractor'] is None:
        row = [set_contractor_btn(repair_request)]
        arr_kb.append(row)

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


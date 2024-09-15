import json
from typing import Coroutine

from aiogram import Bot
from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM

from util import logger, crm

from common.keyboard import to_start_btn

from data import const

notification_texts = \
{
    "STATUS_UPDATE":
    {
        2:  # в работе
        {
            "CUSTOMER": "Ваша заявка №{number} передана в работу исполнителю!",
            "CONTRACTOR": ""
        },
        3:  # выполнена
        {
            "customer": "Ваша заявка №{number} выполнена, пожалуйста, проверьте качество выполнения ремонта!",
            "contractor": ""
        }
    },
    "URGENCY_UPDATE":
    {
        "customer": "",
        "contractor": ""
    },
    "COMMENT_UPDATE":
    {
        "customer": "",
        "contractor": ""
    },
}


def get_status_update_text(new_status: int, role: int, request_number: int):
    string = notification_texts["STATUS_UPDATE"][new_status][crm.roles.get_str(role)]

    if string is None:
        return None

    return string.format(number=request_number)


def get_urgency_update_text(role: int, request_number: int):
    string = notification_texts["URGENCY_UPDATE"][crm.roles.get_str(role)]

    if string is None:
        return None

    return string.format(number=request_number)


async def get_simple_notification_text(event: str, msg: dict):
    match event:
        case "STATUS_UPDATE":
            rr_number = await crm.get_repair_request_number(msg["requestId"])
            return f"<b>❗️ИЗМЕНЕНИЕ СТАТУСА ЗАЯВКИ❗️</b>\nСтатус заявки №{rr_number} был изменён на \"{const.statuses_ru_locale[msg['newStatus']]}\""
        case "URGENCY_UPDATE":
            rr_number = await crm.get_repair_request_number(msg["requestId"])
            return f"<b>❗ИЗМЕНЕНИЕ СРОЧНОСТИ ЗАЯВКИ❗️</b>\nСрочность завки №{rr_number} была изменена на \"{msg['newUrgency']}\""
        case "COMMENT_UPDATE":
            rr_number = await crm.get_repair_request_number(msg["requestId"])
            return f"<b>❗ИЗМЕНЕНИЕ КОММЕНТАРИЯ ЗАЯВКИ❗️</b>\nКомментарий заявки №{rr_number} был изменён.\nОткройте заявку, чтобы увидеть изменения"
        case "REQUEST_CREATE":
            rr_number = await crm.get_repair_request_number(msg["requestId"])
            return f"<b>❗НОВАЯ ЗАЯВКА❗️</b>\nЗаказчиком была добавлена новая заявка №{rr_number}"
        case "TGUSER_CREATE":
            print(f"event: {event}\nmsg: {msg}")
            user = await crm.get_user_by_id(msg['userId'])
            return f"<b>❗ЗАЯВКА НА РЕГИСТРАЦИЮ❗️</b>\nНовая заявка на регистрацию!\n<i>Имя: <b>{user['name']}</b>\nРоль: <b>{crm.roles.get_rus(user['role'])}</b></i>"
        case _:
            return None


def get_simple_notification_kb(event: str, msg: dict, role: int):
    match event:
        case "TGUSER_CREATE":
            return None
        case _:
            kb = get_send_one_rr_kb(msg["requestId"], role)
            return kb


async def from_websocket_message(bot: Bot, message_string: str) -> None:

    message_dict = json.loads(message_string)

    msg = message_dict["msg"]
    event = message_dict["event"]

    print("\n", msg)

    if "customer" in msg.keys() and msg['customer'] is not None:
        if msg['customer'].isdigit():
            customer_id = int(msg["customer"])
        else:
            customer_id = await crm.get_tg_id_by_id(msg["customer"])
    else:
        customer_id = None

    if "contractor" in msg.keys() and msg['contractor'] is not None:
        if msg['contractor'].isdigit():
            contractor_id = int(msg["contractor"])
        else:
            contractor_id = await crm.get_tg_id_by_id(msg["contractor"])
    else:
        contractor_id = None

    admin_ids = await crm.get_all_manager_tg_ids()

    print(f"cus: {customer_id}", f"con: {contractor_id}", f"adm: {admin_ids}")

    try:
        text = await get_simple_notification_text(event, msg)

        if customer_id is not None:
            kb = get_simple_notification_kb(event, msg, crm.roles.CUSTOMER)
            await bot.send_message(customer_id, text, reply_markup=kb)
            logger.info("sent notification to customer")

        if contractor_id is not None:
            kb = get_simple_notification_kb(event, msg, crm.roles.CONTRACTOR)
            await bot.send_message(contractor_id, text, reply_markup=kb)
            logger.info("sent notification to contractor")

        if admin_ids:
            kb = get_simple_notification_kb(event, msg, crm.roles.ADMIN)
            for admin_id in admin_ids:
                await bot.send_message(admin_id, text, reply_markup=kb)
            logger.info("sent notification to admins")
    except Exception as e:
        print(e)


def get_send_one_rr_kb(request_id: str, role: int) -> IKM:
    return IKM(inline_keyboard=[
        [IKB(text="Посмотреть заявку ▶️", callback_data=f"send1rr:{request_id}:{role}")],
        [to_start_btn()]
    ])

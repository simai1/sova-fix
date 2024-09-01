import json

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


def get_simple_notification_text(event: str, msg: dict, rr_number: int) -> str | None:
    match event:
        case "STATUS_UPDATE":
            return f"Статус заявки №{rr_number} был изменён на \"{const.statuses_ru_locale[msg['newStatus']]}\""
        case "URGENCY_UPDATE":
            return f"Срочность завки №{rr_number} была изменена на \"{msg['newUrgency']}\""
        case "COMMENT_UPDATE":
            return f"Комментарий заявки №{rr_number} был изменён.\nОткройте заявку, чтобы увидеть изменения"
        case _:
            return None


async def from_websocket_message(bot: Bot, message_string: str) -> None:

    message_dict = json.loads(message_string)

    msg = message_dict["msg"]
    event = message_dict["event"]

    customer_id = int(msg["customer"]) if msg["customer"] is not None else None
    contractor_id = int(msg["contractor"]) if msg["contractor"] is not None else None

    request_id = msg["requestId"]
    request_number = await crm.get_repair_request_number(request_id)

    text = get_simple_notification_text(event, msg, request_number)

    if customer_id is not None:
        kb = get_send_one_rr_kb(request_id, crm.roles.CUSTOMER)
        await bot.send_message(customer_id, text, reply_markup=kb)
        logger.info("sent notification to customer")

    if contractor_id is not None:
        kb = get_send_one_rr_kb(request_id, crm.roles.CONTRACTOR)
        await bot.send_message(contractor_id, text, reply_markup=kb)
        logger.info("sent notification to contractor")


def get_send_one_rr_kb(request_id: str, role: int) -> IKM:
    return IKM(inline_keyboard=[
        [IKB(text="Посмотреть заявку ▶️", callback_data=f"send1rr:{request_id}:{role}")],
        [to_start_btn()]
    ])

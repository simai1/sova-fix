from typing import Callable

from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, Message
from aiogram.enums.content_type import ContentType

from command.admin.show_admin_requests import send_rr_for_admin
from command.contractor.show_contractor_requests import send_rr_for_contractor
from command.customer.show_customer_requests import send_rr_for_customer
from common.keyboard import to_start_kb
from common.messages import send_repair_request, \
    to_start_msg

from util import crm

router = Router(name=__name__)


class FSMRequestByNumber(StatesGroup):
    await_request_number = State()


@router.callback_query(F.data.startswith('request_by_number'))
async def request_by_number_callback_handler(query: CallbackQuery, state: FSMContext) -> None:
    await state.clear()

    await query.message.answer("Введите номер заявки")
    await state.set_state(FSMRequestByNumber.await_request_number)
    await query.answer()


@router.message(FSMRequestByNumber.await_request_number, F.content_type == ContentType.TEXT)
async def send_rr_by_number(message: Message, state: FSMContext) -> None:
    if not message.text.isdigit():
        await message.answer("Введите номер заявки")
        return

    rr_number = message.text
    user_id = message.from_user.id
    params = f"number={rr_number}"

    user = await crm.get_user(user_id)
    role = crm.roles.get_num(user['role'])

    match role:
        case crm.roles.CUSTOMER:

            await send_rr_if_found(
                message=message,
                rr_number=rr_number,
                found_requests=(await crm.get_customer_requests(user_id, params)),
                send_func=send_rr_for_customer
            )

        case crm.roles.CONTRACTOR:

            await send_rr_if_found(
                message=message,
                rr_number=rr_number,
                found_requests=(await crm.get_contractor_requests(user_id, params)),
                send_func=send_rr_for_contractor
            )

        case crm.roles.ADMIN:

            await send_rr_if_found(
                message=message,
                rr_number=rr_number,
                found_requests=(await crm.get_all_requests_with_params(params)),
                send_func=send_rr_for_admin
            )

        case _:

            await send_rr_if_found(
                message=message,
                rr_number=rr_number,
                found_requests=(await crm.get_all_requests_with_params(params)),
                send_func=send_repair_request
            )

    await state.clear()


async def send_rr_if_found(message: Message, rr_number: str | int, found_requests: list[dict], send_func: Callable) -> None:
    if len(found_requests) == 0:
        await message.answer(f"Не удалось найти заявку <b>№{rr_number}</b>. ❌", reply_markup=to_start_kb())
        return
    rr = found_requests[-1]
    await send_func(message, rr)
    await to_start_msg(message)


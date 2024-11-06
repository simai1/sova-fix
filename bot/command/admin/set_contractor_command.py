from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import StatesGroup, State
from aiogram.types import CallbackQuery

from common.keyboard import to_start_kb
from handler import pagination
from util import crm
from util.crm import roles
from util.verification import verify_user, VerificationError

router = Router(name=__name__)


class FSMSetContractor(StatesGroup):
    await_contractor_id = State()


@router.callback_query(F.data.startswith("set_con:"))
async def set_contractor_handler(query: CallbackQuery, state: FSMContext) -> None:
    # verification
    try:
        await verify_user(query.from_user.id, query.message, role=roles.ADMIN)
    except VerificationError:
        return

    request_id = query.data.split(':')[-1]

    await state.update_data(request_id=request_id)

    contractors_data = await crm.get_contractors_dict()
    names = await pagination.set_pages_data(contractors_data, state)
    kb = pagination.make_kb(0, names, prefix="contractor_id")

    await state.set_state(FSMSetContractor.await_contractor_id)
    await query.message.answer("Выберите исполнителя:", reply_markup=kb)

    await query.answer()


@router.callback_query(FSMSetContractor.await_contractor_id)
async def set_selected_contractor(query: CallbackQuery, state: FSMContext) -> None:
    contractor_id = await pagination.get_selected_value(query, state)
    request_id = (await state.get_data())['request_id']

    await pagination.remove_page_list(state)

    success = await crm.set_contractor(request_id, contractor_id)

    if success:
        await query.message.answer("Исполнитель успешно был назначен ✅", reply_markup=to_start_kb())
    else:
        await query.message.answer("Не удалось назначить исполнителя. Попробуйте позже", reply_markup=to_start_kb())

    await state.clear()
    await query.answer()

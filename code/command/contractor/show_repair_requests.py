from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message
from aiogram.fsm.context import FSMContext

router = Router(name=__name__)


@router.message(Command('show_repair_requests'))
async def start_command_handler(message: Message, state: FSMContext) -> None:
    pass


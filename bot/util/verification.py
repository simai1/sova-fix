from aiogram.types import Message

from common.messages import you_cant_do_that
from util import crm, logger
from util.crm import roles


class VerificationError(BaseException):
    def __init__(self, message):
        logger.error(message)


async def verify_user(user_id: int, message: Message, role: int | None = None) -> None:
    user = await crm.get_user(user_id)

    if user is None:
        await you_cant_do_that(message)
        raise VerificationError(f'No user with id={user_id}')

    if role is not None and user['role'] != roles.get_str(role):
        await you_cant_do_that(message)
        raise VerificationError(f'User with id={user_id} is not a {roles.get_str(role)}')

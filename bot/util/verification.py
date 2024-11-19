from aiogram.types import Message

from common.messages import you_cant_do_that
from util import crm, logger


class VerificationError(BaseException):
    def __init__(self, message):
        logger.error(message)


async def verify_user(
        user_id: int,
        role: int | list[int] | None = None,
        message: Message | None = None
) -> None:
    """
    Try to verify if the user is in the database
    :param user_id: tg_id of the user
    :param message: message for answering
    :param role: check if the user has a specific role
    :return:
    """
    user = await crm.get_user(user_id)

    if user is None:
        await you_cant_do_that(message)
        raise VerificationError(f'No user with id={user_id}')

    if role is None:
        return

    m_roles = [role] if isinstance(role, int) else role

    str_roles = [crm.roles.get_str(_role) for _role in m_roles]
    if user['role'] not in str_roles:
        await you_cant_do_that(message)
        raise VerificationError(f'User with id={user_id} is not a {str_roles}')


async def has_role(user: dict, roles: list[int]) -> bool:
    """
    check if the user has a specific role
    :param user:
    :param roles:
    :return:
    """
    str_roles = [crm.roles.get_str(_role) for _role in roles]

    if user['role'] in str_roles:
        return True
    return False



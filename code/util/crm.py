import asyncio
import io
import mimetypes
import pprint
from typing import BinaryIO

import requests

from code.util import logger

dev = 'http://localhost:3000'


class roles:
    USER = 1,
    ADMIN = 2,
    CUSTOMER = 3
    CONTRACTOR = 4

    m_list = ['USER', 'ADMIN', 'CUSTOMER', 'CONTRACTOR']

    @staticmethod
    def get_str(index: int) -> str:
        return roles.m_list[index-1]

    @staticmethod
    def get_num(string: str) -> int:
        return roles.m_list.index(string) + 1


async def register_user(user_id: int, name: str, role: int) -> dict | None:
    if await user_already_exists(user_id):
        return None

    url = f'{dev}/tgUsers'

    data: dict = {'name': name, 'role': role, 'tgId': str(user_id)}
    request = requests.post(url, data)

    if request.status_code == 200:
        return data
    else:
        logger.error(f'could not register user {user_id}, status_code={request.status_code}')


async def get_all_users() -> list | dict | None:
    url = f'{dev}/tgUsers'

    request = requests.get(url)
    data = request.json()

    return data


async def get_user(user_id: int) -> dict | None:
    url = f'{dev}/tgUsers/{user_id}'

    request = requests.get(url)
    data: dict = request.json()

    return data


async def user_already_exists(user_id: int) -> bool:
    user = await get_user(user_id)
    return user is not None


async def get_all_repair_requests() -> dict | None:
    url = f'{dev}/requests/'

    request = requests.get(url)
    data: dict = request.json()

    return data


async def create_repair_request(
        unit: str,
        object_: str,
        problem_description: str,
        photo,
        urgency: str,
        repair_price: str,
        comment: str,
        legal_entity: str
) -> dict | None:
    url = f'{dev}/requests/'

    values: dict = {'unit': unit, 'object': object_, 'urgency': urgency}
    photo_file = {'file': ('img.jpg', photo, 'image/jpeg')}

    request = requests.post(url=url, data=values, files=photo_file)

    if request.status_code == 200:
        return values
    else:
        logger.error(f'could not create repair request, status_code={request.status_code}')


async def main() -> None:
    pprint.pprint(await get_all_users())
    pass
    # user = await register_user(2054873802, 'oleg', roles.CONTRACTOR)
    # pprint.pprint(await get_all_users())


if __name__ == '__main__':
    asyncio.run(main())

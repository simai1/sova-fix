import asyncio

import requests

dev = 'http://localhost:3000'


class roles:
    USER = 1,
    ADMIN = 2,
    CUSTOMER = 3,
    CONTRACTOR = 4


async def register_user(user_id: int, name: str, role: str) -> None:
    pass


async def does_user_exist(user_id: int) -> bool:
    pass


async def get_user(user_id: id) -> dict | None:
    url = f'{dev}/tgUsers/{user_id}'

    request = requests.get(url)
    data: dict = request.json()

    print(request.status_code, data)

    return data


async def create_repair_request(
        unit: str,
        object_: str,
        problem_description: str,
        urgency: str,
        repair_price: str,
        comment: str,
        legal_entity: str) -> None:
    pass


if __name__ == '__main__':
    # user_id = 1234537

    dev = 'http://localhost:3000'
    url = f'{dev}/tgUsers'

    request = requests.get(url)
    data = request.json()

    print(data)

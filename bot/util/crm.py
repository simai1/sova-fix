from typing import BinaryIO

import requests

import config as cf
from util import logger


class roles:
    USER = 1,
    ADMIN = 2,
    CUSTOMER = 3
    CONTRACTOR = 4

    m_roles_list_en_locale = ['USER', 'ADMIN', 'CUSTOMER', 'CONTRACTOR']
    m_roles_list_ru_locale = ['Пользователь', 'Менеджер', 'Заказчик', 'Исполнитель']

    @staticmethod
    def get_str(index: int) -> str:
        return roles.m_roles_list_en_locale[index - 1]

    @staticmethod
    def get_num(string: str) -> int:
        return roles.m_roles_list_en_locale.index(string) + 1


async def register_user(user_id: int, name: str, role: int) -> dict | None:
    if await user_already_exists(user_id):
        return None

    url = f'{cf.API_URL}/tgUsers'

    data: dict = {'name': name, 'role': role, 'tgId': str(user_id)}
    request = requests.post(url, data)

    if request.status_code == 200:
        logger.info(f'successfully registered user', f'tg_id={user_id}')
        return data
    else:
        logger.error(f'could not register user {user_id}', f'{request.status_code}')
        return None


async def get_all_users() -> list | dict | None:
    url = f'{cf.API_URL}/tgUsers'

    request = requests.get(url)
    data = request.json()

    return data


async def get_user(user_id: int) -> dict | None:
    url = f'{cf.API_URL}/tgUsers/{user_id}'

    request = requests.get(url)
    data = request.json()

    if data is None:
        logger.warn(f'no user with tg_id={user_id}')
        return None

    return data


async def user_already_exists(user_id: int) -> bool:
    user = await get_user(user_id)
    return user is not None


async def get_all_repair_requests() -> dict | None:
    url = f'{cf.API_URL}/requests/'

    request = requests.get(url)
    data: dict = request.json()

    return data


async def get_repair_request(request_id: str) -> dict | None:
    url = f'{cf.API_URL}/requests/{request_id}'

    request = requests.get(url)
    data: dict = request.json()

    if request.status_code == 200:
        return data
    else:
        logger.error('could not get repair request', f'{request.status_code}\nrequest_id={request_id}')
        return None


async def get_tg_user_id(user_id: int) -> str | None:
    user = await get_user(user_id)

    if user is None:
        return None

    tg_user_id = user['id']
    return tg_user_id


async def create_repair_request(
        tg_user_id: str,
        photo: BinaryIO,
        unit: str,
        _object: str,
        problem_description: str,
        urgency: str,
        repair_price: str | None = None,
        comment: str | None = None,
        legal_entity: str | None = None
) -> dict | None:

    url = f'{cf.API_URL}/requests/'

    values = {
        'unit': unit,
        'object': _object,
        'problemDescription': problem_description,
        'urgency': urgency,
        'tgUserId': tg_user_id
    }

    if repair_price is not None:
        values['repairPrice'] = repair_price
    if comment is not None:
        values['comment'] = comment
    if legal_entity is not None:
        values['legalEntity'] = legal_entity

    photo_file = {'file': ('img.jpg', photo, 'image/jpeg')}

    request = requests.post(url=url, data=values, files=photo_file)

    if request.status_code == 200:
        logger.info('new repair request!', f'{values}')
        return values
    else:
        logger.error('could not create repair request', f'{request.status_code} \n{values}')
        return None


async def create_contractor(name: str) -> dict | None:
    url = f'{cf.API_URL}/contractors/'
    
    data = {'name': name}
    request = requests.post(url, data)
    
    if request.status_code == 200:
        return data
    
    return None


async def get_all_contractors() -> dict:
    url = f'{cf.API_URL}/contractors/'
    
    request = requests.get(url)
    data = request.json()

    return data


async def get_contractor_id(user_id: int) -> str | None:
    user = await get_user(user_id)

    if user is None or user['role'] != roles.get_str(roles.CONTRACTOR):
        return None

    contractor_id = user['contractor']['id']
    return contractor_id


async def get_contractor_requests(user_id: int) -> list | None:
    contractor_id = await get_contractor_id(user_id)

    url = f'{cf.API_URL}/contractors/{contractor_id}/requests'

    request = requests.get(url)
    data = request.json()

    if request.status_code == 200:
        return data
    else:
        logger.error(f'could not get contractor requests', f'contractor_id: {contractor_id}')
        return None


async def get_itinerary(user_id) -> list | None:
    contractor_id = await get_contractor_id(user_id)

    url = f'{cf.API_URL}/contractors/{contractor_id}/itinerary'

    request = requests.get(url)
    data = request.json()

    if request.status_code == 200:
        return data
    else:
        logger.error(f'could not get contractor requests', f'contractor_id: {contractor_id}')
        return None


async def get_customer_requests(user_id: int) -> list | None:

    tg_user_id = await get_tg_user_id(user_id)

    url = f'{cf.API_URL}/requests/customer/{tg_user_id}'

    request = requests.get(url)
    data = request.json()

    if request.status_code == 200:
        return data
    else:
        logger.error(f'could not get customer requests (tg_user_id={tg_user_id})')
        return None


async def change_repair_request_status(request_id: str, status: int) -> bool:
    url = f'{cf.API_URL}/requests/set/status'

    data = {
        "requestId": request_id,
        "status": status
    }

    request = requests.patch(url, json=data)

    if request.status_code == 200:
        return True
    else:
        logger.error('could not change request status', f'{request.status_code}\nrequest_id={request_id}, status={status}')
        return False


async def get_repair_request_comment(request_id: str) -> str | None:
    rr = await get_repair_request(request_id)

    if rr is None:
        return None

    return rr['comment']


async def change_repair_request_comment(request_id: str, new_comment: str) -> bool:
    url = f'{cf.API_URL}/requests/set/comment'

    data = {
        "requestId": request_id,
        "comment": new_comment
    }

    request = requests.patch(url, json=data)

    if request.status_code == 200:
        logger.info('successfully changed comment', f'\nrequest_id={request_id}')
        return True
    else:
        logger.error('could not change request comment', f'{request.status_code}\nrequest_id={request_id}')
        return False

from typing import BinaryIO

import requests

import config as cf
from util import logger


class roles:
    USER = 1
    ADMIN = 2
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

    @staticmethod
    def get_rus(string: str) -> str:
        return roles.m_roles_list_ru_locale[roles.get_num(string) - 1]


class User:
    def __init__(self, data: dict):
        self.id = data['id']
        self.name = data['name']
        self.role = roles.get_num(data['role'])
        self.tg_id = int(data['tgId'])
        self.linkId = data['linkId']
        self.is_confirmed = data['isConfirmed']



async def register_user(user_id: int, name: str, role: int, username: str) -> dict | None:
    if await user_already_exists(user_id):
        return None

    url = f'{cf.API_URL}/tgUsers'

    data: dict = {'name': name, 'role': role, 'tgId': str(user_id), 'linkId': username}
    request = requests.post(url, data)

    if request.status_code == 200:
        logger.info('API: successfully registered user', f'tg_id={user_id}')
        return data
    else:
        logger.error(f'API: could not register user {user_id}', f'{request.status_code}')
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
        logger.warn(f'API: no user with tg_id={user_id}')
        return None

    return data


async def user_already_exists(user_id: int) -> bool:
    user = await get_user(user_id)
    return user is not None


async def get_all_repair_requests(params: str = "") -> dict | None:
    url = f'{cf.API_URL}/requests?{params}'

    request = requests.get(url)
    data: dict = request.json()

    if request.status_code == 200:
        return data['data']
    else:
        logger.error('API: could not get all repair requests', f'{request.status_code}\nurl={url}')
        return None


async def get_repair_request(request_id: str) -> dict | None:
    url = f'{cf.API_URL}/requests/{request_id}'

    request = requests.get(url)
    data: dict = request.json()

    if request.status_code == 200:
        return data
    else:
        logger.error('API: could not get repair request', f'{request.status_code}\nrequest_id={request_id}')
        return None


async def get_tg_user_id(user_id: int) -> str | None:
    user = await get_user(user_id)

    if user is None:
        return None

    tg_user_id = user['id']
    return tg_user_id


async def create_repair_request(
        tg_user_id: str,
        file,
        content_type: str,
        object_id: str,
        problem_description: str,
        urgency: str,
        repair_price: str | None = None,
        comment: str | None = None,
        legal_entity: str | None = None
) -> dict | None:

    url = f'{cf.API_URL}/requests/'

    values = {
        'objectId': object_id,
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

    filename = {"photo": "img.jpg", "video": "video.mp4"}[content_type]

    files = {"file": (filename, file)}

    request = requests.post(url=url, data=values, files=files)

    if request.status_code == 200:
        logger.info('new repair request!', f'{values}')
        return request.json()['requestDto']
    else:
        logger.error('API: could not create repair request', f'{request.status_code}  {values}')
        return None


async def get_all_contractors() -> list:
    url = f'{cf.API_URL}/contractors/'

    request = requests.get(url)
    data = request.json()

    return data


async def get_contractors_dict() -> dict:
    contractors_list = await get_all_contractors()
    return {contractor['name']: contractor['id'] for contractor in contractors_list}


async def get_contractor_id(user_id: int) -> str | None:
    user = await get_user(user_id)

    if user is None or user['role'] != roles.get_str(roles.CONTRACTOR):
        return None

    contractor_id = user['contractor']['id']
    return contractor_id


async def get_contractor_requests(user_id: int, params: str = '') -> list | None:
    contractor_id = await get_contractor_id(user_id)

    url = f'{cf.API_URL}/contractors/{contractor_id}/requests?{params}'

    request = requests.get(url)
    data = request.json()

    if request.status_code == 200:
        return data
    else:
        logger.error('API: could not get contractor requests', f'contractor_id: {contractor_id}')
        return None


async def get_itinerary(user_id) -> list | None:
    contractor_id = await get_contractor_id(user_id)

    url = f'{cf.API_URL}/contractors/{contractor_id}/itinerary'

    request = requests.get(url)
    data = request.json()

    if request.status_code == 200:
        return data
    else:
        logger.error('API: could not get contractor requests', f'contractor_id: {contractor_id}')
        return None


async def get_customer_requests(user_id: int, params: str = '') -> list | None:

    tg_user_id = await get_tg_user_id(user_id)

    url = f'{cf.API_URL}/requests/customer/{tg_user_id}?{params}'

    request = requests.get(url)
    data = request.json()

    if request.status_code == 200:
        return data
    else:
        logger.error("API: could not get customer requests", f"tg_user_id={tg_user_id})")
        return None


async def get_requests_by_objects(user_id: int, params: str = '') -> list | None:
    """
    Получает заявки по объектам, к которым у пользователя есть доступ
    
    Args:
        user_id: ID пользователя в Telegram
        params: Дополнительные параметры запроса
        
    Returns:
        Список заявок или None, если произошла ошибка
    """
    tg_user_id = await get_tg_user_id(user_id)
    
    if not tg_user_id:
        logger.error("API: could not get tg_user_id for user", f"user_id={user_id}")
        return None
    
    url = f'{cf.API_URL}/requests/objects/{tg_user_id}?{params}'
    
    logger.info(f"Getting requests by objects: user_id={user_id}, tg_user_id={tg_user_id}, url={url}")
    
    try:
        request = requests.get(url)
        
        if request.status_code == 200:
            data = request.json()
            logger.info(f"Successfully got requests by objects: {len(data)} requests")
            return data
        else:
            logger.error("API: could not get requests by objects", 
                         f"status_code={request.status_code}, "
                         f"tg_user_id={tg_user_id}, "
                         f"response={request.text}")
            return None
    except Exception as e:
        logger.error("API: exception getting requests by objects", 
                     f"error={str(e)}, "
                     f"tg_user_id={tg_user_id}")
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
        logger.error('API: could not change request status', f'{request.status_code}\nrequest_id={request_id}, status={status}')
        return False


async def get_repair_request_comment(request_id: str) -> str | None:
    rr = await get_repair_request(request_id)

    if rr is None:
        return None

    return rr['comment']


async def set_repair_request_comment(request_id: str, comment: str) -> bool:
    url = f'{cf.API_URL}/requests/set/comment'

    data = {
        "requestId": request_id,
        "comment": comment
    }

    request = requests.patch(url, json=data)

    if request.status_code == 200:
        logger.info("API: successfully changed comment", f"request_id={request_id}")
        return True
    else:
        logger.error("API: could not change request comment", f"{request.status_code}request_id={request_id}")
        return False


async def set_rr_comment_attachment(request_id: str, file, content_type: str) -> bool:
    url = f'{cf.API_URL}/requests/set/commentAttachment'

    data = {
        "requestId": request_id,
    }

    filename = {"photo": "img.jpg", "video": "video.mp4"}[content_type]

    files = {
        "file": (filename, file)
    }

    request = requests.patch(url, data=data, files=files)

    if request.status_code == 200:
        logger.info("API: successfully changed comment attachment", f"request_id={request_id}")
        return True
    else:
        logger.error("API: could not change comment attachment", f"{request.status_code} request_id={request_id}")
        return False


async def get_repair_request_number(request_id: str) -> int | None:
    rr = await get_repair_request(request_id)

    if rr is None:
        return None

    return rr['number']


async def sync_manager(email: str, password: str, name: str, tg_id: int, username: str) -> dict | None:
    url = f'{cf.API_URL}/tgUsers/syncManager'

    data = {
        "email": email,
        "password": password,
        "name": name,
        "tgId": str(tg_id),
        "linkId": username
    }

    request = requests.post(url, data)

    if request.status_code == 200:
        logger.info('successfully synced manager')
        return request.json()
    else:
        logger.error('API: could not sync manager', f'{request.status_code}')
        return None


async def get_all_managers() -> list | None:
    url = f"{cf.API_URL}/tgUsers/managers"

    request = requests.get(url)

    if request.status_code == 200:
        return request.json()
    else:
        logger.error('API: could not get all managers', f'{request.status_code}')
        return None


async def get_all_manager_tg_ids() -> list | None:
    managers = await get_all_managers()

    if managers is None:
        return

    manager_ids = []

    for manager in managers:
        manager_ids.append(int(manager['tgId']))

    return manager_ids


async def get_user_by_id(_id: str) -> dict | None:
    url = f"{cf.API_URL}/tgUsers/get/{_id}"

    request = requests.get(url)

    if request.status_code == 200:
        return request.json()
    else:
        logger.error('API: could not get user by id', f'{request.status_code}')
        return None


async def get_tg_id_by_id(_id: str) -> int | None:
    user = await get_user_by_id(_id)
    return user['tgId']


async def get_all_requests_with_params(params: str = "") -> list | None:
    url = f"{cf.API_URL}/requests?{params}"

    req = requests.get(url)

    if req.status_code == 200:
        return req.json()['data']
    else:
        logger.error("API: could not get all requests with params", f"{req.status_code}, {url=}")
    return None


async def units_get_all() -> list | None:
    url = f"{cf.API_URL}/units"

    req = requests.get(url)

    if req.status_code == 200:
        return req.json()
    else:
        logger.error("API: could not get all units", f"{req.status_code}")
    return None


async def objects_get_all() -> list | None:
    url = f"{cf.API_URL}/objects"

    req = requests.get(url)

    if req.status_code == 200:
        return req.json()
    else:
        logger.error("API: could not get all objects", f"{req.status_code}")
    return None


async def add_check(rr_id: str, file: BinaryIO) -> bool:
    url = f"{cf.API_URL}/requests/add/check/{rr_id}"
    photo_file = {'file': ('img.jpg', file, 'image/jpeg')}

    req = requests.patch(url, files=photo_file)

    if req.status_code == 200:
        logger.info("successfully added check", f"requestId: {rr_id}")
        return True
    else:
        logger.error("could not add check", f"{req.status_code}  requestId: {rr_id}")
        return False


async def update_repair_request(request_id: str, data: dict) -> bool:
    url = f"{cf.API_URL}/requests/{request_id}/update"

    req = requests.patch(url, data)

    if req.status_code == 200:
        logger.info("successfully updated repair request", f"requestId: {request_id}, data: {data}")
        return True
    else:
        logger.error("could not add check", f"{req.status_code}  requestId: {request_id}, data: {data}")
        return False


async def set_contractor(request_id: str, contractor_id: str) -> bool:
    url = f"{cf.API_URL}/requests/set/contractor"

    data = {
        'requestId': request_id,
        'contractorId': contractor_id
    }

    req = requests.patch(url, data)

    if req.status_code == 200:
        logger.info("successfully set contractor", f"data: {data}")
        return True
    else:
        logger.error("could not set contractor", f"{req.status_code}  data: {data}")
        return False


async def get_rrs_for_user(user_data: dict, params: str = "") -> list:
    user = User(user_data)

    if not user.is_confirmed:
        return []

    match user.role:
        case roles.CUSTOMER:
            logger.info(f"Getting requests for CUSTOMER: {user.tg_id}")
            
            user_requests = await get_customer_requests(user.tg_id, params)
            if user_requests is None:
                user_requests = []
                
            object_requests = await get_requests_by_objects(user.tg_id, params)
            if object_requests is None:
                object_requests = []
                
            all_requests = []
            request_ids = set()
            
            for request in user_requests:
                if request['id'] not in request_ids:
                    all_requests.append(request)
                    request_ids.add(request['id'])
                    
            for request in object_requests:
                if request['id'] not in request_ids:
                    all_requests.append(request)
                    request_ids.add(request['id'])
            
            logger.info(f"Total requests for user {user.tg_id}: {len(all_requests)} "
                        f"(created: {len(user_requests)}, by objects: {len(object_requests)})")
            
            all_requests.sort(key=lambda x: x.get('number', 0), reverse=True)
            
            return all_requests
            
        case roles.CONTRACTOR:
            return await get_contractor_requests(user.tg_id, params)
        case roles.ADMIN:
            return await get_all_requests_with_params(params)


async def get_static_content(filename: str) -> bytes | None:
    url = f"{cf.API_URL}/uploads/{filename}"

    req = requests.get(url)

    if req.status_code == 200:
        logger.debug("UPLOADS: successfully loaded", f"{filename}")
        return req.content
    else:
        logger.error(f"could not get {filename} from uploads", f"{req.status_code}")
        return None


async def get_user_objects(tg_user_id: str) -> list | None:
    """
    Получает список объектов, доступных пользователю Telegram через публичный API.
    
    Args:
        tg_user_id: ID пользователя Telegram в базе данных
        
    Returns:
        Список объектов, доступных пользователю, или None в случае ошибки
    """
    url = f"{cf.API_URL}/tgUsers/{tg_user_id}/objects/public"
    
    try:
        logger.info(f"Getting objects for user {tg_user_id} via public API endpoint")
        request = requests.get(url)
        
        if request.status_code == 200:
            response = request.json()
            
            if isinstance(response, dict) and 'objects' in response:
                objects = response['objects']
                logger.info(f"Successfully got objects for user {tg_user_id}: {len(objects)} objects")
                return objects
            
            logger.info(f"Successfully got objects for user {tg_user_id}: {len(response)} objects")
            return response
        else:
            logger.error(f"API: could not get user objects: {request.status_code}, tg_user_id={tg_user_id}")
            return None
    except Exception as e:
        logger.error(f"API: error when getting user objects: {str(e)}, tg_user_id={tg_user_id}")
        return None


async def get_tguser_object_relations(tg_user_id: str) -> list | None:
    """
    Прямой запрос к API для получения связей пользователя и объектов из таблицы tgUserObjects.
    
    Args:
        tg_user_id: ID пользователя Telegram в базе данных
        
    Returns:
        Список ID объектов, связанных с пользователем, или None в случае ошибки
    """
    url = f"{cf.API_URL}/raw/tgUserObjects/by-user/{tg_user_id}"
    
    try:
        logger.info(f"Запрашиваем связи объектов для пользователя {tg_user_id}")
        request = requests.get(url)
        
        if request.status_code == 200:
            relations = request.json()
            logger.info(f"Получили {len(relations)} связей для пользователя {tg_user_id}")
            
            object_ids = [rel.get('objectId') for rel in relations if rel.get('objectId')]
            logger.info(f"Извлекли {len(object_ids)} ID объектов: {object_ids}")
            return object_ids
        else:
            logger.error(f"Ошибка при запросе связей: {request.status_code}, tg_user_id={tg_user_id}")
            return None
    except Exception as e:
        logger.error(f"Исключение при запросе связей: {str(e)}, tg_user_id={tg_user_id}")
        return None

async def get_all_urgencies() -> list | None:
    url = f"{cf.API_URL}/urgency"

    request = requests.get(url)
    data = request.json()

    return data
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
    """
    Регистрирует нового пользователя.
    
    Args:
        user_id: Telegram ID пользователя
        name: Имя пользователя
        role: Роль пользователя
        username: Имя пользователя в Telegram
        
    Returns:
        Данные созданного пользователя или None в случае ошибки
    """
    if await user_already_exists(user_id):
        return None

    url = f'{cf.API_URL}/tgUsers'

    data: dict = {'name': name, 'role': role, 'tgId': str(user_id), 'linkId': username}
    
    try:
        request = requests.post(url, data)

        if request.status_code == 200:
            logger.info(f'API: successfully registered user with tgId={user_id}')
            return request.json()
        else:
            logger.error(f'API: could not register user with tgId={user_id}', f'status={request.status_code}')
            return None
    except Exception as e:
        logger.error(f'API: exception during user registration with tgId={user_id}', f'error={str(e)}')
        return None


async def get_all_users() -> list | dict | None:
    """
    Получает список всех пользователей.
    
    Returns:
        Список всех пользователей или None в случае ошибки
    """
    url = f'{cf.API_URL}/tgUsers'

    try:
        request = requests.get(url)
        
        if request.status_code == 200:
            return request.json()
        else:
            logger.error(f'API: could not get all users, status={request.status_code}')
            return None
    except Exception as e:
        logger.error(f'API: exception getting all users: {str(e)}')
        return None


async def get_user(user_id: int) -> dict | None:
    """
    Получает данные пользователя по его Telegram ID.
    
    Args:
        user_id: Telegram ID пользователя
        
    Returns:
        Данные пользователя или None, если пользователь не найден
    """
    url = f'{cf.API_URL}/tgUsers/{user_id}'
    
    try:
        request = requests.get(url)
        
        if request.status_code != 200:
            logger.debug(f"API: user with tgId={user_id} not found, status={request.status_code}")
            return None
        
        data = request.json()
        
        if data is None:
            logger.debug(f"API: empty response for user with tgId={user_id}")
            return None
        
        return data
    except Exception as e:
        logger.error(f"API: exception getting user with tgId={user_id}: {str(e)}")
        return None


async def user_already_exists(user_id: int) -> bool:
    """
    Проверяет, существует ли пользователь с указанным Telegram ID.
    
    Args:
        user_id: Telegram ID пользователя
        
    Returns:
        True если пользователь существует, False в противном случае
    """
    url = f'{cf.API_URL}/tgUsers/{user_id}'
    
    try:
        request = requests.get(url)
        return request.status_code == 200 and request.json() is not None
    except Exception as e:
        logger.error(f"API: exception checking if user with tgId={user_id} exists: {str(e)}")
        return False


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

    logger.info(f"Запрашиваем детали заявки: id={request_id}")
    
    try:
        request = requests.get(url)
        
        if request.status_code != 200:
            logger.error(f'API: could not get repair request, код: {request.status_code}, request_id={request_id}')
            logger.error(f'API ответ: {request.text}')
            return None
        
        data: dict = request.json()
        
        logger.info(f"Получили данные заявки: id={data.get('id')}, status={data.get('status')}, managerId={data.get('managerId')}, managerTgId={data.get('managerTgId')}")
        
        if 'status' in data and not isinstance(data['status'], int):
            try:
                data['status'] = int(data['status'])
            except (ValueError, TypeError):
                logger.error(f"Не удалось преобразовать статус {data.get('status')} в int")
        
        return data
    except Exception as e:
        logger.error(f'API: исключение при получении заявки: {str(e)}, request_id={request_id}')
        return None


async def get_tg_user_id(user_id: int) -> str | None:
    """
    Получает ID пользователя Telegram в базе данных по его Telegram ID.
    
    Args:
        user_id: Telegram ID пользователя
    
    Returns:
        ID пользователя в базе данных или None в случае ошибки
    """
    try:
        user = await get_user(user_id)
        
        if user is None:
            logger.warn(f"Пользователь с Telegram ID {user_id} не найден в базе данных")
            return None
        
        tg_user_id = user.get('id')
        
        if not tg_user_id:
            logger.error(f"У пользователя с Telegram ID {user_id} отсутствует ID в базе данных")
            return None
            
        logger.info(f"Получен ID пользователя в базе данных: {tg_user_id} для Telegram ID {user_id}")
        return tg_user_id
    except Exception as e:
        logger.error(f"Ошибка при получении ID пользователя: {str(e)}, user_id={user_id}")
        return None


async def create_repair_request(
        tg_user_id: str,
        file,
        content_type: str,
        object_id: str,
        problem_description: str,
        urgency: str,
        category_id: str | None,
        repair_price: str | None = None,
        comment: str | None = None,
        legal_entity: str | None = None
) -> dict | None:

    url = f'{cf.API_URL}/requests/'

    values = {
        'objectId': object_id,
        'problemDescription': problem_description,
        'urgency': urgency,
        'tgUserId': tg_user_id,
        'directoryCategoryId': category_id
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


async def create_repair_request_without_photo(
        tg_user_id: str,
        object_id: str,
        problem_description: str,
        urgency: str,
        category_id: str | None,
        repair_price: str | None = None,
        comment: str | None = None,
        legal_entity: str | None = None
) -> dict | None:
    """
    Создает заявку на ремонт без прикрепления фотографии
    """
    url = f'{cf.API_URL}/requests/without-photo'

    data = {
        'objectId': object_id,
        'problemDescription': problem_description,
        'urgency': urgency,
        'tgUserId': tg_user_id,
        'directoryCategoryId': category_id
    }

    if repair_price is not None:
        data['repairPrice'] = repair_price
    if comment is not None:
        data['comment'] = comment
    if legal_entity is not None:
        data['legalEntity'] = legal_entity

    request = requests.post(url=url, json=data)

    if request.status_code == 200:
        logger.info('new repair request without photo!', f'{data}')
        return request.json()['requestDto']
    else:
        logger.error('API: could not create repair request without photo', f'{request.status_code}  {data}')
        return None


async def create_repair_request_multiple_photos(
        tg_user_id: str,
        files_list,
        object_id: str,
        problem_description: str,
        urgency: str,
        category_id: str | None,
        repair_price: str | None = None,
        comment: str | None = None,
        legal_entity: str | None = None
) -> dict | None:
    """
    Создает заявку на ремонт с прикреплением нескольких фотографий
    """
    url = f'{cf.API_URL}/requests/multiple-photos'

    values = {
        'objectId': object_id,
        'problemDescription': problem_description,
        'urgency': urgency,
        'tgUserId': tg_user_id,
        'directoryCategoryId': category_id
    }

    if repair_price is not None:
        values['repairPrice'] = repair_price
    if comment is not None:
        values['comment'] = comment
    if legal_entity is not None:
        values['legalEntity'] = legal_entity

    files = [('file', (f'img{i}.jpg', file)) for i, file in enumerate(files_list)]

    request = requests.post(url=url, data=values, files=files)

    if request.status_code == 200:
        logger.info('new repair request with multiple photos!', f'{values}')
        return request.json()['requestDto']
    else:
        logger.error('API: could not create repair request with multiple photos', f'{request.status_code}  {values}')
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

    logger.info(f"Изменяем статус заявки: id={request_id}, новый статус={status}")
    
    try:
        status_int = int(status)
    except (ValueError, TypeError):
        logger.error(f"Неверный формат статуса: {status}")
        return False

    data = {
        "requestId": request_id,
        "status": status_int
    }

    try:
        request = requests.patch(url, json=data)
        
        if request.status_code == 200:
            return True
        else:
            logger.error(f"API: не удалось изменить статус заявки. Код: {request.status_code}, запрос: request_id={request_id}, status={status_int}")
            logger.error(f"Ответ API: {request.text}")
            return False
    except Exception as e:
        logger.error(f"Исключение при изменении статуса заявки: {str(e)}")
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
    """
    Синхронизирует данные менеджера с web-частью системы.
    
    Args:
        email: Email менеджера
        password: Пароль менеджера
        name: Имя менеджера
        tg_id: Telegram ID менеджера
        username: Имя пользователя в Telegram
        
    Returns:
        Данные синхронизированного менеджера или None в случае ошибки
    """
    url = f'{cf.API_URL}/tgUsers/syncManager'
    
    data = {
        "email": email,
        "password": password,
        "name": name,
        "tgId": str(tg_id),
        "linkId": username
    }

    try:
        request = requests.post(url, data)
        
        if request.status_code == 200:
            logger.info(f'Successfully synced manager with tgId={tg_id}')
            return request.json()
        else:
            logger.error(f'API: could not sync manager with tgId={tg_id}, status={request.status_code}, response={request.text}')
            return None
    except Exception as e:
        logger.error(f'API: exception during sync manager with tgId={tg_id}, error={str(e)}')
        return None


async def get_all_managers() -> list | None:
    url = f"{cf.API_URL}/tgUsers/managers"

    request = requests.get(url)

    if request.status_code == 200:
        return request.json()
    else:
        logger.error('API: could not get all managers', f'{request.status_code}')
        return None


async def get_all_manager_tg_ids() -> list[int] | None:
    managers = await get_all_managers()

    if not managers:
        return None

    admin_ids = [
        int(manager['tgId'])
        for manager in managers
        if manager.get('role') == "ADMIN"
    ]

    return admin_ids if admin_ids else None


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
    
    logger.info(f"Запрашиваем заявки с параметрами: {params}")
    
    req = requests.get(url)

    if req.status_code == 200:
        response = req.json()
        
        # Проверяем формат ответа
        if isinstance(response, dict) and 'data' in response:
            data = response['data']
            logger.info(f"Получили {len(data)} заявок через API")
            
            # Выводим информацию о первой заявке для отладки
            if data and len(data) > 0:
                sample = data[0]
                logger.info(f"Пример заявки: id={sample.get('id')}, status={sample.get('status')}, managerId={sample.get('managerId')}")
            
            return data
        else:
            logger.info(f"Получили ответ в неожиданном формате: {type(response)}")
            return response
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
    """
    Обновляет информацию о заявке на ремонт через API.
    
    Args:
        request_id: ID заявки
        data: Словарь с полями для обновления
        
    Returns:
        True если обновление прошло успешно, иначе False
    """
    url = f"{cf.API_URL}/requests/{request_id}/update"
    
    logger.info(f"Отправляем запрос на обновление заявки: id={request_id}, данные={data}")
    
    try:
        req = requests.patch(url, json=data)
        
        if req.status_code == 200:
            return True
        else:
            logger.error(f"Не удалось обновить заявку: код={req.status_code}, id={request_id}, данные={data}")
            logger.error(f"Ответ API: {req.text}")
            return False
    except Exception as e:
        logger.error(f"Исключение при обновлении заявки: {str(e)}, id={request_id}, данные={data}")
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
            all_requests = await get_all_requests_with_params(params)
            if all_requests is None:
                all_requests = []
                
            manager_requests = await get_manager_assigned_requests(user.tg_id)
            if manager_requests is None:
                manager_requests = []
                
            if manager_requests:
                request_ids = {req['id'] for req in all_requests}
                for req in manager_requests:
                    if req['id'] not in request_ids:
                        all_requests.append(req)
                        request_ids.add(req['id'])
            return all_requests


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
        request = requests.get(url)
        
        if request.status_code == 200:
            response = request.json()
            
            if isinstance(response, dict) and 'objects' in response:
                objects = response['objects']
                logger.info(f"Получено объектов для пользователя {tg_user_id}: {len(objects)}")
                
                if not objects or len(objects) == 0:
                    logger.warn(f"Пустой список объектов для пользователя {tg_user_id}")
                    return []
                
                if len(objects) > 0:
                    sample_obj = objects[0]
                    logger.info(f"Пример структуры объекта: {sample_obj}")
                
                return objects
            elif isinstance(response, list):
                logger.info(f"Получено объектов для пользователя {tg_user_id}: {len(response)}")
                
                if not response or len(response) == 0:
                    logger.warn(f"Пустой список объектов для пользователя {tg_user_id}")
                    return []
                
                if len(response) > 0:
                    sample_obj = response[0]
                    logger.info(f"Пример структуры объекта: {sample_obj}")
                
                return response
            else:
                logger.error(f"Неожиданный формат ответа API: {type(response)}")
                return []
        else:
            logger.error(f"Ошибка при запросе объектов: {request.status_code}, tg_user_id={tg_user_id}")
            return None
    except Exception as e:
        logger.error(f"Исключение при запросе объектов: {str(e)}, tg_user_id={tg_user_id}")
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

async def get_repair_requests_by_contractor(contractor_id: str, filter_: dict | None = None) -> list | None:
    url = f'{cf.API_URL}/contractors/{contractor_id}/requests'

    if filter_ is not None:
        url += "?" + "&".join([f"{key}={value}" for key, value in filter_.items()])

    request = requests.get(url)
    data = request.json()

    return data
    if request.status_code == 200:
        return data
    else:
        logger.error('API: could not get repair requests by contractor', f'{request.status_code}\ncontractor_id={contractor_id}')
        return None


async def get_manager_assigned_requests(tg_user_id: str) -> list | None:
    """
    Получает заявки, назначенные менеджеру, по его Telegram ID.
    Возвращает только заявки со статусом "В работе" (статус 2).
    
    Args:
        tg_user_id: Telegram ID менеджера
    
    Returns:
        Список заявок, назначенных менеджеру, или None в случае ошибки
    """
    try:
        # Убеждаемся что tg_user_id это строка
        tg_user_id_str = str(tg_user_id)
        logger.info(f"Запрос заявок для менеджера с tg_user_id: {tg_user_id_str}")
        
        # Добавляем фильтр по статусу "В работе" (статус 2)
        url = f'{cf.API_URL}/requests?managerTgId={tg_user_id_str}&status=2'
        logger.info(f"URL запроса: {url}")
        
        request = requests.get(url)
        
        if request.status_code == 200:
            response = request.json()
            
            if isinstance(response, dict) and 'data' in response:
                requests_data = response['data']
                logger.info(f"Получено {len(requests_data)} заявок через managerTgId со статусом 'В работе'")
                return requests_data
            elif isinstance(response, list):
                logger.info(f"Получено {len(response)} заявок через managerTgId (прямой список) со статусом 'В работе'")
                return response
            else:
                logger.warn(f"Неожиданный формат ответа: {type(response)}")
                return []
        else:
            logger.error(f"Ошибка при запросе заявок по managerTgId: код {request.status_code}")
            logger.error(f"Ответ сервера: {request.text}")
        
        # Fallback: пытаемся найти через managerId
        logger.info("Пытаемся найти заявки через managerId")
        user = await get_user_by_tg_id(int(tg_user_id))
        
        if not user or 'id' not in user:
            logger.error(f'Не удалось получить данные пользователя: tg_id={tg_user_id}')
            return []
        
        user_id = user['id']
        # Добавляем фильтр по статусу "В работе" (статус 2) и для fallback
        url = f'{cf.API_URL}/requests?managerId={user_id}&status=2'
        logger.info(f"Fallback URL запроса: {url}")
        
        request = requests.get(url)
        
        if request.status_code == 200:
            response = request.json()
            
            if isinstance(response, dict) and 'data' in response:
                requests_data = response['data']
                logger.info(f"Получено {len(requests_data)} заявок через managerId со статусом 'В работе'")
                return requests_data
            elif isinstance(response, list):
                logger.info(f"Получено {len(response)} заявок через managerId (прямой список) со статусом 'В работе'")
                return response
            else:
                logger.warn(f"Неожиданный формат ответа fallback: {type(response)}")
                return []
        else:
            logger.error(f"Ошибка при запросе заявок по managerId: код {request.status_code}")
            logger.error(f"Ответ сервера fallback: {request.text}")
            return []
            
    except Exception as e:
        logger.error(f"Исключение при получении заявок менеджера: {str(e)}, tg_user_id={tg_user_id}")
        return []


async def get_user_by_tg_id(tg_id: int) -> dict | None:
    """
    Получает пользователя по его Telegram ID
    
    Args:
        tg_id: Telegram ID пользователя
        
    Returns:
        Информация о пользователе или None, если пользователь не найден
    """
    return await get_user(tg_id)

async def get_all_urgencies() -> list | None:
    url = f"{cf.API_URL}/urgency"

    request = requests.get(url)
    data = request.json()

    return data

async def register_customer_crm(login: str, user_id: int) -> bool:
    """
    Регистрирует пользователя для доступа к CRM по логину.

    Args:
        login: Логин пользователя

    Returns:
        True если успешно, False иначе
    """
    url = f'{cf.API_URL}/auth/registerCustomerCrm'
    data = {'login': login, 'user_id': user_id}

    try:
        response = requests.post(url, json=data)

        if response.status_code == 200:
            logger.info(f"CRM access requested successfully for login={login}")
            return True
        else:
            logger.warn(f"CRM access request failed for login={login}, status={response.status_code}")
            return False
    except Exception as e:
        logger.error(f"Exception while requesting CRM access for login={login}: {str(e)}")
        return False

async def get_status_name(statusNumber: int) -> str | None:
    url = f"{cf.API_URL}/status/{statusNumber}"

    request = requests.get(url)
    data = request.json()

    return data.get("name")

async def get_count_of_files_in_request(requestId: str) -> int | None:
    url = f"{cf.API_URL}/requests/files/{requestId}"

    request = requests.get(url)
    data = request.json()
    
    return data.get("count")

async def get_setting_by_name(settingName: str) -> bool | None:
    url = f"{cf.API_URL}/settings/{settingName}"

    response = requests.get(url)
    try:
        data = response.json()
    except ValueError:
        return None

    if isinstance(data, dict):
        return data.get("value")

    return None

async def get_customer_directory_category(tg_id: str) -> list:
    url = f"{cf.API_URL}/directoryCategory/customers/{tg_id}"

    response = requests.get(url)
    data = response.json()

    return data
    
import requests

async def get_actual_admin_requests_by_objects(tg_user_id: int, unit_id: int, object_id: str | None = None) -> list:
    """
    Получить заявки для администратора по подразделению и объекту.
    Если object_id=None — возвращаем заявки по всем объектам подразделения.
    """
    url = f"{cf.API_URL}/requests/actual/{tg_user_id}/{unit_id}"
    if object_id:
        url += f"/{object_id}"

    response = requests.get(url)
    data = response.json()
    return data.get("requests", [])


    
async def get_actual_contractor_requests_by_objects(user_id: str, unit_id: str, object_id: str | None = None) -> list:
    contractor_id = await get_contractor_id(user_id)

    url = f"{cf.API_URL}/contractors/{contractor_id}/{unit_id}"
    if object_id:
        url += f"/{object_id}"

    response = requests.get(url)
    response.raise_for_status()
    data = response.json()

    return data

from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM
from util import logger


def to_start_kb() -> IKM:
    return IKM(inline_keyboard=[
        [to_start_btn()]
    ])


def to_start_btn() -> IKB:
    return IKB(text='На главную ↩️', callback_data='start')


def skip_btn() -> IKB:
    return IKB(text="Пропустить ▶️", callback_data="skip")


def check_btn(repair_request: dict) -> IKB:
    return IKB(text='Добавить чек 🧾', callback_data=f"check:{repair_request['id']}")


def comment_btn(repair_request: dict) -> IKB:
    return IKB(text='Добавить комментарий 📝', callback_data=f"add_comment:{repair_request['id']}")


def not_relevant_btn(repair_request: dict) -> IKB:
    return IKB(text='Неактуально ❌', callback_data=f"not_relevant:{repair_request['id']}")


def done_btn(repair_request: dict) -> IKB:
    return IKB(text='Выполнено ✅', callback_data=f"done:{repair_request['id']}")

def exit_not_done_btn(repair_request: dict) -> IKB:
    return IKB(text='Выезд без выполнения 🚫', callback_data=f"exit_not_done:{repair_request['id']}")


def set_contractor_btn(repair_request: dict) -> IKB:
    return IKB(text="Назначить исполнителя 👨‍🔧", callback_data=f"set_con:{repair_request['id']}")


def skip_kb() -> IKM:
    return IKM(inline_keyboard=[[skip_btn()]])


def rr_admin_kb(repair_request: dict) -> IKM:
    arr_kb = []

    # Добавляем кнопку "Назначить исполнителя" только если
    # 1. У заявки нет исполнителя (contractor is None)
    # 2. У заявки нет назначенного менеджера-исполнителя (managerTgId is None)
    if repair_request['contractor'] is None and not repair_request.get('managerTgId'):
        logger.info(f"Добавляем кнопку 'Назначить исполнителя' для заявки {repair_request.get('id')}")
        row = [set_contractor_btn(repair_request)]
        arr_kb.append(row)
    else:
        logger.info(f"Не добавляем кнопку 'Назначить исполнителя' для заявки {repair_request.get('id')}, " 
                   f"т.к. contractor={repair_request.get('contractor')}, managerTgId={repair_request.get('managerTgId')}")

    if repair_request['checkPhoto'] is None:
        row = [check_btn(repair_request)]
        arr_kb.append(row)

    row = [comment_btn(repair_request)]
    arr_kb.append(row)

    return IKM(inline_keyboard=arr_kb)


def rr_customer_kb(repair_request: dict) -> IKM:
    arr_kb = []
    
    try:
        status = int(repair_request['status'])
    except (ValueError, TypeError):
        status = repair_request.get('status')
        logger.info(f"Не удалось преобразовать статус {repair_request.get('status')} в int для customer kb")

    if status != 4:
        row = [not_relevant_btn(repair_request)]
        arr_kb.append(row)

    row = [comment_btn(repair_request)]
    arr_kb.append(row)

    return IKM(inline_keyboard=arr_kb)


def rr_contractor_kb(repair_request: dict) -> IKM:
    arr_kb = []
    
    try:
        status = int(repair_request['status'])
    except (ValueError, TypeError):
        status = repair_request.get('status')
        logger.info(f"Не удалось преобразовать статус {repair_request.get('status')} в int для contractor kb")

    if status != 5: # Не "Выезд без выполнения"
        row = [exit_not_done_btn(repair_request)]
        arr_kb.append(row)

    if status != 3:  # Не "выполнена"
        row = [done_btn(repair_request)]
        arr_kb.append(row)

    if repair_request['checkPhoto'] is None:
        row = [check_btn(repair_request)]
        arr_kb.append(row)

    row = [comment_btn(repair_request)]
    arr_kb.append(row)

    return IKM(inline_keyboard=arr_kb)

def rr_manager_assigned_kb(repair_request: dict) -> IKM:
    arr_kb = []
    
    try:
        status = int(repair_request['status'])
    except (ValueError, TypeError):
        status = 2
        logger.info(f"Не удалось преобразовать статус {repair_request.get('status')} в int для manager kb")
    
    logger.info(f"ОТЛАДКА rr_manager_assigned_kb: Генерируем клавиатуру для заявки id={repair_request.get('id')}, status={status}, managerTgId={repair_request.get('managerTgId')}")
    
    if status != 3 and status != 4:
        logger.info(f"Добавляем кнопку 'Выполнена' для заявки {repair_request['id']} (статус {status})")
        row = [done_btn(repair_request)]
        arr_kb.append(row)
    else:
        logger.info(f"Не добавляем кнопку 'Выполнена' для заявки {repair_request['id']}, т.к. статус = {status}")

    if repair_request.get('checkPhoto') is None and status != 4:
        row = [check_btn(repair_request)]
        arr_kb.append(row)

    row = [comment_btn(repair_request)]
    arr_kb.append(row)
    
    kb = IKM(inline_keyboard=arr_kb)
    logger.info(f"ОТЛАДКА rr_manager_assigned_kb: Итоговая клавиатура: {kb}")
    return kb


async def is_manager_executor(user_id: int, repair_request: dict) -> bool:
    from util import crm, logger
    import traceback
    stack_trace = traceback.format_stack()
    for line in stack_trace[:-1]:
        logger.info(f"СТЕК: {line.strip()}")
    
    if 'managerTgId' in repair_request and repair_request['managerTgId']:
        is_executor = str(user_id) == str(repair_request['managerTgId'])
        logger.info(f"Проверка по managerTgId: tg_id={user_id}, managerTgId={repair_request['managerTgId']}, is_executor={is_executor}")
        return is_executor
    
    if 'managerId' in repair_request and repair_request['managerId']:
        user = await crm.get_user_by_tg_id(user_id)
        if user and 'id' in user:
            is_executor = user['id'] == repair_request['managerId']
            logger.info(f"Проверка по managerId: user_id={user['id']}, managerId={repair_request['managerId']}, is_executor={is_executor}")
            
            if is_executor:
                logger.info(f"Обновляем managerTgId для заявки {repair_request['id']}")
                repair_request['managerTgId'] = str(user_id)
                
                try:
                    result = await crm.update_repair_request(repair_request['id'], {
                        'managerTgId': str(user_id)
                    })
                    if result:
                        logger.info(f"Успешно обновлен managerTgId в базе данных для заявки {repair_request['id']}")
                    else:
                        logger.error(f"Не удалось обновить managerTgId в базе данных для заявки {repair_request['id']}")
                except Exception as e:
                    logger.error(f"Ошибка при обновлении managerTgId: {str(e)}")
                
                return True
    
    builder = repair_request.get('builder', '')
    if builder and 'Менеджер:' in builder:
        user = await crm.get_user_by_tg_id(user_id)
        if user and user.get('name') and user.get('name') in builder:
            logger.info(f"Это задача для конкретного менеджера {user.get('name')}")
            repair_request['managerId'] = user['id']
            repair_request['managerTgId'] = str(user_id)
            
            try:
                result = await crm.update_repair_request(repair_request['id'], {
                    'managerId': user['id'],
                    'managerTgId': str(user_id)
                })
                if result:
                    logger.info(f"Успешно обновлены managerId и managerTgId в базе данных для заявки {repair_request['id']}")
                else:
                    logger.error(f"Не удалось обновить ID в базе данных для заявки {repair_request['id']}")
            except Exception as e:
                logger.error(f"Ошибка при обновлении ID в базе данных: {str(e)}")
                
            return True
    
    logger.info(f"Пользователь {user_id} НЕ является исполнителем заявки {repair_request.get('id')}")
    return False


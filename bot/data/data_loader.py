from typing import Any, Dict

import config as cf
from util import crm
from util import logger


async def get_units_data() -> dict[str, Any]:
    all_units = await crm.units_get_all()
    units_data = {}

    for _unit in all_units:
        units_data[_unit['name']] = _unit['id']

    return units_data


async def get_objects_data(unit_id: str, tg_user_id: str = None) -> dict[str, Any]:
    """
    Получает объекты, доступные пользователю в конкретном подразделении.
    
    Args:
        unit_id: ID подразделения
        tg_user_id: ID пользователя Telegram
    
    Returns:
        Словарь с названиями объектов в качестве ключей и их ID в качестве значений
    """
    unit_objects_data = {}
    
    if not tg_user_id:
        logger.warn(f"tg_user_id не указан")
        return unit_objects_data
    
    all_objects = await crm.objects_get_all()
    if not all_objects:
        logger.error(f"Не удалось получить список объектов")
        return unit_objects_data
    
    logger.info(f"Получено {len(all_objects)} объектов из базы данных")
    
    user_object_relations = await crm.get_tguser_object_relations(tg_user_id)
    
    if not user_object_relations or len(user_object_relations) == 0:
        logger.warn(f"Не найдено связей с объектами для пользователя {tg_user_id}")
        return unit_objects_data
    
    logger.info(f"Найдено {len(user_object_relations)} связей с объектами для пользователя {tg_user_id}")
    
    for obj in all_objects:
        if obj.get('unit', {}).get('id') == unit_id:
            if obj.get('id') in user_object_relations:
                unit_objects_data[obj.get('name')] = obj.get('id')
    
    logger.info(f"Отфильтровано {len(unit_objects_data)} объектов подразделения {unit_id} для пользователя {tg_user_id}")
    
    if unit_objects_data:
        object_names = list(unit_objects_data.keys())
        logger.info(f"Доступные объекты: {', '.join(object_names)}")
    
    return unit_objects_data


async def get_user_objects_by_units(tg_user_id: str) -> Dict[str, Dict[str, str]]:
    """
    Группирует объекты пользователя по подразделениям.
    
    Args:
        tg_user_id: ID пользователя Telegram
    
    Returns:
        Словарь с ID подразделений в качестве ключей и словарями объектов в качестве значений
    """
    units_with_objects = {}
    
    user_objects = await crm.get_user_objects(tg_user_id)
    
    if not user_objects or len(user_objects) == 0:
        logger.warn(f"Не найдено объектов для пользователя {tg_user_id}")
        return units_with_objects
    
    logger.info(f"Получено {len(user_objects)} объектов для пользователя {tg_user_id}")
    
    valid_objects = 0
    
    for obj in user_objects:
        obj_name = obj.get('name')
        obj_id = obj.get('id')
        
        unit_id = None
        if isinstance(obj.get('unit'), dict):
            unit_id = obj.get('unit', {}).get('id')
        elif isinstance(obj.get('unitId'), str):
            unit_id = obj.get('unitId')
        
        valid_objects += 1
        
        if unit_id not in units_with_objects:
            units_with_objects[unit_id] = {}
            
        units_with_objects[unit_id][obj_name] = obj_id
    return units_with_objects


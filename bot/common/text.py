from data.const import statuses_ru_with_emoji
from util import logger


def repair_request_text(repair_request: dict) -> str:
    """
    Форматирует текст заявки для отображения с HTML разметкой
    
    Args:
        repair_request: словарь с данными заявки
        
    Returns:
        форматированный текст заявки
    """
    lots_of_spaces = ' ' * 100
    
    executor = "не указан"
    if repair_request.get('contractor') is not None:
        if isinstance(repair_request['contractor'], dict) and 'name' in repair_request['contractor']:
            executor = repair_request['contractor']['name']
        else:
            executor = str(repair_request['contractor'])
    elif repair_request.get('managerId') is not None or repair_request.get('managerTgId') is not None:
        executor = repair_request.get('builder', 'Менеджер')
    
    status = repair_request.get('status')
    if isinstance(status, str):
        try:
            status = int(status)
        except (ValueError, TypeError):
            logger.error(f"Не удалось преобразовать статус {status} в число")
            status = 2  # По умолчанию "В работе"
    
    return f"""
<b>Заявка №{repair_request.get('number')}{lots_of_spaces}&#x200D;</b>
<b>▶️Подразделение</b>: 
{repair_request.get('unit', 'Не указано')}

<b>▶️Объект</b>: 
📍{repair_request.get('object', 'Не указан')}

<b>▶️Описание проблемы</b>:
✍️{repair_request.get('problemDescription', 'Не указано')}

<b>👨‍🔧Исполнитель</b>: 
👤{executor if executor else '<i>не указан</i>'}

<b>Плановая дата выполнения:</b> {f"<u>{repair_request.get('planCompleteDate')}</u>" if repair_request.get('planCompleteDate') else "<i>не указано</i>"}

<b>▶️Статус заявки</b>: {statuses_ru_with_emoji.get(status, f"Статус {status}")}
{("<b>💰Цена ремонта: </b>" + str(repair_request.get('repairPrice')) + "\n") if repair_request.get('repairPrice') is not None else ""}
<b>❗️Срочность</b>: <i>{repair_request.get('urgency', 'Не указана')}</i>
<b>💬Комментарии</b>:
{repair_request.get('comment') if repair_request.get('comment') is not None else '<i>нет</i>'}
"""

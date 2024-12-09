from data.const import statuses_ru_with_emoji


def repair_request_text(repair_reqest: dict) -> str:
    lots_of_spaces = ' ' * 100
    return f"""
<b>Заявка №{repair_reqest['number']}{lots_of_spaces}&#x200D;</b>
<b>▶️Подразделение</b>: 
{repair_reqest['unit']}

<b>▶️Объект</b>: 
📍{repair_reqest['object']}

<b>▶️Описание проблемы</b>:
✍️{repair_reqest['problemDescription']}

<b>👨‍🔧Исполнитель</b>: 
👤{repair_reqest['contractor']['name'] if repair_reqest['contractor'] is not None else '<i>не указан</i>'}

<b>Плановая дата выполнения:</b> {f"<u>{repair_reqest['planCompleteDate']}</u>" if repair_reqest['planCompleteDate'] else "<i>не указано</i>"}

<b>▶️Статус заявки</b>: {statuses_ru_with_emoji[repair_reqest['status']]}
{("<b>💰Цена ремонта: </b>" + str(repair_reqest['repairPrice']) + "\n") if repair_reqest['repairPrice'] is not None else ""}
<b>❗️Срочность</b>: <i>{repair_reqest['urgency']}</i>
<b>💬Комментарии</b>:
{repair_reqest['comment'] if repair_reqest['comment'] is not None else '<i>нет</i>'}
"""

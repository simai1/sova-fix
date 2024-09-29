from typing import Any

from util import crm


async def get_units_data() -> dict[str, Any]:
    all_units = await crm.units_get_all()
    units_data = {}

    for _unit in all_units:
        units_data[_unit['name']] = _unit['id']

    return units_data


async def get_objects_data(unit_id: str) -> dict[str, Any]:
    all_objects = await crm.objects_get_all()
    unit_objects_data = {}

    for _object in all_objects:
        if _object['unit']['id'] != unit_id:
            continue
        unit_objects_data[_object['name']] = _object['id']

    return unit_objects_data


import config as cf
from datetime import datetime

log = True


class Defaults:
    LATEST_PATH = 'latest.log'
    DT_FORMAT: str = '%d.%m.%Y %H:%M:%S'


class LogMessageType:
    INFO: str = 'INFO'
    WARNING: str = 'WARN'
    ERROR: str = 'ERROR'


def init() -> None:
    if log:
        open(Defaults.LATEST_PATH, 'w').close()


def warn(message: str, add: str | None = None) -> None:
    additional(LogMessageType.WARNING, message, add)


def error(message: str, add: str | None = None) -> None:
    additional(LogMessageType.ERROR, message, add)


def info(message: str, add: str | None = None) -> None:
    additional(LogMessageType.INFO, message, add)


def additional(msg_type: str, message: str, add: str | None = None) -> None:
    text = message

    if add is not None:
        text += f'  {add}'

    msg(msg_type, text)


def msg(msg_type: str, message: str) -> None:
    now = datetime.now(tz=cf.TIMEZONE)

    text = f'{now.strftime(Defaults.DT_FORMAT)} [{msg_type}] {message}'

    if log:
        with open(Defaults.LATEST_PATH, 'a') as log_file:
            log_file.write(text+'\n')

    print(text)

from bot import config as cf
from datetime import datetime
from colorama import Fore, Style
from colorama import init as colorama_init


def init() -> None:
    colorama_init()


class Defaults:
    DT_FORMAT: str = '%d.%m.%Y %H:%M:%S'


class LogMessageType:
    INFO: str = 'INFO'
    WARNING: str = 'WARN'
    ERROR: str = 'ERROR'


def warn(message: str, add: str | None = None, color: Fore = Fore.LIGHTYELLOW_EX) -> None:
    additional(LogMessageType.WARNING, message, add, color)


def error(message: str, add: str | None = None, color: Fore = Fore.LIGHTRED_EX) -> None:
    additional(LogMessageType.ERROR, message, add, color)


def info(message: str, add: str | None = None, color: Fore = Fore.LIGHTGREEN_EX) -> None:
    additional(LogMessageType.INFO, message, add, color)


def additional(msg_type: str, message: str, add: str | None = None, color: Fore = Fore.LIGHTRED_EX) -> None:
    text = message

    if add is not None:
        text += f'  {Fore.LIGHTCYAN_EX}{add}'

    msg(msg_type, text, color)


def msg(msg_type: str, message: str, color: Fore = Fore.LIGHTCYAN_EX) -> None:
    now = datetime.now(tz=cf.TIMEZONE)
    text = f'{Style.DIM}{Fore.WHITE}{now.strftime(Defaults.DT_FORMAT)} {Style.NORMAL}{color}[{msg_type}] {message}{Fore.RESET}{Style.RESET_ALL}'
    print(text)

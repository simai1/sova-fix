from typing import Optional

import config as cf
from datetime import datetime

import colorama
from colorama import Fore, Style

log = True
color = True


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
    if color:
        colorama.init()


def warn(message: str, add: str | None = None) -> None:
    msg(LogMessageType.WARNING, message, add)


def error(message: str, add: str | None = None) -> None:
    msg(LogMessageType.ERROR, message, add)


def info(message: str, add: str | None = None) -> None:
    msg(LogMessageType.INFO, message, add)


def msg(msg_type: str, message: str, add: Optional[str]) -> None:
    now = datetime.now(tz=cf.TIMEZONE)

    if add is None:
        add = ""

    if color:
        match msg_type:
            case LogMessageType.INFO:
                Fore_MSG = Fore.LIGHTWHITE_EX
                Fore_MSG_TYPE = Fore.LIGHTGREEN_EX
            case LogMessageType.WARNING:
                Fore_MSG = Fore.LIGHTYELLOW_EX
                Fore_MSG_TYPE = Fore.LIGHTYELLOW_EX
            case LogMessageType.ERROR:
                Fore_MSG = Fore.LIGHTRED_EX
                Fore_MSG_TYPE = Fore.LIGHTRED_EX
            case _:
                Fore_MSG = Fore.LIGHTWHITE_EX
                Fore_MSG_TYPE = Fore.LIGHTWHITE_EX
        Fore_ADD = Fore.LIGHTCYAN_EX

        text = (
            f"{Fore.LIGHTBLACK_EX}{now.strftime(Defaults.DT_FORMAT)} "
            f"{Fore_MSG_TYPE}[{msg_type}] "
            f"{Fore_MSG}{message} "
            f"{Fore_ADD}{add}"
            f"{Style.RESET_ALL}"
        )

    else:
        text = f"{now.strftime(Defaults.DT_FORMAT)} [{msg_type}] {message}"

    if log:
        with open(Defaults.LATEST_PATH, 'a') as log_file:
            try:
                log_text = f"{now.strftime(Defaults.DT_FORMAT)} [{msg_type}] {message}"
                log_file.write(log_text+'\n')
            except UnicodeEncodeError:
                warn('could not encode character for log')

    print(text)

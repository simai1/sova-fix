import os

from dotenv import load_dotenv


def test() -> None:
    load_dotenv(dotenv_path='.env')

    print(os.getenv('BOT_TOKEN'))


if __name__ == '__main__':
    test()

import asyncio


async def test() -> None:
    print("o" in "test")


if __name__ == '__main__':
    asyncio.run(test())

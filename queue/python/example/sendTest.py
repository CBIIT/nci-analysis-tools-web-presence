import json
from stompest.config import StompConfig
from stompest.sync import Stomp

CONFIG = StompConfig('tcp://localhost:61613')
QUEUE = '/queue/test'




if __name__ == '__main__':
    client = Stomp(CONFIG)
    client.connect()
    client.send(QUEUE, json.dumps({'fileName':'test','path':'/home/user/python/testDir','email':'wuye@mail.nih.gov','timeStamp':'2015-06-25','outputDir':'/home/user/python/testOutDir'}))
    client.disconnect()

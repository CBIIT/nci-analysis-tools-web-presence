import json
import logging
import time
import os

from twisted.internet import reactor, defer
from PropertyUtil import PropertyUtil
from stompest.async import Stomp
from stompest.async.listener import SubscriptionListener
from stompest.async.listener import DisconnectListener
from stompest.config import StompConfig
from stompest.protocol import StompSpec

class QueueJob(DisconnectListener):

    def __init__(self, config=None):

        # Initialize Connections to ActiveMQ

	self.QUEUE=PropertyUtil.getAttribute('queue.remote.name')
	self.ERROR_QUEUE=PropertyUtil.getAttribute('queue.remote.error.name')
        if config is None:
            	config = StompConfig(PropertyUtil.getAttribute('queye.remote.url')) 
		self.config = config

    @defer.inlineCallbacks
    def run(self):
        client = yield Stomp(self.config).connect()
        headers = {
            # client-individual mode is necessary for concurrent processing
            # (requires ActiveMQ >= 5.2)
            StompSpec.ACK_HEADER: StompSpec.ACK_CLIENT_INDIVIDUAL,
            # the maximal number of messages the broker will let you work on at the same time
            'activemq.prefetchSize': '100',
        }
        client.subscribe(self.QUEUE, headers, listener=SubscriptionListener(self.consume, errorDestination=self.ERROR_QUEUE))
	client.add(listener=self)

    # Consumer for Jobs in Queue, needs to be rewrite by the individual projects
    def consume(self, client, frame):
	print('in Queue Job')

    def onCleanup(self, connect):
	print 'In clean up ...'
    def onConnectionLost(self, connect, reason):
	self.run()


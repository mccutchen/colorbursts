import logging
import os
import socket
import urllib

import tornado.gen
import tornado.httpclient
import tornado.ioloop
import tornado.options
import tornado.web


class BaseHandler(tornado.web.RequestHandler):

    @property
    def httpclient(self):
        if not hasattr(self, '_httpclient'):
            self._httpclient = tornado.httpclient.AsyncHTTPClient()
        return self._httpclient

    def fetch(self, *args, **kwargs):
        return self.httpclient.fetch(*args, **kwargs)


class IndexHandler(BaseHandler):

    def get(self):
        self.finish(open('index.html').read())


class EmbedlyProxyHandler(BaseHandler):

    @tornado.web.asynchronous
    @tornado.gen.engine
    def get(self):
        params = {
            'url': self.get_argument('url'),
            'key': self.settings['embedly_api_key'],
            'colors': 'true',
        }
        url = 'http://api.embed.ly/1/preview?' + urllib.urlencode(params)
        resp = yield tornado.gen.Task(self.fetch, url)
        self.set_header('Content-Type', resp.headers['Content-Type'])
        self.set_status(resp.code)
        self.finish(resp.body)


class BitlyProxyHandler(BaseHandler):

    @tornado.web.asynchronous
    @tornado.gen.engine
    def get(self, path):
        params = dict((k, map(_utf8, self.get_arguments(k)))
                      for k in self.request.arguments)
        params['access_token'] = self.settings['bitly_access_token']
        url = 'https://api-ssl.bitly.com' + path
        logging.debug('Bitly proxy: %s %r', url, params)
        resp = yield tornado.gen.Task(
            self.fetch, url + '?' + urllib.urlencode(params, doseq=1))
        logging.debug('Proxy resp: %s %s', resp.code, url)
        self.set_header('Content-Type', resp.headers['Content-Type'])
        self.set_status(resp.code)
        self.finish(resp.body)


def _utf8(s):
    if not s or isinstance(s, str):
        return s
    return s.decode('utf8')


settings = {
    'embedly_api_key': os.environ['EMBEDLY_API_KEY'],
    'bitly_access_token': os.environ['BITLY_ACCESS_TOKEN'],
    'static_path': 'static',
    'debug': socket.gethostname() == 'brisket.local',
}


application = tornado.web.Application([
    (r'/', IndexHandler),
    (r'/bitly(/[\w/]+)', BitlyProxyHandler),
    (r'/embedly', EmbedlyProxyHandler),
], **settings)


if __name__ == '__main__':
    tornado.options.parse_command_line()
    port = int(os.environ.get('PORT', 5000))
    application.listen(port)
    tornado.ioloop.IOLoop.instance().start()

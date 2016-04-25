
from BaseHTTPServer import BaseHTTPRequestHandler,HTTPServer
from os import curdir, sep

from server.dataProcess import dataProcess

import cgi

PORT_NUMBER = 8080


class myHandler(BaseHTTPRequestHandler):
	
	#Handler for the GET requests
	def do_GET(self):
		if self.path=="/":
			self.path = "/BingVSearch.html"

		try:
			#Check the file extension required and
			#set the right mime type

			sendReply = False
			if self.path.endswith(".html"):
				mimetype='text/html'
				sendReply = True
			if self.path.endswith(".jpg"):
				mimetype='image/jpg'
				sendReply = True
			if self.path.endswith(".gif"):
				mimetype='image/gif'
				sendReply = True
			if self.path.endswith(".js"):
				mimetype='application/javascript'
				sendReply = True
			if self.path.endswith(".css"):
				mimetype='text/css'
				sendReply = True

			if sendReply == True:
				#Open the static file requested and send it
				f = open(curdir + "/client" + self.path)
				self.send_response(200)
				self.send_header('Content-type',mimetype)
				self.end_headers()
				self.wfile.write(f.read())
				f.close()
			return

		except IOError:
			self.send_error(404,'File Not Found: %s' % self.path)

	#Handler for the POST requests
	def do_POST(self):
		try:
			ctype, pdict = cgi.parse_header(self.headers.getheader("Content-type"))	
			if ctype == "application/json":
				length = int(self.headers.getheader('content-length'))
				data = self.rfile.read(length)
				dp = dataProcess(data)
				if self.path=="/get":
					dp.getEigValue()
				

				rep = dp.getJsonData()
				self.send_response(200)
				self.end_headers()
				self.wfile.write(rep)
		except:
			self.send_error(404, "bad request")
			
			
try:
	#Create a web server and define the handler to manage the
	#incoming request
	server = HTTPServer(('', PORT_NUMBER), myHandler)
	print 'Started httpserver on port ' , PORT_NUMBER
	
	#Wait forever for incoming htto requests
	server.serve_forever()

except KeyboardInterrupt:
	print '^C received, shutting down the web server'
	server.socket.close()




	
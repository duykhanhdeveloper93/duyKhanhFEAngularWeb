"use strict";

/*
	The MIT License (MIT)

	Copyright (c) 2016 Meetecho

	Permission is hereby granted, free of charge, to any person obtaining
	a copy of this software and associated documentation files (the "Software"),
	to deal in the Software without restriction, including without limitation
	the rights to use, copy, modify, merge, publish, distribute, sublicense,
	and/or sell copies of the Software, and to permit persons to whom the
	Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included
	in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
	THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
	OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
	ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
	OTHER DEALINGS IN THE SOFTWARE.
 */

// List of sessions
Webrtc.sessions = new Map();

Webrtc.isExtensionEnabled = function() {
	if(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
		// No need for the extension, getDisplayMedia is supported
		return true;
	}
	if(window.navigator.userAgent.match('Chrome')) {
		let chromever = parseInt(window.navigator.userAgent.match(/Chrome\/(.*) /)[1], 10);
		let maxver = 33;
		if(window.navigator.userAgent.match('Linux'))
			maxver = 35;	// "known" crash in chrome 34 and 35 on linux
		if(chromever >= 26 && chromever <= maxver) {
			// Older versions of Chrome don't support this extension-based approach, so lie
			return true;
		}
		return Webrtc.extension.isInstalled();
	} else {
		// Firefox and others, no need for the extension (but this doesn't mean it will work)
		return true;
	}
};

var defaultExtension = {
	// Screensharing Chrome Extension ID
	extensionId: 'hapfgfdkleiggjjpfpenajgdnfckjpaj',
	isInstalled: function() { return document.querySelector('#janus-extension-installed') !== null; },
	getScreen: function (callback) {
		let pending = window.setTimeout(function () {
			let error = new Error('NavigatorUserMediaError');
			error.name = 'The required Chrome extension is not installed: click <a href="#">here</a> to install it. (NOTE: this will need you to refresh the page)';
			return callback(error);
		}, 1000);
		this.cache[pending] = callback;
		window.postMessage({ type: 'janusGetScreen', id: pending }, '*');
	},
	init: function () {
		let cache = {};
		this.cache = cache;
		// Wait for events from the Chrome Extension
		window.addEventListener('message', function (event) {
			if(event.origin != window.location.origin)
				return;
			if(event.data.type == 'janusGotScreen' && cache[event.data.id]) {
				let callback = cache[event.data.id];
				delete cache[event.data.id];
				if(event.data.sourceId === '') {
					// user canceled
					let error = new Error('NavigatorUserMediaError');
					error.name = 'You cancelled the request for permission, giving up...';
					callback(error);
				} else {
					callback(null, event.data.sourceId);
				}
			} else if(event.data.type == 'janusGetScreenPending') {
				console.log('clearing ', event.data.id);
				window.clearTimeout(event.data.id);
			}
		});
	}
};

Webrtc.useDefaultDependencies = function (deps) {
	let f = (deps && deps.fetch) || fetch;
	let p = (deps && deps.Promise) || Promise;
	let socketCls = (deps && deps.WebSocket) || WebSocket;

	return {
		newWebSocket: function(server, proto) { return new socketCls(server, proto); },
		extension: (deps && deps.extension) || defaultExtension,
		isArray: function(arr) { return Array.isArray(arr); },
		webRTCAdapter: (deps && deps.adapter) || adapter,
		httpAPICall: function(url, options) {
			let fetchOptions = {
				method: options.verb,
				headers: {
					'Accept': 'application/json, text/plain, */*'
				},
				cache: 'no-cache'
			};
			if(options.verb === "POST") {
				fetchOptions.headers['Content-Type'] = 'application/json';
			}
			if(typeof options.withCredentials !== 'undefined') {
				fetchOptions.credentials = options.withCredentials === true ? 'include' : (options.withCredentials ? options.withCredentials : 'omit');
			}
			if(options.body) {
				fetchOptions.body = JSON.stringify(options.body);
			}

			let fetching = f(url, fetchOptions).catch(function(error) {
				return p.reject({message: 'Probably a network error, is the server down?', error: error});
			});

			/*
			 * fetch() does not natively support timeouts.
			 * Work around this by starting a timeout manually, and racing it agains the fetch() to see which thing resolves first.
			 */

			if(options.timeout) {
				let timeout = new p(function(resolve, reject) {
					let timerId = setTimeout(function() {
						clearTimeout(timerId);
						return reject({message: 'Request timed out', timeout: options.timeout});
					}, options.timeout);
				});
				fetching = p.race([fetching, timeout]);
			}

			fetching.then(function(response) {
				if(response.ok) {
					if(typeof(options.success) === typeof(Webrtc.noop)) {
						return response.json().then(function(parsed) {
							try {
								options.success(parsed);
							} catch(error) {
								Webrtc.error('Unhandled httpAPICall success callback error', error);
							}
						}, function(error) {
							return p.reject({message: 'Failed to parse response body', error: error, response: response});
						});
					}
				}
				else {
					return p.reject({message: 'API call failed', response: response});
				}
			}).catch(function(error) {
				if(typeof(options.error) === typeof(Webrtc.noop)) {
					options.error(error.message || '<< internal error >>', error);
				}
			});

			return fetching;
		}
	}
};

Webrtc.useOldDependencies = function (deps) {
	let jq = (deps && deps.jQuery) || jQuery;
	let socketCls = (deps && deps.WebSocket) || WebSocket;
	return {
		newWebSocket: function(server, proto) { return new socketCls(server, proto); },
		isArray: function(arr) { return jq.isArray(arr); },
		extension: (deps && deps.extension) || defaultExtension,
		webRTCAdapter: (deps && deps.adapter) || adapter,
		httpAPICall: function(url, options) {
			let payload = (typeof options.body !== 'undefined') ? {
				contentType: 'application/json',
				data: JSON.stringify(options.body)
			} : {};
			let credentials = (typeof options.withCredentials !== 'undefined') ? {xhrFields: {withCredentials: options.withCredentials}} : {};

			return jq.ajax(jq.extend(payload, credentials, {
				url: url,
				type: options.verb,
				cache: false,
				dataType: 'json',
				async: options.async,
				timeout: options.timeout,
				success: function(result) {
					if(typeof(options.success) === typeof(Webrtc.noop)) {
						options.success(result);
					}
				},
				error: function(xhr, status, err) {
					if(typeof(options.error) === typeof(Webrtc.noop)) {
						options.error(status, err);
					}
				}
			}));
		}
	};
};

// Helper function to convert a deprecated media object to a tracks array
Webrtc.mediaToTracks = function(media) {
	let tracks = [];
	if(!media) {
		// Default is bidirectional audio and video, using default devices
		tracks.push({ type: 'audio', capture: true, recv: true });
		tracks.push({ type: 'video', capture: true, recv: true });
	} else {
		if(!media.keepAudio && media.audio !== false && ((typeof media.audio === 'undefined') || media.audio || media.audioSend || media.audioRecv ||
				media.addAudio || media.replaceAudio || media.removeAudio)) {
			// We may need an audio track
			let track = { type: 'audio' };
			if(media.removeAudio) {
				track.remove = true;
			} else {
				if(media.addAudio)
					track.add = true;
				else if(media.replaceAudio)
					track.replace = true;
				// Check if we need to capture an audio device
				if(media.audioSend !== false)
					track.capture = media.audio || true;
				// Check if we need to receive audio
				if(media.audioRecv !== false)
					track.recv = true;
			}
			// Add an audio track if needed
			if(track.remove || track.capture || track.recv)
				tracks.push(track);
		}
		if(!media.keepVideo && media.video !== false && ((typeof media.video === 'undefined') || media.video || media.videoSend || media.videoRecv ||
				media.addVideo || media.replaceVideo || media.removeVideo)) {
			// We may need a video track
			let track = { type: 'video' };
			if(media.removeVideo) {
				track.remove = true;
			} else {
				if(media.addVideo)
					track.add = true;
				else if(media.replaceVideo)
					track.replace = true;
				// Check if we need to capture a video device
				if(media.videoSend !== false) {
					track.capture = media.video || true;
					if(['screen', 'window', 'desktop'].includes(track.capture)) {
						// Change the type to 'screen'
						track.type = 'screen';
						track.capture = { video: {} };
						// Check if there's constraints
						if(media.screenshareFrameRate)
							track.capture.frameRate = media.screenshareFrameRate;
						if(media.screenshareHeight)
							track.capture.height = media.screenshareHeight;
						if(media.screenshareWidth)
							track.capture.width = media.screenshareWidth;
					}
				}
				// Check if we need to receive video
				if(media.videoRecv !== false)
					track.recv = true;
			}
			// Add a video track if needed
			if(track.remove || track.capture || track.recv)
				tracks.push(track);
		}
		if(media.data) {
			// We need a data channel
			tracks.push({ type: 'data' });
		}
	}
	// Done
	return tracks;
};

// Helper function to convert a track object to a set of constraints
Webrtc.trackConstraints = function(track) {
	let constraints = {};
	if(!track || !track.capture)
		return constraints;
	if(track.type === 'audio') {
		// Just put the capture part in the constraints
		constraints.audio = track.capture;
	} else if(track.type === 'video') {
		// Check if one of the keywords was passed
		if((track.simulcast || track.svc) && track.capture === true)
			track.capture = 'hires';
		if(track.capture === true || typeof track.capture === 'object') {
			// Use the provided capture object as video constraint
			constraints.video = track.capture;
		} else {
			let width = 0;
			let height = 0;
			if(track.capture === 'lowres') {
				// Small resolution, 4:3
				width = 320;
				height = 240;
			} else if(track.capture === 'lowres-16:9') {
				// Small resolution, 16:9
				width = 320;
				height = 180;
			} else if(track.capture === 'hires' || track.capture === 'hires-16:9' || track.capture === 'hdres') {
				// High(HD) resolution is only 16:9
				width = 1280;
				height = 720;
			} else if(track.capture === 'fhdres') {
				// Full HD resolution is only 16:9
				width = 1920;
				height = 1080;
			} else if(track.capture === '4kres') {
				// 4K resolution is only 16:9
				width = 3840;
				height = 2160;
			} else if(track.capture === 'stdres') {
				// Normal resolution, 4:3
				width = 640;
				height = 480;
			} else if(track.capture === 'stdres-16:9') {
				// Normal resolution, 16:9
				width = 640;
				height = 360;
			} else {
				Webrtc.log('Default video setting is stdres 4:3');
				width = 640;
				height = 480;
			}
			constraints.video = {
				width: { ideal: width },
				height: { ideal: height }
			};
		}
	} else if(track.type === 'screen') {
		// Use the provided capture object as video constraint
		constraints.video = track.capture;
	}
	return constraints;
};

Webrtc.noop = function() {};

Webrtc.dataChanDefaultLabel = "JanusDataChannel";

// Note: in the future we may want to change this, e.g., as was
// attempted in https://github.com/meetecho/janus-gateway/issues/1670
Webrtc.endOfCandidates = null;

// Stop all tracks from a given stream
Webrtc.stopAllTracks = function(stream) {
	try {
		// Try a MediaStreamTrack.stop() for each track
		let tracks = stream.getTracks();
		for(let mst of tracks) {
			Webrtc.log(mst);
			if(mst && mst.dontStop !== true) {
				mst.stop();
			}
		}
	} catch(e) {
		// Do nothing if this fails
	}
}

// Initialization
Webrtc.init = function(options) {
	options = options || {};
	options.callback = (typeof options.callback == "function") ? options.callback : Webrtc.noop;
	if(Webrtc.initDone) {
		// Already initialized
		options.callback();
	} else {
		if(typeof console.log == "undefined") {
			console.log = function() {};
		}
		// Console logging (all debugging disabled by default)
		Webrtc.trace = Webrtc.noop;
		Webrtc.debug = Webrtc.noop;
		Webrtc.vdebug = Webrtc.noop;
		Webrtc.log = Webrtc.noop;
		Webrtc.warn = Webrtc.noop;
		Webrtc.error = Webrtc.noop;
		if(options.debug === true || options.debug === "all") {
			// Enable all debugging levels
			Webrtc.trace = console.trace.bind(console);
			Webrtc.debug = console.debug.bind(console);
			Webrtc.vdebug = console.debug.bind(console);
			Webrtc.log = console.log.bind(console);
			Webrtc.warn = console.warn.bind(console);
			Webrtc.error = console.error.bind(console);
		} else if(Array.isArray(options.debug)) {
			for(let d of options.debug) {
				switch(d) {
					case "trace":
						Webrtc.trace = console.trace.bind(console);
						break;
					case "debug":
						Webrtc.debug = console.debug.bind(console);
						break;
					case "vdebug":
						Webrtc.vdebug = console.debug.bind(console);
						break;
					case "log":
						Webrtc.log = console.log.bind(console);
						break;
					case "warn":
						Webrtc.warn = console.warn.bind(console);
						break;
					case "error":
						Webrtc.error = console.error.bind(console);
						break;
					default:
						console.error("Unknown debugging option '" + d + "' (supported: 'trace', 'debug', 'vdebug', 'log', warn', 'error')");
						break;
				}
			}
		}
		Webrtc.log("Initializing library");

		let usedDependencies = options.dependencies || Webrtc.useDefaultDependencies();
		Webrtc.isArray = usedDependencies.isArray;
		Webrtc.webRTCAdapter = usedDependencies.webRTCAdapter;
		Webrtc.httpAPICall = usedDependencies.httpAPICall;
		Webrtc.newWebSocket = usedDependencies.newWebSocket;
		Webrtc.extension = usedDependencies.extension;
		Webrtc.extension.init();

		// Helper method to enumerate devices
		Webrtc.listDevices = function(callback, config) {
			callback = (typeof callback == "function") ? callback : Webrtc.noop;
			if(!config)
				config = { audio: true, video: true };
			if(Webrtc.isGetUserMediaAvailable()) {
				navigator.mediaDevices.getUserMedia(config)
					.then(function(stream) {
						navigator.mediaDevices.enumerateDevices().then(function(devices) {
							Webrtc.debug(devices);
							callback(devices);
							// Get rid of the now useless stream
							Webrtc.stopAllTracks(stream)
						});
					})
					.catch(function(err) {
						Webrtc.error(err);
						callback([]);
					});
			} else {
				Webrtc.warn("navigator.mediaDevices unavailable");
				callback([]);
			}
		};
		// Helper methods to attach/reattach a stream to a video element (previously part of adapter.js)
		Webrtc.attachMediaStream = function(element, stream) {
			try {
				element.srcObject = stream;
			} catch (e) {
				try {
					element.src = URL.createObjectURL(stream);
				} catch (e) {
					Webrtc.error("Error attaching stream to element", e);
				}
			}
		};
		Webrtc.reattachMediaStream = function(to, from) {
			try {
				to.srcObject = from.srcObject;
			} catch (e) {
				try {
					to.src = from.src;
				} catch (e) {
					Webrtc.error("Error reattaching stream to element", e);
				}
			}
		};
		// Detect tab close: make sure we don't loose existing onbeforeunload handlers
		// (note: for iOS we need to subscribe to a different event, 'pagehide', see
		// https://gist.github.com/thehunmonkgroup/6bee8941a49b86be31a787fe8f4b8cfe)
		let iOS = ['iPad', 'iPhone', 'iPod'].indexOf(navigator.platform) >= 0;
		let eventName = iOS ? 'pagehide' : 'beforeunload';
		let oldOBF = window["on" + eventName];
		window.addEventListener(eventName, function() {
			Webrtc.log("Closing window");
			for(const [sessionId, session] of Webrtc.sessions) {
				if(session && session.destroyOnUnload) {
					Webrtc.log("Destroying session " + sessionId);
					session.destroy({unload: true, notifyDestroyed: false});
				}
			}
			if(oldOBF && typeof oldOBF == "function") {
				oldOBF();
			}
		});
		// If this is a Safari, check if VP8 or VP9 are supported
		Webrtc.safariVp8 = false;
		Webrtc.safariVp9 = false;
		if(Webrtc.webRTCAdapter.browserDetails.browser === 'safari' &&
				Webrtc.webRTCAdapter.browserDetails.version >= 605) {
			// Let's see if RTCRtpSender.getCapabilities() is there
			if(RTCRtpSender && RTCRtpSender.getCapabilities && RTCRtpSender.getCapabilities("video") &&
					RTCRtpSender.getCapabilities("video").codecs && RTCRtpSender.getCapabilities("video").codecs.length) {
				for(let codec of RTCRtpSender.getCapabilities("video").codecs) {
					if(codec && codec.mimeType && codec.mimeType.toLowerCase() === "video/vp8") {
						Webrtc.safariVp8 = true;
					} else if(codec && codec.mimeType && codec.mimeType.toLowerCase() === "video/vp9") {
						Webrtc.safariVp9 = true;
					}
				}
				if(Webrtc.safariVp8) {
					Webrtc.log("This version of Safari supports VP8");
				} else {
					Webrtc.warn("This version of Safari does NOT support VP8: if you're using a Technology Preview, " +
						"try enabling the 'WebRTC VP8 codec' setting in the 'Experimental Features' Develop menu");
				}
			} else {
				// We do it in a very ugly way, as there's no alternative...
				// We create a PeerConnection to see if VP8 is in an offer
				let testpc = new RTCPeerConnection({});
				testpc.createOffer({offerToReceiveVideo: true}).then(function(offer) {
					Webrtc.safariVp8 = offer.sdp.indexOf("VP8") !== -1;
					Webrtc.safariVp9 = offer.sdp.indexOf("VP9") !== -1;
					if(Webrtc.safariVp8) {
						Webrtc.log("This version of Safari supports VP8");
					} else {
						Webrtc.warn("This version of Safari does NOT support VP8: if you're using a Technology Preview, " +
							"try enabling the 'WebRTC VP8 codec' setting in the 'Experimental Features' Develop menu");
					}
					testpc.close();
					testpc = null;
				});
			}
		}
		Webrtc.initDone = true;
		options.callback();
	}
};

// Helper method to check whether WebRTC is supported by this browser
Webrtc.isWebrtcSupported = function() {
	return !!window.RTCPeerConnection;
};
// Helper method to check whether devices can be accessed by this browser (e.g., not possible via plain HTTP)
Webrtc.isGetUserMediaAvailable = function() {
	return navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
};

// Helper method to create random identifiers (e.g., transaction)
Webrtc.randomString = function(len) {
	let charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let randomString = '';
	for(let i=0; i<len; i++) {
		let randomPoz = Math.floor(Math.random() * charSet.length);
		randomString += charSet.charAt(randomPoz);
	}
	return randomString;
};

function Webrtc(gatewayCallbacks) {
	gatewayCallbacks = gatewayCallbacks || {};
	gatewayCallbacks.success = (typeof gatewayCallbacks.success == "function") ? gatewayCallbacks.success : Webrtc.noop;
	gatewayCallbacks.error = (typeof gatewayCallbacks.error == "function") ? gatewayCallbacks.error : Webrtc.noop;
	gatewayCallbacks.destroyed = (typeof gatewayCallbacks.destroyed == "function") ? gatewayCallbacks.destroyed : Webrtc.noop;
	if(!Webrtc.initDone) {
		gatewayCallbacks.error("Library not initialized");
		return {};
	}
	if(!Webrtc.isWebrtcSupported()) {
		gatewayCallbacks.error("WebRTC not supported by this browser");
		return {};
	}
	Webrtc.log("Library initialized: " + Webrtc.initDone);
	if(!gatewayCallbacks.server) {
		gatewayCallbacks.error("Invalid server url");
		return {};
	}
	let websockets = false;
	let ws = null;
	let wsHandlers = {};
	let wsKeepaliveTimeoutId = null;
	let servers = null;
	let serversIndex = 0;
	let server = gatewayCallbacks.server;
	if(Webrtc.isArray(server)) {
		Webrtc.log("Multiple servers provided (" + server.length + "), will use the first that works");
		server = null;
		servers = gatewayCallbacks.server;
		Webrtc.debug(servers);
	} else {
		if(server.indexOf("ws") === 0) {
			websockets = true;
			Webrtc.log("Using WebSockets to contact Janus: " + server);
		} else {
			websockets = false;
			Webrtc.log("Using REST API to contact Janus: " + server);
		}
	}
	let iceServers = gatewayCallbacks.iceServers || [{urls: "stun:stun.l.google.com:19302"}];
	let iceTransportPolicy = gatewayCallbacks.iceTransportPolicy;
	let bundlePolicy = gatewayCallbacks.bundlePolicy;
	// Whether we should enable the withCredentials flag for XHR requests
	let withCredentials = false;
	if(typeof gatewayCallbacks.withCredentials !== 'undefined' && gatewayCallbacks.withCredentials !== null)
		withCredentials = gatewayCallbacks.withCredentials === true;
	// Optional max events
	let maxev = 10;
	if(typeof gatewayCallbacks.max_poll_events !== 'undefined' && gatewayCallbacks.max_poll_events !== null)
		maxev = gatewayCallbacks.max_poll_events;
	if(maxev < 1)
		maxev = 1;
	// Token to use (only if the token based authentication mechanism is enabled)
	let token = null;
	if(typeof gatewayCallbacks.token !== 'undefined' && gatewayCallbacks.token !== null)
		token = gatewayCallbacks.token;
	// API secret to use (only if the shared API secret is enabled)
	let apisecret = null;
	if(typeof gatewayCallbacks.apisecret !== 'undefined' && gatewayCallbacks.apisecret !== null)
		apisecret = gatewayCallbacks.apisecret;
	// Whether we should destroy this session when onbeforeunload is called
	this.destroyOnUnload = true;
	if(typeof gatewayCallbacks.destroyOnUnload !== 'undefined' && gatewayCallbacks.destroyOnUnload !== null)
		this.destroyOnUnload = (gatewayCallbacks.destroyOnUnload === true);
	// Some timeout-related values
	let keepAlivePeriod = 25000;
	if(typeof gatewayCallbacks.keepAlivePeriod !== 'undefined' && gatewayCallbacks.keepAlivePeriod !== null)
		keepAlivePeriod = gatewayCallbacks.keepAlivePeriod;
	if(isNaN(keepAlivePeriod))
		keepAlivePeriod = 25000;
	let longPollTimeout = 60000;
	if(typeof gatewayCallbacks.longPollTimeout !== 'undefined' && gatewayCallbacks.longPollTimeout !== null)
		longPollTimeout = gatewayCallbacks.longPollTimeout;
	if(isNaN(longPollTimeout))
		longPollTimeout = 60000;

	// overrides for default maxBitrate values for simulcasting
	function getMaxBitrates(simulcastMaxBitrates) {
		let maxBitrates = {
			high: 900000,
			medium: 300000,
			low: 100000,
		};

		if(typeof simulcastMaxBitrates !== 'undefined' && simulcastMaxBitrates !== null) {
			if(simulcastMaxBitrates.high)
				maxBitrates.high = simulcastMaxBitrates.high;
			if(simulcastMaxBitrates.medium)
				maxBitrates.medium = simulcastMaxBitrates.medium;
			if(simulcastMaxBitrates.low)
				maxBitrates.low = simulcastMaxBitrates.low;
		}

		return maxBitrates;
	}

	let connected = false;
	let sessionId = null;
	let pluginHandles = new Map();
	let that = this;
	let retries = 0;
	let transactions = new Map();
	createSession(gatewayCallbacks);

	// Public methods
	this.getServer = function() { return server; };
	this.isConnected = function() { return connected; };
	this.reconnect = function(callbacks) {
		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Webrtc.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : Webrtc.noop;
		callbacks["reconnect"] = true;
		createSession(callbacks);
	};
	this.getSessionId = function() { return sessionId; };
	this.getInfo = function(callbacks) { getInfo(callbacks); };
	this.destroy = function(callbacks) { destroySession(callbacks); };
	this.attach = function(callbacks) { createHandle(callbacks); };

	function eventHandler() {
		if(sessionId == null)
			return;
		Webrtc.debug('Long poll...');
		if(!connected) {
			Webrtc.warn("Is the server down? (connected=false)");
			return;
		}
		let longpoll = server + "/" + sessionId + "?rid=" + new Date().getTime();
		if(maxev)
			longpoll = longpoll + "&maxev=" + maxev;
		if(token)
			longpoll = longpoll + "&token=" + encodeURIComponent(token);
		if(apisecret)
			longpoll = longpoll + "&apisecret=" + encodeURIComponent(apisecret);
		Webrtc.httpAPICall(longpoll, {
			verb: 'GET',
			withCredentials: withCredentials,
			success: handleEvent,
			timeout: longPollTimeout,
			error: function(textStatus, errorThrown) {
				Webrtc.error(textStatus + ":", errorThrown);
				retries++;
				if(retries > 3) {
					// Did we just lose the server? :-(
					connected = false;
					gatewayCallbacks.error("Lost connection to the server (is it down?)");
					return;
				}
				eventHandler();
			}
		});
	}

	// Private event handler: this will trigger plugin callbacks, if set
	function handleEvent(json, skipTimeout) {
		retries = 0;
		if(!websockets && typeof sessionId !== 'undefined' && sessionId !== null && skipTimeout !== true)
			eventHandler();
		if(!websockets && Webrtc.isArray(json)) {
			// We got an array: it means we passed a maxev > 1, iterate on all objects
			for(let i=0; i<json.length; i++) {
				handleEvent(json[i], true);
			}
			return;
		}
		if(json["janus"] === "keepalive") {
			// Nothing happened
			Webrtc.vdebug("Got a keepalive on session " + sessionId);
			return;
		} else if(json["janus"] === "server_info") {
			// Just info on the Janus instance
			Webrtc.debug("Got info on the Janus instance");
			Webrtc.debug(json);
			const transaction = json["transaction"];
			if(transaction) {
				const reportSuccess = transactions.get(transaction);
				if(reportSuccess)
					reportSuccess(json);
				transactions.delete(transaction);
			}
			return;
		} else if(json["janus"] === "ack") {
			// Just an ack, we can probably ignore
			Webrtc.debug("Got an ack on session " + sessionId);
			Webrtc.debug(json);
			const transaction = json["transaction"];
			if(transaction) {
				const reportSuccess = transactions.get(transaction);
				if(reportSuccess)
					reportSuccess(json);
				transactions.delete(transaction);
			}
			return;
		} else if(json["janus"] === "success") {
			// Success!
			Webrtc.debug("Got a success on session " + sessionId);
			Webrtc.debug(json);
			const transaction = json["transaction"];
			if(transaction) {
				const reportSuccess = transactions.get(transaction);
				if(reportSuccess)
					reportSuccess(json);
				transactions.delete(transaction);
			}
			return;
		} else if(json["janus"] === "trickle") {
			// We got a trickle candidate from Janus
			const sender = json["sender"];
			if(!sender) {
				Webrtc.warn("Missing sender...");
				return;
			}
			const pluginHandle = pluginHandles.get(sender);
			if(!pluginHandle) {
				Webrtc.debug("This handle is not attached to this session");
				return;
			}
			let candidate = json["candidate"];
			Webrtc.debug("Got a trickled candidate on session " + sessionId);
			Webrtc.debug(candidate);
			let config = pluginHandle.webrtcStuff;
			if(config.pc && config.remoteSdp) {
				// Add candidate right now
				Webrtc.debug("Adding remote candidate:", candidate);
				if(!candidate || candidate.completed === true) {
					// end-of-candidates
					config.pc.addIceCandidate(Webrtc.endOfCandidates);
				} else {
					// New candidate
					config.pc.addIceCandidate(candidate);
				}
			} else {
				// We didn't do setRemoteDescription (trickle got here before the offer?)
				Webrtc.debug("We didn't do setRemoteDescription (trickle got here before the offer?), caching candidate");
				if(!config.candidates)
					config.candidates = [];
				config.candidates.push(candidate);
				Webrtc.debug(config.candidates);
			}
		} else if(json["janus"] === "webrtcup") {
			// The PeerConnection with the server is up! Notify this
			Webrtc.debug("Got a webrtcup event on session " + sessionId);
			Webrtc.debug(json);
			const sender = json["sender"];
			if(!sender) {
				Webrtc.warn("Missing sender...");
				return;
			}
			const pluginHandle = pluginHandles.get(sender);
			if(!pluginHandle) {
				Webrtc.debug("This handle is not attached to this session");
				return;
			}
			pluginHandle.webrtcState(true);
			return;
		} else if(json["janus"] === "hangup") {
			// A plugin asked the core to hangup a PeerConnection on one of our handles
			Webrtc.debug("Got a hangup event on session " + sessionId);
			Webrtc.debug(json);
			const sender = json["sender"];
			if(!sender) {
				Webrtc.warn("Missing sender...");
				return;
			}
			const pluginHandle = pluginHandles.get(sender);
			if(!pluginHandle) {
				Webrtc.debug("This handle is not attached to this session");
				return;
			}
			pluginHandle.webrtcState(false, json["reason"]);
			pluginHandle.hangup();
		} else if(json["janus"] === "detached") {
			// A plugin asked the core to detach one of our handles
			Webrtc.debug("Got a detached event on session " + sessionId);
			Webrtc.debug(json);
			const sender = json["sender"];
			if(!sender) {
				Webrtc.warn("Missing sender...");
				return;
			}
			const pluginHandle = pluginHandles.get(sender);
			if(!pluginHandle) {
				// Don't warn here because destroyHandle causes this situation.
				return;
			}
			pluginHandle.ondetached();
			pluginHandle.detach();
		} else if(json["janus"] === "media") {
			// Media started/stopped flowing
			Webrtc.debug("Got a media event on session " + sessionId);
			Webrtc.debug(json);
			const sender = json["sender"];
			if(!sender) {
				Webrtc.warn("Missing sender...");
				return;
			}
			const pluginHandle = pluginHandles.get(sender);
			if(!pluginHandle) {
				Webrtc.debug("This handle is not attached to this session");
				return;
			}
			pluginHandle.mediaState(json["type"], json["receiving"], json["mid"]);
		} else if(json["janus"] === "slowlink") {
			Webrtc.debug("Got a slowlink event on session " + sessionId);
			Webrtc.debug(json);
			// Trouble uplink or downlink
			const sender = json["sender"];
			if(!sender) {
				Webrtc.warn("Missing sender...");
				return;
			}
			const pluginHandle = pluginHandles.get(sender);
			if(!pluginHandle) {
				Webrtc.debug("This handle is not attached to this session");
				return;
			}
			pluginHandle.slowLink(json["uplink"], json["lost"], json["mid"]);
		} else if(json["janus"] === "error") {
			// Oops, something wrong happened
			Webrtc.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
			Webrtc.debug(json);
			let transaction = json["transaction"];
			if(transaction) {
				let reportSuccess = transactions.get(transaction);
				if(reportSuccess) {
					reportSuccess(json);
				}
				transactions.delete(transaction);
			}
			return;
		} else if(json["janus"] === "event") {
			Webrtc.debug("Got a plugin event on session " + sessionId);
			Webrtc.debug(json);
			const sender = json["sender"];
			if(!sender) {
				Webrtc.warn("Missing sender...");
				return;
			}
			let plugindata = json["plugindata"];
			if(!plugindata) {
				Webrtc.warn("Missing plugindata...");
				return;
			}
			Webrtc.debug("  -- Event is coming from " + sender + " (" + plugindata["plugin"] + ")");
			let data = plugindata["data"];
			Webrtc.debug(data);
			const pluginHandle = pluginHandles.get(sender);
			if(!pluginHandle) {
				Webrtc.warn("This handle is not attached to this session");
				return;
			}
			let jsep = json["jsep"];
			if(jsep) {
				Webrtc.debug("Handling SDP as well...");
				Webrtc.debug(jsep);
			}
			let callback = pluginHandle.onmessage;
			if(callback) {
				Webrtc.debug("Notifying application...");
				// Send to callback specified when attaching plugin handle
				callback(data, jsep);
			} else {
				// Send to generic callback (?)
				Webrtc.debug("No provided notification callback");
			}
		} else if(json["janus"] === "timeout") {
			Webrtc.error("Timeout on session " + sessionId);
			Webrtc.debug(json);
			if(websockets) {
				ws.close(3504, "Gateway timeout");
			}
			return;
		} else {
			Webrtc.warn("Unknown message/event  '" + json["janus"] + "' on session " + sessionId);
			Webrtc.debug(json);
		}
	}

	// Private helper to send keep-alive messages on WebSockets
	function keepAlive() {
		if(!server || !websockets || !connected)
			return;
		wsKeepaliveTimeoutId = setTimeout(keepAlive, keepAlivePeriod);
		let request = { "janus": "keepalive", "session_id": sessionId, "transaction": Webrtc.randomString(12) };
		if(token)
			request["token"] = token;
		if(apisecret)
			request["apisecret"] = apisecret;
		ws.send(JSON.stringify(request));
	}

	// Private method to create a session
	function createSession(callbacks) {
		let transaction = Webrtc.randomString(12);
		let request = { "janus": "create", "transaction": transaction };
		if(callbacks["reconnect"]) {
			// We're reconnecting, claim the session
			connected = false;
			request["janus"] = "claim";
			request["session_id"] = sessionId;
			// If we were using websockets, ignore the old connection
			if(ws) {
				ws.onopen = null;
				ws.onerror = null;
				ws.onclose = null;
				if(wsKeepaliveTimeoutId) {
					clearTimeout(wsKeepaliveTimeoutId);
					wsKeepaliveTimeoutId = null;
				}
			}
		}
		if(token)
			request["token"] = token;
		if(apisecret)
			request["apisecret"] = apisecret;
		if(!server && Webrtc.isArray(servers)) {
			// We still need to find a working server from the list we were given
			server = servers[serversIndex];
			if(server.indexOf("ws") === 0) {
				websockets = true;
				Webrtc.log("Server #" + (serversIndex+1) + ": trying WebSockets to contact Janus (" + server + ")");
			} else {
				websockets = false;
				Webrtc.log("Server #" + (serversIndex+1) + ": trying REST API to contact Janus (" + server + ")");
			}
		}
		if(websockets) {
			ws = Webrtc.newWebSocket(server, 'janus-protocol');
			wsHandlers = {
				'error': function() {
					Webrtc.error("Error connecting to the Janus WebSockets server... " + server);
					if(Webrtc.isArray(servers) && !callbacks["reconnect"]) {
						serversIndex++;
						if(serversIndex === servers.length) {
							// We tried all the servers the user gave us and they all failed
							callbacks.error("Error connecting to any of the provided Janus servers: Is the server down?");
							return;
						}
						// Let's try the next server
						server = null;
						setTimeout(function() {
							createSession(callbacks);
						}, 200);
						return;
					}
					callbacks.error("Error connecting to the Janus WebSockets server: Is the server down?");
				},

				'open': function() {
					// We need to be notified about the success
					transactions.set(transaction, function(json) {
						Webrtc.debug(json);
						if(json["janus"] !== "success") {
							Webrtc.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
							callbacks.error(json["error"].reason);
							return;
						}
						wsKeepaliveTimeoutId = setTimeout(keepAlive, keepAlivePeriod);
						connected = true;
						sessionId = json["session_id"] ? json["session_id"] : json.data["id"];
						if(callbacks["reconnect"]) {
							Webrtc.log("Claimed session: " + sessionId);
						} else {
							Webrtc.log("Created session: " + sessionId);
						}
						Webrtc.sessions.set(sessionId, that);
						callbacks.success();
					});
					ws.send(JSON.stringify(request));
				},

				'message': function(event) {
					handleEvent(JSON.parse(event.data));
				},

				'close': function() {
					if(!server || !connected) {
						return;
					}
					connected = false;
					// FIXME What if this is called when the page is closed?
					gatewayCallbacks.error("Lost connection to the server (is it down?)");
				}
			};

			for(let eventName in wsHandlers) {
				ws.addEventListener(eventName, wsHandlers[eventName]);
			}

			return;
		}
		Webrtc.httpAPICall(server, {
			verb: 'POST',
			withCredentials: withCredentials,
			body: request,
			success: function(json) {
				Webrtc.debug(json);
				if(json["janus"] !== "success") {
					Webrtc.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
					callbacks.error(json["error"].reason);
					return;
				}
				connected = true;
				sessionId = json["session_id"] ? json["session_id"] : json.data["id"];
				if(callbacks["reconnect"]) {
					Webrtc.log("Claimed session: " + sessionId);
				} else {
					Webrtc.log("Created session: " + sessionId);
				}
				Webrtc.sessions.set(sessionId, that);
				eventHandler();
				callbacks.success();
			},
			error: function(textStatus, errorThrown) {
				Webrtc.error(textStatus + ":", errorThrown);	// FIXME
				if(Webrtc.isArray(servers) && !callbacks["reconnect"]) {
					serversIndex++;
					if(serversIndex === servers.length) {
						// We tried all the servers the user gave us and they all failed
						callbacks.error("Error connecting to any of the provided Janus servers: Is the server down?");
						return;
					}
					// Let's try the next server
					server = null;
					setTimeout(function() { createSession(callbacks); }, 200);
					return;
				}
				if(errorThrown === "")
					callbacks.error(textStatus + ": Is the server down?");
				else if(errorThrown && errorThrown.error)
					callbacks.error(textStatus + ": " + errorThrown.error.message);
				else
					callbacks.error(textStatus + ": " + errorThrown);
			}
		});
	}

	// Private method to get info on the server
	function getInfo(callbacks) {
		callbacks = callbacks || {};
		// FIXME This method triggers a success even when we fail
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Webrtc.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : Webrtc.noop;
		Webrtc.log("Getting info on Janus instance");
		if(!connected) {
			Webrtc.warn("Is the server down? (connected=false)");
			callbacks.error("Is the server down? (connected=false)");
			return;
		}
		// We just need to send an "info" request
		let transaction = Webrtc.randomString(12);
		let request = { "janus": "info", "transaction": transaction };
		if(token)
			request["token"] = token;
		if(apisecret)
			request["apisecret"] = apisecret;
		if(websockets) {
			transactions.set(transaction, function(json) {
				Webrtc.log("Server info:");
				Webrtc.debug(json);
				if(json["janus"] !== "server_info") {
					Webrtc.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
				}
				callbacks.success(json);
			});
			ws.send(JSON.stringify(request));
			return;
		}
		Webrtc.httpAPICall(server, {
			verb: 'POST',
			withCredentials: withCredentials,
			body: request,
			success: function(json) {
				Webrtc.log("Server info:");
				Webrtc.debug(json);
				if(json["janus"] !== "server_info") {
					Webrtc.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
				}
				callbacks.success(json);
			},
			error: function(textStatus, errorThrown) {
				Webrtc.error(textStatus + ":", errorThrown);	// FIXME
				if(errorThrown === "")
					callbacks.error(textStatus + ": Is the server down?");
				else
					callbacks.error(textStatus + ": " + errorThrown);
			}
		});
	}

	// Private method to destroy a session
	function destroySession(callbacks) {
		callbacks = callbacks || {};
		// FIXME This method triggers a success even when we fail
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Webrtc.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : Webrtc.noop;
		let unload = (callbacks.unload === true);
		let notifyDestroyed = true;
		if(typeof callbacks.notifyDestroyed !== 'undefined' && callbacks.notifyDestroyed !== null)
			notifyDestroyed = (callbacks.notifyDestroyed === true);
		let cleanupHandles = (callbacks.cleanupHandles === true);
		Webrtc.log("Destroying session " + sessionId + " (unload=" + unload + ")");
		if(!sessionId) {
			Webrtc.warn("No session to destroy");
			callbacks.success();
			if(notifyDestroyed)
				gatewayCallbacks.destroyed();
			return;
		}
		if(cleanupHandles) {
			for(const handleId of pluginHandles.keys())
				destroyHandle(handleId, { noRequest: true });
		}
		if(!connected) {
			Webrtc.warn("Is the server down? (connected=false)");
			sessionId = null;
			callbacks.success();
			return;
		}
		// No need to destroy all handles first, Janus will do that itself
		let request = { "janus": "destroy", "transaction": Webrtc.randomString(12) };
		if(token)
			request["token"] = token;
		if(apisecret)
			request["apisecret"] = apisecret;
		if(unload) {
			// We're unloading the page: use sendBeacon for HTTP instead,
			// or just close the WebSocket connection if we're using that
			if(websockets) {
				ws.onclose = null;
				ws.close();
				ws = null;
			} else {
				navigator.sendBeacon(server + "/" + sessionId, JSON.stringify(request));
			}
			Webrtc.log("Destroyed session:");
			sessionId = null;
			connected = false;
			callbacks.success();
			if(notifyDestroyed)
				gatewayCallbacks.destroyed();
			return;
		}

		if(websockets) {
			request["session_id"] = sessionId;

			let unbindWebSocket = function() {
				for(let eventName in wsHandlers) {
					ws.removeEventListener(eventName, wsHandlers[eventName]);
				}
				ws.removeEventListener('message', onUnbindMessage);
				ws.removeEventListener('error', onUnbindError);
				if(wsKeepaliveTimeoutId) {
					clearTimeout(wsKeepaliveTimeoutId);
				}
				ws.close();
			};

			let onUnbindMessage = function(event){
				let data = JSON.parse(event.data);
				if(data.session_id == request.session_id && data.transaction == request.transaction) {
					unbindWebSocket();
					callbacks.success();
					if(notifyDestroyed)
						gatewayCallbacks.destroyed();
				}
			};
			let onUnbindError = function() {
				unbindWebSocket();
				callbacks.error("Failed to destroy the server: Is the server down?");
				if(notifyDestroyed)
					gatewayCallbacks.destroyed();
			};

			ws.addEventListener('message', onUnbindMessage);
			ws.addEventListener('error', onUnbindError);

			if(ws.readyState === 1) {
				ws.send(JSON.stringify(request));
			} else {
				onUnbindError();
			}

			return;
		}
		Webrtc.httpAPICall(server + "/" + sessionId, {
			verb: 'POST',
			withCredentials: withCredentials,
			body: request,
			success: function(json) {
				Webrtc.log("Destroyed session:");
				Webrtc.debug(json);
				sessionId = null;
				connected = false;
				if(json["janus"] !== "success") {
					Webrtc.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
				}
				callbacks.success();
				if(notifyDestroyed)
					gatewayCallbacks.destroyed();
			},
			error: function(textStatus, errorThrown) {
				Webrtc.error(textStatus + ":", errorThrown);	// FIXME
				// Reset everything anyway
				sessionId = null;
				connected = false;
				callbacks.success();
				if(notifyDestroyed)
					gatewayCallbacks.destroyed();
			}
		});
	}

	// Private method to create a plugin handle
	function createHandle(callbacks) {
		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Webrtc.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : Webrtc.noop;
		callbacks.dataChannelOptions = callbacks.dataChannelOptions || { ordered: true };
		callbacks.consentDialog = (typeof callbacks.consentDialog == "function") ? callbacks.consentDialog : Webrtc.noop;
		callbacks.iceState = (typeof callbacks.iceState == "function") ? callbacks.iceState : Webrtc.noop;
		callbacks.mediaState = (typeof callbacks.mediaState == "function") ? callbacks.mediaState : Webrtc.noop;
		callbacks.webrtcState = (typeof callbacks.webrtcState == "function") ? callbacks.webrtcState : Webrtc.noop;
		callbacks.slowLink = (typeof callbacks.slowLink == "function") ? callbacks.slowLink : Webrtc.noop;
		callbacks.onmessage = (typeof callbacks.onmessage == "function") ? callbacks.onmessage : Webrtc.noop;
		callbacks.onlocaltrack = (typeof callbacks.onlocaltrack == "function") ? callbacks.onlocaltrack : Webrtc.noop;
		callbacks.onremotetrack = (typeof callbacks.onremotetrack == "function") ? callbacks.onremotetrack : Webrtc.noop;
		callbacks.ondata = (typeof callbacks.ondata == "function") ? callbacks.ondata : Webrtc.noop;
		callbacks.ondataopen = (typeof callbacks.ondataopen == "function") ? callbacks.ondataopen : Webrtc.noop;
		callbacks.oncleanup = (typeof callbacks.oncleanup == "function") ? callbacks.oncleanup : Webrtc.noop;
		callbacks.ondetached = (typeof callbacks.ondetached == "function") ? callbacks.ondetached : Webrtc.noop;
		if(!connected) {
			Webrtc.warn("Is the server down? (connected=false)");
			callbacks.error("Is the server down? (connected=false)");
			return;
		}
		let plugin = callbacks.plugin;
		if(!plugin) {
			Webrtc.error("Invalid plugin");
			callbacks.error("Invalid plugin");
			return;
		}
		let opaqueId = callbacks.opaqueId;
		let loopIndex = callbacks.loopIndex;
		let handleToken = callbacks.token ? callbacks.token : token;
		let transaction = Webrtc.randomString(12);
		let request = { "janus": "attach", "plugin": plugin, "opaque_id": opaqueId, "loop_index": loopIndex, "transaction": transaction };
		if(handleToken)
			request["token"] = handleToken;
		if(apisecret)
			request["apisecret"] = apisecret;
		if(websockets) {
			transactions.set(transaction, function(json) {
				Webrtc.debug(json);
				if(json["janus"] !== "success") {
					Webrtc.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
					callbacks.error("Ooops: " + json["error"].code + " " + json["error"].reason);
					return;
				}
				let handleId = json.data["id"];
				Webrtc.log("Created handle: " + handleId);
				let pluginHandle =
					{
						session : that,
						plugin : plugin,
						id : handleId,
						token : handleToken,
						detached : false,
						webrtcStuff : {
							started : false,
							myStream : null,
							streamExternal : false,
							mySdp : null,
							mediaConstraints : null,
							pc : null,
							dataChannelOptions: callbacks.dataChannelOptions,
							dataChannel : {},
							dtmfSender : null,
							trickle : true,
							iceDone : false,
							bitrate : {}
						},
						getId : function() { return handleId; },
						getPlugin : function() { return plugin; },
						getVolume : function(mid, result) { return getVolume(handleId, mid, true, result); },
						getRemoteVolume : function(mid, result) { return getVolume(handleId, mid, true, result); },
						getLocalVolume : function(mid, result) { return getVolume(handleId, mid, false, result); },
						isAudioMuted : function(mid) { return isMuted(handleId, mid, false); },
						muteAudio : function(mid) { return mute(handleId, mid, false, true); },
						unmuteAudio : function(mid) { return mute(handleId, mid, false, false); },
						isVideoMuted : function(mid) { return isMuted(handleId, mid, true); },
						muteVideo : function(mid) { return mute(handleId, mid, true, true); },
						unmuteVideo : function(mid) { return mute(handleId, mid, true, false); },
						getBitrate : function(mid) { return getBitrate(handleId, mid); },
						setMaxBitrate : function(mid, bitrate) { return setBitrate(handleId, mid, bitrate); },
						send : function(callbacks) { sendMessage(handleId, callbacks); },
						data : function(callbacks) { sendData(handleId, callbacks); },
						dtmf : function(callbacks) { sendDtmf(handleId, callbacks); },
						consentDialog : callbacks.consentDialog,
						iceState : callbacks.iceState,
						mediaState : callbacks.mediaState,
						webrtcState : callbacks.webrtcState,
						slowLink : callbacks.slowLink,
						onmessage : callbacks.onmessage,
						createOffer : function(callbacks) { prepareWebrtc(handleId, true, callbacks); },
						createAnswer : function(callbacks) { prepareWebrtc(handleId, false, callbacks); },
						handleRemoteJsep : function(callbacks) { prepareWebrtcPeer(handleId, callbacks); },
						replaceTracks : function(callbacks) { replaceTracks(handleId, callbacks); },
						getLocalTracks : function() { return getLocalTracks(handleId); },
						getRemoteTracks : function() { return getRemoteTracks(handleId); },
						onlocaltrack : callbacks.onlocaltrack,
						onremotetrack : callbacks.onremotetrack,
						ondata : callbacks.ondata,
						ondataopen : callbacks.ondataopen,
						oncleanup : callbacks.oncleanup,
						ondetached : callbacks.ondetached,
						hangup : function(sendRequest) { cleanupWebrtc(handleId, sendRequest === true); },
						detach : function(callbacks) { destroyHandle(handleId, callbacks); }
					};
				pluginHandles.set(handleId, pluginHandle);
				callbacks.success(pluginHandle);
			});
			request["session_id"] = sessionId;
			ws.send(JSON.stringify(request));
			return;
		}

		Webrtc.httpAPICall(server + "/" + sessionId, {
			verb: 'POST',
			withCredentials: withCredentials,
			body: request,
			success: function(json) {
				Webrtc.debug(json);
				if(json["janus"] !== "success") {
					Webrtc.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
					callbacks.error("Ooops: " + json["error"].code + " " + json["error"].reason);
					return;
				}
				let handleId = json.data["id"];
				Webrtc.log("Created handle: " + handleId);
				let pluginHandle =
					{
						session : that,
						plugin : plugin,
						id : handleId,
						token : handleToken,
						detached : false,
						webrtcStuff : {
							started : false,
							myStream : null,
							streamExternal : false,
							mySdp : null,
							mediaConstraints : null,
							pc : null,
							dataChannelOptions: callbacks.dataChannelOptions,
							dataChannel : {},
							dtmfSender : null,
							trickle : true,
							iceDone : false,
							bitrate: {}
						},
						getId : function() { return handleId; },
						getPlugin : function() { return plugin; },
						getVolume : function(mid, result) { return getVolume(handleId, mid, true, result); },
						getRemoteVolume : function(mid, result) { return getVolume(handleId, mid, true, result); },
						getLocalVolume : function(mid, result) { return getVolume(handleId, mid, false, result); },
						isAudioMuted : function(mid) { return isMuted(handleId, mid, false); },
						muteAudio : function(mid) { return mute(handleId, mid, false, true); },
						unmuteAudio : function(mid) { return mute(handleId, mid, false, false); },
						isVideoMuted : function(mid) { return isMuted(handleId, mid, true); },
						muteVideo : function(mid) { return mute(handleId, mid, true, true); },
						unmuteVideo : function(mid) { return mute(handleId, mid, true, false); },
						getBitrate : function(mid) { return getBitrate(handleId, mid); },
						setMaxBitrate : function(mid, bitrate) { return setBitrate(handleId, mid, bitrate); },
						send : function(callbacks) { sendMessage(handleId, callbacks); },
						data : function(callbacks) { sendData(handleId, callbacks); },
						dtmf : function(callbacks) { sendDtmf(handleId, callbacks); },
						consentDialog : callbacks.consentDialog,
						iceState : callbacks.iceState,
						mediaState : callbacks.mediaState,
						webrtcState : callbacks.webrtcState,
						slowLink : callbacks.slowLink,
						onmessage : callbacks.onmessage,
						createOffer : function(callbacks) { prepareWebrtc(handleId, true, callbacks); },
						createAnswer : function(callbacks) { prepareWebrtc(handleId, false, callbacks); },
						handleRemoteJsep : function(callbacks) { prepareWebrtcPeer(handleId, callbacks); },
						replaceTracks : function(callbacks) { replaceTracks(handleId, callbacks); },
						getLocalTracks : function() { return getLocalTracks(handleId); },
						getRemoteTracks : function() { return getRemoteTracks(handleId); },
						onlocaltrack : callbacks.onlocaltrack,
						onremotetrack : callbacks.onremotetrack,
						ondata : callbacks.ondata,
						ondataopen : callbacks.ondataopen,
						oncleanup : callbacks.oncleanup,
						ondetached : callbacks.ondetached,
						hangup : function(sendRequest) { cleanupWebrtc(handleId, sendRequest === true); },
						detach : function(callbacks) { destroyHandle(handleId, callbacks); }
					}
				pluginHandles.set(handleId, pluginHandle);
				callbacks.success(pluginHandle);
			},
			error: function(textStatus, errorThrown) {
				Webrtc.error(textStatus + ":", errorThrown);	// FIXME
				if(errorThrown === "")
					callbacks.error(textStatus + ": Is the server down?");
				else
					callbacks.error(textStatus + ": " + errorThrown);
			}
		});
	}

	// Private method to send a message
	function sendMessage(handleId, callbacks) {
		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Webrtc.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : Webrtc.noop;
		if(!connected) {
			Webrtc.warn("Is the server down? (connected=false)");
			callbacks.error("Is the server down? (connected=false)");
			return;
		}
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle || !pluginHandle.webrtcStuff) {
			Webrtc.warn("Invalid handle");
			callbacks.error("Invalid handle");
			return;
		}
		let message = callbacks.message;
		let jsep = callbacks.jsep;
		let transaction = Webrtc.randomString(12);
		let request = { "janus": "message", "body": message, "transaction": transaction };
		if(pluginHandle.token)
			request["token"] = pluginHandle.token;
		if(apisecret)
			request["apisecret"] = apisecret;
		if(jsep) {
			request.jsep = {
				type: jsep.type,
				sdp: jsep.sdp
			};
			if(jsep.e2ee)
				request.jsep.e2ee = true;
			if(jsep.rid_order === "hml" || jsep.rid_order === "lmh")
				request.jsep.rid_order = jsep.rid_order;
			if(jsep.force_relay)
				request.jsep.force_relay = true;
			// Check if there's SVC video streams to tell Janus about
			let svc = null;
			let config = pluginHandle.webrtcStuff;
			if(config.pc) {
				let transceivers = config.pc.getTransceivers();
				if(transceivers && transceivers.length > 0) {
					for(let mindex in transceivers) {
						let tr = transceivers[mindex];
						if(tr && tr.sender && tr.sender.track && tr.sender.track.kind === 'video') {
							let params = tr.sender.getParameters();
							if(params && params.encodings && params.encodings[0] &&
									params.encodings[0].scalabilityMode) {
								// This video stream uses SVC
								if(!svc)
									svc = [];
								svc.push({
									mindex: parseInt(mindex),
									mid: tr.mid,
									svc: params.encodings[0].scalabilityMode
								});
							}
						}
					}
				}
			}
			if(svc)
				request.jsep.svc = vsc;
		}
		Webrtc.debug("Sending message to plugin (handle=" + handleId + "):");
		Webrtc.debug(request);
		if(websockets) {
			request["session_id"] = sessionId;
			request["handle_id"] = handleId;
			transactions.set(transaction, function(json) {
				Webrtc.debug("Message sent!");
				Webrtc.debug(json);
				if(json["janus"] === "success") {
					// We got a success, must have been a synchronous transaction
					let plugindata = json["plugindata"];
					if(!plugindata) {
						Webrtc.warn("Request succeeded, but missing plugindata...");
						callbacks.success();
						return;
					}
					Webrtc.log("Synchronous transaction successful (" + plugindata["plugin"] + ")");
					let data = plugindata["data"];
					Webrtc.debug(data);
					callbacks.success(data);
					return;
				} else if(json["janus"] !== "ack") {
					// Not a success and not an ack, must be an error
					if(json["error"]) {
						Webrtc.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
						callbacks.error(json["error"].code + " " + json["error"].reason);
					} else {
						Webrtc.error("Unknown error");	// FIXME
						callbacks.error("Unknown error");
					}
					return;
				}
				// If we got here, the plugin decided to handle the request asynchronously
				callbacks.success();
			});
			ws.send(JSON.stringify(request));
			return;
		}
		Webrtc.httpAPICall(server + "/" + sessionId + "/" + handleId, {
			verb: 'POST',
			withCredentials: withCredentials,
			body: request,
			success: function(json) {
				Webrtc.debug("Message sent!");
				Webrtc.debug(json);
				if(json["janus"] === "success") {
					// We got a success, must have been a synchronous transaction
					let plugindata = json["plugindata"];
					if(!plugindata) {
						Webrtc.warn("Request succeeded, but missing plugindata...");
						callbacks.success();
						return;
					}
					Webrtc.log("Synchronous transaction successful (" + plugindata["plugin"] + ")");
					let data = plugindata["data"];
					Webrtc.debug(data);
					callbacks.success(data);
					return;
				} else if(json["janus"] !== "ack") {
					// Not a success and not an ack, must be an error
					if(json["error"]) {
						Webrtc.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
						callbacks.error(json["error"].code + " " + json["error"].reason);
					} else {
						Webrtc.error("Unknown error");	// FIXME
						callbacks.error("Unknown error");
					}
					return;
				}
				// If we got here, the plugin decided to handle the request asynchronously
				callbacks.success();
			},
			error: function(textStatus, errorThrown) {
				Webrtc.error(textStatus + ":", errorThrown);	// FIXME
				callbacks.error(textStatus + ": " + errorThrown);
			}
		});
	}

	// Private method to send a trickle candidate
	function sendTrickleCandidate(handleId, candidate) {
		if(!connected) {
			Webrtc.warn("Is the server down? (connected=false)");
			return;
		}
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle || !pluginHandle.webrtcStuff) {
			Webrtc.warn("Invalid handle");
			return;
		}
		let request = { "janus": "trickle", "candidate": candidate, "transaction": Webrtc.randomString(12) };
		if(pluginHandle.token)
			request["token"] = pluginHandle.token;
		if(apisecret)
			request["apisecret"] = apisecret;
		Webrtc.vdebug("Sending trickle candidate (handle=" + handleId + "):");
		Webrtc.vdebug(request);
		if(websockets) {
			request["session_id"] = sessionId;
			request["handle_id"] = handleId;
			ws.send(JSON.stringify(request));
			return;
		}
		Webrtc.httpAPICall(server + "/" + sessionId + "/" + handleId, {
			verb: 'POST',
			withCredentials: withCredentials,
			body: request,
			success: function(json) {
				Webrtc.vdebug("Candidate sent!");
				Webrtc.vdebug(json);
				if(json["janus"] !== "ack") {
					Webrtc.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
					return;
				}
			},
			error: function(textStatus, errorThrown) {
				Webrtc.error(textStatus + ":", errorThrown);	// FIXME
			}
		});
	}

	// Private method to create a data channel
	function createDataChannel(handleId, dclabel, dcprotocol, incoming, pendingData) {
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle || !pluginHandle.webrtcStuff) {
			Webrtc.warn("Invalid handle");
			return;
		}
		let config = pluginHandle.webrtcStuff;
		if(!config.pc) {
			Webrtc.warn("Invalid PeerConnection");
			return;
		}
		let onDataChannelMessage = function(event) {
			Webrtc.log('Received message on data channel:', event);
			let label = event.target.label;
			pluginHandle.ondata(event.data, label);
		};
		let onDataChannelStateChange = function(event) {
			Webrtc.log('Received state change on data channel:', event);
			let label = event.target.label;
			let protocol = event.target.protocol;
			let dcState = config.dataChannel[label] ? config.dataChannel[label].readyState : "null";
			Webrtc.log('State change on <' + label + '> data channel: ' + dcState);
			if(dcState === 'open') {
				// Any pending messages to send?
				if(config.dataChannel[label].pending && config.dataChannel[label].pending.length > 0) {
					Webrtc.log("Sending pending messages on <" + label + ">:", config.dataChannel[label].pending.length);
					for(let data of config.dataChannel[label].pending) {
						Webrtc.log("Sending data on data channel <" + label + ">");
						Webrtc.debug(data);
						config.dataChannel[label].send(data);
					}
					config.dataChannel[label].pending = [];
				}
				// Notify the open data channel
				pluginHandle.ondataopen(label, protocol);
			}
		};
		let onDataChannelError = function(error) {
			Webrtc.error('Got error on data channel:', error);
			// TODO
		};
		if(!incoming) {
			// FIXME Add options (ordered, maxRetransmits, etc.)
			let dcoptions = config.dataChannelOptions;
			if(dcprotocol)
				dcoptions.protocol = dcprotocol;
			config.dataChannel[dclabel] = config.pc.createDataChannel(dclabel, dcoptions);
		} else {
			// The channel was created by Janus
			config.dataChannel[dclabel] = incoming;
		}
		config.dataChannel[dclabel].onmessage = onDataChannelMessage;
		config.dataChannel[dclabel].onopen = onDataChannelStateChange;
		config.dataChannel[dclabel].onclose = onDataChannelStateChange;
		config.dataChannel[dclabel].onerror = onDataChannelError;
		config.dataChannel[dclabel].pending = [];
		if(pendingData)
			config.dataChannel[dclabel].pending.push(pendingData);
	}

	// Private method to send a data channel message
	function sendData(handleId, callbacks) {
		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Webrtc.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : Webrtc.noop;
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle || !pluginHandle.webrtcStuff) {
			Webrtc.warn("Invalid handle");
			callbacks.error("Invalid handle");
			return;
		}
		let config = pluginHandle.webrtcStuff;
		let data = callbacks.text || callbacks.data;
		if(!data) {
			Webrtc.warn("Invalid data");
			callbacks.error("Invalid data");
			return;
		}
		let label = callbacks.label ? callbacks.label : Webrtc.dataChanDefaultLabel;
		if(!config.dataChannel[label]) {
			// Create new data channel and wait for it to open
			createDataChannel(handleId, label, callbacks.protocol, false, data, callbacks.protocol);
			callbacks.success();
			return;
		}
		if(config.dataChannel[label].readyState !== "open") {
			config.dataChannel[label].pending.push(data);
			callbacks.success();
			return;
		}
		Webrtc.log("Sending data on data channel <" + label + ">");
		Webrtc.debug(data);
		config.dataChannel[label].send(data);
		callbacks.success();
	}

	// Private method to send a DTMF tone
	function sendDtmf(handleId, callbacks) {
		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Webrtc.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : Webrtc.noop;
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle || !pluginHandle.webrtcStuff) {
			Webrtc.warn("Invalid handle");
			callbacks.error("Invalid handle");
			return;
		}
		let config = pluginHandle.webrtcStuff;
		if(!config.dtmfSender) {
			// Create the DTMF sender the proper way, if possible
			if(config.pc) {
				let senders = config.pc.getSenders();
				let audioSender = senders.find(function(sender) {
					return sender.track && sender.track.kind === 'audio';
				});
				if(!audioSender) {
					Webrtc.warn("Invalid DTMF configuration (no audio track)");
					callbacks.error("Invalid DTMF configuration (no audio track)");
					return;
				}
				config.dtmfSender = audioSender.dtmf;
				if(config.dtmfSender) {
					Webrtc.log("Created DTMF Sender");
					config.dtmfSender.ontonechange = function(tone) { Webrtc.debug("Sent DTMF tone: " + tone.tone); };
				}
			}
			if(!config.dtmfSender) {
				Webrtc.warn("Invalid DTMF configuration");
				callbacks.error("Invalid DTMF configuration");
				return;
			}
		}
		let dtmf = callbacks.dtmf;
		if(!dtmf) {
			Webrtc.warn("Invalid DTMF parameters");
			callbacks.error("Invalid DTMF parameters");
			return;
		}
		let tones = dtmf.tones;
		if(!tones) {
			Webrtc.warn("Invalid DTMF string");
			callbacks.error("Invalid DTMF string");
			return;
		}
		let duration = (typeof dtmf.duration === 'number') ? dtmf.duration : 500; // We choose 500ms as the default duration for a tone
		let gap = (typeof dtmf.gap === 'number') ? dtmf.gap : 50; // We choose 50ms as the default gap between tones
		Webrtc.debug("Sending DTMF string " + tones + " (duration " + duration + "ms, gap " + gap + "ms)");
		config.dtmfSender.insertDTMF(tones, duration, gap);
		callbacks.success();
	}

	// Private method to destroy a plugin handle
	function destroyHandle(handleId, callbacks) {
		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Webrtc.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : Webrtc.noop;
		let noRequest = (callbacks.noRequest === true);
		Webrtc.log("Destroying handle " + handleId + " (only-locally=" + noRequest + ")");
		cleanupWebrtc(handleId);
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle || pluginHandle.detached) {
			// Plugin was already detached by Janus, calling detach again will return a handle not found error, so just exit here
			pluginHandles.delete(handleId);
			callbacks.success();
			return;
		}
		pluginHandle.detached = true;
		if(noRequest) {
			// We're only removing the handle locally
			pluginHandles.delete(handleId);
			callbacks.success();
			return;
		}
		if(!connected) {
			Webrtc.warn("Is the server down? (connected=false)");
			callbacks.error("Is the server down? (connected=false)");
			return;
		}
		let request = { "janus": "detach", "transaction": Webrtc.randomString(12) };
		if(pluginHandle.token)
			request["token"] = pluginHandle.token;
		if(apisecret)
			request["apisecret"] = apisecret;
		if(websockets) {
			request["session_id"] = sessionId;
			request["handle_id"] = handleId;
			ws.send(JSON.stringify(request));
			pluginHandles.delete(handleId);
			callbacks.success();
			return;
		}
		Webrtc.httpAPICall(server + "/" + sessionId + "/" + handleId, {
			verb: 'POST',
			withCredentials: withCredentials,
			body: request,
			success: function(json) {
				Webrtc.log("Destroyed handle:");
				Webrtc.debug(json);
				if(json["janus"] !== "success") {
					Webrtc.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
				}
				pluginHandles.delete(handleId);
				callbacks.success();
			},
			error: function(textStatus, errorThrown) {
				Webrtc.error(textStatus + ":", errorThrown);	// FIXME
				// We cleanup anyway
				pluginHandles.delete(handleId);
				callbacks.success();
			}
		});
	}

	// WebRTC stuff
	// Helper function to create a new PeerConnection, if we need one
	function createPeerconnectionIfNeeded(handleId, callbacks) {
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle || !pluginHandle.webrtcStuff) {
			Webrtc.warn("Invalid handle");
			throw "Invalid handle";
		}
		let config = pluginHandle.webrtcStuff;
		if(config.pc) {
			// Nothing to do, we have a PeerConnection already
			return;
		}
		let pc_config = {
			iceServers: iceServers,
			iceTransportPolicy: iceTransportPolicy,
			bundlePolicy: bundlePolicy
		};
		pc_config.sdpSemantics = 'unified-plan';
		// Check if a sender or receiver transform has been provided
		let insertableStreams = false;
		if(callbacks.tracks) {
			for(let track of callbacks.tracks) {
				if(track.transforms && (track.transforms.sender || track.transforms.receiver)) {
					insertableStreams = true;
					break;
				}
			}
		}
		if(callbacks.externalEncryption) {
			insertableStreams = true;
			config.externalEncryption = true;
		}
		if(RTCRtpSender && (RTCRtpSender.prototype.createEncodedStreams ||
				(RTCRtpSender.prototype.createEncodedAudioStreams &&
				RTCRtpSender.prototype.createEncodedVideoStreams)) && insertableStreams) {
			config.insertableStreams = true;
			pc_config.forceEncodedAudioInsertableStreams = true;
			pc_config.forceEncodedVideoInsertableStreams = true;
			pc_config.encodedInsertableStreams = true;
		}
		Webrtc.log('Creating PeerConnection');
		config.pc = new RTCPeerConnection(pc_config);
		Webrtc.debug(config.pc);
		if(config.pc.getStats) {	// FIXME
			config.volume = {};
			config.bitrate.value = '0 kbits/sec';
		}
		Webrtc.log('Preparing local SDP and gathering candidates (trickle=' + config.trickle + ')');
		config.pc.oniceconnectionstatechange = function() {
			if(config.pc)
				pluginHandle.iceState(config.pc.iceConnectionState);
		};
		config.pc.onicecandidate = function(event) {
			if(!event.candidate || (event.candidate.candidate && event.candidate.candidate.indexOf('endOfCandidates') > 0)) {
				Webrtc.log('End of candidates.');
				config.iceDone = true;
				if(config.trickle === true) {
					// Notify end of candidates
					sendTrickleCandidate(handleId, { completed : true });
				} else {
					// No trickle, time to send the complete SDP (including all candidates)
					sendSDP(handleId, callbacks);
				}
			} else {
				// JSON.stringify doesn't work on some WebRTC objects anymore
				// See https://code.google.com/p/chromium/issues/detail?id=467366
				let candidate = {
					candidate: event.candidate.candidate,
					sdpMid: event.candidate.sdpMid,
					sdpMLineIndex: event.candidate.sdpMLineIndex
				};
				if(config.trickle === true) {
					// Send candidate
					sendTrickleCandidate(handleId, candidate);
				}
			}
		};
		config.pc.ontrack = function(event) {
			Webrtc.log('Handling Remote Track', event);
			if(!event.streams)
				return;
			if(!event.track)
				return;
			// Notify about the new track event
			let mid = event.transceiver ? event.transceiver.mid : event.track.id;
			try {
				pluginHandle.onremotetrack(event.track, mid, true, { reason: 'created' });
			} catch(e) {
				Webrtc.error("Error calling onremotetrack", e);
			}
			if(event.track.onended)
				return;
			let trackMutedTimeoutId = null;
			Webrtc.log('Adding onended callback to track:', event.track);
			event.track.onended = function(ev) {
				Webrtc.log('Remote track removed:', ev);
				clearTimeout(trackMutedTimeoutId);
				// Notify the application
				let transceivers = config.pc ? config.pc.getTransceivers() : null;
				let transceiver = transceivers ? transceivers.find(
					t => t.receiver.track === ev.target) : null;
				let mid = transceiver ? transceiver.mid : ev.target.id;
				try {
					pluginHandle.onremotetrack(ev.target, mid, false, { reason: 'ended' });
				} catch(e) {
					Webrtc.error("Error calling onremotetrack on removal", e);
				}
			};
			event.track.onmute = function(ev) {
				Webrtc.log('Remote track muted:', ev);
				if(!trackMutedTimeoutId) {
					trackMutedTimeoutId = setTimeout(function() {
						Webrtc.log('Removing remote track');
						// Notify the application the track is gone
						let transceivers = config.pc ? config.pc.getTransceivers() : null;
						let transceiver = transceivers ? transceivers.find(
							t => t.receiver.track === ev.target) : null;
						let mid = transceiver ? transceiver.mid : ev.target.id;
						try {
							pluginHandle.onremotetrack(ev.target, mid, false, { reason: 'mute' } );
						} catch(e) {
							Webrtc.error("Error calling onremotetrack on mute", e);
						}
						trackMutedTimeoutId = null;
					// Chrome seems to raise mute events only at multiples of 834ms;
					// we set the timeout to three times this value (rounded to 840ms)
					}, 3 * 840);
				}
			};
			event.track.onunmute = function(ev) {
				Webrtc.log('Remote track flowing again:', ev);
				if(trackMutedTimeoutId != null) {
					clearTimeout(trackMutedTimeoutId);
					trackMutedTimeoutId = null;
				} else {
					try {
						// Notify the application the track is back
						let transceivers = config.pc ? config.pc.getTransceivers() : null;
						let transceiver = transceivers ? transceivers.find(
							t => t.receiver.track === ev.target) : null;
						let mid = transceiver ? transceiver.mid : ev.target.id;
						pluginHandle.onremotetrack(ev.target, mid, true, { reason: 'unmute' });
					} catch(e) {
						Webrtc.error("Error calling onremotetrack on unmute", e);
					}
				}
			};
		};
	}

	// Helper function used when creating either an offer or answer: it
	// prepares what needs to be prepared, including creating a new
	// PeerConnection (if needed) and updating the tracks configuration,
	// before invoking the function to actually generate the offer/answer
	async function prepareWebrtc(handleId, offer, callbacks) {

		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Webrtc.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : webrtcError;
		let jsep = callbacks.jsep;
		if(offer && jsep) {
			Webrtc.error("Provided a JSEP to a createOffer");
			callbacks.error("Provided a JSEP to a createOffer");
			return;
		} else if(!offer && (!jsep || !jsep.type || !jsep.sdp)) {
			Webrtc.error("A valid JSEP is required for createAnswer");
			callbacks.error("A valid JSEP is required for createAnswer");
			return;
		}
		// If the deprecated media was provided instead of tracks, translate it
		if(callbacks.media && !callbacks.tracks) {
			callbacks.tracks = Webrtc.mediaToTracks(callbacks.media);
			if(callbacks.simulcast === true || callbacks.simulcast2 === true || callbacks.svc) {
				// Find the video track and add simulcast/SVC info there
				for(let track of callbacks.tracks) {
					if(track.type === 'video') {
						if(callbacks.simulcast === true || callbacks.simulcast2 === true)
							track.simulcast = true;
						else if(callbacks.svc)
							track.svc = callbacks.svc;
						break;
					}
				}
			}
			Webrtc.warn('Deprecated media object passed, use tracks instead. Automatically translated to:', callbacks.tracks);
		}
		// Check that callbacks.array is a valid array
		if(callbacks.tracks && !Array.isArray(callbacks.tracks)) {
			Webrtc.error("Tracks must be an array");
			callbacks.error("Tracks must be an array");
			return;
		}
		// Get the plugin handle
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle || !pluginHandle.webrtcStuff) {
			Webrtc.warn("Invalid handle");
			callbacks.error("Invalid handle");
			return;
		}
		let config = pluginHandle.webrtcStuff;
		config.trickle = isTrickleEnabled(callbacks.trickle);
		try {

			// Create a PeerConnection, if needed
			createPeerconnectionIfNeeded(handleId, callbacks);
			if(offer) {
				// Capture devices and setup tracks, if needed
				await captureDevices(handleId, callbacks);
			}
			// Create offer or answer now (depending on the context)
			if(!jsep) {
				let offer = await createOffer(handleId, callbacks);
				callbacks.success(offer);
			} else {
				await config.pc.setRemoteDescription(jsep);
				Webrtc.log("Remote description accepted!");
				config.remoteSdp = jsep.sdp;
				// Any trickle candidate we cached?
				if(config.candidates && config.candidates.length > 0) {
					for(let i=0; i<config.candidates.length; i++) {
						let candidate = config.candidates[i];
						Webrtc.debug("Adding remote candidate:", candidate);
						if(!candidate || candidate.completed === true) {
							// end-of-candidates
							config.pc.addIceCandidate(Webrtc.endOfCandidates);
						} else {
							// New candidate
							config.pc.addIceCandidate(candidate);
						}
					}
					config.candidates = [];
				}
				// Capture devices and setup tracks, if needed
				await captureDevices(handleId, callbacks);
				// Create the answer now
				let answer = await createAnswer(handleId, callbacks);
				callbacks.success(answer);
			}
		} catch(err) {
			Webrtc.error(err);
			callbacks.error(err);
		}
	}

	function prepareWebrtcPeer(handleId, callbacks) {
		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Webrtc.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : webrtcError;
		callbacks.customizeSdp = (typeof callbacks.customizeSdp == "function") ? callbacks.customizeSdp : Webrtc.noop;
		let jsep = callbacks.jsep;
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle || !pluginHandle.webrtcStuff) {
			Webrtc.warn("Invalid handle");
			callbacks.error("Invalid handle");
			return;
		}
		let config = pluginHandle.webrtcStuff;
		if(jsep) {
			if(!config.pc) {
				Webrtc.warn("Wait, no PeerConnection?? if this is an answer, use createAnswer and not handleRemoteJsep");
				callbacks.error("No PeerConnection: if this is an answer, use createAnswer and not handleRemoteJsep");
				return;
			}
			callbacks.customizeSdp(jsep);
			config.pc.setRemoteDescription(jsep)
				.then(function() {
					Webrtc.log("Remote description accepted!");
					config.remoteSdp = jsep.sdp;
					// Any trickle candidate we cached?
					if(config.candidates && config.candidates.length > 0) {
						for(let i=0; i<config.candidates.length; i++) {
							let candidate = config.candidates[i];
							Webrtc.debug("Adding remote candidate:", candidate);
							if(!candidate || candidate.completed === true) {
								// end-of-candidates
								config.pc.addIceCandidate(Webrtc.endOfCandidates);
							} else {
								// New candidate
								config.pc.addIceCandidate(candidate);
							}
						}
						config.candidates = [];
					}
					// Done
					callbacks.success();
				}, callbacks.error);
		} else {
			callbacks.error("Invalid JSEP");
		}
	}

	async function createOffer(handleId, callbacks) {
		callbacks = callbacks || {};
		callbacks.customizeSdp = (typeof callbacks.customizeSdp == "function") ? callbacks.customizeSdp : Webrtc.noop;
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle || !pluginHandle.webrtcStuff) {
			Webrtc.warn("Invalid handle");
			throw "Invalid handle";
		}
		let config = pluginHandle.webrtcStuff;
		Webrtc.log("Creating offer (iceDone=" + config.iceDone + ")");
		// https://code.google.com/p/webrtc/issues/detail?id=3508
		let mediaConstraints = {};
		let iceRestart = (callbacks.iceRestart === true);
		// If we need an ICE restart, set the related constraint
		if(iceRestart)
			mediaConstraints.iceRestart = true;
		Webrtc.debug(mediaConstraints);
		let offer = await config.pc.createOffer(mediaConstraints);
		Webrtc.debug(offer);
		// JSON.stringify doesn't work on some WebRTC objects anymore
		// See https://code.google.com/p/chromium/issues/detail?id=467366
		let jsep = {
			type: 'offer',
			sdp: offer.sdp
		};
		callbacks.customizeSdp(jsep);
		offer.sdp = jsep.sdp;
		Webrtc.log("Setting local description");
		config.mySdp = {
			type: 'offer',
			sdp: offer.sdp
		};
		await config.pc.setLocalDescription(offer);
		config.mediaConstraints = mediaConstraints;
		if(!config.iceDone && !config.trickle) {
			// FIXME Don't do anything until we have all candidates
			Webrtc.log("Waiting for all candidates...");
			return null;
		}
		// If transforms are present, notify Janus that the media is end-to-end encrypted
		if(config.insertableStreams || config.externalEncryption)
			offer.e2ee = true;
		return offer;
	}

	async function createAnswer(handleId, callbacks) {
		callbacks = callbacks || {};
		callbacks.customizeSdp = (typeof callbacks.customizeSdp == "function") ? callbacks.customizeSdp : Webrtc.noop;
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle || !pluginHandle.webrtcStuff) {
			Webrtc.warn("Invalid handle");
			throw "Invalid handle";
		}
		let config = pluginHandle.webrtcStuff;
		Webrtc.log("Creating answer (iceDone=" + config.iceDone + ")");
		let answer = await config.pc.createAnswer();
		Webrtc.debug(answer);
		// JSON.stringify doesn't work on some WebRTC objects anymore
		// See https://code.google.com/p/chromium/issues/detail?id=467366
		let jsep = {
			type: 'answer',
			sdp: answer.sdp
		};
		callbacks.customizeSdp(jsep);
		answer.sdp = jsep.sdp;
		Webrtc.log("Setting local description");
		config.mySdp = {
			type: 'answer',
			sdp: answer.sdp
		};
		await config.pc.setLocalDescription(answer);
		if(!config.iceDone && !config.trickle) {
			// FIXME Don't do anything until we have all candidates
			Webrtc.log("Waiting for all candidates...");
			return null;
		}
		// If transforms are present, notify Janus that the media is end-to-end encrypted
		if(config.insertableStreams || config.externalEncryption)
			answer.e2ee = true;
		return answer;
	}

	function sendSDP(handleId, callbacks) {
		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Webrtc.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : Webrtc.noop;
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle || !pluginHandle.webrtcStuff) {
			Webrtc.warn("Invalid handle, not sending anything");
			return;
		}
		let config = pluginHandle.webrtcStuff;
		Webrtc.log("Sending offer/answer SDP...");
		if(!config.mySdp) {
			Webrtc.warn("Local SDP instance is invalid, not sending anything...");
			return;
		}
		config.mySdp = {
			type: config.pc.localDescription.type,
			sdp: config.pc.localDescription.sdp
		};
		if(config.trickle === false)
			config.mySdp["trickle"] = false;
		Webrtc.debug(callbacks);
		config.sdpSent = true;
		callbacks.success(config.mySdp);
	}

	async function replaceTracks(handleId, callbacks) {
		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == 'function') ? callbacks.success : Webrtc.noop;
		callbacks.error = (typeof callbacks.error == 'function') ? callbacks.error : Webrtc.noop;
		// Check that callbacks.array is a valid array
		if(callbacks.tracks && !Array.isArray(callbacks.tracks)) {
			Webrtc.error('Tracks must be an array');
			callbacks.error('Tracks must be an array');
			return;
		}
		// Add the replace:true if it's missing
		for(let track of callbacks.tracks) {
			if(track.add || (!track.replace && !track.remove))
				track.replace = true;
		}
		try {
			await captureDevices(handleId, callbacks);
			callbacks.success();
		} catch(err) {
			Webrtc.error(err);
			callbacks.error(err);
		}
	}

	async function captureDevices(handleId, callbacks) {
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle || !pluginHandle.webrtcStuff) {
			Webrtc.warn('Invalid handle, not sending anything');
			throw 'Invalid handle';
		}
		let config = pluginHandle.webrtcStuff;
		if(!config.pc) {
			Webrtc.warn('Invalid PeerConnection');
			throw 'Invalid PeerConnection';
		}
		let tracks = callbacks.tracks;
		if(!tracks || !Array.isArray(tracks) || tracks.length === 0) {
			// Nothing to do
			return;
		}
		let openedConsentDialog = false;
		// Check if we can/should group getUserMedia calls
		let groups = {};
		for(let track of tracks) {
			delete track.gumGroup;
			if(!track.type || !['audio', 'video'].includes(track.type))
				continue;
			if(!track.capture || track.capture instanceof MediaStreamTrack)
				continue;
			let group = track.group ? track.group : 'default';
			if(!groups[group])
				groups[group] = {};
			if(groups[group][track.type])
				continue;
			track.gumGroup = group;
			groups[group][track.type] = track;
		}
		let keys = Object.keys(groups);
		for(let key of keys) {
			let group = groups[key];
			if(!group.audio || !group.video) {
				if(group.audio)
					delete group.audio.gumGroup;
				if(group.video)
					delete group.video.gumGroup;
				delete groups[key];
			}
		}
		let answer = (callbacks.jsep ? true : false);
		for(let track of tracks) {
			if(!track.type) {
				Webrtc.warn('Missing track type:', track);
				continue;
			}
			if(track.type === 'data') {
				// Easy enough: create a datachannel if we don't have one already
				if(config.pc.ondatachannel) {
					Webrtc.warn('Data channel exists already, not creating another one');
					continue;
				}
				Webrtc.log('Creating default data channel');
				createDataChannel(handleId, Webrtc.dataChanDefaultLabel, null, false);
				config.pc.ondatachannel = function(event) {
					Webrtc.log('Data channel created by Janus:', event);
					createDataChannel(handleId, event.channel.label, event.channel.protocol, event.channel);
				};
				continue;
			}
			if((typeof track.add === 'undefined' || track.add === null) &&
					(typeof track.remove === 'undefined' || track.remove === null) &&
					(typeof track.replace === 'undefined' || track.replace === null)) {
				// Let's default to 'add'
				track.add = true;
			}
			if((track.add && track.remove) || (track.add && track.remove && track.replace)) {
				Webrtc.warn('Conflicting actions for track, ignoring:', track);
				continue;
			}
			if(track.add && track.replace) {
				Webrtc.warn('Both add and replace provided, falling back to replace:', track);
				delete track.add;
			} else if(track.remove && track.replace) {
				Webrtc.warn('Both remove and replace provided, falling back to remove:', track);
				delete track.replace;
			}
			let kind = track.type;
			if(track.type === 'screen')
				kind = 'video';	// FIXME
			let transceiver = null, sender = null;
			if(track.mid) {
				// Search by mid
				transceiver = config.pc.getTransceivers()
					.find(t => (t.mid === track.mid && t.receiver.track.kind === kind));
			} else {
				// Find the first track of this type
				transceiver = config.pc.getTransceivers()
					.find(t => (t.receiver.track.kind === kind));
			}
			if(track.replace || track.remove) {
				if(!transceiver) {
					Webrtc.warn("Couldn't find a transceiver for track:", track);
					continue;
				}
				if(!transceiver.sender) {
					Webrtc.warn('No sender in the transceiver for track:', track);
					continue;
				}
				sender = transceiver.sender;
			}
			if(answer && !transceiver) {
				transceiver = config.pc.getTransceivers()
					.find(t => (t.receiver.track.kind === kind));
				if(!transceiver) {
					Webrtc.warn("Couldn't find a transceiver for track:", track);
					continue;
				}
			}
			// Capture the new track, if we need to
			let nt = null, trackId = null;
			if(track.remove || track.replace) {
				Webrtc.log('Removing track from PeerConnection', track);
				trackId = sender.track ? sender.track.id : null;
				await sender.replaceTrack(null);
				// Get rid of the old track
				if(trackId && config.myStream) {
					let rt = null;
					if(kind === 'audio' && config.myStream.getAudioTracks() && config.myStream.getAudioTracks().length) {
						for(let t of config.myStream.getAudioTracks()) {
							if(t.id === trackId) {
								rt = t;
								Webrtc.log('Removing audio track:', rt);
							}
						}
					} else if(kind === 'video' && config.myStream.getVideoTracks() && config.myStream.getVideoTracks().length) {
						for(let t of config.myStream.getVideoTracks()) {
							if(t.id === trackId) {
								rt = t;
								Webrtc.log('Removing video track:', rt);
							}
						}
					}
					if(rt) {
						// Remove the track and notify the application
						try {
							config.myStream.removeTrack(rt);
							pluginHandle.onlocaltrack(rt, false);
						} catch(e) {
							Webrtc.error("Error calling onlocaltrack on removal for renegotiation", e);
						}
						// Close the old track (unless we've been asked not to)
						if(rt.dontStop !== true) {
							try {
								rt.stop();
							} catch(e) {}
						}
					}
				}
			}
			if(track.capture) {
				if(track.gumGroup && groups[track.gumGroup] && groups[track.gumGroup].stream) {
					// We did a getUserMedia before already
					let stream = groups[track.gumGroup].stream;
					nt = (track.type === 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0]);
					delete groups[track.gumGroup].stream;
					delete groups[track.gumGroup];
					delete track.gumGroup;
				} else if(track.capture instanceof MediaStreamTrack) {
					// An external track was provided, use that
					nt = track.capture;
				} else {
					if(!openedConsentDialog) {
						openedConsentDialog = true;
						pluginHandle.consentDialog(true);
					}
					let constraints = Webrtc.trackConstraints(track), stream = null;
					if(track.type === 'audio' || track.type === 'video') {
						// Use getUserMedia: check if we need to group audio and video together
						if(track.gumGroup) {
							let otherType = (track.type === 'audio' ? 'video' : 'audio');
							if(groups[track.gumGroup] && groups[track.gumGroup][otherType]) {
								let otherTrack = groups[track.gumGroup][otherType];
								let otherConstraints = Webrtc.trackConstraints(otherTrack);
								constraints[otherType] = otherConstraints[otherType];
							}
						}
						stream = await navigator.mediaDevices.getUserMedia(constraints);
						if(track.gumGroup && constraints.audio && constraints.video) {
							// We just performed a grouped getUserMedia, keep track of the
							// stream so that we can immediately assign the track later
							groups[track.gumGroup].stream = stream;
							delete track.gumGroup;
						}
					} else {
						// Use getDisplayMedia
						stream = await navigator.mediaDevices.getDisplayMedia(constraints);
					}
					nt = (track.type === 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0]);
				}
				if(track.replace) {
					// Replace the track
					await sender.replaceTrack(nt);
					// Update the transceiver direction
					let newDirection = 'sendrecv';
					if(track.recv === false || transceiver.direction === 'inactive' || transceiver.direction === 'sendonly')
						newDirection = 'sendonly';
					if(transceiver.setDirection)
						transceiver.setDirection(newDirection);
					else
						transceiver.direction = newDirection;
				} else {
					// FIXME Add as a new track
					if(!config.myStream)
						config.myStream = new MediaStream();
					if(kind === 'audio' || (!track.simulcast && !track.svc)) {
						sender = config.pc.addTrack(nt, config.myStream);
						transceiver = config.pc.getTransceivers()
							.find(t => (t.sender === sender));
					} else if(track.simulcast) {
						if(Webrtc.webRTCAdapter.browserDetails.browser !== 'firefox') {
							// Standard RID
							Webrtc.log('Enabling rid-based simulcasting:', nt);
							let maxBitrates = getMaxBitrates(track.simulcastMaxBitrates);
							transceiver = config.pc.addTransceiver(nt, {
								direction: 'sendrecv',
								streams: [config.myStream],
								sendEncodings: track.sendEncodings || [
									{ rid: 'h', active: true, scalabilityMode: 'L1T2', maxBitrate: maxBitrates.high },
									{ rid: 'm', active: true, scalabilityMode: 'L1T2', maxBitrate: maxBitrates.medium, scaleResolutionDownBy: 2 },
									{ rid: 'l', active: true, scalabilityMode: 'L1T2', maxBitrate: maxBitrates.low, scaleResolutionDownBy: 4 }
								]
							});
						} else {
							// Firefox-based RID, based on https://gist.github.com/voluntas/088bc3cc62094730647b
							Webrtc.log('Enabling Simulcasting for Firefox (RID)');
							transceiver = config.pc.addTransceiver(nt, {
								direction: 'sendrecv',
								streams: [config.myStream]
							});
							sender = transceiver ? transceiver.sender : null;
							if(sender) {
								let parameters = sender.getParameters();
								if(!parameters)
									parameters = {};
								let maxBitrates = getMaxBitrates(track.simulcastMaxBitrates);
								parameters.encodings = track.sendEncodings || [
									{ rid: 'h', active: true, maxBitrate: maxBitrates.high },
									{ rid: 'm', active: true, maxBitrate: maxBitrates.medium, scaleResolutionDownBy: 2 },
									{ rid: 'l', active: true, maxBitrate: maxBitrates.low, scaleResolutionDownBy: 4 }
								];
								sender.setParameters(parameters);
							}
						}
					} else {
						Webrtc.log('Enabling SVC (' + track.svc + '):', nt);
						transceiver = config.pc.addTransceiver(nt, {
							direction: 'sendrecv',
							streams: [config.myStream],
							sendEncodings: [
								{ scalabilityMode: track.svc }
							]
						});
					}
					if(!sender)
						sender = transceiver ? transceiver.sender : null;
					// Check if we need to override some settings
					if(track.codec) {
						if(Webrtc.webRTCAdapter.browserDetails.browser === 'firefox') {
							Webrtc.warn('setCodecPreferences not supported in Firefox, ignoring codec for track:', track);
						} else if(typeof track.codec !== 'string') {
							Webrtc.warn('Invalid codec value, ignoring for track:', track);
						} else {
							let mimeType = kind + '/' + track.codec.toLowerCase();
							let codecs = RTCRtpReceiver.getCapabilities(kind).codecs.filter(function(codec) {
								return codec.mimeType.toLowerCase() === mimeType;
							});
							if(!codecs || codecs.length === 0) {
								Webrtc.warn('Codec not supported in this browser for this track, ignoring:', track);
							} else if(transceiver) {
								try {
									transceiver.setCodecPreferences(codecs);
								} catch(err) {
									Webrtc.warn('Failed enforcing codec for this ' + kind + ' track:', err);
								}
							}
						}
					}
					if(track.bitrate) {
						// Override maximum bitrate
						if(track.simulcast || track.svc) {
							Webrtc.warn('Ignoring bitrate for simulcast/SVC track, use sendEncodings for that');
						} else if(isNaN(track.bitrate) || track.bitrate < 0) {
							Webrtc.warn('Ignoring invalid bitrate for track:', track);
						} else if(sender) {
							let params = sender.getParameters();
							if(!params || !params.encodings || params.encodings.length === 0) {
								Webrtc.warn('No encodings in the sender parameters, ignoring bitrate for track:', track);
							} else {
								params.encodings[0].maxBitrate = track.bitrate;
								await sender.setParameters(params);
							}
						}
					}
					if(kind === 'video' && track.framerate) {
						// Override maximum framerate
						if(track.simulcast || track.svc) {
							Webrtc.warn('Ignoring framerate for simulcast/SVC track, use sendEncodings for that');
						} else if(isNaN(track.framerate) || track.framerate < 0) {
							Webrtc.warn('Ignoring invalid framerate for track:', track);
						} else if(sender) {
							let params = sender.getParameters();
							if(!params || !params.encodings || params.encodings.length === 0) {
								Webrtc.warn('No encodings in the sender parameters, ignoring framerate for track:', track);
							} else {
								params.encodings[0].maxFramerate = track.framerate;
								await sender.setParameters(params);
							}
						}
					}
					// Check if insertable streams are involved
					if(track.transforms) {
						if(sender && track.transforms.sender) {
							// There's a sender transform, set it on the transceiver sender
							let senderStreams = null;
							if(RTCRtpSender.prototype.createEncodedStreams) {
								senderStreams = sender.createEncodedStreams();
							} else if(RTCRtpSender.prototype.createAudioEncodedStreams || RTCRtpSender.prototype.createEncodedVideoStreams) {
								if(kind === 'audio') {
									senderStreams = sender.createEncodedAudioStreams();
								} else if(kind === 'video') {
									senderStreams = sender.createEncodedVideoStreams();
								}
							}
							if(senderStreams) {
								console.log('Insertable Streams sender transform:', senderStreams);
								if(senderStreams.readableStream && senderStreams.writableStream) {
									senderStreams.readableStream
										.pipeThrough(track.transforms.sender)
										.pipeTo(senderStreams.writableStream);
								} else if(senderStreams.readable && senderStreams.writable) {
									senderStreams.readable
										.pipeThrough(track.transforms.sender)
										.pipeTo(senderStreams.writable);
								}
							}
						}
						if(transceiver && transceiver.receiver && track.transforms.receiver) {
							// There's a receiver transform, set it on the transceiver receiver
							let receiverStreams = null;
							if(RTCRtpReceiver.prototype.createEncodedStreams) {
								receiverStreams = transceiver.receiver.createEncodedStreams();
							} else if(RTCRtpReceiver.prototype.createAudioEncodedStreams || RTCRtpReceiver.prototype.createEncodedVideoStreams) {
								if(kind === 'audio') {
									receiverStreams = transceiver.receiver.createEncodedAudioStreams();
								} else if(kind === 'video') {
									receiverStreams = transceiver.receiver.createEncodedVideoStreams();
								}
							}
							if(receiverStreams) {
								console.log('Insertable Streams receiver transform:', receiverStreams);
								if(receiverStreams.readableStream && receiverStreams.writableStream) {
									receiverStreams.readableStream
										.pipeThrough(track.transforms.receiver)
										.pipeTo(receiverStreams.writableStream);
								} else if(receiverStreams.readable && receiverStreams.writable) {
									receiverStreams.readable
										.pipeThrough(track.transforms.receiver)
										.pipeTo(receiverStreams.writable);
								}
							}
						}
					}
				}
				if(nt && track.dontStop === true)
					nt.dontStop = true;
			} else if(track.recv) {
				// Maybe a new recvonly track
				if(!transceiver)
					transceiver = config.pc.addTransceiver(kind);
				if(transceiver) {
					// Check if we need to override some settings
					if(track.codec) {
						if(Webrtc.webRTCAdapter.browserDetails.browser === 'firefox') {
							Webrtc.warn('setCodecPreferences not supported in Firefox, ignoring codec for track:', track);
						} else if(typeof track.codec !== 'string') {
							Webrtc.warn('Invalid codec value, ignoring for track:', track);
						} else {
							let mimeType = kind + '/' + track.codec.toLowerCase();
							let codecs = RTCRtpReceiver.getCapabilities(kind).codecs.filter(function(codec) {
								return codec.mimeType.toLowerCase() === mimeType;
							});
							if(!codecs || codecs.length === 0) {
								Webrtc.warn('Codec not supported in this browser for this track, ignoring:', track);
							} else {
								try {
									transceiver.setCodecPreferences(codecs);
								} catch(err) {
									Webrtc.warn('Failed enforcing codec for this ' + kind + ' track:', err);
								}
							}
						}
					}
					// Check if insertable streams are involved
					if(transceiver.receiver && track.transforms && track.transforms.receiver) {
						// There's a receiver transform, set it on the transceiver receiver
						let receiverStreams = null;
						if(RTCRtpReceiver.prototype.createEncodedStreams) {
							receiverStreams = transceiver.receiver.createEncodedStreams();
						} else if(RTCRtpReceiver.prototype.createAudioEncodedStreams || RTCRtpReceiver.prototype.createEncodedVideoStreams) {
							if(kind === 'audio') {
								receiverStreams = transceiver.receiver.createEncodedAudioStreams();
							} else if(kind === 'video') {
								receiverStreams = transceiver.receiver.createEncodedVideoStreams();
							}
						}
						if(receiverStreams) {
							console.log('Insertable Streams receiver transform:', receiverStreams);
							if(receiverStreams.readableStream && receiverStreams.writableStream) {
								receiverStreams.readableStream
									.pipeThrough(track.transforms.receiver)
									.pipeTo(receiverStreams.writableStream);
							} else if(receiverStreams.readable && receiverStreams.writable) {
								receiverStreams.readable
									.pipeThrough(track.transforms.receiver)
									.pipeTo(receiverStreams.writable);
							}
						}
					}
				}
			}
			if(nt) {
				// FIXME Add the new track locally
				config.myStream.addTrack(nt);
				// Notify the application about the new local track, if any
				nt.onended = function(ev) {
					Webrtc.log('Local track removed:', ev);
					try {
						pluginHandle.onlocaltrack(ev.target, false);
					} catch(e) {
						Webrtc.error("Error calling onlocaltrack following end", e);
					}
				}
				try {
					pluginHandle.onlocaltrack(nt, true);
				} catch(e) {
					Webrtc.error("Error calling onlocaltrack for track add", e);
				}
			}
			// Update the direction of the transceiver
			if(transceiver) {
				let curdir = transceiver.direction, newdir = null;
				let send = (nt && transceiver.sender.track),
					recv = (track.recv !== false && transceiver.receiver.track);
				if(send && recv)
					newdir = 'sendrecv';
				else if(send && !recv)
					newdir = 'sendonly';
				else if(!send && recv)
					newdir = 'recvonly';
				else if(!send && !recv)
					newdir = 'inactive';
				if(newdir && newdir !== curdir) {
					Webrtc.warn('Changing direction of transceiver to ' + newdir + ' (was ' + curdir + ')', track);
					if(transceiver.setDirection)
						transceiver.setDirection(newdir);
					else
						transceiver.direction = newdir;
				}
			}
		}
		if(openedConsentDialog)
			pluginHandle.consentDialog(false);
	}

	function getLocalTracks(handleId) {
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle || !pluginHandle.webrtcStuff) {
			Webrtc.warn('Invalid handle');
			return null;
		}
		let config = pluginHandle.webrtcStuff;
		if(!config.pc) {
			Webrtc.warn('Invalid PeerConnection');
			return null;
		}
		let tracks = [];
		let transceivers = config.pc.getTransceivers();
		for(let tr of transceivers) {
			let track = null;
			if(tr.sender && tr.sender.track) {
				track = { mid: tr.mid };
				track.type = tr.sender.track.kind;
				track.id = tr.sender.track.id;
				track.label = tr.sender.track.label;
			}
			if(track)
				tracks.push(track);
		}
		return tracks;
	}

	function getRemoteTracks(handleId) {
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle || !pluginHandle.webrtcStuff) {
			Webrtc.warn('Invalid handle');
			return null;
		}
		let config = pluginHandle.webrtcStuff;
		if(!config.pc) {
			Webrtc.warn('Invalid PeerConnection');
			return null;
		}
		let tracks = [];
		let transceivers = config.pc.getTransceivers();
		for(let tr of transceivers) {
			let track = null;
			if(tr.receiver && tr.receiver.track) {
				track = { mid: tr.mid };
				track.type = tr.receiver.track.kind;
				track.id = tr.receiver.track.id;
				track.label = tr.receiver.track.label;
			}
			if(track)
				tracks.push(track);
		}
		return tracks;
	}

	function getVolume(handleId, mid, remote, result) {
		result = (typeof result == "function") ? result : Webrtc.noop;
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle || !pluginHandle.webrtcStuff) {
			Webrtc.warn("Invalid handle");
			result(0);
			return;
		}
		let stream = remote ? "remote" : "local";
		let config = pluginHandle.webrtcStuff;
		if(!config.volume[stream])
			config.volume[stream] = { value: 0 };
		// Start getting the volume, if audioLevel in getStats is supported (apparently
		// they're only available in Chrome/Safari right now: https://webrtc-stats.callstats.io/)
		if(config.pc && config.pc.getStats && (Webrtc.webRTCAdapter.browserDetails.browser === "chrome" ||
				Webrtc.webRTCAdapter.browserDetails.browser === "safari")) {
			// Are we interested in a mid in particular?
			let query = config.pc;
			if(mid) {
				let transceiver = config.pc.getTransceivers()
					.find(t => (t.mid === mid && t.receiver.track.kind === "audio"));
				if(!transceiver) {
					Webrtc.warn("No audio transceiver with mid " + mid);
					result(0);
					return;
				}
				if(remote && !transceiver.receiver) {
					Webrtc.warn("Remote transceiver track unavailable");
					result(0);
					return;
				} else if(!remote && !transceiver.sender) {
					Webrtc.warn("Local transceiver track unavailable");
					result(0);
					return;
				}
				query = remote ? transceiver.receiver : transceiver.sender;
			}
			query.getStats()
				.then(function(stats) {
					stats.forEach(function (res) {
						if(!res || res.kind !== "audio")
							return;
						if((remote && !res.remoteSource) || (!remote && res.type !== "media-source"))
							return;
						result(res.audioLevel ? res.audioLevel : 0);
					});
				});
			return config.volume[stream].value;
		} else {
			// audioInputLevel and audioOutputLevel seem only available in Chrome? audioLevel
			// seems to be available on Chrome and Firefox, but they don't seem to work
			Webrtc.warn("Getting the " + stream + " volume unsupported by browser");
			result(0);
			return;
		}
	}

	function isMuted(handleId, mid, video) {
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle || !pluginHandle.webrtcStuff) {
			Webrtc.warn("Invalid handle");
			return true;
		}
		let config = pluginHandle.webrtcStuff;
		if(!config.pc) {
			Webrtc.warn("Invalid PeerConnection");
			return true;
		}
		if(!config.myStream) {
			Webrtc.warn("Invalid local MediaStream");
			return true;
		}
		if(video) {
			// Check video track
			if(!config.myStream.getVideoTracks() || config.myStream.getVideoTracks().length === 0) {
				Webrtc.warn("No video track");
				return true;
			}
			if(mid) {
				let transceiver = config.pc.getTransceivers()
					.find(t => (t.mid === mid && t.receiver.track.kind === "video"));
				if(!transceiver) {
					Webrtc.warn("No video transceiver with mid " + mid);
					return true;
				}
				if(!transceiver.sender || !transceiver.sender.track) {
					Webrtc.warn("No video sender with mid " + mid);
					return true;
				}
				return !transceiver.sender.track.enabled;
			} else {
				return !config.myStream.getVideoTracks()[0].enabled;
			}
		} else {
			// Check audio track
			if(!config.myStream.getAudioTracks() || config.myStream.getAudioTracks().length === 0) {
				Webrtc.warn("No audio track");
				return true;
			}
			if(mid) {
				let transceiver = config.pc.getTransceivers()
					.find(t => (t.mid === mid && t.receiver.track.kind === "audio"));
				if(!transceiver) {
					Webrtc.warn("No audio transceiver with mid " + mid);
					return true;
				}
				if(!transceiver.sender || !transceiver.sender.track) {
					Webrtc.warn("No audio sender with mid " + mid);
					return true;
				}
				return !transceiver.sender.track.enabled;
			} else {
				return !config.myStream.getAudioTracks()[0].enabled;
			}
		}
	}

	function mute(handleId, mid, video, mute) {
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle || !pluginHandle.webrtcStuff) {
			Webrtc.warn("Invalid handle");
			return false;
		}
		let config = pluginHandle.webrtcStuff;
		if(!config.pc) {
			Webrtc.warn("Invalid PeerConnection");
			return false;
		}
		if(!config.myStream) {
			Webrtc.warn("Invalid local MediaStream");
			return false;
		}
		if(video) {
			// Mute/unmute video track
			if(!config.myStream.getVideoTracks() || config.myStream.getVideoTracks().length === 0) {
				Webrtc.warn("No video track");
				return false;
			}
			if(mid) {
				let transceiver = config.pc.getTransceivers()
					.find(t => (t.mid === mid && t.receiver.track.kind === "video"));
				if(!transceiver) {
					Webrtc.warn("No video transceiver with mid " + mid);
					return false;
				}
				if(!transceiver.sender || !transceiver.sender.track) {
					Webrtc.warn("No video sender with mid " + mid);
					return false;
				}
				transceiver.sender.track.enabled = mute ? false : true;
			} else {
				for(const videostream of config.myStream.getVideoTracks()) {
					videostream.enabled = !mute
				}
			}
		} else {
			// Mute/unmute audio track
			if(!config.myStream.getAudioTracks() || config.myStream.getAudioTracks().length === 0) {
				Webrtc.warn("No audio track");
				return false;
			}
			if(mid) {
				let transceiver = config.pc.getTransceivers()
					.find(t => (t.mid === mid && t.receiver.track.kind === "audio"));
				if(!transceiver) {
					Webrtc.warn("No audio transceiver with mid " + mid);
					return false;
				}
				if(!transceiver.sender || !transceiver.sender.track) {
					Webrtc.warn("No audio sender with mid " + mid);
					return false;
				}
				transceiver.sender.track.enabled = mute ? false : true;
			} else {
				for(const audiostream of config.myStream.getAudioTracks()) {
					audiostream.enabled = !mute
				}
			}
		}
		return true;
	}

	function getBitrate(handleId, mid) {
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle || !pluginHandle.webrtcStuff) {
			Webrtc.warn("Invalid handle");
			return "Invalid handle";
		}
		let config = pluginHandle.webrtcStuff;
		if(!config.pc)
			return "Invalid PeerConnection";
		// Start getting the bitrate, if getStats is supported
		if(config.pc.getStats) {
			let query = config.pc;
			let target = mid ? mid : "default";
			if(mid) {
				let transceiver = config.pc.getTransceivers()
					.find(t => (t.mid === mid && t.receiver.track.kind === "video"));
				if(!transceiver) {
					Webrtc.warn("No video transceiver with mid " + mid);
					return ("No video transceiver with mid " + mid);
				}
				if(!transceiver.receiver) {
					Webrtc.warn("No video receiver with mid " + mid);
					return ("No video receiver with mid " + mid);
				}
				query = transceiver.receiver;
			}
			if(!config.bitrate[target]) {
				config.bitrate[target] = {
					timer: null,
					bsnow: null,
					bsbefore: null,
					tsnow: null,
					tsbefore: null,
					value: "0 kbits/sec"
				};
			}
			if(!config.bitrate[target].timer) {
				Webrtc.log("Starting bitrate timer" + (mid ? (" for mid " + mid) : "") + " (via getStats)");
				config.bitrate[target].timer = setInterval(function() {
					query.getStats()
						.then(function(stats) {
							stats.forEach(function (res) {
								if(!res)
									return;
								let inStats = false;
								// Check if these are statistics on incoming media
								if((res.mediaType === "video" || res.id.toLowerCase().indexOf("video") > -1) &&
										res.type === "inbound-rtp" && res.id.indexOf("rtcp") < 0) {
									// New stats
									inStats = true;
								} else if(res.type == 'ssrc' && res.bytesReceived &&
										(res.googCodecName === "VP8" || res.googCodecName === "")) {
									// Older Chromer versions
									inStats = true;
								}
								// Parse stats now
								if(inStats) {
									config.bitrate[target].bsnow = res.bytesReceived;
									config.bitrate[target].tsnow = res.timestamp;
									if(config.bitrate[target].bsbefore === null || config.bitrate[target].tsbefore === null) {
										// Skip this round
										config.bitrate[target].bsbefore = config.bitrate[target].bsnow;
										config.bitrate[target].tsbefore = config.bitrate[target].tsnow;
									} else {
										// Calculate bitrate
										let timePassed = config.bitrate[target].tsnow - config.bitrate[target].tsbefore;
										if(Webrtc.webRTCAdapter.browserDetails.browser === "safari")
											timePassed = timePassed/1000;	// Apparently the timestamp is in microseconds, in Safari
										let bitRate = Math.round((config.bitrate[target].bsnow - config.bitrate[target].bsbefore) * 8 / timePassed);
										if(Webrtc.webRTCAdapter.browserDetails.browser === "safari")
											bitRate = parseInt(bitRate/1000);
										config.bitrate[target].value = bitRate + ' kbits/sec';
										//~ Janus.log("Estimated bitrate is " + config.bitrate.value);
										config.bitrate[target].bsbefore = config.bitrate[target].bsnow;
										config.bitrate[target].tsbefore = config.bitrate[target].tsnow;
									}
								}
							});
						});
				}, 1000);
				return "0 kbits/sec";	// We don't have a bitrate value yet
			}
			return config.bitrate[target].value;
		} else {
			Webrtc.warn("Getting the video bitrate unsupported by browser");
			return "Feature unsupported by browser";
		}
	}

	function setBitrate(handleId, mid, bitrate) {
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle || !pluginHandle.webrtcStuff) {
			Webrtc.warn('Invalid handle');
			return;
		}
		let config = pluginHandle.webrtcStuff;
		if(!config.pc) {
			Webrtc.warn('Invalid PeerConnection');
			return;
		}
		let transceiver = config.pc.getTransceivers().find(t => (t.mid === mid));
		if(!transceiver) {
			Webrtc.warn('No transceiver with mid', mid);
			return;
		}
		if(!transceiver.sender) {
			Webrtc.warn('No sender for transceiver with mid', mid);
			return;
		}
		let params = transceiver.sender.getParameters();
		if(!params || !params.encodings || params.encodings.length === 0) {
			Webrtc.warn('No parameters encodings');
		} else if(params.encodings.length > 1) {
			Webrtc.warn('Ignoring bitrate for simulcast track, use sendEncodings for that');
		} else if(isNaN(bitrate) || bitrate < 0) {
			Webrtc.warn('Invalid bitrate (must be a positive integer)');
		} else {
			params.encodings[0].maxBitrate = bitrate;
			transceiver.sender.setParameters(params);
		}
	}

	function webrtcError(error) {
		Webrtc.error("WebRTC error:", error);
	}

	function cleanupWebrtc(handleId, hangupRequest) {
		Webrtc.log("Cleaning WebRTC stuff");
		let pluginHandle = pluginHandles.get(handleId);
		if(!pluginHandle) {
			// Nothing to clean
			return;
		}
		let config = pluginHandle.webrtcStuff;
		if(config) {
			if(hangupRequest === true) {
				// Send a hangup request (we don't really care about the response)
				let request = { "janus": "hangup", "transaction": Webrtc.randomString(12) };
				if(pluginHandle.token)
					request["token"] = pluginHandle.token;
				if(apisecret)
					request["apisecret"] = apisecret;
				Webrtc.debug("Sending hangup request (handle=" + handleId + "):");
				Webrtc.debug(request);
				if(websockets) {
					request["session_id"] = sessionId;
					request["handle_id"] = handleId;
					ws.send(JSON.stringify(request));
				} else {
					Webrtc.httpAPICall(server + "/" + sessionId + "/" + handleId, {
						verb: 'POST',
						withCredentials: withCredentials,
						body: request
					});
				}
			}
			// Cleanup stack
			if(config.volume) {
				if(config.volume["local"] && config.volume["local"].timer)
					clearInterval(config.volume["local"].timer);
				if(config.volume["remote"] && config.volume["remote"].timer)
					clearInterval(config.volume["remote"].timer);
			}
			for(let i in config.bitrate) {
				if(config.bitrate[i].timer)
					clearInterval(config.bitrate[i].timer);
			}
			config.bitrate = {};
			if(!config.streamExternal && config.myStream) {
				Webrtc.log("Stopping local stream tracks");
				Webrtc.stopAllTracks(config.myStream);
			}
			config.streamExternal = false;
			config.myStream = null;
			// Close PeerConnection
			try {
				config.pc.close();
			} catch(e) {
				// Do nothing
			}
			config.pc = null;
			config.candidates = null;
			config.mySdp = null;
			config.remoteSdp = null;
			config.iceDone = false;
			config.dataChannel = {};
			config.dtmfSender = null;
			config.insertableStreams = false;
			config.externalEncryption = false;
		}
		pluginHandle.oncleanup();
	}

	function isTrickleEnabled(trickle) {
		Webrtc.debug("isTrickleEnabled:", trickle);
		return (trickle === false) ? false : true;
	}
}

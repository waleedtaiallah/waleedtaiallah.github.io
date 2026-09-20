/*! iScroll v5.1.2 ~ (c) 2008-2014 Matteo Spinelli ~ http://cubiq.org/license */
(function (window, document, Math) {
var rAF = window.requestAnimationFrame	||
	window.webkitRequestAnimationFrame	||
	window.mozRequestAnimationFrame		||
	window.oRequestAnimationFrame		||
	window.msRequestAnimationFrame		||
	function (callback) { window.setTimeout(callback, 1000 / 60); };

var utils = (function () {
	var me = {};

	var _elementStyle = document.createElement('div').style;
	var _vendor = (function () {
		var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
			transform,
			i = 0,
			l = vendors.length;

		for ( ; i < l; i++ ) {
			transform = vendors[i] + 'ransform';
			if ( transform in _elementStyle ) return vendors[i].substr(0, vendors[i].length-1);
		}

		return false;
	})();

	function _prefixStyle (style) {
		if ( _vendor === false ) return false;
		if ( _vendor === '' ) return style;
		return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
	}

	me.getTime = Date.now || function getTime () { return new Date().getTime(); };

	me.extend = function (target, obj) {
		for ( var i in obj ) {
			target[i] = obj[i];
		}
	};

	me.addEvent = function (el, type, fn, capture) {
		el.addEventListener(type, fn, !!capture);
	};

	me.removeEvent = function (el, type, fn, capture) {
		el.removeEventListener(type, fn, !!capture);
	};

	me.prefixPointerEvent = function (pointerEvent) {
		return window.MSPointerEvent ? 
			'MSPointer' + pointerEvent.charAt(9).toUpperCase() + pointerEvent.substr(10):
			pointerEvent;
	};

	me.momentum = function (current, start, time, lowerMargin, wrapperSize, deceleration) {
		var distance = current - start,
			speed = Math.abs(distance) / time,
			destination,
			duration;

		deceleration = deceleration === undefined ? 0.0006 : deceleration;

		destination = current + ( speed * speed ) / ( 2 * deceleration ) * ( distance < 0 ? -1 : 1 );
		duration = speed / deceleration;

		if ( destination < lowerMargin ) {
			destination = wrapperSize ? lowerMargin - ( wrapperSize / 2.5 * ( speed / 8 ) ) : lowerMargin;
			distance = Math.abs(destination - current);
			duration = distance / speed;
		} else if ( destination > 0 ) {
			destination = wrapperSize ? wrapperSize / 2.5 * ( speed / 8 ) : 0;
			distance = Math.abs(current) + destination;
			duration = distance / speed;
		}

		return {
			destination: Math.round(destination),
			duration: duration
		};
	};

	var _transform = _prefixStyle('transform');

	me.extend(me, {
		hasTransform: _transform !== false,
		hasPerspective: _prefixStyle('perspective') in _elementStyle,
		hasTouch: 'ontouchstart' in window,
		hasPointer: window.PointerEvent || window.MSPointerEvent, // IE10 is prefixed
		hasTransition: _prefixStyle('transition') in _elementStyle
	});

	// This should find all Android browsers lower than build 535.19 (both stock browser and webview)
	me.isBadAndroid = /Android /.test(window.navigator.appVersion) && !(/Chrome\/\d/.test(window.navigator.appVersion));

	me.extend(me.style = {}, {
		transform: _transform,
		transitionTimingFunction: _prefixStyle('transitionTimingFunction'),
		transitionDuration: _prefixStyle('transitionDuration'),
		transitionDelay: _prefixStyle('transitionDelay'),
		transformOrigin: _prefixStyle('transformOrigin')
	});

	me.hasClass = function (e, c) {
		var re = new RegExp("(^|\\s)" + c + "(\\s|$)");
		return re.test(e.className);
	};

	me.addClass = function (e, c) {
		if ( me.hasClass(e, c) ) {
			return;
		}

		var newclass = e.className.split(' ');
		newclass.push(c);
		e.className = newclass.join(' ');
	};

	me.removeClass = function (e, c) {
		if ( !me.hasClass(e, c) ) {
			return;
		}

		var re = new RegExp("(^|\\s)" + c + "(\\s|$)", 'g');
		e.className = e.className.replace(re, ' ');
	};

	me.offset = function (el) {
		var left = -el.offsetLeft,
			top = -el.offsetTop;

		// jshint -W084
		while (el = el.offsetParent) {
			left -= el.offsetLeft;
			top -= el.offsetTop;
		}
		// jshint +W084

		return {
			left: left,
			top: top
		};
	};

	me.preventDefaultException = function (el, exceptions) {
		for ( var i in exceptions ) {
			if ( exceptions[i].test(el[i]) ) {
				return true;
			}
		}

		return false;
	};

	me.extend(me.eventType = {}, {
		touchstart: 1,
		touchmove: 1,
		touchend: 1,

		mousedown: 2,
		mousemove: 2,
		mouseup: 2,

		pointerdown: 3,
		pointermove: 3,
		pointerup: 3,

		MSPointerDown: 3,
		MSPointerMove: 3,
		MSPointerUp: 3
	});

	me.extend(me.ease = {}, {
		quadratic: {
			style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
			fn: function (k) {
				return k * ( 2 - k );
			}
		},
		circular: {
			style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',	// Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
			fn: function (k) {
				return Math.sqrt( 1 - ( --k * k ) );
			}
		},
		back: {
			style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
			fn: function (k) {
				var b = 4;
				return ( k = k - 1 ) * k * ( ( b + 1 ) * k + b ) + 1;
			}
		},
		bounce: {
			style: '',
			fn: function (k) {
				if ( ( k /= 1 ) < ( 1 / 2.75 ) ) {
					return 7.5625 * k * k;
				} else if ( k < ( 2 / 2.75 ) ) {
					return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
				} else if ( k < ( 2.5 / 2.75 ) ) {
					return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
				} else {
					return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
				}
			}
		},
		elastic: {
			style: '',
			fn: function (k) {
				var f = 0.22,
					e = 0.4;

				if ( k === 0 ) { return 0; }
				if ( k == 1 ) { return 1; }

				return ( e * Math.pow( 2, - 10 * k ) * Math.sin( ( k - f / 4 ) * ( 2 * Math.PI ) / f ) + 1 );
			}
		}
	});

	me.tap = function (e, eventName) {
		var ev = document.createEvent('Event');
		ev.initEvent(eventName, true, true);
		ev.pageX = e.pageX;
		ev.pageY = e.pageY;
		e.target.dispatchEvent(ev);
	};

	me.click = function (e) {
		var target = e.target,
			ev;

		if ( !(/(SELECT|INPUT|TEXTAREA)/i).test(target.tagName) ) {
			ev = document.createEvent('MouseEvents');
			ev.initMouseEvent('click', true, true, e.view, 1,
				target.screenX, target.screenY, target.clientX, target.clientY,
				e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
				0, null);

			ev._constructed = true;
			target.dispatchEvent(ev);
		}
	};

	return me;
})();

function IScroll (el, options) {
	this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;
	this.scroller = this.wrapper.children[0];
	this.scrollerStyle = this.scroller.style;		// cache style for better performance

	this.options = {

		resizeScrollbars: true,

		mouseWheelSpeed: 20,

		snapThreshold: 0.334,

// INSERT POINT: OPTIONS 

		startX: 0,
		startY: 0,
		scrollY: true,
		directionLockThreshold: 5,
		momentum: true,

		bounce: true,
		bounceTime: 600,
		bounceEasing: '',

		preventDefault: true,
		preventDefaultException: { tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/ },

		HWCompositing: true,
		useTransition: true,
		useTransform: true
	};

	for ( var i in options ) {
		this.options[i] = options[i];
	}

	// Normalize options
	this.translateZ = this.options.HWCompositing && utils.hasPerspective ? ' translateZ(0)' : '';

	this.options.useTransition = utils.hasTransition && this.options.useTransition;
	this.options.useTransform = utils.hasTransform && this.options.useTransform;

	this.options.eventPassthrough = this.options.eventPassthrough === true ? 'vertical' : this.options.eventPassthrough;
	this.options.preventDefault = !this.options.eventPassthrough && this.options.preventDefault;

	// If you want eventPassthrough I have to lock one of the axes
	this.options.scrollY = this.options.eventPassthrough == 'vertical' ? false : this.options.scrollY;
	this.options.scrollX = this.options.eventPassthrough == 'horizontal' ? false : this.options.scrollX;

	// With eventPassthrough we also need lockDirection mechanism
	this.options.freeScroll = this.options.freeScroll && !this.options.eventPassthrough;
	this.options.directionLockThreshold = this.options.eventPassthrough ? 0 : this.options.directionLockThreshold;

	this.options.bounceEasing = typeof this.options.bounceEasing == 'string' ? utils.ease[this.options.bounceEasing] || utils.ease.circular : this.options.bounceEasing;

	this.options.resizePolling = this.options.resizePolling === undefined ? 60 : this.options.resizePolling;

	if ( this.options.tap === true ) {
		this.options.tap = 'tap';
	}

	if ( this.options.shrinkScrollbars == 'scale' ) {
		this.options.useTransition = false;
	}

	this.options.invertWheelDirection = this.options.invertWheelDirection ? -1 : 1;

// INSERT POINT: NORMALIZATION

	// Some defaults	
	this.x = 0;
	this.y = 0;
	this.directionX = 0;
	this.directionY = 0;
	this._events = {};

// INSERT POINT: DEFAULTS

	this._init();
	this.refresh();

	this.scrollTo(this.options.startX, this.options.startY);
	this.enable();
}

IScroll.prototype = {
	version: '5.1.2',

	_init: function () {
		this._initEvents();

		if ( this.options.scrollbars || this.options.indicators ) {
			this._initIndicators();
		}

		if ( this.options.mouseWheel ) {
			this._initWheel();
		}

		if ( this.options.snap ) {
			this._initSnap();
		}

		if ( this.options.keyBindings ) {
			this._initKeys();
		}

// INSERT POINT: _init

	},

	destroy: function () {
		this._initEvents(true);

		this._execEvent('destroy');
	},

	_transitionEnd: function (e) {
		if ( e.target != this.scroller || !this.isInTransition ) {
			return;
		}

		this._transitionTime();
		if ( !this.resetPosition(this.options.bounceTime) ) {
			this.isInTransition = false;
			this._execEvent('scrollEnd');
		}
	},

	_start: function (e) {
		// React to left mouse button only
		if ( utils.eventType[e.type] != 1 ) {
			if ( e.button !== 0 ) {
				return;
			}
		}

		if ( !this.enabled || (this.initiated && utils.eventType[e.type] !== this.initiated) ) {
			return;
		}

		if ( this.options.preventDefault && !utils.isBadAndroid && !utils.preventDefaultException(e.target, this.options.preventDefaultException) ) {
			e.preventDefault();
		}

		var point = e.touches ? e.touches[0] : e,
			pos;

		this.initiated	= utils.eventType[e.type];
		this.moved		= false;
		this.distX		= 0;
		this.distY		= 0;
		this.directionX = 0;
		this.directionY = 0;
		this.directionLocked = 0;

		this._transitionTime();

		this.startTime = utils.getTime();

		if ( this.options.useTransition && this.isInTransition ) {
			this.isInTransition = false;
			pos = this.getComputedPosition();
			this._translate(Math.round(pos.x), Math.round(pos.y));
			this._execEvent('scrollEnd');
		} else if ( !this.options.useTransition && this.isAnimating ) {
			this.isAnimating = false;
			this._execEvent('scrollEnd');
		}

		this.startX    = this.x;
		this.startY    = this.y;
		this.absStartX = this.x;
		this.absStartY = this.y;
		this.pointX    = point.pageX;
		this.pointY    = point.pageY;

		this._execEvent('beforeScrollStart');
	},

	_move: function (e) {
		if ( !this.enabled || utils.eventType[e.type] !== this.initiated ) {
			return;
		}

		if ( this.options.preventDefault ) {	// increases performance on Android? TODO: check!
			e.preventDefault();
		}

		var point		= e.touches ? e.touches[0] : e,
			deltaX		= point.pageX - this.pointX,
			deltaY		= point.pageY - this.pointY,
			timestamp	= utils.getTime(),
			newX, newY,
			absDistX, absDistY;

		this.pointX		= point.pageX;
		this.pointY		= point.pageY;

		this.distX		+= deltaX;
		this.distY		+= deltaY;
		absDistX		= Math.abs(this.distX);
		absDistY		= Math.abs(this.distY);

		// We need to move at least 10 pixels for the scrolling to initiate
		if ( timestamp - this.endTime > 300 && (absDistX < 10 && absDistY < 10) ) {
			return;
		}

		// If you are scrolling in one direction lock the other
		if ( !this.directionLocked && !this.options.freeScroll ) {
			if ( absDistX > absDistY + this.options.directionLockThreshold ) {
				this.directionLocked = 'h';		// lock horizontally
			} else if ( absDistY >= absDistX + this.options.directionLockThreshold ) {
				this.directionLocked = 'v';		// lock vertically
			} else {
				this.directionLocked = 'n';		// no lock
			}
		}

		if ( this.directionLocked == 'h' ) {
			if ( this.options.eventPassthrough == 'vertical' ) {
				e.preventDefault();
			} else if ( this.options.eventPassthrough == 'horizontal' ) {
				this.initiated = false;
				return;
			}

			deltaY = 0;
		} else if ( this.directionLocked == 'v' ) {
			if ( this.options.eventPassthrough == 'horizontal' ) {
				e.preventDefault();
			} else if ( this.options.eventPassthrough == 'vertical' ) {
				this.initiated = false;
				return;
			}

			deltaX = 0;
		}

		deltaX = this.hasHorizontalScroll ? deltaX : 0;
		deltaY = this.hasVerticalScroll ? deltaY : 0;

		newX = this.x + deltaX;
		newY = this.y + deltaY;

		// Slow down if outside of the boundaries
		if ( newX > 0 || newX < this.maxScrollX ) {
			newX = this.options.bounce ? this.x + deltaX / 3 : newX > 0 ? 0 : this.maxScrollX;
		}
		if ( newY > 0 || newY < this.maxScrollY ) {
			newY = this.options.bounce ? this.y + deltaY / 3 : newY > 0 ? 0 : this.maxScrollY;
		}

		this.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
		this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

		if ( !this.moved ) {
			this._execEvent('scrollStart');
		}

		this.moved = true;

		this._translate(newX, newY);

/* REPLACE START: _move */

		if ( timestamp - this.startTime > 300 ) {
			this.startTime = timestamp;
			this.startX = this.x;
			this.startY = this.y;
		}

/* REPLACE END: _move */

	},

	_end: function (e) {
		if ( !this.enabled || utils.eventType[e.type] !== this.initiated ) {
			return;
		}

		if ( this.options.preventDefault && !utils.preventDefaultException(e.target, this.options.preventDefaultException) ) {
			e.preventDefault();
		}

		var point = e.changedTouches ? e.changedTouches[0] : e,
			momentumX,
			momentumY,
			duration = utils.getTime() - this.startTime,
			newX = Math.round(this.x),
			newY = Math.round(this.y),
			distanceX = Math.abs(newX - this.startX),
			distanceY = Math.abs(newY - this.startY),
			time = 0,
			easing = '';

		this.isInTransition = 0;
		this.initiated = 0;
		this.endTime = utils.getTime();

		// reset if we are outside of the boundaries
		if ( this.resetPosition(this.options.bounceTime) ) {
			return;
		}

		this.scrollTo(newX, newY);	// ensures that the last position is rounded

		// we scrolled less than 10 pixels
		if ( !this.moved ) {
			if ( this.options.tap ) {
				utils.tap(e, this.options.tap);
			}

			if ( this.options.click ) {
				utils.click(e);
			}

			this._execEvent('scrollCancel');
			return;
		}

		if ( this._events.flick && duration < 200 && distanceX < 100 && distanceY < 100 ) {
			this._execEvent('flick');
			return;
		}

		// start momentum animation if needed
		if ( this.options.momentum && duration < 300 ) {
			momentumX = this.hasHorizontalScroll ? utils.momentum(this.x, this.startX, duration, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration) : { destination: newX, duration: 0 };
			momentumY = this.hasVerticalScroll ? utils.momentum(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration) : { destination: newY, duration: 0 };
			newX = momentumX.destination;
			newY = momentumY.destination;
			time = Math.max(momentumX.duration, momentumY.duration);
			this.isInTransition = 1;
		}


		if ( this.options.snap ) {
			var snap = this._nearestSnap(newX, newY);
			this.currentPage = snap;
			time = this.options.snapSpeed || Math.max(
					Math.max(
						Math.min(Math.abs(newX - snap.x), 1000),
						Math.min(Math.abs(newY - snap.y), 1000)
					), 300);
			newX = snap.x;
			newY = snap.y;

			this.directionX = 0;
			this.directionY = 0;
			easing = this.options.bounceEasing;
		}

// INSERT POINT: _end

		if ( newX != this.x || newY != this.y ) {
			// change easing function when scroller goes out of the boundaries
			if ( newX > 0 || newX < this.maxScrollX || newY > 0 || newY < this.maxScrollY ) {
				easing = utils.ease.quadratic;
			}

			this.scrollTo(newX, newY, time, easing);
			return;
		}

		this._execEvent('scrollEnd');
	},

	_resize: function () {
		var that = this;

		clearTimeout(this.resizeTimeout);

		this.resizeTimeout = setTimeout(function () {
			that.refresh();
		}, this.options.resizePolling);
	},

	resetPosition: function (time) {
		var x = this.x,
			y = this.y;

		time = time || 0;

		if ( !this.hasHorizontalScroll || this.x > 0 ) {
			x = 0;
		} else if ( this.x < this.maxScrollX ) {
			x = this.maxScrollX;
		}

		if ( !this.hasVerticalScroll || this.y > 0 ) {
			y = 0;
		} else if ( this.y < this.maxScrollY ) {
			y = this.maxScrollY;
		}

		if ( x == this.x && y == this.y ) {
			return false;
		}

		this.scrollTo(x, y, time, this.options.bounceEasing);

		return true;
	},

	disable: function () {
		this.enabled = false;
	},

	enable: function () {
		this.enabled = true;
	},

	refresh: function () {
		var rf = this.wrapper.offsetHeight;		// Force reflow

		this.wrapperWidth	= this.wrapper.clientWidth;
		this.wrapperHeight	= this.wrapper.clientHeight;

/* REPLACE START: refresh */

		this.scrollerWidth	= this.scroller.offsetWidth;
		this.scrollerHeight	= this.scroller.offsetHeight;

		this.maxScrollX		= this.wrapperWidth - this.scrollerWidth;
		this.maxScrollY		= this.wrapperHeight - this.scrollerHeight;

/* REPLACE END: refresh */

		this.hasHorizontalScroll	= this.options.scrollX && this.maxScrollX < 0;
		this.hasVerticalScroll		= this.options.scrollY && this.maxScrollY < 0;

		if ( !this.hasHorizontalScroll ) {
			this.maxScrollX = 0;
			this.scrollerWidth = this.wrapperWidth;
		}

		if ( !this.hasVerticalScroll ) {
			this.maxScrollY = 0;
			this.scrollerHeight = this.wrapperHeight;
		}

		this.endTime = 0;
		this.directionX = 0;
		this.directionY = 0;

		this.wrapperOffset = utils.offset(this.wrapper);

		this._execEvent('refresh');

		this.resetPosition();

// INSERT POINT: _refresh

	},

	on: function (type, fn) {
		if ( !this._events[type] ) {
			this._events[type] = [];
		}

		this._events[type].push(fn);
	},

	off: function (type, fn) {
		if ( !this._events[type] ) {
			return;
		}

		var index = this._events[type].indexOf(fn);

		if ( index > -1 ) {
			this._events[type].splice(index, 1);
		}
	},

	_execEvent: function (type) {
		if ( !this._events[type] ) {
			return;
		}

		var i = 0,
			l = this._events[type].length;

		if ( !l ) {
			return;
		}

		for ( ; i < l; i++ ) {
			this._events[type][i].apply(this, [].slice.call(arguments, 1));
		}
	},

	scrollBy: function (x, y, time, easing) {
		x = this.x + x;
		y = this.y + y;
		time = time || 0;

		this.scrollTo(x, y, time, easing);
	},

	scrollTo: function (x, y, time, easing) {
		easing = easing || utils.ease.circular;

		this.isInTransition = this.options.useTransition && time > 0;

		if ( !time || (this.options.useTransition && easing.style) ) {
			this._transitionTimingFunction(easing.style);
			this._transitionTime(time);
			this._translate(x, y);
		} else {
			this._animate(x, y, time, easing.fn);
		}
	},

	scrollToElement: function (el, time, offsetX, offsetY, easing) {
		el = el.nodeType ? el : this.scroller.querySelector(el);

		if ( !el ) {
			return;
		}

		var pos = utils.offset(el);

		pos.left -= this.wrapperOffset.left;
		pos.top  -= this.wrapperOffset.top;

		// if offsetX/Y are true we center the element to the screen
		if ( offsetX === true ) {
			offsetX = Math.round(el.offsetWidth / 2 - this.wrapper.offsetWidth / 2);
		}
		if ( offsetY === true ) {
			offsetY = Math.round(el.offsetHeight / 2 - this.wrapper.offsetHeight / 2);
		}

		pos.left -= offsetX || 0;
		pos.top  -= offsetY || 0;

		pos.left = pos.left > 0 ? 0 : pos.left < this.maxScrollX ? this.maxScrollX : pos.left;
		pos.top  = pos.top  > 0 ? 0 : pos.top  < this.maxScrollY ? this.maxScrollY : pos.top;

		time = time === undefined || time === null || time === 'auto' ? Math.max(Math.abs(this.x-pos.left), Math.abs(this.y-pos.top)) : time;

		this.scrollTo(pos.left, pos.top, time, easing);
	},

	_transitionTime: function (time) {
		time = time || 0;

		this.scrollerStyle[utils.style.transitionDuration] = time + 'ms';

		if ( !time && utils.isBadAndroid ) {
			this.scrollerStyle[utils.style.transitionDuration] = '0.001s';
		}


		if ( this.indicators ) {
			for ( var i = this.indicators.length; i--; ) {
				this.indicators[i].transitionTime(time);
			}
		}


// INSERT POINT: _transitionTime

	},

	_transitionTimingFunction: function (easing) {
		this.scrollerStyle[utils.style.transitionTimingFunction] = easing;


		if ( this.indicators ) {
			for ( var i = this.indicators.length; i--; ) {
				this.indicators[i].transitionTimingFunction(easing);
			}
		}


// INSERT POINT: _transitionTimingFunction

	},

	_translate: function (x, y) {
		if ( this.options.useTransform ) {

/* REPLACE START: _translate */

			this.scrollerStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.translateZ;

/* REPLACE END: _translate */

		} else {
			x = Math.round(x);
			y = Math.round(y);
			this.scrollerStyle.left = x + 'px';
			this.scrollerStyle.top = y + 'px';
		}

		this.x = x;
		this.y = y;


	if ( this.indicators ) {
		for ( var i = this.indicators.length; i--; ) {
			this.indicators[i].updatePosition();
		}
	}


// INSERT POINT: _translate

	},

	_initEvents: function (remove) {
		var eventType = remove ? utils.removeEvent : utils.addEvent,
			target = this.options.bindToWrapper ? this.wrapper : window;

		eventType(window, 'orientationchange', this);
		eventType(window, 'resize', this);

		if ( this.options.click ) {
			eventType(this.wrapper, 'click', this, true);
		}

		if ( !this.options.disableMouse ) {
			eventType(this.wrapper, 'mousedown', this);
			eventType(target, 'mousemove', this);
			eventType(target, 'mousecancel', this);
			eventType(target, 'mouseup', this);
		}

		if ( utils.hasPointer && !this.options.disablePointer ) {
			eventType(this.wrapper, utils.prefixPointerEvent('pointerdown'), this);
			eventType(target, utils.prefixPointerEvent('pointermove'), this);
			eventType(target, utils.prefixPointerEvent('pointercancel'), this);
			eventType(target, utils.prefixPointerEvent('pointerup'), this);
		}

		if ( utils.hasTouch && !this.options.disableTouch ) {
			eventType(this.wrapper, 'touchstart', this);
			eventType(target, 'touchmove', this);
			eventType(target, 'touchcancel', this);
			eventType(target, 'touchend', this);
		}

		eventType(this.scroller, 'transitionend', this);
		eventType(this.scroller, 'webkitTransitionEnd', this);
		eventType(this.scroller, 'oTransitionEnd', this);
		eventType(this.scroller, 'MSTransitionEnd', this);
	},

	getComputedPosition: function () {
		var matrix = window.getComputedStyle(this.scroller, null),
			x, y;

		if ( this.options.useTransform ) {
			matrix = matrix[utils.style.transform].split(')')[0].split(', ');
			x = +(matrix[12] || matrix[4]);
			y = +(matrix[13] || matrix[5]);
		} else {
			x = +matrix.left.replace(/[^-\d.]/g, '');
			y = +matrix.top.replace(/[^-\d.]/g, '');
		}

		return { x: x, y: y };
	},

	_initIndicators: function () {
		var interactive = this.options.interactiveScrollbars,
			customStyle = typeof this.options.scrollbars != 'string',
			indicators = [],
			indicator;

		var that = this;

		this.indicators = [];

		if ( this.options.scrollbars ) {
			// Vertical scrollbar
			if ( this.options.scrollY ) {
				indicator = {
					el: createDefaultScrollbar('v', interactive, this.options.scrollbars),
					interactive: interactive,
					defaultScrollbars: true,
					customStyle: customStyle,
					resize: this.options.resizeScrollbars,
					shrink: this.options.shrinkScrollbars,
					fade: this.options.fadeScrollbars,
					listenX: false
				};

				this.wrapper.appendChild(indicator.el);
				indicators.push(indicator);
			}

			// Horizontal scrollbar
			if ( this.options.scrollX ) {
				indicator = {
					el: createDefaultScrollbar('h', interactive, this.options.scrollbars),
					interactive: interactive,
					defaultScrollbars: true,
					customStyle: customStyle,
					resize: this.options.resizeScrollbars,
					shrink: this.options.shrinkScrollbars,
					fade: this.options.fadeScrollbars,
					listenY: false
				};

				this.wrapper.appendChild(indicator.el);
				indicators.push(indicator);
			}
		}

		if ( this.options.indicators ) {
			// TODO: check concat compatibility
			indicators = indicators.concat(this.options.indicators);
		}

		for ( var i = indicators.length; i--; ) {
			this.indicators.push( new Indicator(this, indicators[i]) );
		}

		// TODO: check if we can use array.map (wide compatibility and performance issues)
		function _indicatorsMap (fn) {
			for ( var i = that.indicators.length; i--; ) {
				fn.call(that.indicators[i]);
			}
		}

		if ( this.options.fadeScrollbars ) {
			this.on('scrollEnd', function () {
				_indicatorsMap(function () {
					this.fade();
				});
			});

			this.on('scrollCancel', function () {
				_indicatorsMap(function () {
					this.fade();
				});
			});

			this.on('scrollStart', function () {
				_indicatorsMap(function () {
					this.fade(1);
				});
			});

			this.on('beforeScrollStart', function () {
				_indicatorsMap(function () {
					this.fade(1, true);
				});
			});
		}


		this.on('refresh', function () {
			_indicatorsMap(function () {
				this.refresh();
			});
		});

		this.on('destroy', function () {
			_indicatorsMap(function () {
				this.destroy();
			});

			delete this.indicators;
		});
	},

	_initWheel: function () {
		utils.addEvent(this.wrapper, 'wheel', this);
		utils.addEvent(this.wrapper, 'mousewheel', this);
		utils.addEvent(this.wrapper, 'DOMMouseScroll', this);

		this.on('destroy', function () {
			utils.removeEvent(this.wrapper, 'wheel', this);
			utils.removeEvent(this.wrapper, 'mousewheel', this);
			utils.removeEvent(this.wrapper, 'DOMMouseScroll', this);
		});
	},

	_wheel: function (e) {
		if ( !this.enabled ) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		var wheelDeltaX, wheelDeltaY,
			newX, newY,
			that = this;

		if ( this.wheelTimeout === undefined ) {
			that._execEvent('scrollStart');
		}

		// Execute the scrollEnd event after 400ms the wheel stopped scrolling
		clearTimeout(this.wheelTimeout);
		this.wheelTimeout = setTimeout(function () {
			that._execEvent('scrollEnd');
			that.wheelTimeout = undefined;
		}, 400);

		if ( 'deltaX' in e ) {
		    var multiply = (e.deltaMode === 1) ? this.options.mouseWheelSpeed : 1;
		    wheelDeltaX = -e.deltaX * multiply;
		    wheelDeltaY = -e.deltaY * multiply;
		} else if ( 'wheelDeltaX' in e ) {
			wheelDeltaX = e.wheelDeltaX / 120 * this.options.mouseWheelSpeed;
			wheelDeltaY = e.wheelDeltaY / 120 * this.options.mouseWheelSpeed;
		} else if ( 'wheelDelta' in e ) {
			wheelDeltaX = wheelDeltaY = e.wheelDelta / 120 * this.options.mouseWheelSpeed;
		} else if ( 'detail' in e ) {
			wheelDeltaX = wheelDeltaY = -e.detail / 3 * this.options.mouseWheelSpeed;
		} else {
			return;
		}

		wheelDeltaX *= this.options.invertWheelDirection;
		wheelDeltaY *= this.options.invertWheelDirection;

		if ( !this.hasVerticalScroll ) {
			wheelDeltaX = wheelDeltaY;
			wheelDeltaY = 0;
		}

		if ( this.options.snap ) {
			newX = this.currentPage.pageX;
			newY = this.currentPage.pageY;

			if ( wheelDeltaX > 0 ) {
				newX--;
			} else if ( wheelDeltaX < 0 ) {
				newX++;
			}

			if ( wheelDeltaY > 0 ) {
				newY--;
			} else if ( wheelDeltaY < 0 ) {
				newY++;
			}

			this.goToPage(newX, newY);

			return;
		}

		newX = this.x + Math.round(this.hasHorizontalScroll ? wheelDeltaX : 0);
		newY = this.y + Math.round(this.hasVerticalScroll ? wheelDeltaY : 0);

		if ( newX > 0 ) {
			newX = 0;
		} else if ( newX < this.maxScrollX ) {
			newX = this.maxScrollX;
		}

		if ( newY > 0 ) {
			newY = 0;
		} else if ( newY < this.maxScrollY ) {
			newY = this.maxScrollY;
		}

		this.scrollTo(newX, newY, 0);

// INSERT POINT: _wheel
	},

	_initSnap: function () {
		this.currentPage = {};

		if ( typeof this.options.snap == 'string' ) {
			this.options.snap = this.scroller.querySelectorAll(this.options.snap);
		}

		this.on('refresh', function () {
			var i = 0, l,
				m = 0, n,
				cx, cy,
				x = 0, y,
				stepX = this.options.snapStepX || this.wrapperWidth,
				stepY = this.options.snapStepY || this.wrapperHeight,
				el;

			this.pages = [];

			if ( !this.wrapperWidth || !this.wrapperHeight || !this.scrollerWidth || !this.scrollerHeight ) {
				return;
			}

			if ( this.options.snap === true ) {
				cx = Math.round( stepX / 2 );
				cy = Math.round( stepY / 2 );

				while ( x > -this.scrollerWidth ) {
					this.pages[i] = [];
					l = 0;
					y = 0;

					while ( y > -this.scrollerHeight ) {
						this.pages[i][l] = {
							x: Math.max(x, this.maxScrollX),
							y: Math.max(y, this.maxScrollY),
							width: stepX,
							height: stepY,
							cx: x - cx,
							cy: y - cy
						};

						y -= stepY;
						l++;
					}

					x -= stepX;
					i++;
				}
			} else {
				el = this.options.snap;
				l = el.length;
				n = -1;

				for ( ; i < l; i++ ) {
					if ( i === 0 || el[i].offsetLeft <= el[i-1].offsetLeft ) {
						m = 0;
						n++;
					}

					if ( !this.pages[m] ) {
						this.pages[m] = [];
					}

					x = Math.max(-el[i].offsetLeft, this.maxScrollX);
					y = Math.max(-el[i].offsetTop, this.maxScrollY);
					cx = x - Math.round(el[i].offsetWidth / 2);
					cy = y - Math.round(el[i].offsetHeight / 2);

					this.pages[m][n] = {
						x: x,
						y: y,
						width: el[i].offsetWidth,
						height: el[i].offsetHeight,
						cx: cx,
						cy: cy
					};

					if ( x > this.maxScrollX ) {
						m++;
					}
				}
			}

			this.goToPage(this.currentPage.pageX || 0, this.currentPage.pageY || 0, 0);

			// Update snap threshold if needed
			if ( this.options.snapThreshold % 1 === 0 ) {
				this.snapThresholdX = this.options.snapThreshold;
				this.snapThresholdY = this.options.snapThreshold;
			} else {
				this.snapThresholdX = Math.round(this.pages[this.currentPage.pageX][this.currentPage.pageY].width * this.options.snapThreshold);
				this.snapThresholdY = Math.round(this.pages[this.currentPage.pageX][this.currentPage.pageY].height * this.options.snapThreshold);
			}
		});

		this.on('flick', function () {
			var time = this.options.snapSpeed || Math.max(
					Math.max(
						Math.min(Math.abs(this.x - this.startX), 1000),
						Math.min(Math.abs(this.y - this.startY), 1000)
					), 300);

			this.goToPage(
				this.currentPage.pageX + this.directionX,
				this.currentPage.pageY + this.directionY,
				time
			);
		});
	},

	_nearestSnap: function (x, y) {
		if ( !this.pages.length ) {
			return { x: 0, y: 0, pageX: 0, pageY: 0 };
		}

		var i = 0,
			l = this.pages.length,
			m = 0;

		// Check if we exceeded the snap threshold
		if ( Math.abs(x - this.absStartX) < this.snapThresholdX &&
			Math.abs(y - this.absStartY) < this.snapThresholdY ) {
			return this.currentPage;
		}

		if ( x > 0 ) {
			x = 0;
		} else if ( x < this.maxScrollX ) {
			x = this.maxScrollX;
		}

		if ( y > 0 ) {
			y = 0;
		} else if ( y < this.maxScrollY ) {
			y = this.maxScrollY;
		}

		for ( ; i < l; i++ ) {
			if ( x >= this.pages[i][0].cx ) {
				x = this.pages[i][0].x;
				break;
			}
		}

		l = this.pages[i].length;

		for ( ; m < l; m++ ) {
			if ( y >= this.pages[0][m].cy ) {
				y = this.pages[0][m].y;
				break;
			}
		}

		if ( i == this.currentPage.pageX ) {
			i += this.directionX;

			if ( i < 0 ) {
				i = 0;
			} else if ( i >= this.pages.length ) {
				i = this.pages.length - 1;
			}

			x = this.pages[i][0].x;
		}

		if ( m == this.currentPage.pageY ) {
			m += this.directionY;

			if ( m < 0 ) {
				m = 0;
			} else if ( m >= this.pages[0].length ) {
				m = this.pages[0].length - 1;
			}

			y = this.pages[0][m].y;
		}

		return {
			x: x,
			y: y,
			pageX: i,
			pageY: m
		};
	},

	goToPage: function (x, y, time, easing) {
		easing = easing || this.options.bounceEasing;

		if ( x >= this.pages.length ) {
			x = this.pages.length - 1;
		} else if ( x < 0 ) {
			x = 0;
		}

		if ( y >= this.pages[x].length ) {
			y = this.pages[x].length - 1;
		} else if ( y < 0 ) {
			y = 0;
		}

		var posX = this.pages[x][y].x,
			posY = this.pages[x][y].y;

		time = time === undefined ? this.options.snapSpeed || Math.max(
			Math.max(
				Math.min(Math.abs(posX - this.x), 1000),
				Math.min(Math.abs(posY - this.y), 1000)
			), 300) : time;

		this.currentPage = {
			x: posX,
			y: posY,
			pageX: x,
			pageY: y
		};

		this.scrollTo(posX, posY, time, easing);
	},

	next: function (time, easing) {
		var x = this.currentPage.pageX,
			y = this.currentPage.pageY;

		x++;

		if ( x >= this.pages.length && this.hasVerticalScroll ) {
			x = 0;
			y++;
		}

		this.goToPage(x, y, time, easing);
	},

	prev: function (time, easing) {
		var x = this.currentPage.pageX,
			y = this.currentPage.pageY;

		x--;

		if ( x < 0 && this.hasVerticalScroll ) {
			x = 0;
			y--;
		}

		this.goToPage(x, y, time, easing);
	},

	_initKeys: function (e) {
		// default key bindings
		var keys = {
			pageUp: 33,
			pageDown: 34,
			end: 35,
			home: 36,
			left: 37,
			up: 38,
			right: 39,
			down: 40
		};
		var i;

		// if you give me characters I give you keycode
		if ( typeof this.options.keyBindings == 'object' ) {
			for ( i in this.options.keyBindings ) {
				if ( typeof this.options.keyBindings[i] == 'string' ) {
					this.options.keyBindings[i] = this.options.keyBindings[i].toUpperCase().charCodeAt(0);
				}
			}
		} else {
			this.options.keyBindings = {};
		}

		for ( i in keys ) {
			this.options.keyBindings[i] = this.options.keyBindings[i] || keys[i];
		}

		utils.addEvent(window, 'keydown', this);

		this.on('destroy', function () {
			utils.removeEvent(window, 'keydown', this);
		});
	},

	_key: function (e) {
		if ( !this.enabled ) {
			return;
		}

		var snap = this.options.snap,	// we are using this alot, better to cache it
			newX = snap ? this.currentPage.pageX : this.x,
			newY = snap ? this.currentPage.pageY : this.y,
			now = utils.getTime(),
			prevTime = this.keyTime || 0,
			acceleration = 0.250,
			pos;

		if ( this.options.useTransition && this.isInTransition ) {
			pos = this.getComputedPosition();

			this._translate(Math.round(pos.x), Math.round(pos.y));
			this.isInTransition = false;
		}

		this.keyAcceleration = now - prevTime < 200 ? Math.min(this.keyAcceleration + acceleration, 50) : 0;

		switch ( e.keyCode ) {
			case this.options.keyBindings.pageUp:
				if ( this.hasHorizontalScroll && !this.hasVerticalScroll ) {
					newX += snap ? 1 : this.wrapperWidth;
				} else {
					newY += snap ? 1 : this.wrapperHeight;
				}
				break;
			case this.options.keyBindings.pageDown:
				if ( this.hasHorizontalScroll && !this.hasVerticalScroll ) {
					newX -= snap ? 1 : this.wrapperWidth;
				} else {
					newY -= snap ? 1 : this.wrapperHeight;
				}
				break;
			case this.options.keyBindings.end:
				newX = snap ? this.pages.length-1 : this.maxScrollX;
				newY = snap ? this.pages[0].length-1 : this.maxScrollY;
				break;
			case this.options.keyBindings.home:
				newX = 0;
				newY = 0;
				break;
			case this.options.keyBindings.left:
				newX += snap ? -1 : 5 + this.keyAcceleration>>0;
				break;
			case this.options.keyBindings.up:
				newY += snap ? 1 : 5 + this.keyAcceleration>>0;
				break;
			case this.options.keyBindings.right:
				newX -= snap ? -1 : 5 + this.keyAcceleration>>0;
				break;
			case this.options.keyBindings.down:
				newY -= snap ? 1 : 5 + this.keyAcceleration>>0;
				break;
			default:
				return;
		}

		if ( snap ) {
			this.goToPage(newX, newY);
			return;
		}

		if ( newX > 0 ) {
			newX = 0;
			this.keyAcceleration = 0;
		} else if ( newX < this.maxScrollX ) {
			newX = this.maxScrollX;
			this.keyAcceleration = 0;
		}

		if ( newY > 0 ) {
			newY = 0;
			this.keyAcceleration = 0;
		} else if ( newY < this.maxScrollY ) {
			newY = this.maxScrollY;
			this.keyAcceleration = 0;
		}

		this.scrollTo(newX, newY, 0);

		this.keyTime = now;
	},

	_animate: function (destX, destY, duration, easingFn) {
		var that = this,
			startX = this.x,
			startY = this.y,
			startTime = utils.getTime(),
			destTime = startTime + duration;

		function step () {
			var now = utils.getTime(),
				newX, newY,
				easing;

			if ( now >= destTime ) {
				that.isAnimating = false;
				that._translate(destX, destY);

				if ( !that.resetPosition(that.options.bounceTime) ) {
					that._execEvent('scrollEnd');
				}

				return;
			}

			now = ( now - startTime ) / duration;
			easing = easingFn(now);
			newX = ( destX - startX ) * easing + startX;
			newY = ( destY - startY ) * easing + startY;
			that._translate(newX, newY);

			if ( that.isAnimating ) {
				rAF(step);
			}
		}

		this.isAnimating = true;
		step();
	},
	handleEvent: function (e) {
		switch ( e.type ) {
			case 'touchstart':
			case 'pointerdown':
			case 'MSPointerDown':
			case 'mousedown':
				this._start(e);
				break;
			case 'touchmove':
			case 'pointermove':
			case 'MSPointerMove':
			case 'mousemove':
				this._move(e);
				break;
			case 'touchend':
			case 'pointerup':
			case 'MSPointerUp':
			case 'mouseup':
			case 'touchcancel':
			case 'pointercancel':
			case 'MSPointerCancel':
			case 'mousecancel':
				this._end(e);
				break;
			case 'orientationchange':
			case 'resize':
				this._resize();
				break;
			case 'transitionend':
			case 'webkitTransitionEnd':
			case 'oTransitionEnd':
			case 'MSTransitionEnd':
				this._transitionEnd(e);
				break;
			case 'wheel':
			case 'DOMMouseScroll':
			case 'mousewheel':
				this._wheel(e);
				break;
			case 'keydown':
				this._key(e);
				break;
			case 'click':
				if ( !e._constructed ) {
					e.preventDefault();
					e.stopPropagation();
				}
				break;
		}
	}
};
function createDefaultScrollbar (direction, interactive, type) {
	var scrollbar = document.createElement('div'),
		indicator = document.createElement('div');

	if ( type === true ) {
		scrollbar.style.cssText = 'position:absolute;z-index:9999';
		indicator.style.cssText = '-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;position:absolute;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);border-radius:3px';
	}

	indicator.className = 'iScrollIndicator';

	if ( direction == 'h' ) {
		if ( type === true ) {
			scrollbar.style.cssText += ';height:7px;left:2px;right:2px;bottom:0';
			indicator.style.height = '100%';
		}
		scrollbar.className = 'iScrollHorizontalScrollbar';
	} else {
		if ( type === true ) {
			scrollbar.style.cssText += ';width:7px;bottom:2px;top:2px;right:1px';
			indicator.style.width = '100%';
		}
		scrollbar.className = 'iScrollVerticalScrollbar';
	}

	scrollbar.style.cssText += ';overflow:hidden';

	if ( !interactive ) {
		scrollbar.style.pointerEvents = 'none';
	}

	scrollbar.appendChild(indicator);

	return scrollbar;
}

function Indicator (scroller, options) {
	this.wrapper = typeof options.el == 'string' ? document.querySelector(options.el) : options.el;
	this.wrapperStyle = this.wrapper.style;
	this.indicator = this.wrapper.children[0];
	this.indicatorStyle = this.indicator.style;
	this.scroller = scroller;

	this.options = {
		listenX: true,
		listenY: true,
		interactive: false,
		resize: true,
		defaultScrollbars: false,
		shrink: false,
		fade: false,
		speedRatioX: 0,
		speedRatioY: 0
	};

	for ( var i in options ) {
		this.options[i] = options[i];
	}

	this.sizeRatioX = 1;
	this.sizeRatioY = 1;
	this.maxPosX = 0;
	this.maxPosY = 0;

	if ( this.options.interactive ) {
		if ( !this.options.disableTouch ) {
			utils.addEvent(this.indicator, 'touchstart', this);
			utils.addEvent(window, 'touchend', this);
		}
		if ( !this.options.disablePointer ) {
			utils.addEvent(this.indicator, utils.prefixPointerEvent('pointerdown'), this);
			utils.addEvent(window, utils.prefixPointerEvent('pointerup'), this);
		}
		if ( !this.options.disableMouse ) {
			utils.addEvent(this.indicator, 'mousedown', this);
			utils.addEvent(window, 'mouseup', this);
		}
	}

	if ( this.options.fade ) {
		this.wrapperStyle[utils.style.transform] = this.scroller.translateZ;
		this.wrapperStyle[utils.style.transitionDuration] = utils.isBadAndroid ? '0.001s' : '0ms';
		this.wrapperStyle.opacity = '0';
	}
}

Indicator.prototype = {
	handleEvent: function (e) {
		switch ( e.type ) {
			case 'touchstart':
			case 'pointerdown':
			case 'MSPointerDown':
			case 'mousedown':
				this._start(e);
				break;
			case 'touchmove':
			case 'pointermove':
			case 'MSPointerMove':
			case 'mousemove':
				this._move(e);
				break;
			case 'touchend':
			case 'pointerup':
			case 'MSPointerUp':
			case 'mouseup':
			case 'touchcancel':
			case 'pointercancel':
			case 'MSPointerCancel':
			case 'mousecancel':
				this._end(e);
				break;
		}
	},

	destroy: function () {
		if ( this.options.interactive ) {
			utils.removeEvent(this.indicator, 'touchstart', this);
			utils.removeEvent(this.indicator, utils.prefixPointerEvent('pointerdown'), this);
			utils.removeEvent(this.indicator, 'mousedown', this);

			utils.removeEvent(window, 'touchmove', this);
			utils.removeEvent(window, utils.prefixPointerEvent('pointermove'), this);
			utils.removeEvent(window, 'mousemove', this);

			utils.removeEvent(window, 'touchend', this);
			utils.removeEvent(window, utils.prefixPointerEvent('pointerup'), this);
			utils.removeEvent(window, 'mouseup', this);
		}

		if ( this.options.defaultScrollbars ) {
			this.wrapper.parentNode.removeChild(this.wrapper);
		}
	},

	_start: function (e) {
		var point = e.touches ? e.touches[0] : e;

		e.preventDefault();
		e.stopPropagation();

		this.transitionTime();

		this.initiated = true;
		this.moved = false;
		this.lastPointX	= point.pageX;
		this.lastPointY	= point.pageY;

		this.startTime	= utils.getTime();

		if ( !this.options.disableTouch ) {
			utils.addEvent(window, 'touchmove', this);
		}
		if ( !this.options.disablePointer ) {
			utils.addEvent(window, utils.prefixPointerEvent('pointermove'), this);
		}
		if ( !this.options.disableMouse ) {
			utils.addEvent(window, 'mousemove', this);
		}

		this.scroller._execEvent('beforeScrollStart');
	},

	_move: function (e) {
		var point = e.touches ? e.touches[0] : e,
			deltaX, deltaY,
			newX, newY,
			timestamp = utils.getTime();

		if ( !this.moved ) {
			this.scroller._execEvent('scrollStart');
		}

		this.moved = true;

		deltaX = point.pageX - this.lastPointX;
		this.lastPointX = point.pageX;

		deltaY = point.pageY - this.lastPointY;
		this.lastPointY = point.pageY;

		newX = this.x + deltaX;
		newY = this.y + deltaY;

		this._pos(newX, newY);

// INSERT POINT: indicator._move

		e.preventDefault();
		e.stopPropagation();
	},

	_end: function (e) {
		if ( !this.initiated ) {
			return;
		}

		this.initiated = false;

		e.preventDefault();
		e.stopPropagation();

		utils.removeEvent(window, 'touchmove', this);
		utils.removeEvent(window, utils.prefixPointerEvent('pointermove'), this);
		utils.removeEvent(window, 'mousemove', this);

		if ( this.scroller.options.snap ) {
			var snap = this.scroller._nearestSnap(this.scroller.x, this.scroller.y);

			var time = this.options.snapSpeed || Math.max(
					Math.max(
						Math.min(Math.abs(this.scroller.x - snap.x), 1000),
						Math.min(Math.abs(this.scroller.y - snap.y), 1000)
					), 300);

			if ( this.scroller.x != snap.x || this.scroller.y != snap.y ) {
				this.scroller.directionX = 0;
				this.scroller.directionY = 0;
				this.scroller.currentPage = snap;
				this.scroller.scrollTo(snap.x, snap.y, time, this.scroller.options.bounceEasing);
			}
		}

		if ( this.moved ) {
			this.scroller._execEvent('scrollEnd');
		}
	},

	transitionTime: function (time) {
		time = time || 0;
		this.indicatorStyle[utils.style.transitionDuration] = time + 'ms';

		if ( !time && utils.isBadAndroid ) {
			this.indicatorStyle[utils.style.transitionDuration] = '0.001s';
		}
	},

	transitionTimingFunction: function (easing) {
		this.indicatorStyle[utils.style.transitionTimingFunction] = easing;
	},

	refresh: function () {
		this.transitionTime();

		if ( this.options.listenX && !this.options.listenY ) {
			this.indicatorStyle.display = this.scroller.hasHorizontalScroll ? 'block' : 'none';
		} else if ( this.options.listenY && !this.options.listenX ) {
			this.indicatorStyle.display = this.scroller.hasVerticalScroll ? 'block' : 'none';
		} else {
			this.indicatorStyle.display = this.scroller.hasHorizontalScroll || this.scroller.hasVerticalScroll ? 'block' : 'none';
		}

		if ( this.scroller.hasHorizontalScroll && this.scroller.hasVerticalScroll ) {
			utils.addClass(this.wrapper, 'iScrollBothScrollbars');
			utils.removeClass(this.wrapper, 'iScrollLoneScrollbar');

			if ( this.options.defaultScrollbars && this.options.customStyle ) {
				if ( this.options.listenX ) {
					this.wrapper.style.right = '8px';
				} else {
					this.wrapper.style.bottom = '8px';
				}
			}
		} else {
			utils.removeClass(this.wrapper, 'iScrollBothScrollbars');
			utils.addClass(this.wrapper, 'iScrollLoneScrollbar');

			if ( this.options.defaultScrollbars && this.options.customStyle ) {
				if ( this.options.listenX ) {
					this.wrapper.style.right = '2px';
				} else {
					this.wrapper.style.bottom = '2px';
				}
			}
		}

		var r = this.wrapper.offsetHeight;	// force refresh

		if ( this.options.listenX ) {
			this.wrapperWidth = this.wrapper.clientWidth;
			if ( this.options.resize ) {
				this.indicatorWidth = Math.max(Math.round(this.wrapperWidth * this.wrapperWidth / (this.scroller.scrollerWidth || this.wrapperWidth || 1)), 8);
				this.indicatorStyle.width = this.indicatorWidth + 'px';
			} else {
				this.indicatorWidth = this.indicator.clientWidth;
			}

			this.maxPosX = this.wrapperWidth - this.indicatorWidth;

			if ( this.options.shrink == 'clip' ) {
				this.minBoundaryX = -this.indicatorWidth + 8;
				this.maxBoundaryX = this.wrapperWidth - 8;
			} else {
				this.minBoundaryX = 0;
				this.maxBoundaryX = this.maxPosX;
			}

			this.sizeRatioX = this.options.speedRatioX || (this.scroller.maxScrollX && (this.maxPosX / this.scroller.maxScrollX));	
		}

		if ( this.options.listenY ) {
			this.wrapperHeight = this.wrapper.clientHeight;
			if ( this.options.resize ) {
				this.indicatorHeight = Math.max(Math.round(this.wrapperHeight * this.wrapperHeight / (this.scroller.scrollerHeight || this.wrapperHeight || 1)), 8);
				this.indicatorStyle.height = this.indicatorHeight + 'px';
			} else {
				this.indicatorHeight = this.indicator.clientHeight;
			}

			this.maxPosY = this.wrapperHeight - this.indicatorHeight;

			if ( this.options.shrink == 'clip' ) {
				this.minBoundaryY = -this.indicatorHeight + 8;
				this.maxBoundaryY = this.wrapperHeight - 8;
			} else {
				this.minBoundaryY = 0;
				this.maxBoundaryY = this.maxPosY;
			}

			this.maxPosY = this.wrapperHeight - this.indicatorHeight;
			this.sizeRatioY = this.options.speedRatioY || (this.scroller.maxScrollY && (this.maxPosY / this.scroller.maxScrollY));
		}

		this.updatePosition();
	},

	updatePosition: function () {
		var x = this.options.listenX && Math.round(this.sizeRatioX * this.scroller.x) || 0,
			y = this.options.listenY && Math.round(this.sizeRatioY * this.scroller.y) || 0;

		if ( !this.options.ignoreBoundaries ) {
			if ( x < this.minBoundaryX ) {
				if ( this.options.shrink == 'scale' ) {
					this.width = Math.max(this.indicatorWidth + x, 8);
					this.indicatorStyle.width = this.width + 'px';
				}
				x = this.minBoundaryX;
			} else if ( x > this.maxBoundaryX ) {
				if ( this.options.shrink == 'scale' ) {
					this.width = Math.max(this.indicatorWidth - (x - this.maxPosX), 8);
					this.indicatorStyle.width = this.width + 'px';
					x = this.maxPosX + this.indicatorWidth - this.width;
				} else {
					x = this.maxBoundaryX;
				}
			} else if ( this.options.shrink == 'scale' && this.width != this.indicatorWidth ) {
				this.width = this.indicatorWidth;
				this.indicatorStyle.width = this.width + 'px';
			}

			if ( y < this.minBoundaryY ) {
				if ( this.options.shrink == 'scale' ) {
					this.height = Math.max(this.indicatorHeight + y * 3, 8);
					this.indicatorStyle.height = this.height + 'px';
				}
				y = this.minBoundaryY;
			} else if ( y > this.maxBoundaryY ) {
				if ( this.options.shrink == 'scale' ) {
					this.height = Math.max(this.indicatorHeight - (y - this.maxPosY) * 3, 8);
					this.indicatorStyle.height = this.height + 'px';
					y = this.maxPosY + this.indicatorHeight - this.height;
				} else {
					y = this.maxBoundaryY;
				}
			} else if ( this.options.shrink == 'scale' && this.height != this.indicatorHeight ) {
				this.height = this.indicatorHeight;
				this.indicatorStyle.height = this.height + 'px';
			}
		}

		this.x = x;
		this.y = y;

		if ( this.scroller.options.useTransform ) {
			this.indicatorStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.scroller.translateZ;
		} else {
			this.indicatorStyle.left = x + 'px';
			this.indicatorStyle.top = y + 'px';
		}
	},

	_pos: function (x, y) {
		if ( x < 0 ) {
			x = 0;
		} else if ( x > this.maxPosX ) {
			x = this.maxPosX;
		}

		if ( y < 0 ) {
			y = 0;
		} else if ( y > this.maxPosY ) {
			y = this.maxPosY;
		}

		x = this.options.listenX ? Math.round(x / this.sizeRatioX) : this.scroller.x;
		y = this.options.listenY ? Math.round(y / this.sizeRatioY) : this.scroller.y;

		this.scroller.scrollTo(x, y);
	},

	fade: function (val, hold) {
		if ( hold && !this.visible ) {
			return;
		}

		clearTimeout(this.fadeTimeout);
		this.fadeTimeout = null;

		var time = val ? 250 : 500,
			delay = val ? 0 : 300;

		val = val ? '1' : '0';

		this.wrapperStyle[utils.style.transitionDuration] = time + 'ms';

		this.fadeTimeout = setTimeout((function (val) {
			this.wrapperStyle.opacity = val;
			this.visible = +val;
		}).bind(this, val), delay);
	}
};

IScroll.utils = utils;

if ( typeof module != 'undefined' && module.exports ) {
	module.exports = IScroll;
} else {
	window.IScroll = IScroll;
}

})(window, document, Math);/*!
* jScrollPane - v2.0.19 - 2013-11-16
* http://jscrollpane.kelvinluck.com/
*
* Copyright (c) 2013 Kelvin Luck
* Dual licensed under the MIT or GPL licenses.
*/

// Script: jScrollPane - cross browser customisable scrollbars
//
// *Version: 2.0.19, Last updated: 2013-11-16*
//
// Project Home - http://jscrollpane.kelvinluck.com/
// GitHub       - http://github.com/vitch/jScrollPane
// Source       - http://github.com/vitch/jScrollPane/raw/master/script/jquery.jscrollpane.js
// (Minified)   - http://github.com/vitch/jScrollPane/raw/master/script/jquery.jscrollpane.min.js
//
// About: License
//
// Copyright (c) 2013 Kelvin Luck
// Dual licensed under the MIT or GPL Version 2 licenses.
// http://jscrollpane.kelvinluck.com/MIT-LICENSE.txt
// http://jscrollpane.kelvinluck.com/GPL-LICENSE.txt
//
// About: Examples
//
// All examples and demos are available through the jScrollPane example site at:
// http://jscrollpane.kelvinluck.com/
//
// About: Support and Testing
//
// This plugin is tested on the browsers below and has been found to work reliably on them. If you run
// into a problem on one of the supported browsers then please visit the support section on the jScrollPane
// website (http://jscrollpane.kelvinluck.com/) for more information on getting support. You are also
// welcome to fork the project on GitHub if you can contribute a fix for a given issue. 
//
// jQuery Versions - tested in 1.4.2+ - reported to work in 1.3.x
// Browsers Tested - Firefox 3.6.8, Safari 5, Opera 10.6, Chrome 5.0, IE 6, 7, 8
//
// About: Release History
//
// 2.0.19 - (2013-11-16) Changes for more reliable scroll amount with latest mousewheel plugin (thanks @brandonaaron)
// 2.0.18 - (2013-10-23) Fix for issue with gutters and scrollToElement (thanks @Dubiy)
// 2.0.17 - (2013-08-17) Working correctly when box-sizing is set to border-box (thanks @pieht)
// 2.0.16 - (2013-07-30) Resetting left position when scroll is removed. Fixes #189
// 2.0.15 - (2013-07-29) Fixed issue with scrollToElement where the destX and destY are undefined.
// 2.0.14 - (2013-05-01) Updated to most recent mouse wheel plugin (see #106) and related changes for sensible scroll speed
// 2.0.13 - (2013-05-01) Switched to semver compatible version name
// 2.0.0beta12 - (2012-09-27) fix for jQuery 1.8+
// 2.0.0beta11 - (2012-05-14)
// 2.0.0beta10 - (2011-04-17) cleaner required size calculation, improved keyboard support, stickToBottom/Left, other small fixes
// 2.0.0beta9 - (2011-01-31) new API methods, bug fixes and correct keyboard support for FF/OSX
// 2.0.0beta8 - (2011-01-29) touchscreen support, improved keyboard support
// 2.0.0beta7 - (2011-01-23) scroll speed consistent (thanks Aivo Paas)
// 2.0.0beta6 - (2010-12-07) scrollToElement horizontal support
// 2.0.0beta5 - (2010-10-18) jQuery 1.4.3 support, various bug fixes
// 2.0.0beta4 - (2010-09-17) clickOnTrack support, bug fixes
// 2.0.0beta3 - (2010-08-27) Horizontal mousewheel, mwheelIntent, keyboard support, bug fixes
// 2.0.0beta2 - (2010-08-21) Bug fixes
// 2.0.0beta1 - (2010-08-17) Rewrite to follow modern best practices and enable horizontal scrolling, initially hidden
//                           elements and dynamically sized elements.
// 1.x - (2006-12-31 - 2010-07-31) Initial version, hosted at googlecode, deprecated

(function (plugin, window) {
    var factory = function ($) {
        return plugin($, window);
    }
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS style for Browserify
        module.exports = factory;
    } else {
        // Browser globals
        factory(jQuery);
    }
} (function ($, window, undefined) {

    $.fn.jScrollPane = function (settings) {
        // JScrollPane "class" - public methods are available through $('selector').data('jsp')
        function JScrollPane(elem, s) {
            var settings, jsp = this, pane, paneWidth, paneHeight, container, contentWidth, contentHeight,
                percentInViewH, percentInViewV, isScrollableV, isScrollableH, verticalDrag, dragMaxY,
                verticalDragPosition, horizontalDrag, dragMaxX, horizontalDragPosition,
                verticalBar, verticalTrack, scrollbarWidth, verticalTrackHeight, verticalDragHeight, arrowUp, arrowDown,
                horizontalBar, horizontalTrack, horizontalTrackWidth, horizontalDragWidth, arrowLeft, arrowRight,
                reinitialiseInterval, originalPadding, originalPaddingTotalWidth, previousContentWidth,
                wasAtTop = true, wasAtLeft = true, wasAtBottom = false, wasAtRight = false,
                originalElement = elem.clone(false, false).empty(),
                mwEvent = $.fn.mwheelIntent ? 'mwheelIntent.jsp' : 'mousewheel.jsp';

            if (elem.css('box-sizing') === 'border-box') {
                originalPadding = 0;
                originalPaddingTotalWidth = 0;
            } else {
                originalPadding = elem.css('paddingTop') + ' ' +
                                    elem.css('paddingRight') + ' ' +
                                    elem.css('paddingBottom') + ' ' +
                                    elem.css('paddingLeft');
                originalPaddingTotalWidth = (parseInt(elem.css('paddingLeft'), 10) || 0) +
                                            (parseInt(elem.css('paddingRight'), 10) || 0);
            }

            function initialise(s) {

                var /*firstChild, lastChild, */isMaintainingPositon, lastContentX, lastContentY,
                        hasContainingSpaceChanged, originalScrollTop, originalScrollLeft,
                        maintainAtBottom = false, maintainAtRight = false;

                settings = s;

                if (pane === undefined) {
                    originalScrollTop = elem.scrollTop();
                    originalScrollLeft = elem.scrollLeft();

                    elem.css(
                        {
                            overflow: 'hidden',
                            padding: 0
                        }
                    );
                    // TODO: Deal with where width/ height is 0 as it probably means the element is hidden and we should
                    // come back to it later and check once it is unhidden...
                    paneWidth = elem.innerWidth() + originalPaddingTotalWidth;
                    paneHeight = elem.innerHeight();

                    elem.width(paneWidth);

                    pane = $('<div class="jspPane" />').css('padding', originalPadding).append(elem.children());
                    container = $('<div class="jspContainer" />')
                        .css({
                            'width': paneWidth + 'px',
                            'height': paneHeight + 'px'
                        }
                    ).append(pane).appendTo(elem);

                    /*
                    // Move any margins from the first and last children up to the container so they can still
                    // collapse with neighbouring elements as they would before jScrollPane 
                    firstChild = pane.find(':first-child');
                    lastChild = pane.find(':last-child');
                    elem.css(
                    {
                    'margin-top': firstChild.css('margin-top'),
                    'margin-bottom': lastChild.css('margin-bottom')
                    }
                    );
                    firstChild.css('margin-top', 0);
                    lastChild.css('margin-bottom', 0);
                    */
                } else {
                    elem.css('width', '');

                    maintainAtBottom = settings.stickToBottom && isCloseToBottom();
                    maintainAtRight = settings.stickToRight && isCloseToRight();

                    hasContainingSpaceChanged = elem.innerWidth() + originalPaddingTotalWidth != paneWidth || elem.outerHeight() != paneHeight;

                    if (hasContainingSpaceChanged) {
                        paneWidth = elem.innerWidth() + originalPaddingTotalWidth;
                        paneHeight = elem.innerHeight();
                        container.css({
                            width: paneWidth + 'px',
                            height: paneHeight + 'px'
                        });
                    }

                    // If nothing changed since last check...
                    if (!hasContainingSpaceChanged && previousContentWidth == contentWidth && pane.outerHeight() == contentHeight) {
                        elem.width(paneWidth);
                        return;
                    }
                    previousContentWidth = contentWidth;

                    pane.css('width', '');
                    elem.width(paneWidth);

                    container.find('>.jspVerticalBar,>.jspHorizontalBar').remove().end();
                }

                pane.css('overflow', 'auto');
                if (s.contentWidth) {
                    contentWidth = s.contentWidth;
                } else {
                    contentWidth = pane[0].scrollWidth;
                }
                contentHeight = pane[0].scrollHeight;
                pane.css('overflow', '');

                percentInViewH = contentWidth / paneWidth;
                percentInViewV = contentHeight / paneHeight;
                isScrollableV = percentInViewV > 1;

                isScrollableH = percentInViewH > 1;

                //console.log(paneWidth, paneHeight, contentWidth, contentHeight, percentInViewH, percentInViewV, isScrollableH, isScrollableV);

                if (!(isScrollableH || isScrollableV)) {
                    elem.removeClass('jspScrollable');
                    pane.css({
                        top: 0,
                        left: 0,
                        width: container.width() - originalPaddingTotalWidth
                    });
                    removeMousewheel();
                    removeFocusHandler();
                    removeKeyboardNav();
                    removeClickOnTrack();
                } else {
                    elem.addClass('jspScrollable');

                    isMaintainingPositon = settings.maintainPosition && (verticalDragPosition || horizontalDragPosition);
                    if (isMaintainingPositon) {
                        lastContentX = contentPositionX();
                        lastContentY = contentPositionY();
                    }

                    initialiseVerticalScroll();
                    initialiseHorizontalScroll();
                    resizeScrollbars();

                    if (isMaintainingPositon) {
                        scrollToX(maintainAtRight ? (contentWidth - paneWidth) : lastContentX, false);
                        scrollToY(maintainAtBottom ? (contentHeight - paneHeight) : lastContentY, false);
                    }

                    initFocusHandler();
                    initMousewheel();
                    initTouch();

                    if (settings.enableKeyboardNavigation) {
                        initKeyboardNav();
                    }
                    if (settings.clickOnTrack) {
                        initClickOnTrack();
                    }

                    observeHash();
                    if (settings.hijackInternalLinks) {
                        hijackInternalLinks();
                    }
                }

                if (settings.autoReinitialise && !reinitialiseInterval) {
                    reinitialiseInterval = setInterval(
                        function () {
                            initialise(settings);
                        },
                        settings.autoReinitialiseDelay
                    );
                } else if (!settings.autoReinitialise && reinitialiseInterval) {
                    clearInterval(reinitialiseInterval);
                }

                originalScrollTop && elem.scrollTop(0) && scrollToY(originalScrollTop, false);
                originalScrollLeft && elem.scrollLeft(0) && scrollToX(originalScrollLeft, false);

                elem.trigger('jsp-initialised', [isScrollableH || isScrollableV]);
            }

            function initialiseVerticalScroll() {
                if (isScrollableV) {

                    container.append(
                        $('<div class="jspVerticalBar" />').append(
                            $('<div class="jspCap jspCapTop" />'),
                            $('<div class="jspTrack" />').append(
                                $('<div class="jspDrag" />').append(
                                    $('<div class="jspDragTop" />'),
                                    $('<div class="jspDragBottom" />')
                                )
                            ),
                            $('<div class="jspCap jspCapBottom" />')
                        )
                    );

                    verticalBar = container.find('>.jspVerticalBar');
                    verticalTrack = verticalBar.find('>.jspTrack');
                    verticalDrag = verticalTrack.find('>.jspDrag');

                    if (settings.showArrows) {
                        arrowUp = $('<a class="jspArrow jspArrowUp" />').bind(
                            'mousedown.jsp', getArrowScroll(0, -1)
                        ).bind('click.jsp', nil);
                        arrowDown = $('<a class="jspArrow jspArrowDown" />').bind(
                            'mousedown.jsp', getArrowScroll(0, 1)
                        ).bind('click.jsp', nil);
                        if (settings.arrowScrollOnHover) {
                            arrowUp.bind('mouseover.jsp', getArrowScroll(0, -1, arrowUp));
                            arrowDown.bind('mouseover.jsp', getArrowScroll(0, 1, arrowDown));
                        }

                        appendArrows(verticalTrack, settings.verticalArrowPositions, arrowUp, arrowDown);
                    }

                    verticalTrackHeight = paneHeight;
                    container.find('>.jspVerticalBar>.jspCap:visible,>.jspVerticalBar>.jspArrow').each(
                        function () {
                            verticalTrackHeight -= $(this).outerHeight();
                        }
                    );


                    verticalDrag.hover(
                        function () {
                            verticalDrag.addClass('jspHover');
                        },
                        function () {
                            verticalDrag.removeClass('jspHover');
                        }
                    ).bind(
                        'mousedown.jsp',
                        function (e) {
                            // Stop IE from allowing text selection
                            $('html').bind('dragstart.jsp selectstart.jsp', nil);

                            verticalDrag.addClass('jspActive');

                            var startY = e.pageY - verticalDrag.position().top;

                            $('html').bind(
                                'mousemove.jsp',
                                function (e) {
                                    positionDragY(e.pageY - startY, false);
                                }
                            ).bind('mouseup.jsp mouseleave.jsp', cancelDrag);
                            return false;
                        }
                    );
                    sizeVerticalScrollbar();
                }
            }

            function sizeVerticalScrollbar() {
                verticalTrack.height(verticalTrackHeight + 'px');
                verticalDragPosition = 0;
                scrollbarWidth = settings.verticalGutter + verticalTrack.outerWidth();

                // Make the pane thinner to allow for the vertical scrollbar
                pane.width(paneWidth - scrollbarWidth - originalPaddingTotalWidth);

                // Add margin to the left of the pane if scrollbars are on that side (to position
                // the scrollbar on the left or right set it's left or right property in CSS)
                try {
                    if (verticalBar.position().left === 0) {
                        pane.css('margin-left', scrollbarWidth + 'px');
                    }
                } catch (err) {
                }
            }

            function initialiseHorizontalScroll() {
                if (isScrollableH) {

                    container.append(
                        $('<div class="jspHorizontalBar" />').append(
                            $('<div class="jspCap jspCapLeft" />'),
                            $('<div class="jspTrack" />').append(
                                $('<div class="jspDrag" />').append(
                                    $('<div class="jspDragLeft" />'),
                                    $('<div class="jspDragRight" />')
                                )
                            ),
                            $('<div class="jspCap jspCapRight" />')
                        )
                    );

                    horizontalBar = container.find('>.jspHorizontalBar');
                    horizontalTrack = horizontalBar.find('>.jspTrack');
                    horizontalDrag = horizontalTrack.find('>.jspDrag');

                    if (settings.showArrows) {
                        arrowLeft = $('<a class="jspArrow jspArrowLeft" />').bind(
                            'mousedown.jsp', getArrowScroll(-1, 0)
                        ).bind('click.jsp', nil);
                        arrowRight = $('<a class="jspArrow jspArrowRight" />').bind(
                            'mousedown.jsp', getArrowScroll(1, 0)
                        ).bind('click.jsp', nil);
                        if (settings.arrowScrollOnHover) {
                            arrowLeft.bind('mouseover.jsp', getArrowScroll(-1, 0, arrowLeft));
                            arrowRight.bind('mouseover.jsp', getArrowScroll(1, 0, arrowRight));
                        }
                        appendArrows(horizontalTrack, settings.horizontalArrowPositions, arrowLeft, arrowRight);
                    }

                    horizontalDrag.hover(
                        function () {
                            horizontalDrag.addClass('jspHover');
                        },
                        function () {
                            horizontalDrag.removeClass('jspHover');
                        }
                    ).bind(
                        'mousedown.jsp',
                        function (e) {
                            // Stop IE from allowing text selection
                            $('html').bind('dragstart.jsp selectstart.jsp', nil);

                            horizontalDrag.addClass('jspActive');

                            var startX = e.pageX - horizontalDrag.position().left;

                            $('html').bind(
                                'mousemove.jsp',
                                function (e) {
                                    positionDragX(e.pageX - startX, false);
                                }
                            ).bind('mouseup.jsp mouseleave.jsp', cancelDrag);
                            return false;
                        }
                    );
                    horizontalTrackWidth = container.innerWidth();
                    sizeHorizontalScrollbar();
                }
            }

            function sizeHorizontalScrollbar() {
                container.find('>.jspHorizontalBar>.jspCap:visible,>.jspHorizontalBar>.jspArrow').each(
                    function () {
                        horizontalTrackWidth -= $(this).outerWidth();
                    }
                );

                horizontalTrack.width(horizontalTrackWidth + 'px');
                horizontalDragPosition = 0;
            }

            function resizeScrollbars() {
                if (isScrollableH && isScrollableV) {
                    var horizontalTrackHeight = horizontalTrack.outerHeight(),
                        verticalTrackWidth = verticalTrack.outerWidth();
                    verticalTrackHeight -= horizontalTrackHeight;
                    $(horizontalBar).find('>.jspCap:visible,>.jspArrow').each(
                        function () {
                            horizontalTrackWidth += $(this).outerWidth();
                        }
                    );
                    horizontalTrackWidth -= verticalTrackWidth;
                    paneHeight -= verticalTrackWidth;
                    paneWidth -= horizontalTrackHeight;
                    horizontalTrack.parent().append(
                        $('<div class="jspCorner" />').css('width', horizontalTrackHeight + 'px')
                    );
                    sizeVerticalScrollbar();
                    sizeHorizontalScrollbar();
                }
                // reflow content
                if (isScrollableH) {
                    pane.width((container.outerWidth() - originalPaddingTotalWidth) + 'px');
                }
                contentHeight = pane.outerHeight();
                percentInViewV = contentHeight / paneHeight;

                if (isScrollableH) {
                    horizontalDragWidth = Math.ceil(1 / percentInViewH * horizontalTrackWidth);
                    if (horizontalDragWidth > settings.horizontalDragMaxWidth) {
                        horizontalDragWidth = settings.horizontalDragMaxWidth;
                    } else if (horizontalDragWidth < settings.horizontalDragMinWidth) {
                        horizontalDragWidth = settings.horizontalDragMinWidth;
                    }
                    horizontalDrag.width(horizontalDragWidth + 'px');
                    dragMaxX = horizontalTrackWidth - horizontalDragWidth;
                    _positionDragX(horizontalDragPosition); // To update the state for the arrow buttons
                }
                if (isScrollableV) {
                    verticalDragHeight = Math.ceil(1 / percentInViewV * verticalTrackHeight);
                    if (verticalDragHeight > settings.verticalDragMaxHeight) {
                        verticalDragHeight = settings.verticalDragMaxHeight;
                    } else if (verticalDragHeight < settings.verticalDragMinHeight) {
                        verticalDragHeight = settings.verticalDragMinHeight;
                    }
                    verticalDrag.height(verticalDragHeight + 'px');
                    dragMaxY = verticalTrackHeight - verticalDragHeight;
                    _positionDragY(verticalDragPosition); // To update the state for the arrow buttons
                }
            }

            function appendArrows(ele, p, a1, a2) {
                var p1 = "before", p2 = "after", aTemp;

                // Sniff for mac... Is there a better way to determine whether the arrows would naturally appear
                // at the top or the bottom of the bar?
                if (p == "os") {
                    p = /Mac/.test(navigator.platform) ? "after" : "split";
                }
                if (p == p1) {
                    p2 = p;
                } else if (p == p2) {
                    p1 = p;
                    aTemp = a1;
                    a1 = a2;
                    a2 = aTemp;
                }

                ele[p1](a1)[p2](a2);
            }

            function getArrowScroll(dirX, dirY, ele) {
                return function () {
                    arrowScroll(dirX, dirY, this, ele);
                    this.blur();
                    return false;
                };
            }

            function arrowScroll(dirX, dirY, arrow, ele) {
                arrow = $(arrow).addClass('jspActive');

                var eve,
                    scrollTimeout,
                    isFirst = true,
                    doScroll = function () {
                        if (dirX !== 0) {
                            jsp.scrollByX(dirX * settings.arrowButtonSpeed);
                        }
                        if (dirY !== 0) {
                            jsp.scrollByY(dirY * settings.arrowButtonSpeed);
                        }
                        scrollTimeout = setTimeout(doScroll, isFirst ? settings.initialDelay : settings.arrowRepeatFreq);
                        isFirst = false;
                    };

                doScroll();

                eve = ele ? 'mouseout.jsp' : 'mouseup.jsp';
                ele = ele || $('html');
                ele.bind(
                    eve,
                    function () {
                        arrow.removeClass('jspActive');
                        scrollTimeout && clearTimeout(scrollTimeout);
                        scrollTimeout = null;
                        ele.unbind(eve);
                    }
                );
            }

            function initClickOnTrack() {
                removeClickOnTrack();
                if (isScrollableV) {
                    verticalTrack.bind(
                        'mousedown.jsp',
                        function (e) {
                            if (e.originalTarget === undefined || e.originalTarget == e.currentTarget) {
                                var clickedTrack = $(this),
                                    offset = clickedTrack.offset(),
                                    direction = e.pageY - offset.top - verticalDragPosition,
                                    scrollTimeout,
                                    isFirst = true,
                                    doScroll = function () {
                                        var offset = clickedTrack.offset(),
                                            pos = e.pageY - offset.top - verticalDragHeight / 2,
                                            contentDragY = paneHeight * settings.scrollPagePercent,
                                            dragY = dragMaxY * contentDragY / (contentHeight - paneHeight);
                                        if (direction < 0) {
                                            if (verticalDragPosition - dragY > pos) {
                                                jsp.scrollByY(-contentDragY);
                                            } else {
                                                positionDragY(pos);
                                            }
                                        } else if (direction > 0) {
                                            if (verticalDragPosition + dragY < pos) {
                                                jsp.scrollByY(contentDragY);
                                            } else {
                                                positionDragY(pos);
                                            }
                                        } else {
                                            cancelClick();
                                            return;
                                        }
                                        scrollTimeout = setTimeout(doScroll, isFirst ? settings.initialDelay : settings.trackClickRepeatFreq);
                                        isFirst = false;
                                    },
                                    cancelClick = function () {
                                        scrollTimeout && clearTimeout(scrollTimeout);
                                        scrollTimeout = null;
                                        $(document).unbind('mouseup.jsp', cancelClick);
                                    };
                                doScroll();
                                $(document).bind('mouseup.jsp', cancelClick);
                                return false;
                            }
                        }
                    );
                }

                if (isScrollableH) {
                    horizontalTrack.bind(
                        'mousedown.jsp',
                        function (e) {
                            if (e.originalTarget === undefined || e.originalTarget == e.currentTarget) {
                                var clickedTrack = $(this),
                                    offset = clickedTrack.offset(),
                                    direction = e.pageX - offset.left - horizontalDragPosition,
                                    scrollTimeout,
                                    isFirst = true,
                                    doScroll = function () {
                                        var offset = clickedTrack.offset(),
                                            pos = e.pageX - offset.left - horizontalDragWidth / 2,
                                            contentDragX = paneWidth * settings.scrollPagePercent,
                                            dragX = dragMaxX * contentDragX / (contentWidth - paneWidth);
                                        if (direction < 0) {
                                            if (horizontalDragPosition - dragX > pos) {
                                                jsp.scrollByX(-contentDragX);
                                            } else {
                                                positionDragX(pos);
                                            }
                                        } else if (direction > 0) {
                                            if (horizontalDragPosition + dragX < pos) {
                                                jsp.scrollByX(contentDragX);
                                            } else {
                                                positionDragX(pos);
                                            }
                                        } else {
                                            cancelClick();
                                            return;
                                        }
                                        scrollTimeout = setTimeout(doScroll, isFirst ? settings.initialDelay : settings.trackClickRepeatFreq);
                                        isFirst = false;
                                    },
                                    cancelClick = function () {
                                        scrollTimeout && clearTimeout(scrollTimeout);
                                        scrollTimeout = null;
                                        $(document).unbind('mouseup.jsp', cancelClick);
                                    };
                                doScroll();
                                $(document).bind('mouseup.jsp', cancelClick);
                                return false;
                            }
                        }
                    );
                }
            }

            function removeClickOnTrack() {
                if (horizontalTrack) {
                    horizontalTrack.unbind('mousedown.jsp');
                }
                if (verticalTrack) {
                    verticalTrack.unbind('mousedown.jsp');
                }
            }

            function cancelDrag() {
                $('html').unbind('dragstart.jsp selectstart.jsp mousemove.jsp mouseup.jsp mouseleave.jsp');

                if (verticalDrag) {
                    verticalDrag.removeClass('jspActive');
                }
                if (horizontalDrag) {
                    horizontalDrag.removeClass('jspActive');
                }
            }

            function positionDragY(destY, animate) {
                if (!isScrollableV) {
                    return;
                }
                if (destY < 0) {
                    destY = 0;
                } else if (destY > dragMaxY) {
                    destY = dragMaxY;
                }

                // can't just check if(animate) because false is a valid value that could be passed in...
                if (animate === undefined) {
                    animate = settings.animateScroll;
                }
                if (animate) {
                    jsp.animate(verticalDrag, 'top', destY, _positionDragY);
                } else {
                    verticalDrag.css('top', destY);
                    _positionDragY(destY);
                }

            }

            function _positionDragY(destY) {
                if (destY === undefined) {
                    destY = verticalDrag.position().top;
                }

                container.scrollTop(0);
                verticalDragPosition = destY;

                var isAtTop = verticalDragPosition === 0,
                    isAtBottom = verticalDragPosition == dragMaxY,
                    percentScrolled = destY / dragMaxY,
                    destTop = -percentScrolled * (contentHeight - paneHeight);

                if (wasAtTop != isAtTop || wasAtBottom != isAtBottom) {
                    wasAtTop = isAtTop;
                    wasAtBottom = isAtBottom;
                    elem.trigger('jsp-arrow-change', [wasAtTop, wasAtBottom, wasAtLeft, wasAtRight]);
                }

                updateVerticalArrows(isAtTop, isAtBottom);
                pane.css('top', destTop);
                elem.trigger('jsp-scroll-y', [-destTop, isAtTop, isAtBottom]).trigger('scroll');
            }

            function positionDragX(destX, animate) {
                if (!isScrollableH) {
                    return;
                }
                if (destX < 0) {
                    destX = 0;
                } else if (destX > dragMaxX) {
                    destX = dragMaxX;
                }

                if (animate === undefined) {
                    animate = settings.animateScroll;
                }
                if (animate) {
                    jsp.animate(horizontalDrag, 'left', destX, _positionDragX);
                } else {
                    horizontalDrag.css('left', destX);
                    _positionDragX(destX);
                }
            }

            function _positionDragX(destX) {
                if (destX === undefined) {
                    destX = horizontalDrag.position().left;
                }

                container.scrollTop(0);
                horizontalDragPosition = destX;

                var isAtLeft = horizontalDragPosition === 0,
                    isAtRight = horizontalDragPosition == dragMaxX,
                    percentScrolled = destX / dragMaxX,
                    destLeft = -percentScrolled * (contentWidth - paneWidth);

                if (wasAtLeft != isAtLeft || wasAtRight != isAtRight) {
                    wasAtLeft = isAtLeft;
                    wasAtRight = isAtRight;
                    elem.trigger('jsp-arrow-change', [wasAtTop, wasAtBottom, wasAtLeft, wasAtRight]);
                }

                updateHorizontalArrows(isAtLeft, isAtRight);
                pane.css('left', destLeft);
                elem.trigger('jsp-scroll-x', [-destLeft, isAtLeft, isAtRight]).trigger('scroll');
            }

            function updateVerticalArrows(isAtTop, isAtBottom) {
                if (settings.showArrows) {
                    arrowUp[isAtTop ? 'addClass' : 'removeClass']('jspDisabled');
                    arrowDown[isAtBottom ? 'addClass' : 'removeClass']('jspDisabled');
                }
            }

            function updateHorizontalArrows(isAtLeft, isAtRight) {
                if (settings.showArrows) {
                    arrowLeft[isAtLeft ? 'addClass' : 'removeClass']('jspDisabled');
                    arrowRight[isAtRight ? 'addClass' : 'removeClass']('jspDisabled');
                }
            }

            function scrollToY(destY, animate) {
                var percentScrolled = destY / (contentHeight - paneHeight);
                positionDragY(percentScrolled * dragMaxY, animate);
            }

            function scrollToX(destX, animate) {
                var percentScrolled = destX / (contentWidth - paneWidth);
                positionDragX(percentScrolled * dragMaxX, animate);
            }

            function scrollToElement(ele, stickToTop, animate) {
                var e, eleHeight, eleWidth, eleTop = 0, eleLeft = 0, viewportTop, viewportLeft, maxVisibleEleTop, maxVisibleEleLeft, destY, destX;

                // Legal hash values aren't necessarily legal jQuery selectors so we need to catch any
                // errors from the lookup...
                try {
                    e = $(ele);
                } catch (err) {
                    return;
                }
                eleHeight = e.outerHeight();
                eleWidth = e.outerWidth();

                container.scrollTop(0);
                container.scrollLeft(0);

                // loop through parents adding the offset top of any elements that are relatively positioned between
                // the focused element and the jspPane so we can get the true distance from the top
                // of the focused element to the top of the scrollpane...
                while (!e.is('.jspPane')) {
                    eleTop += e.position().top;
                    eleLeft += e.position().left;
                    e = e.offsetParent();
                    if (/^body|html$/i.test(e[0].nodeName)) {
                        // we ended up too high in the document structure. Quit!
                        return;
                    }
                }

                viewportTop = contentPositionY();
                maxVisibleEleTop = viewportTop + paneHeight;
                if (eleTop < viewportTop || stickToTop) { // element is above viewport
                    destY = eleTop - settings.horizontalGutter;
                } else if (eleTop + eleHeight > maxVisibleEleTop) { // element is below viewport
                    destY = eleTop - paneHeight + eleHeight + settings.horizontalGutter;
                }
                if (!isNaN(destY)) {
                    scrollToY(destY, animate);
                }

                viewportLeft = contentPositionX();
                maxVisibleEleLeft = viewportLeft + paneWidth;
                if (eleLeft < viewportLeft || stickToTop) { // element is to the left of viewport
                    destX = eleLeft - settings.horizontalGutter;
                } else if (eleLeft + eleWidth > maxVisibleEleLeft) { // element is to the right viewport
                    destX = eleLeft - paneWidth + eleWidth + settings.horizontalGutter;
                }
                if (!isNaN(destX)) {
                    scrollToX(destX, animate);
                }

            }

            function contentPositionX() {
                return -pane.position().left;
            }

            function contentPositionY() {
                return -pane.position().top;
            }

            function isCloseToBottom() {
                var scrollableHeight = contentHeight - paneHeight;
                return (scrollableHeight > 20) && (scrollableHeight - contentPositionY() < 10);
            }

            function isCloseToRight() {
                var scrollableWidth = contentWidth - paneWidth;
                return (scrollableWidth > 20) && (scrollableWidth - contentPositionX() < 10);
            }

            function initMousewheel() {
                container.unbind(mwEvent).bind(
                    mwEvent,
                    function (event, delta, deltaX, deltaY) {
                        var dX = horizontalDragPosition, dY = verticalDragPosition, factor = event.deltaFactor || settings.mouseWheelSpeed;
                        jsp.scrollBy(deltaX * factor, -deltaY * factor, false);
                        // return true if there was no movement so rest of screen can scroll
                        return dX == horizontalDragPosition && dY == verticalDragPosition;
                    }
                );
            }

            function removeMousewheel() {
                container.unbind(mwEvent);
            }

            function nil() {
                return false;
            }

            function initFocusHandler() {
                pane.find(':input,a').unbind('focus.jsp').bind(
                    'focus.jsp',
                    function (e) {
                        scrollToElement(e.target, false);
                    }
                );
            }

            function removeFocusHandler() {
                pane.find(':input,a').unbind('focus.jsp');
            }

            function initKeyboardNav() {
                var keyDown, elementHasScrolled, validParents = [];
                isScrollableH && validParents.push(horizontalBar[0]);
                isScrollableV && validParents.push(verticalBar[0]);

                // IE also focuses elements that don't have tabindex set.
                pane.focus(
                    function () {
                        elem.focus();
                    }
                );

                elem.attr('tabindex', 0)
                    .unbind('keydown.jsp keypress.jsp')
                    .bind(
                        'keydown.jsp',
                        function (e) {
                            if (e.target !== this && !(validParents.length && $(e.target).closest(validParents).length)) {
                                return;
                            }
                            var dX = horizontalDragPosition, dY = verticalDragPosition;
                            switch (e.keyCode) {
                                case 40: // down
                                case 38: // up
                                case 34: // page down
                                case 32: // space
                                case 33: // page up
                                case 39: // right
                                case 37: // left
                                    keyDown = e.keyCode;
                                    keyDownHandler();
                                    break;
                                case 35: // end
                                    scrollToY(contentHeight - paneHeight);
                                    keyDown = null;
                                    break;
                                case 36: // home
                                    scrollToY(0);
                                    keyDown = null;
                                    break;
                            }

                            elementHasScrolled = e.keyCode == keyDown && dX != horizontalDragPosition || dY != verticalDragPosition;
                            return !elementHasScrolled;
                        }
                    ).bind(
                        'keypress.jsp', // For FF/ OSX so that we can cancel the repeat key presses if the JSP scrolls...
                        function (e) {
                            if (e.keyCode == keyDown) {
                                keyDownHandler();
                            }
                            return !elementHasScrolled;
                        }
                    );

                if (settings.hideFocus) {
                    elem.css('outline', 'none');
                    if ('hideFocus' in container[0]) {
                        elem.attr('hideFocus', true);
                    }
                } else {
                    elem.css('outline', '');
                    if ('hideFocus' in container[0]) {
                        elem.attr('hideFocus', false);
                    }
                }

                function keyDownHandler() {
                    var dX = horizontalDragPosition, dY = verticalDragPosition;
                    switch (keyDown) {
                        case 40: // down
                            jsp.scrollByY(settings.keyboardSpeed, false);
                            break;
                        case 38: // up
                            jsp.scrollByY(-settings.keyboardSpeed, false);
                            break;
                        case 34: // page down
                        case 32: // space
                            jsp.scrollByY(paneHeight * settings.scrollPagePercent, false);
                            break;
                        case 33: // page up
                            jsp.scrollByY(-paneHeight * settings.scrollPagePercent, false);
                            break;
                        case 39: // right
                            jsp.scrollByX(settings.keyboardSpeed, false);
                            break;
                        case 37: // left
                            jsp.scrollByX(-settings.keyboardSpeed, false);
                            break;
                    }

                    elementHasScrolled = dX != horizontalDragPosition || dY != verticalDragPosition;
                    return elementHasScrolled;
                }
            }

            function removeKeyboardNav() {
                elem.attr('tabindex', '-1')
                    .removeAttr('tabindex')
                    .unbind('keydown.jsp keypress.jsp');
            }

            function observeHash() {
                if (location.hash && location.hash.length > 1) {
                    var e,
                        retryInt,
                        hash = escape(location.hash.substr(1)) // hash must be escaped to prevent XSS
                        ;
                    try {
                        e = $('#' + hash + ', a[name="' + hash + '"]');
                    } catch (err) {
                        return;
                    }

                    if (e.length && pane.find(hash)) {
                        // nasty workaround but it appears to take a little while before the hash has done its thing
                        // to the rendered page so we just wait until the container's scrollTop has been messed up.
                        if (container.scrollTop() === 0) {
                            retryInt = setInterval(
                                function () {
                                    if (container.scrollTop() > 0) {
                                        scrollToElement(e, true);
                                        $(document).scrollTop(container.position().top);
                                        clearInterval(retryInt);
                                    }
                                },
                                50
                            );
                        } else {
                            scrollToElement(e, true);
                            $(document).scrollTop(container.position().top);
                        }
                    }
                }
            }

            function hijackInternalLinks() {
                // only register the link handler once
                if ($(document.body).data('jspHijack')) {
                    return;
                }

                // remember that the handler was bound
                $(document.body).data('jspHijack', true);

                // use live handler to also capture newly created links
                $(document.body).delegate('a[href*=#]', 'click', function (event) {
                    // does the link point to the same page?
                    // this also takes care of cases with a <base>-Tag or Links not starting with the hash #
                    // e.g. <a href="index.html#test"> when the current url already is index.html
                    var href = this.href.substr(0, this.href.indexOf('#')),
                        locationHref = location.href,
                        hash,
                        element,
                        container,
                        jsp,
                        scrollTop,
                        elementTop;
                    if (location.href.indexOf('#') !== -1) {
                        locationHref = location.href.substr(0, location.href.indexOf('#'));
                    }
                    if (href !== locationHref) {
                        // the link points to another page
                        return;
                    }

                    // check if jScrollPane should handle this click event
                    hash = escape(this.href.substr(this.href.indexOf('#') + 1));

                    // find the element on the page
                    element;
                    try {
                        element = $('#' + hash + ', a[name="' + hash + '"]');
                    } catch (e) {
                        // hash is not a valid jQuery identifier
                        return;
                    }

                    if (!element.length) {
                        // this link does not point to an element on this page
                        return;
                    }

                    container = element.closest('.jspScrollable');
                    jsp = container.data('jsp');

                    // jsp might be another jsp instance than the one, that bound this event
                    // remember: this event is only bound once for all instances.
                    jsp.scrollToElement(element, true);

                    if (container[0].scrollIntoView) {
                        // also scroll to the top of the container (if it is not visible)
                        scrollTop = $(window).scrollTop();
                        elementTop = element.offset().top;
                        if (elementTop < scrollTop || elementTop > scrollTop + $(window).height()) {
                            container[0].scrollIntoView();
                        }
                    }

                    // jsp handled this event, prevent the browser default (scrolling :P)
                    event.preventDefault();
                });
            }

            // Init touch on iPad, iPhone, iPod, Android
            function initTouch() {
                var startX,
                    startY,
                    touchStartX,
                    touchStartY,
                    moved,
                    moving = false;

                container.unbind('touchstart.jsp touchmove.jsp touchend.jsp click.jsp-touchclick').bind(
                    'touchstart.jsp',
                    function (e) {
                        var touch = e.originalEvent.touches[0];
                        startX = contentPositionX();
                        startY = contentPositionY();
                        touchStartX = touch.pageX;
                        touchStartY = touch.pageY;
                        moved = false;
                        moving = true;
                    }
                ).bind(
                    'touchmove.jsp',
                    function (ev) {
                        if (!moving) {
                            return;
                        }

                        var touchPos = ev.originalEvent.touches[0],
                            dX = horizontalDragPosition, dY = verticalDragPosition;

                        jsp.scrollTo(startX + touchStartX - touchPos.pageX, startY + touchStartY - touchPos.pageY);

                        moved = moved || Math.abs(touchStartX - touchPos.pageX) > 5 || Math.abs(touchStartY - touchPos.pageY) > 5;

                        // return true if there was no movement so rest of screen can scroll
                        return dX == horizontalDragPosition && dY == verticalDragPosition;
                    }
                ).bind(
                    'touchend.jsp',
                    function (e) {
                        moving = false;
                        /*if(moved) {
                        return false;
                        }*/
                    }
                ).bind(
                    'click.jsp-touchclick',
                    function (e) {
                        if (moved) {
                            moved = false;
                            return false;
                        }
                    }
                );
            }

            function destroy() {
                var currentY = contentPositionY(),
                    currentX = contentPositionX();
                elem.removeClass('jspScrollable').unbind('.jsp');
                elem.replaceWith(originalElement.append(pane.children()));
                originalElement.scrollTop(currentY);
                originalElement.scrollLeft(currentX);

                // clear reinitialize timer if active
                if (reinitialiseInterval) {
                    clearInterval(reinitialiseInterval);
                }
            }

            // Public API
            $.extend(
                jsp,
                {
                    // Reinitialises the scroll pane (if it's internal dimensions have changed since the last time it
                    // was initialised). The settings object which is passed in will override any settings from the
                    // previous time it was initialised - if you don't pass any settings then the ones from the previous
                    // initialisation will be used.
                    reinitialise: function (s) {
                        s = $.extend({}, settings, s);
                        initialise(s);
                    },
                    // Scrolls the specified element (a jQuery object, DOM node or jQuery selector string) into view so
                    // that it can be seen within the viewport. If stickToTop is true then the element will appear at
                    // the top of the viewport, if it is false then the viewport will scroll as little as possible to
                    // show the element. You can also specify if you want animation to occur. If you don't provide this
                    // argument then the animateScroll value from the settings object is used instead.
                    scrollToElement: function (ele, stickToTop, animate) {
                        scrollToElement(ele, stickToTop, animate);
                    },
                    // Scrolls the pane so that the specified co-ordinates within the content are at the top left
                    // of the viewport. animate is optional and if not passed then the value of animateScroll from
                    // the settings object this jScrollPane was initialised with is used.
                    scrollTo: function (destX, destY, animate) {
                        scrollToX(destX, animate);
                        scrollToY(destY, animate);
                    },
                    // Scrolls the pane so that the specified co-ordinate within the content is at the left of the
                    // viewport. animate is optional and if not passed then the value of animateScroll from the settings
                    // object this jScrollPane was initialised with is used.
                    scrollToX: function (destX, animate) {
                        scrollToX(destX, animate);
                    },
                    // Scrolls the pane so that the specified co-ordinate within the content is at the top of the
                    // viewport. animate is optional and if not passed then the value of animateScroll from the settings
                    // object this jScrollPane was initialised with is used.
                    scrollToY: function (destY, animate) {
                        scrollToY(destY, animate);
                    },
                    // Scrolls the pane to the specified percentage of its maximum horizontal scroll position. animate
                    // is optional and if not passed then the value of animateScroll from the settings object this
                    // jScrollPane was initialised with is used.
                    scrollToPercentX: function (destPercentX, animate) {
                        scrollToX(destPercentX * (contentWidth - paneWidth), animate);
                    },
                    // Scrolls the pane to the specified percentage of its maximum vertical scroll position. animate
                    // is optional and if not passed then the value of animateScroll from the settings object this
                    // jScrollPane was initialised with is used.
                    scrollToPercentY: function (destPercentY, animate) {
                        scrollToY(destPercentY * (contentHeight - paneHeight), animate);
                    },
                    // Scrolls the pane by the specified amount of pixels. animate is optional and if not passed then
                    // the value of animateScroll from the settings object this jScrollPane was initialised with is used.
                    scrollBy: function (deltaX, deltaY, animate) {
                        jsp.scrollByX(deltaX, animate);
                        jsp.scrollByY(deltaY, animate);
                    },
                    // Scrolls the pane by the specified amount of pixels. animate is optional and if not passed then
                    // the value of animateScroll from the settings object this jScrollPane was initialised with is used.
                    scrollByX: function (deltaX, animate) {
                        var destX = contentPositionX() + Math[deltaX < 0 ? 'floor' : 'ceil'](deltaX),
                            percentScrolled = destX / (contentWidth - paneWidth);
                        positionDragX(percentScrolled * dragMaxX, animate);
                    },
                    // Scrolls the pane by the specified amount of pixels. animate is optional and if not passed then
                    // the value of animateScroll from the settings object this jScrollPane was initialised with is used.
                    scrollByY: function (deltaY, animate) {
                        var destY = contentPositionY() + Math[deltaY < 0 ? 'floor' : 'ceil'](deltaY),
                            percentScrolled = destY / (contentHeight - paneHeight);
                        positionDragY(percentScrolled * dragMaxY, animate);
                    },
                    // Positions the horizontal drag at the specified x position (and updates the viewport to reflect
                    // this). animate is optional and if not passed then the value of animateScroll from the settings
                    // object this jScrollPane was initialised with is used.
                    positionDragX: function (x, animate) {
                        positionDragX(x, animate);
                    },
                    // Positions the vertical drag at the specified y position (and updates the viewport to reflect
                    // this). animate is optional and if not passed then the value of animateScroll from the settings
                    // object this jScrollPane was initialised with is used.
                    positionDragY: function (y, animate) {
                        positionDragY(y, animate);
                    },
                    // This method is called when jScrollPane is trying to animate to a new position. You can override
                    // it if you want to provide advanced animation functionality. It is passed the following arguments:
                    //  * ele          - the element whose position is being animated
                    //  * prop         - the property that is being animated
                    //  * value        - the value it's being animated to
                    //  * stepCallback - a function that you must execute each time you update the value of the property
                    // You can use the default implementation (below) as a starting point for your own implementation.
                    animate: function (ele, prop, value, stepCallback) {
                        var params = {};
                        params[prop] = value;
                        ele.animate(
                            params,
                            {
                                'duration': settings.animateDuration,
                                'easing': settings.animateEase,
                                'queue': false,
                                'step': stepCallback
                            }
                        );
                    },
                    // Returns the current x position of the viewport with regards to the content pane.
                    getContentPositionX: function () {
                        return contentPositionX();
                    },
                    // Returns the current y position of the viewport with regards to the content pane.
                    getContentPositionY: function () {
                        return contentPositionY();
                    },
                    // Returns the width of the content within the scroll pane.
                    getContentWidth: function () {
                        return contentWidth;
                    },
                    // Returns the height of the content within the scroll pane.
                    getContentHeight: function () {
                        return contentHeight;
                    },
                    // Returns the horizontal position of the viewport within the pane content.
                    getPercentScrolledX: function () {
                        return contentPositionX() / (contentWidth - paneWidth);
                    },
                    // Returns the vertical position of the viewport within the pane content.
                    getPercentScrolledY: function () {
                        return contentPositionY() / (contentHeight - paneHeight);
                    },
                    // Returns whether or not this scrollpane has a horizontal scrollbar.
                    getIsScrollableH: function () {
                        return isScrollableH;
                    },
                    // Returns whether or not this scrollpane has a vertical scrollbar.
                    getIsScrollableV: function () {
                        return isScrollableV;
                    },
                    // Gets a reference to the content pane. It is important that you use this method if you want to
                    // edit the content of your jScrollPane as if you access the element directly then you may have some
                    // problems (as your original element has had additional elements for the scrollbars etc added into
                    // it).
                    getContentPane: function () {
                        return pane;
                    },
                    // Scrolls this jScrollPane down as far as it can currently scroll. If animate isn't passed then the
                    // animateScroll value from settings is used instead.
                    scrollToBottom: function (animate) {
                        positionDragY(dragMaxY, animate);
                    },
                    // Hijacks the links on the page which link to content inside the scrollpane. If you have changed
                    // the content of your page (e.g. via AJAX) and want to make sure any new anchor links to the
                    // contents of your scroll pane will work then call this function.
                    hijackInternalLinks: $.noop,
                    // Removes the jScrollPane and returns the page to the state it was in before jScrollPane was
                    // initialised.
                    destroy: function () {
                        destroy();
                    }
                }
            );

            initialise(s);
        }

        // Pluginifying code...
        settings = $.extend({}, $.fn.jScrollPane.defaults, settings);

        // Apply default speed
        $.each(['arrowButtonSpeed', 'trackClickSpeed', 'keyboardSpeed'], function () {
            settings[this] = settings[this] || settings.speed;
        });

        return this.each(
            function () {
                var elem = $(this), jspApi = elem.data('jsp');
                if (jspApi) {
                    jspApi.reinitialise(settings);
                } else {
                    $("script", elem).filter('[type="text/javascript"],:not([type])').remove();
                    jspApi = new JScrollPane(elem, settings);
                    elem.data('jsp', jspApi);
                }
            }
        );
    };

    $.fn.jScrollPane.defaults = {
        showArrows: false,
        maintainPosition: true,
        stickToBottom: false,
        stickToRight: false,
        clickOnTrack: true,
        autoReinitialise: false,
        autoReinitialiseDelay: 500,
        verticalDragMinHeight: 0,
        verticalDragMaxHeight: 99999,
        horizontalDragMinWidth: 0,
        horizontalDragMaxWidth: 99999,
        contentWidth: undefined,
        animateScroll: false,
        animateDuration: 300,
        animateEase: 'linear',
        hijackInternalLinks: false,
        verticalGutter: 4,
        horizontalGutter: 4,
        mouseWheelSpeed: 3,
        arrowButtonSpeed: 0,
        arrowRepeatFreq: 50,
        arrowScrollOnHover: false,
        trackClickSpeed: 0,
        trackClickRepeatFreq: 70,
        verticalArrowPositions: 'split',
        horizontalArrowPositions: 'split',
        enableKeyboardNavigation: true,
        hideFocus: false,
        keyboardSpeed: 0,
        initialDelay: 300,        // Delay before starting repeating
        speed: 30,  // Default speed when others falsey
        scrollPagePercent: .8       // Percent of visible area scrolled when pageUp/Down or track area pressed
    };

}, this));$(document).ready(function () {
    var el = $('#breadcrumbs-mobile');
    if (el.length) {
        el.find('.breadcrumbs-row').owlCarousel({
            items: 3,
            dots: false
        }).on('changed.owl.carousel', function (e) {
            el.find('.icon-arrow-left, .icon-arrow-right').show();
            if (e.item.index === 0)
            {
                // Hide previous slide arrow
                el.find('.icon-arrow-left').hide();
            }
            else if (e.item.index >= (e.item.count - 3)) {
                // Hide next slide arrow
                el.find('.icon-arrow-right').hide();
            }

            if(e.item.count <= 3)
            {
                el.find('.icon-arrow-right').hide();
            }
        });

        var owl = el.find('.breadcrumbs-row').data('owlCarousel');

        el.find('.icon-arrow-right').on('click', function () {
            owl.next();
        });

        el.find('.icon-arrow-left').on('click', function () {
            owl.prev();
        });

        el.find('a').on('click', trackBreadcrumb);

        // Center on breadcrumb for current page
        var current = $('#breadcrumb-current');
        var i = (current.length && current.data('index')) ? current.data('index') - 1 : 0;
        owl.jumpTo(i);

        // Mobile breadcrumb is hidden until the page is loaded, show mobile breadcrumb now
        el.removeClass('hide');
    }

    // Scroll the page to the top of the summary for mobile
    if (porter.isMobile()) {
        // Check in
        if ($('#web-check-in').length) {
            var container = $('.summary-wrapper');
            if (container.length) {
                porter.scrollTo(container.offset().top);
            }
        }
    }

    var tabletEl = $('#breadcrumbs-tablet');
    if (tabletEl.length) {
        tabletEl.find('a').on('click', trackBreadcrumb);
    }

    function trackBreadcrumb() {
        var clicked = $(this);
        // Track clicked breadcrumb
        if (!_.isEmpty(clicked.data('progress'))) {
            try {
                _trackAnalytics({
                    'progressBarElement': clicked.data('progress'),
                    'progressBarClick': true
                });
            } catch (err) {
            }
        }
        // Redirect to url
        setTimeout(function () {
            window.location.href = clicked.attr('href');
        }, 500);
        return false;
    }
});// Requires: knockout.js, moment.js, underscore.js
var porter = porter || {};

(function () {
    var FlightInfoJourney = function () {
        var _self = this;
        this.flightDate = ko.observable('');        
        this.segments = ko.observableArray();
        this.departureStationCode = ko.observable('');
        this.arrivalStationCode = ko.observable('');
        this.departureTerminal = ko.observable('');
        this.arrivalTerminal = ko.observable('');
        this.departureStationName = ko.observable('');
        this.arrivalStationName = ko.observable(''); 
        this.status = ko.observable('');
        this.statusTranslated = ko.observable('');
        this.departureMessage = ko.observable('');
        this.seeDetailsLink = ko.observable('');
        this.showDetails = ko.observable();
        this.journeySellKey = ko.observable();

        this.selectedDepartureStationCode = ko.observable('');
        this.selectedArrivalStationCode = ko.observable('');
        this.selectedDepartureStationName = ko.observable('');
        this.selectedArrivalStationName = ko.observable(''); 

        // productClass is for the fare tool tip
        this.productClass = ko.observable();

        // Show collapse button
        this.showCollapse = ko.observable(true);
        this.collapse = ko.observable(true);
        // showCollapseSection will hide the entire collapsed section if set to false
        this.showCollapseSection = ko.observable(true);
        // covid19 refund promo
        this.isRefundableFareActive = ko.observable(false);
        // PNR mod
        this.isChanging = ko.observable(false);
        this.isCancelling = ko.observable(false);

        // IROP
        this.isIROP = ko.observable(false);

        // Does this journey have more than one segment or leg
        this.isMulti = function () {
            var count = 0;
            for (var x = 0; x < _self.segments().length; x++) {
                count += _self.segments()[x].legs().length;
            }
            return count > 1;
        };

        // Does this journey have a partner flight with a four digit flight number
        this.hasPartnerWithLongFlightNum = function () {
            for (x = 0; x < _self.segments().length; x++) {
                if (_self.segments()[x].isPartner()) {
                    var segment = _self.segments()[x];
                    for (y = 0; y < segment.legs().length; y++) {
                        if (segment.legs()[y].flightNumber().length >= 4) {
                            return true;
                        }
                    }
                }
            }
            return false;
        };

        this.firstLeg = ko.computed(function () {
            var _firstSegment = _.first(this.segments());
            if (_firstSegment) {
                return _.first(_firstSegment.legs());
            }
        }, this);

        this.lastLeg = ko.computed(function () {
            var _lastSegment = _.last(this.segments());
            if (_lastSegment) {
                return _.last(_lastSegment.legs());
            }
        }, this);

        this.lowerCaseStatus = ko.computed(function () {
            if (this.status()) {
                return this.status().toLowerCase();
            }
        }, this);

        this.track = function (index) {
            if (typeof trackFlightDetailsClick === 'function') {
                trackFlightDetailsClick(this.departureStationCode(), this.arrivalStationCode(), index);
            }
        };

        this.showDepartureMessage = ko.computed(function () {
            return this.lowerCaseStatus() != 'delayed' && this.lowerCaseStatus() != 'cancelled' && this.lowerCaseStatus() != 'closed';
        }, this);

        this.flightDateFormatted = ko.computed(function () {
            var format = porter.isFr ? 'LL' : 'MMMM D, YYYY';
            return moment(this.flightDate()).format(format)
        }, this, { 'deferEvaluation': true });

        this.flightDateFormattedShort = ko.computed(function () {
            var format = porter.isFr ? 'll' : 'MMM D, YYYY';
            return moment(this.flightDate()).format(format)
        }, this, { 'deferEvaluation': true });

        /* FlightInfo Accessisibilty START */
        this.flightInfoTogglerKeyDownEvent = function (data, e) {
            var noHref = e.currentTarget.className.indexOf('no-href') > -1;
            if(e.which == 38 || e.which == 40 || e.which == 32) {
                e.preventDefault();
                e.stopPropagation();
            }
            if(e.which == 32 || (e.which == 13 && noHref)) {
                _self.collapse(!_self.collapse());
            }
            else if(e.which == 40) {
                _self.collapse(false);
            }
            else if(e.which == 27 || e.which == 38) {
                _self.collapse(true);
            }
            return true;
        };
        this.flightInfoDrawerKeyDownEvent = function (data, e) {
            var btnToggle = $(e.currentTarget).prev('.date-flight').find('.btn-toggle:first');
            var noHref = $(btnToggle).hasClass('no-href');
            if(e.which == 38 || e.which == 40 || e.which == 32) {
                e.preventDefault();
                e.stopPropagation();
            }
            if(e.which == 32 || (e.which == 13 && noHref)) {
                _self.collapse(!_self.collapse());
                noHref ? $(btnToggle).focus() : $(btnToggle).parents('a:first').focus();
            }
            else if(e.which == 40) {
                _self.collapse(false);
            }
            else if(e.which == 27 || e.which == 38) {
                _self.collapse(true);
                noHref ? $(btnToggle).focus() : $(btnToggle).parents('a:first').focus();
            }
            return true;
        };

        this.setFocusOnBtnToggle = function(data, e) {
        var xx = data;
        var xxs = e;

        };
        /* FlightInfo Accessisibilty END */
    };

    var convertToSlug = function(Text) {
        return Text ?
            Text.replace(new RegExp(/\u0301|\u00e9/g), 'e')
            .replace(/ /g,'-')
            .replace(/[^\w-]+/g,'') :
            '';
    };

    var getCultureFromUrl = function () {
        var sParam = "culture";
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++) 
        {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam) 
            {
                return sParameterName[1];
            }
        }
    };

    var FlightInfoSegment = function () {
        this.carrierCode = ko.observable('');
        this.flightNumber = ko.observable('');
        this.status = ko.observable('');
        this.formattedEstimatedDepartureDate = ko.observable('');
        this.formattedEstimatedArrivalDate = ko.observable('');
        
        this.legs = ko.observableArray();

        this.isPartner = ko.computed(function () {
            return this.carrierCode() !== 'PD';
        },this);
    };

    var FlightInfoLeg = function () {
        this.departureStationCode = ko.observable('');
        this.arrivalStationCode = ko.observable('');
        this.carrierCode = ko.observable('');
        this.flightNumber = ko.observable('');
        this.STD = ko.observable('');
        this.STA = ko.observable('');
        this.ETD = ko.observable('');
        this.ETA = ko.observable('');
        this.formattedSTD = ko.observable('');
        this.formattedSTA = ko.observable('');
        this.formattedETD = ko.observable('');
        this.formattedETA = ko.observable('');
        this.estFormattedSTD = ko.observable('');
        this.estFormattedSTA = ko.observable('');
        this.departureAirportName = ko.observable('');
        this.arrivalAirportName = ko.observable('');
        this.departureStationName = ko.observable('');
        this.arrivalStationName = ko.observable('');
        this.departureTerminal = ko.observable('');
        this.arrivalTerminal = ko.observable('');
        this.DayDiff = ko.observable('');
        this.EstimatedDayDiff = ko.observable('');
        this.stdDayDiffToFirstLeg = ko.observable('');
        this.etdDayDiffToFirstLeg = ko.observable('');
        this.staDayDiffToFirstLeg = ko.observable('');
        this.etaDayDiffToFirstLeg = ko.observable('');

        this.Duration = ko.observable('');
        this.buildDuration = function (duration) {
            if (duration != null) {
               // var convertedDuration = moment.duration(duration);
                var hrs = moment.duration(duration).hours();
                var min = moment.duration(duration).minutes();
                var sec = moment.duration(duration).seconds();    

                var durationToUse = {
                    Hours: hrs,
                    Minutes : min,
                    Seconds : sec
                }                    

                return durationToUse;
            }
            return duration;
        };

        this.EstimatedDuration = ko.computed(function () {
            if (this.STA()) {                
                return moment.duration(this.STA().diff(this.STD()));
            }
            return null;
        }, this);

        this.durationToUse = ko.computed(function () {
            if (!_.isEmpty(this.EstimatedDuration()) && this.EstimatedDuration().TotalSeconds > 0) {
                return this.buildDuration(this.EstimatedDuration());
            }
            return this.buildDuration(this.EstimatedDuration());
        }, this);


        this.layover = ko.observable({
            hours: ko.observable(0),
            minutes: ko.observable(0)
        });

        this.departureStationUrl = ko.computed(function () {
            return convertToSlug(this.departureStationName()) + "?culture=" + getCultureFromUrl();
        }, this);

        this.arrivalStationUrl = ko.computed(function () {
            return convertToSlug(this.arrivalStationName()) + "?culture=" + getCultureFromUrl();
        }, this);

        this.showLayover = ko.computed(function () {
            return this.layover().hours() > 0 || this.layover().minutes() > 0;
        }, this);

        // Is this leg an interline flight
        this.isPartner = ko.computed(function () {
            return this.carrierCode() !== 'PD';
        },this);

        this.boardingTime = ko.computed(function () {
            //return moment(this.STD()-1200000); //boarding time is 20mins before departure
            return moment(this.formattedSTD()-1200000); //boarding time is 20mins before departure
        }, this);

        // Has estimated time and estimated time is different from scheduled time
        this.hasETD = ko.computed(function () {
            return !_.isEmpty(this.ETD()) && !this.ETD().isSame(this.STD());
        }, this);

        this.hasETA = ko.computed(function () {
            return !_.isEmpty(this.ETA()) && !this.ETA().isSame(this.STA());
        }, this);
    };



    // Main ViewModel
    var FlightInfo = function ()
    {
        var _self = this;

        this.jsonData = {};
        this.jsonStations = {};
        this.flightInfoJourneys = ko.observableArray();
        this.showTime = ko.observable(true);
        this.showDetailsBtn = ko.observable(true);
    };

    var p = FlightInfo.prototype;
    p.Constructor = FlightInfo;

    $.extend(p, {
        // For check in, booking
        // data is an array of PassengerJourneys or Journeys
        // stations is an object of station names
        // isCheckIn is a boolean to determine if check in needs to be open
        injectPassengerJourney: function (data, stations, isCheckIn, showDetails, collapse, upcomingFlights)
        {
            var _self = this;
            if (arguments.length < 4) {
                showDetails = true; //optional
            }
            //if (collapse === undefined) collapse = true; //optional
            collapse = true;
            if (arguments.length < 3) {
                isCheckIn = false;
            }
            if (data) {
                var minDate = moment('0001-01-01');
                for (var x = 0; x < data.length; x++) {
                    //if (!isCheckIn || (isCheckIn && data[x].IsCheckInOpen)) { don't think we need it anymore
                    if (typeof data[x] != "undefined") {
                        var journeyData = data[x].Journey ? data[x].Journey : data[x];
                        var journey = new FlightInfoJourney();
                        journey.departureMessage = journeyData.DepartureMessage;

                        var statusCheck = journeyData.Status;

                        if (statusCheck) {
                            journey.status(journeyData.Status);
                        } else {
                            journey.status("");
                        }
                        journey.statusTranslated = isCheckIn ? journeyData.StatusTranslated : "";
                        journey.showDetails(showDetails);
                        journey.collapse(collapse);

                        journey.flightDate(moment(journeyData.Segments[0].STDFormatted)); //used in my booking, Check In

                        journey.departureStationCode(journeyData.Segments[0].DepartureStation);
                        journey.arrivalStationCode(_.last(journeyData.Segments).ArrivalStation);

                        var governingFare = null;

                        var link = baseUrl + userCulture.toLowerCase() +  "/manage-flights/flight-status/lookup?from=" + journey.departureStationCode() + "&to=" + journey.arrivalStationCode() + "&date=" + moment(journey.flightDate()).format("YYYY-MM-DD");
                        journey.seeDetailsLink(link);
                        if (!_.isEmpty(stations)) {
                            journey.departureStationName(getStationName(journey.departureStationCode(), stations));
                            journey.arrivalStationName(getStationName(journey.arrivalStationCode(), stations));
                        }
                        for (var y = 0; y < journeyData.Segments.length; y++) {
                            var segmentData = journeyData.Segments[y];
                            var segment = new FlightInfoSegment();
                            var upcomingJourney = _.filter(upcomingFlights, function (journey) { 
                                return journey.SellKey == journeyData.SellKey;
                            })
                            segment.carrierCode(segmentData.FlightDesignator.CarrierCode);
                            segment.flightNumber(segmentData.FlightDesignator.FlightNumber.trim());
                            segment.status(segmentData.Status);
                            segment.formattedEstimatedDepartureDate(segmentData.FormattedEstimatedDepartureDate);
                            segment.formattedEstimatedArrivalDate(segmentData.FormattedEstimatedArrivalDate);
                            // Find the governing fare
                            if (segmentData.Fares) {
                                governingFare = _.find(segmentData.Fares, function (f) { return f.FareApplicationType === 2; });
                            }
                            for (var z = 0; z < segmentData.Legs.length; z++) {
                                var legData = segmentData.Legs[z];
                                var leg = new FlightInfoLeg();
                                var legInfo = legData;
                                
                                leg.departureStationCode(legData.DepartureStation);
                                leg.arrivalStationCode(legData.ArrivalStation);
                                leg.carrierCode(legData.FlightDesignator.CarrierCode);
                                leg.flightNumber(legData.FlightDesignator.FlightNumber.trim());
                                leg.Duration(legData.Duration);
                                leg.STD(moment(legData.STD));
                                leg.STA(moment(legData.STA));
                                leg.formattedSTD(moment(typeof (legData.formattedSTD) != 'undefined' ? legData.formattedSTD : legData.STD));
                                leg.formattedSTA(moment(typeof (legData.formattedSTA) != 'undefined' ? legData.formattedSTA : legData.STA));
                                if (moment(legData.ETD).year() > minDate.year()) {
                                    leg.ETD(moment(legData.ETD));
                                    leg.formattedETD(moment(legData.formattedETD));
                                }
                                if (moment(legData.ETA).year() > minDate.year()) {
                                    leg.ETA(moment(legData.ETA));
                                    leg.formattedETA(moment(legData.formattedETA));
                                }

                                if (legInfo.LegInfo) {
                                    leg.departureTerminal(legInfo.LegInfo.DepartureTerminal);
                                    leg.arrivalTerminal(legInfo.LegInfo.ArrivalTerminal);
                                }
                                if (!_.isEmpty(segmentData.Status)) {
                                    leg.estFormattedSTD(moment(segmentData.FormattedEstimatedDepartureDate));
                                    leg.estFormattedSTA(moment(segmentData.FormattedEstimatedArrivalDate));
                                }
                                else {
                                    if (upcomingJourney != null && upcomingJourney.length > 0) {
                                        leg.estFormattedSTD(moment(upcomingJourney[0].EstimatedDepartureDate));
                                        leg.estFormattedSTA(moment(upcomingJourney[0].EstimatedArrivalDate));
                                        segment.status(upcomingJourney[0].Status);
                                    }
                                    else {
                                        leg.estFormattedSTD(leg.formattedSTD());
                                        leg.estFormattedSTA(leg.formattedSTA());
                                        segment.status(journeyData.Status);
                                    }
                                }
                                if (segment.status() === null) {
                                    segment.status('');
                                }
                                if (_.isString(legData.Layover)) {
                                    // If Json.net/Newtonsoft was used to serialize, legData.Layover will be "02:30:00"
                                    var layover = moment.duration(legData.Layover);
                                    leg.layover().hours(layover.hours());
                                    leg.layover().minutes(layover.minutes());
                                } else {
                                    // If JavaScriptSerializer was used to serialize, legData.Layover will be a TimeSpan object
                                    leg.layover().hours(legData.Layover.Hours);
                                    leg.layover().minutes(legData.Layover.Minutes);
                                }
                                if (!_.isEmpty(stations)) {
                                    leg.departureAirportName(getAirportName(leg.departureStationCode(), stations));
                                    leg.arrivalAirportName(getAirportName(leg.arrivalStationCode(), stations));
                                    leg.departureStationName(getStationName(leg.departureStationCode(), stations));
                                    leg.arrivalStationName(getStationName(leg.arrivalStationCode(), stations));
                                }
                                leg.DayDiff(legData.DayDiff);
                                leg.EstimatedDayDiff(legData.EstimatedDayDiff);
                                var flightDate = moment(journey.flightDate()).startOf('day');
                                if (!journey.flightDate().isSame(leg.STD(), 'day')) {
                                    var diff = moment(leg.STD()).startOf('day').diff(flightDate, 'days');
                                    leg.stdDayDiffToFirstLeg('+' + diff);
                                }
                                if (!_.isEmpty(leg.ETD())) {
                                    if (!journey.flightDate().isSame(leg.ETD(), 'day')) {
                                        var diff = moment(leg.ETD()).startOf('day').diff(flightDate, 'days');
                                        leg.etdDayDiffToFirstLeg('+' + diff);
                                    }
                                }
                                if (!journey.flightDate().isSame(leg.STA(), 'day')) {
                                    var diff = moment(leg.STA()).startOf('day').diff(flightDate, 'days');
                                    leg.staDayDiffToFirstLeg('+' + diff);
                                }
                                if (!_.isEmpty(leg.ETA())) {
                                    if (!journey.flightDate().isSame(leg.ETA(), 'day')) {
                                        var diff = moment(leg.ETA()).startOf('day').diff(flightDate, 'days');
                                        leg.etaDayDiffToFirstLeg('+' + diff);
                                    }
                                }
                                segment.legs.push(leg);
                            }
                            journey.segments.push(segment);
                        }
                        // Get the first fare if no governing fare was found
                        if (_.isEmpty(governingFare)) {
                            var firstSegment = _.first(journeyData.Segments);
                            if (!_.isEmpty(firstSegment)) {
                                governingFare = _.first(firstSegment.Fares);
                            }
                        }

                        if (!_.isEmpty(governingFare)) {
                            journey.productClass(governingFare.ProductClass);
                        }
                        journey.journeySellKey(journeyData.SellKey);

                        // Set up observables for cancelled journey
                        if (journey.lowerCaseStatus() == 'cancelled') {
                            journey.collapse(true);
                            journey.isIROP(true);
                            journey.showDetails(false);
                        }

                        this.flightInfoJourneys.push(journey);
                        //}
                    }
                }
            }
        },

        // For flight search results
        // data is an array of JourneyAvailability
        injectJourneyAvailability: function (data, showDetails)
        {            
            for (var x = 0; x < data.length; x++) {
                var journeyData = data[x];
                var journey = new FlightInfoJourney();

                journey.flightDate(moment(journeyData.FormattedSelectedDepartureDate())); //used in booking flow        
                
                journey.departureStationCode(journeyData.DepartureStation());
                journey.arrivalStationCode(journeyData.ArrivalStation());
                journey.departureStationName(journeyData.DepartureStationName());
                journey.arrivalStationName(journeyData.ArrivalStationName());
                journey.showDetails(showDetails);
                this.flightInfoJourneys.push(journey);
            }
        },

        //injectFlightInfoJourneys: function (data, showDetails) {
        //    for (var x = 0; x < data.length; x++)
        //    {
        //        var journeyData = data[x];
        //        var journey = new FlightInfoJourney();

        //        journey.flightDate(moment(journeyData.FormattedSelectedDepartureDate)); //used in booking flow        

        //        journey.departureStationCode(journeyData.DepartureStation);
        //        journey.arrivalStationCode(journeyData.ArrivalStation);
        //        journey.departureStationName(journeyData.DepartureStationName);
        //        journey.arrivalStationName(journeyData.ArrivalStationName);
        //        journey.showDetails(showDetails);


        //        journey.InboundOutbound = ko.observable();
        //        journey.InboundOutbound(journeyData.Direction);

        //        this.flightInfoJourneys.push(journey);
        //    }
        //},

        // For IROP journeys
        // data is a JourneyViewModel
        injectSegmentVersion: function (data, stations) {
            var newJourney = new FlightInfoJourney();
            var firstSegment = _.first(data.Segments);
            var lastSegment = _.last(data.Segments);
            var firstSegmentVersion = _.first(firstSegment.SegmentVersions);
            var lastSegmentVersion = _.first(lastSegment.SegmentVersions);

            var sortedLastSegmentVersions = _.sortBy(lastSegment.SegmentVersions, function (s) { return s.VersionEndDate; });

            for (var x = 0; x < sortedLastSegmentVersions.length; x++) {
                if (x === 0) {
                    lastSegmentVersion = sortedLastSegmentVersions[0];
                } else {
                    if (sortedLastSegmentVersions[x].VersionEndDate === lastSegmentVersion.VersionEndDate) {
                        lastSegmentVersion = sortedLastSegmentVersions[x];
                    } else {
                        break;
                    }
                }
            }

            newJourney.flightDate(moment(firstSegmentVersion.DepartureDate));
            newJourney.departureStationCode(firstSegmentVersion.DepartureStation);
            newJourney.arrivalStationCode(lastSegmentVersion.ArrivalStation);
            newJourney.departureStationName(getStationName(newJourney.departureStationCode(), stations));
            newJourney.arrivalStationName(getStationName(newJourney.arrivalStationCode(), stations));
            newJourney.journeySellKey(data.SellKey);
            newJourney.status('Cancelled');
            newJourney.isIROP(true);

            var newSegment = new FlightInfoSegment();
            var newLeg = new FlightInfoLeg();
            
            var firstLeg = _.first(firstSegment.Legs);
            var legVersion = _.first(firstLeg.LegVersions);
            
            // Find the most recent cancelled flight
            for (var x = firstLeg.LegVersions.length - 1; x >= 0; x--) {
                // Porter.Core.Reservations.InventoryLegStatus
                // Status 2 = Canceled
                if (firstLeg.LegVersions[x].InventoryLegOds.Status === 2) {
                    legVersion = firstLeg.LegVersions[x];
                    break;
                }
            }
            newLeg.STD(moment(legVersion.InventoryLegOds.STD));
            var origLegVersion = null;
            for (var x = lastSegment.Legs.length - 1; x >= 0; x--) {
                if (lastSegment.Legs[x].LegVersions && lastSegment.Legs[x].LegVersions.length > 0) {
                    var sortedLegVersion = _.sortBy(lastSegment.Legs[x].LegVersions, function (l) { return l.VersionStartDate; });
                    // Find the most recent cancelled flight
                    for (var y = sortedLegVersion.length - 1; y >= 0; y--) {
                        // Porter.Core.Reservations.InventoryLegStatus
                        // Status 2 = Canceled
                        if (sortedLegVersion[y].InventoryLegOds.Status === 2) {
                            origLegVersion = sortedLegVersion[y];
                            break;
                        }
                    }
                    if (origLegVersion === null) {
                        origLegVersion = _.first(sortedLegVersion);
                    }
                    // Search for leg versions in case the number of legs has changed
                    for (var y = 0; y < sortedLegVersion.length; y++) {
                        //if (y === 0) {
                        //    origLegVersion = sortedLegVersion[y];
                        //} else {
                            if (origLegVersion != null && sortedLegVersion[y].VersionStartDate === origLegVersion.VersionStartDate) {
                                if (sortedLegVersion[y].SegmentID > origLegVersion.SegmentID) {
                                    origLegVersion = sortedLegVersion[y];
                                }
                            }
                        //}
                    }
                    break;
                }
            }
            newLeg.STA(moment(origLegVersion.InventoryLegOds.STA));
            newLeg.formattedSTD(newLeg.STD());
            newLeg.formattedSTA(newLeg.STA());
            newSegment.legs.push(newLeg);
            newJourney.segments.push(newSegment);
            this.flightInfoJourneys.push(newJourney);
        },

        injectClaimEligibilityJourney: function (stations, depart, arrival, date) {
            var newJourney = new FlightInfoJourney();
            newJourney.departureStationCode(depart);
            newJourney.arrivalStationCode(arrival);
            newJourney.departureStationName(getStationName(depart, stations));
            newJourney.arrivalStationName(getStationName(arrival, stations));
            newJourney.flightDate(moment(date));
            this.flightInfoJourneys.push(newJourney);
        },

        activate: function (data, target, stations, isCheckIn, showDetails)
        {           
            var _self = this;
            if (arguments.length < 4) {
                isCheckIn = true;
            }
            this.jsonData = data;
            this.jsonStations = stations;
            if (!_.isEmpty(this.jsonData)) {
                this.injectPassengerJourney(this.jsonData, this.jsonStations, isCheckIn, showDetails);
            }
            
            if (_.isElement(target)) {
                ko.applyBindings(this, target);
            }
        },

        activateBooking: function (data, target, stations, showDetails) {
            this.activate(data, target, stations,false, showDetails);
        },

        activatePNRMod: function (newBooking, oldBooking, target, stations, departureModType, returnModType) {
            var _journeys = [];
            if (newBooking && oldBooking && (departureModType || returnModType)) {
                // Build journey data for flight change/cancel
                // modType
                // 0 = noChange,
                // 1 = change,
                // 2 = cancel
                if (departureModType === 0 || departureModType === 1) {
                    _journeys.push(newBooking.Journeys[0]);
                } else if (departureModType === 2) {
                    // Grab cancelled journey data from old booking
                    _journeys.push(oldBooking.Journeys[0]);
                }
                if (oldBooking.Journeys.length > 1) {
                    if (returnModType === 0 || returnModType === 1) {
                        // If new booking doesn't have the cancelled journey
                        //_journeys.push(newBooking.Journeys[departureModType === 2 ? 0 : 1]);
                        // If new booking does have the cancelled journey
                        _journeys.push(newBooking.Journeys[newBooking.Journeys.length > 1 ? 1 : 0]);
                    } else if (returnModType === 2) {
                        // Grab cancelled journey data from old booking
                        _journeys.push(oldBooking.Journeys[1]);
                    }
                }
                this.activate(_journeys, target, stations, false);
                // Set observables for changing or cancelling journeys
                if (this.flightInfoJourneys().length > 0) {
                    var _journey = this.flightInfoJourneys()[0];
                    if (departureModType === 1) {
                        _journey.isChanging(true);
                    } else if (departureModType === 2) {
                        _journey.isCancelling(true);
                    }
                }
                if (this.flightInfoJourneys().length > 1) {
                    var _journey = this.flightInfoJourneys()[1];
                    if (returnModType === 1) {
                        _journey.isChanging(true);
                    } else if (returnModType === 2) {
                        _journey.isCancelling(true);
                    }
                }
            } else if (newBooking) {
                // Use normal activate if no flight change/cancel
                this.activate(newBooking.Journeys, target, stations, false);
            }
        },

        compositionComplete: function () {
            
        },


    });

    porter.FlightInfo = FlightInfo;
} ());

// Get station name from stations object or default to station code
function getStationName(stationCode, stations) {
    return !_.isEmpty(stations.Names[stationCode]) ? stations.Names[stationCode] : stationCode;
}

// Get airport name from stations object or default to station code
function getAirportName(stationCode, stations) {
    return !_.isEmpty(stations.Airports[stationCode]) ? stations.Airports[stationCode] : stationCode;
}



(function () {
    var EmailPassenger = function () {
        this.name = ko.observable({
            first: ko.observable(''),
            last: ko.observable(''),
            middle: ko.observable(''),
            suffix: ko.observable('')
        });
        this.contactEmail = ko.observable('');
        this.checked = ko.observable(false);
        this.emailAdded = ko.observable(false);

        this.errors = {
            invalidEmail: ko.observable(false)
        }

        this.fullName = ko.computed(function () {
            return this.name().first() + ' ' + (this.name().middle() ? this.name().middle() + ' ' : '') + this.name().last();
        }, this);
        
        this.resetErrors = function () {        
            for (var err in this.errors) {
                this.errors[err](false);                      
            }        
        };
        
    };

    // Main VM
    var EmailModalVM = function () {
        var _self = this;
        this.passengers = ko.observableArray();
        this.nonPaxEmail = ko.observableArray();
        this.pnr = ko.observable('');
        this.emails = ko.observableArray();

        this.showSuccessMsg = ko.observable(false);
        this.showFailMsg = ko.observable(false);
        this.collapse = ko.observable(false);
        this.showmultipleFail = ko.observable(false);

        // readOnly means the existing email cannot be changed
        // and no new emails can be added
        this.readOnly = ko.observable(false);

        this.isSubmitDisabled = ko.observable(false);

        this.errors = {};

        this.errors.InvalidEmail = ko.observable(false);

        this.CONST = {};
        this.CONST.SEND_ITINERARY_URL = dirPath + 'Common/SendItinerary';

        // close the desktop email module
        this.closeEmail = function () {
            this.collapse(!this.collapse())
            porter.scrollTo($("#email-itinerary-option"));
            if (!this.collapse()) {
                $("#email-itinerary-link").focus();
            }
        };

        this.selectedEmails = ko.computed(function () {
            // var selectedPassengers = _.filter(this.passengers(), function (p) {
            //     return p.checked();
            // });
            // var selectedNonPaxEmails = _.filter(this.nonPaxEmail(), function (p) {
            //     return p.checked();
            // });
            //return selectedPassengers.concat(selectedNonPaxEmails);
            var emails = _.filter(this.emails(), function (p) {
                return p.checked();
            });
            return emails;
        }, this);

        this.compositionComplete();
    };

    var p = EmailModalVM.prototype;
    p.Constructor = EmailModalVM;

    $.extend(p, {
        addEmail: function (index) {
            this.resetErrors();
            if (this.emails().length < 5) {
                var newEmail = new EmailPassenger();
                newEmail.checked(true);
                this.emails.push(newEmail);
                this.emails()[index].emailAdded(true);
                this.nonPaxEmail.push(newEmail);
                document.accessibility.readText("additional email input added");
            }
        },
        removeEmail: function (index) {
            this.emails().splice(index, 1);
            this.emails.valueHasMutated();
            document.accessibility.readText("email removed");
        },

        resetErrors: function () {
            for (var err in this.errors) {
                this.errors[err](false);                
                //this.errors.InvalidEmail(false);                
            }
        },

        //        // Check in
        //        injectPassengers: function (data) {
        //            // data is an array of Criteria
        //            if (!_.isEmpty(data)) {
        //                for (var x = 0; x < data.length; x++) {
        //                    if (!_.isEmpty(_.findWhere(data[x].PassengerJourneys, { IsCheckedIn: true }))) {
        //                        var pax = data[x].Passenger;
        //                        var newPax = new EmailPassenger();
        //                        newPax.name().first(pax.Name.First);
        //                        newPax.name().last(pax.Name.Last);
        //                        newPax.name().middle(pax.Name.Middle);
        //                        if ((x === 0 || !_.isEmpty(pax.CustomerNumber)) && !_.isEmpty(pax.ContactInfo)) {
        //                            newPax.contactEmail(pax.ContactInfo.EmailAddress);
        //                        }
        //                        this.passengers.push(newPax);
        //                    }
        //                }
        //            }
        //        },

        injectBookingPassenger: function (data) {
            // data is an array of PassengerViewModel
            if (!_.isEmpty(data)) {
                for (var x = 0; x < data.length; x++) {
                    var pax = data[x];
                    var newPax = new EmailPassenger();
                    newPax.name().first(pax.Name.First);
                    newPax.name().last(pax.Name.Last);
                    newPax.name().middle(pax.Name.Middle);
                    if ((x === 0 || !_.isEmpty(pax.CustomerNumber)) && !_.isEmpty(pax.ContactInfo)) {
                        newPax.contactEmail(pax.ContactInfo.EmailAddress);
                        newPax.checked(true);
                    }
                    if (newPax.checked()) {
                        this.emails.push(newPax);
                    }
                    this.passengers.push(newPax);
                }
            }
        },

        validate: function () {
            this.resetErrors();
            var allValid = true;
            for (x = 0; x < this.selectedEmails().length; x++) {
                var email = this.selectedEmails()[x];
                
                if (!regexPatterns.email.test(email.contactEmail()) || email.contactEmail() == '') {
                    // Invalid email
                    this.errors.InvalidEmail(true);
                    email.errors.invalidEmail(true);
                    allValid = false;
                }
            }
            if (!allValid) {
                this.errors.InvalidEmail(true);
            }

            // Check if any errors
            for (var err in this.errors) {
                if (this.errors[err]()) {                    
                    porter.accessInlineErrors();
                    // Error
                    return false;
                }
            }
            return true;
        },
        toggleCollapse: function (data) {
            data.information.emailModal().collapse(!data.information.emailModal().collapse());
            if(data.information.emailModal().collapse()) {
                porter.scrollTo($('#email-itinerary-option'));
            }
            if(data.showBookingReceipt()) {
                data.showBookingReceipt(!data.showBookingReceipt());
            }
        },

        submit: function () {
            this.resetErrors();
            if (this.isSubmitDisabled()) {
                return;
            }
            if (this.validate()) {
                this.isSubmitDisabled(true);
                this.sendItinerary();

                // GA
                try {
                    var numOfPaxToReceive = _.filter(this.passengers(), function (pax) { return pax.checked() }).length;
                    var numOfNonPaxToReceive = _.filter(this.nonPaxEmail(), function (pax) { return pax.checked() }).length;
                    var totalAmountOfPeople = numOfPaxToReceive + numOfNonPaxToReceive;
                    var totalNumOfPaxOnBooking = this.passengers().length;
                    trackEmailItinerary(numOfPaxToReceive, numOfNonPaxToReceive, totalAmountOfPeople, totalNumOfPaxOnBooking);
                }
                catch (err) { }
            }
        },

        buildItineraryData: function () {
            var _self = this;
            var emails = [];
            var selectedEmails = _self.selectedEmails();
            for (x = 0; x < selectedEmails.length; x++) {
                var e = selectedEmails[x].contactEmail();
                if (!_.isEmpty(e)) {
                    emails.push(e);
                }
            }
            return {
                'pnr': _self.pnr(),
                'emails': emails
            };
        },

        sendItinerary: function () {
            var _self = this;
            $.ajax({
                url: _self.CONST.SEND_ITINERARY_URL,
                data: JSON.stringify(_self.buildItineraryData()),
                contentType: 'application/json',
                type: 'POST'
            })
            .done(function (result) {
                if (result && result === true) {
                    _self.showSuccessMsg(true);
                    var _emailMsg = $('.email-success:visible').first();
                    porter.scrollTo($('#email-itineray-inline'));
                    // Accessibility, read out the success message
                    var _emailMsgClone = _emailMsg.clone();
                    _emailMsgClone.find('[aria-hidden=true]').remove();
                    document.accessibility.readText(_emailMsgClone.text());
                    setTimeout(function () {
                        _self.showSuccessMsg(false);
                    }, 5000);

                    //_self.displaySuccessModal();
                } else {
                    _self.showFailMsg(true);
                    // Email fail message
                    var _emailMsg = $('.email-fail:visible').first();
                    porter.scrollTo($('#email-itineray-inline'));
                    // Accessibility, read out the fail message
                    var _emailMsgClone = _emailMsg.clone();
                    _emailMsgClone.find('[aria-hidden=true]').remove();
                    document.accessibility.readText(_emailMsgClone.text());
                    setTimeout(function () {
                        _self.showFailMsg(false);
                    }, 5000);

                    //_self.displayFailModal();
                }
                _self.isSubmitDisabled(false);
            })
                .fail(function () {
                //_self.displayFailModal();
                _self.showFailMsg(true);
                // Email fail message
                var _emailMsg = $('.email-fail:visible').first();
                porter.scrollTo($('#email-itineray-inline'));
                // Accessibility, read out the fail message
                var _emailMsgClone = _emailMsg.clone();
                _emailMsgClone.find('[aria-hidden=true]').remove();
                document.accessibility.readText(_emailMsgClone.text());
                setTimeout(function () {
                    _self.showFailMsg(false);
                }, 5000);

                _self.isSubmitDisabled(false);
            });
        },

        displayFailModal: function () {
            var _self = this;
            $("#email-itinerary-modal").off('hidden.bs.modal').modal('hide');
            $('#email-fail-modal').modal('show').one('hidden.bs.modal', function () {
                if (_self._lastFocus) {
                    _self._lastFocus.focus();
                }
            });
        },

        displaySuccessModal: function () {
            var _self = this;
            $("#email-itinerary-modal").off('hidden.bs.modal').modal('hide');
            $('#email-success-modal').modal('show').one('hidden.bs.modal', function () {
                if (_self._lastFocus) {
                    _self._lastFocus.focus();
                }
            });
        },

        compositionComplete: function () {
            var _self = this;
            $('#email-itinerary-modal').on('show.bs.modal', function () {
                // Focus on the last element before opening the modal
                _self._lastFocus = $(document.activeElement);
                $(this).one('hidden.bs.modal', function () {
                    _self._lastFocus.focus();
                });
            });
        }
    });

    porter.EmailModalVM = EmailModalVM;
} ());var bookingCommon = {
    moduleName: 'bookingCommon'
	, bindings: {} // used later for bindings functions
	, base: '.booking' // jQuery base
	, culture: (typeof userCulture !== 'undefined') ? userCulture : $("input[name='culture']").val()
	, debug: false // controls logging
	, isIE8: $("html").hasClass('ie8')
    , seatsVMUpdateSeats: new ko.subscribable()
    , bagsVMUpdateBags: new ko.subscribable()
    , bookingWidgetIsProcessing: new ko.subscribable()
	, alert: function (val) {
	    if (this.debug) {
	        window.alert(val);
	    }
	}
	, log: function (val) {
	    if (this.debug && !this.isIE8) {
	        console.log(val);
	    }
	}
	, setBreakpoint: function () {
	    if ($(".breakpoint").css("display") == "none") {
	        this.onSmallBreakpointEnter();
	    } else {
	        this.onLargeBreakpointEnter();
	    }
	}
    , watchBreakpoints: function () {
        if ($(".breakpoint").css("display") == "none") {
            if ($("body").attr("data-breakpoint") == "large") {
                this.onSmallBreakpointEnter();
            }
        } else {
            if ($("body").attr("data-breakpoint") == "small") {
                this.onLargeBreakpointEnter();
            }
        }
    }
    , onSmallBreakpointEnter: function () {
        // this.log(this.moduleName + ':onSmallBreakpointEnter');
        $("body").attr("data-breakpoint", 'small');
        $(window).trigger('smallBreakpointEnter');
    }
    , onLargeBreakpointEnter: function () {
        // this.log(this.moduleName + ':onLargeBreakpointEnter');
        $("body").attr("data-breakpoint", 'large');
        $(window).trigger('largeBreakpointEnter');
    }

    , localizeModuleCurrency: function (module) {
        var self = this;
        $(module).find(".currency").each(function (i) {
            var selfCulture = self.culture;
            //if id is set - get currency from it
            if ($(this).attr('currency')) {
                if ($(this).attr('currency') == "CAD" && selfCulture == "en-US") {
                    selfCulture = 'en-CA';
                }
                 if ($(this).attr('currency') == "USD") {
                    selfCulture = 'en-US';
                }
            }
            if (this.isIE8) {
                $(this).html(self.localizeCurrency($(this).text(), selfCulture))
            } else {
                // $(this).replaceWith(self.localizeCurrency($(this).text(), self.culture))
                var localized = self.localizeCurrency($(this).text(), selfCulture);

                $(this).addClass(localized.locale).attr('data-amount', localized.amount).html(localized.result);
            }
        });
    }

    , localizeCurrency: function (amount, locale) {
        // This script will return a string with separate spans for:
        //	- currency symbol ($)
        //	- dollars
        //	- cents
        //	- currency Name (i.e. CAD)
        //	and wrap it all in a span class="currency" name, with data-attribute of the original value,
        // 	in case it is needed for calculations
        // <span class="currency" data-amount=""><span class='symbol'>$</span><span class='dollars'>1,141</span><span class="sep">.</sep><span class='cents'>00</span><span class="currencyName">CAD</span></span>

        // Assuming that currency will be returned as 1234.56, but forcing the format anyway
        // fr-CA: 1009,04 $
        // else: $1009.04
        var result = ''; // amount; // return by default
        var resultValue = ''; // amount with dollar symbol
        var resultValueOnly = ''; // amount with dollar symbol
        var sepSymbol = ".";
        var splitCurrency = [];
        var dollars = '';
        var cents = '';
        var currencyName = "CAD";
        var cleanAmount; //parseFloat(amount.replace(/[^\d\.]/g, '')).toFixed(2);        

        amount = amount.replace(/,/g, '.'); // switch the comma with period, if necessary;

        cleanAmount = parseFloat(amount.replace(/[^0-9-.]/g, '')).toFixed(2);

        if (cleanAmount == 'NaN') {
            cleanAmount = '';
        };

        if (amount == '--') {
            return result;
        } else {
            if (locale == 'fr-CA') {
                sepSymbol = ',';
            };

            splitCurrency = cleanAmount.split('.');
            dollars = splitCurrency[0];

            if (typeof splitCurrency[1] != 'undefined') {
                cents = splitCurrency[1];
            }

            if (locale == 'fr-CA') { // handle French exception
                result += "<span class='dollars'>" + dollars + "</span><span class='sep'>" + sepSymbol + "</span><span class='cents'>" + cents + "</span><span class='symbol'>$</span><span class='currencyName'>" + currencyName + "</span>";
                resultValue += dollars + sepSymbol + cents + " $";

            } else {
                if (locale == 'en-US') {
                    currencyName = 'USD';
                };

                result += "<span class='symbol'>$</span><span class='dollars'>" + dollars + "</span><span class='sep'>" + sepSymbol + "</span><span class='cents'>" + cents + "</span><span class='currencyName'>" + currencyName + "</span>";
                resultValue += "$ " + dollars + sepSymbol + cents;
            }

            resultValueOnly += Number(dollars + sepSymbol + cents);
        }

        // return result;
        return { 'result': result, 'locale': locale, 'amount': cleanAmount, 'dollars': dollars, 'sepSymbol': sepSymbol, 'cents': cents,  'resultValue': resultValue, 'resultValueOnly': resultValueOnly };
    }

	, init: function () {
	    this.log('init:' + this.moduleName);
	    this.setBreakpoint();

	    var self = this;

	    $(window).resize(function () {
	        self.watchBreakpoints();
	    });
	}

};
var bookings = bookings || {};

$(function ()
{
    bookings.summary = ko.observable();
    bookings.fareSummary = ko.observable(); // For passengers section
    bookings.collapseFare = ko.observable(true);
    bookings.collapseFareDetails = ko.observable(true);
    bookings.hasLoadedFareDetails = ko.observable(false);
    bookings.hasPetWithin12Hour = ko.observable(false);
    bookings.isOpenJaw = ko.observable(false);
    bookings.hasMixedFareClasses = ko.observable(false);
    bookings.isInfantPassenger = ko.observable(false);
    bookings.stationsXML = ko.observable();
    bookings.collapseSeatAndBag = ko.observable(true);

    bookings.isCancelled = ko.observable(false);
    bookings.isIROP = ko.observable(false);
    bookings.isPotentialIROP = ko.observable(false);
    bookings.isRebooked = ko.observable(false);
    bookings.isEligibleToRebookOnline = ko.observable(false);
    bookings.isWaiveSDC = ko.observable(false);
    bookings.hasBlockedSSRs = ko.observable(false);
    bookings.isClosed = ko.observable(false);
    bookings.isPartialCancelled = ko.observable(false);

    bookings.isGiftCertificate = ko.observable(false);
    
    bookings.isNonRev = ko.observable(false);
    bookings.isPrePaid = ko.observable(false);
    bookings.isGroup = ko.observable(false);
    bookings.isStandbyRankActive = ko.observable(false);
    bookings.withinCovid = ko.observable(true);
    bookings.isFinancing = ko.observable(false);
    bookings.isModifyPage = ko.observable(false);
    
    // rules //
    bookings.showBookingReceipt = ko.observable(false);

    bookings.canSelectSeats = ko.observable();
    bookings.canSelectBags = ko.observable();

    bookings.canSeatsBeChanged = ko.observable();
    bookings.canBagsBeChanged = ko.observable();
    bookings.canModifyBooking = ko.observable();
    bookings.allDeparted = ko.observable();
    bookings.anyDeparted = ko.observable();
    bookings.showRemoveLink = ko.observable();
    // end of rules //
    bookings.departureSection = ko.observable();
    bookings.arrivalSection = ko.observable();
    bookings.departureFare = ko.observable();
    bookings.returnFare = ko.observable();
    bookings.departureBookingWidget = ko.observable();
    bookings.returnBookingWidget = ko.observable();
    bookings.fareRulesDetails = ko.observable();
    bookings.isSubmitDisabled = ko.observable();

    bookings.purchasedAncillaryOptions = ko.computed(function () {
        var options = [];
        if (bookings.fareSummary()) {
            //get FLEX option if any
            for (var i = 0; i < bookings.fareSummary().passengers().length; i++) {
                var pax = bookings.fareSummary().passengers()[i];
                if (pax.addonFees().length > 0) {
                    for (var j = 0; j < pax.addonFees().length; j++) {
                        options.push(pax.addonFees()[j].feeCode());
                    }
                }
            }
            //get RFN/FLRF options if any
            for (var i = 0; i < bookings.fareSummary().additionalFees().length; i++) {
                var fee = bookings.fareSummary().additionalFees()[i];
                options.push(fee.feeCode());
            }
        }
        return Array.from(new Set(options));//remove duplicate options
    }, bookings);

    bookings.collapseFare.subscribe(function (newValue)
    {
        setTimeout(function ()
        {
            document.accessibility.readText($('#btn-more-info-fare-rules').find('span:visible').text());
        }, 300);

    });

    bookings.toggleSeatAndBag = function () {
        this.collapseSeatAndBag(!this.collapseSeatAndBag());
        if (this.collapseSeatAndBag()) {
            porter.scrollTo($("#tab-info__fare-rules"));   
            document.getElementById("seatAndBagsLink").focus(); 
        } 
    }
    

    bookings.lookupSSR = function (code, culture) {
        return $(bookings.stationsXML()).find("SSR[name='" + code + "']").first().find("value[culture='" + culture + "']").text();
    }

    bookings.parseSSRs = function (data) {
        bookings.stationsXML(data);
    }

    bookings.loadSSRs = function () {
        var res = false;

        $.ajax({
            type: "GET",
            url: baseUrl + "SSR.xml",
            async: false,
            dataType: 'xml',
            success: function (data) {
                res = bookings.parseSSRs(data);
            },
            error: function () {
                console.log("load ssr failed");
            }
        });

        return res;
    }

    bookings.redirectToCheckIn = function () {
        lastName = bookings.paxSummaryViewModel.paxSummary().passengers()[0].lastName();
        firstName = bookings.paxSummaryViewModel.paxSummary().passengers()[0].firstName();
        var pnr = bookings.information.confirmationNumber();

        if (lastName != "" && firstName != "" && pnr != ""){
                $.post(
                 bookings.CONST.CHECK_IN_SUBMIT_URL,
                 { pnr: pnr, lastName: lastName, tabid:porter.util.getTabID() }
             ).done(function (result) {
                 if (result.errors && result.errors.length > 0) {
                     var errMsg = '';
                     for (var i = 0; i < result.errors.length; ++i) {
                         if (i > 0)
                             errMsg += '<br />';
                         errMsg += result.errors[i];
                     }
                     porter.showModalError(errMsg);
                     return;
                 }
                 else {
                     window.location.href = result.url;
                 }
             });
            }
    };
  //  bookings.changeDepartureSection = function (section, event) {
  //      var button = $(event.target).val();
  //      if (button)
  //          button = parseInt(button);
  //      bookings.clearSection(0, button);
  //      bookings.departureSection(button);
  //      $('#change-flight-0').val(button);
  //      $('#flightOptionError1').hide();
  //      //this.clearErrors(section);
  //      //this.changeContainerHeight();
  //      return true;
  //  },
  //bookings.changeArrivalSection = function (section, event) {
  //    var button = $(event.target).val();
  //    if (button)
  //        button = parseInt(button);
  //    //button = button == "2" ? 1 : 2;
  //    bookings.clearSection(1, button);
  //    bookings.arrivalSection(button);
  //    $('#change-flight-1').val(button);
  //    $('#flightOptionError2').hide();
  //    //this.clearErrors(section);
  //    //this.changeContainerHeight();
  //    return true;
  //},
    //    bookings.clearSection = function (section, button) {
    //    if (section === 0) {
    //        bookings.departureSection(0);
    //        if (button == null){
    //            $('#change-flight-radio-0').prop("checked", false);
    //            $('#cancel-flight-radio-0').prop("checked", false);
    //        }
    //        else if (button == 1){
    //            $('#change-flight-radio-0').prop("checked", false);
    //        }
    //        else if (button == 2){
    //            $('#cancel-flight-radio-0').prop("checked", false);
    //        }
    //    }
    //    else if (section === 1) {
    //        bookings.arrivalSection(0);
    //        //$('#change-flight-radio-1').prop("checked", false);
    //        //$('#cancel-flight-radio-1').prop("checked", false);
    //        if (button == null){
    //            $('#change-flight-radio-1').prop("checked", false);
    //            $('#cancel-flight-radio-1').prop("checked", false);
    //        }
    //        else if (button == 1){
    //            $('#change-flight-radio-1').prop("checked", false);
    //        }
    //        else if (button == 2){
    //            $('#cancel-flight-radio-1').prop("checked", false);
    //        }
    //    }
    //},
    bookings.flightInfo_submit = function () {
        console.log("Departure: " + bookings.departureSection());
        console.log("Arrival: " + bookings.arrivalSection());
        // window.location.hrefModifyBookingSubmit
    }
    bookings.viewReceipt = function () {
        this.tabID = '';//porter.util.getTabID();
        bookings.summary(new porter.BookingSummary());
        bookings.summary().activate(data.Booking);
        
        $.ajax({
            url: dirPath + 'manage-flights/My-Bookings/setReceiptSummary/' + (this.tabID.length > 0 ? "?tabid=" + this.tabID : ''),
            data: JSON.stringify(data.Booking),
            contentType: 'application/json; charset=utf-8',
            type: 'POST',
            dataType: 'json'
        })
                .done(function (result)
                {
                    //bookings.collapseFareDetails(false);
                    var errorMessage = '';
                    // _self.isLoading(false);
                    if (!_.isEmpty(result)) {
                        if (result && !result.errors) {
                            if (result.CartData)
                            {                                
                                bookings.summary().setSummaryCart(result);
                            }
                            return;
                        } else if (result.errors) {
                            for (var x = 0; x < result.errors.length; x++) {
                                errorMessage += result.errors[x];
                                errorMessage += '<br />';
                            }
                        }
                    }
                    // if error
                    if (errorMessage === '') {
                        errorMessage = porter.CONST.GENERIC_ERROR;
                    }
                    porter.showModalError(errorMessage);
                })
                .fail(function () {
                    //porter.showModalError(porter.CONST.GENERIC_ERROR);
                });
    };
    
    bookings.togglePaymentReceipt = function() { // for flight options module (desktop)
        bookings.showBookingReceipt(!bookings.showBookingReceipt());
        porter.scrollTo($('#payment-receipt-option'));
        if(!bookings.showBookingReceipt()) {
            $("#payment-receipt-link").focus();
        } 
        if (bookings.information.emailModal().collapse()) {
            bookings.information.emailModal().collapse(!bookings.information.emailModal().collapse());
        }
    };

    bookings.closePaymentReceipt = function () { //for credit/refund module
        bookings.showBookingReceipt(!bookings.showBookingReceipt());
        porter.scrollTo($('#credit-refund-info'));
    }

    bookings.closePaymentModal = function () { //for pop-up modal
        if ($('#flight-options-heading').is(':visible')) {
            porter.scrollTo($('#flight-options-heading'));
        } else if ($('#options-heading').is(':visible')) {
            porter.scrollTo($('#options-heading'));
        } else if ($('#credit-refund-info').is(':visible')) {
            porter.scrollTo($('#credit-refund-info'));
        }
    }

    bookings.showConfirmation = function () {
        // only show if car rental already exists
        return (porter.itinerary.data.Booking.PriceBreakdown.HasCar);
    }

    bookings.showRentals = function () {
        var condition1 = porter.itinerary.data.HertzAvailability != null;
        var condition2 = porter.itinerary.data.Booking.ItineraryNavigation.CarAllowed;
        var condition3 = !porter.itinerary.data.Booking.PriceBreakdown.HasCar;
        var condition4 = function () {
            return porter.itinerary.data.HertzAvailability.state != 2;
        }; // delay execution

        return (condition1 && condition2 && condition3 && condition4());
    };

    // For showing/hiding the Porter credit message
    bookings.showCreditMessage = ko.computed(function ()
    {
        if (this.isCancelled() && !this.isGiftCertificate()) 
        {
            if (!this.userDetails.isPorterPassBooklet()) {
                if (this.paymentViewModel) {
                    if (this.paymentViewModel.payment && !_.isEmpty(this.paymentViewModel.payment())) {
                        if (this.paymentViewModel.payment().hasCreditShell() && (this.paymentViewModel.payment().totalPaymentAmount() > 0 || this.paymentViewModel.payment().hasPayment())) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }, bookings);

    //check covid 
    bookings.withinCovid = ko.computed(function(){
    var modifiedDate = data.Booking.BookingDetail.ModifiedDate;
    var minDate = '2020-03-21';
    var maxDate = '2022-06-30';

    //cancellation date within: March 21 and Dec 31, 2021
    //maxDate changed to OCt 31 as requested on WEB-21080, WEB-21080, WEB-20271, WEB-21451 and WEB-21761
    if (moment(modifiedDate).isAfter(minDate) && moment(modifiedDate).isBefore(maxDate)){
        return true;
    }
    return false;
    }, bookings);

    bookings.collapseFareDetails.subscribe(function (val) {
        var _self = this;
        if (!val && !_self.hasLoadedFareDetails()) {
            if (_self.departureFare()) {
                var departFare = {
                    CarrierCode: _self.departureFare().CarrierCode,
                    ClassOfService: _self.departureFare().ClassOfService,
                    RuleTariff: 'fareRule1'
                };
                _self.fareRulesDetails().updateFareRuleText(departFare);
                _self.hasLoadedFareDetails(true);
            }
            if (_self.returnFare()) {
                var returnFare = {
                    CarrierCode: _self.returnFare().CarrierCode,
                    ClassOfService: _self.returnFare().ClassOfService,
                    RuleTariff: 'fareRule2'
                };
                if (!_.isEmpty(returnFare.CarrierCode) && !_.isEmpty(returnFare.ClassOfService)) {
                    _self.fareRulesDetails().updateFareRuleText(returnFare);
                    _self.hasLoadedFareDetails(true);
                }
            }
        }
    }, bookings);

    bookings.setBookingFlags = function (data)
    {
        if (data == null || data.Booking == null)
        {
            return;
        }

        _.each(data.Booking.Journeys, function (journey)
        {
            _.each(journey.Segments, function (segment)
            {
                var upcomingFlight = _.filter(data.UpcomingFlightViewModels, function (j) { return j.DepartureStationCode == segment.DepartureStation });

                _.each(segment.Fares, function (fare)
                {

                    if (typeof PRODUCT_CLASS != "undefined" && fare.ProductClass == PRODUCT_CLASS.GROUP) //GP
                    {
                        bookings.isGroup(true);
                    }
                      
                    if (fare.FareDesignator != null && fare.FareDesignator.RuleFareTypeCode == "N")
                    {                        
                        bookings.isNonRev(true);
                    }

                    // based on server side check - matched against product codes
                    if (upcomingFlight.length > 0) {
                        bookings.isNonRev(upcomingFlight[0].isNonRevenueBooking);
                    }
                })
            })
        });

        var paymentCodePA = _.find(data.Booking.Payments.items, function (item) { return item.PaymentMethodCode == "PA"; });

        if (paymentCodePA != null)
        {
            bookings.isPrePaid(true);
        }

    };

    bookings.activateModels = function (data, stations, provinces, insuranceUrl, countries) {
        this.tabID = porter.util.getTabID();
        var _self = this;
        bookings.loadSSRs();
        bookings.isStandbyRankActive(data.IsStandbyRankActive);
        bookings.isFinancing(data.IsFinancing);
        bookings.setBookingFlags(data);

        // Changed data.UpcomingFlightViewModel to data.UpcomingFlightViewModels as a List
        // Initialize the old VM here to work with previous code
        data.UpcomingFlightViewModel = _.find(data.UpcomingFlightViewModels,
            function (vm) {
                return vm.FlightStatus && vm.FlightStatus.DepartureStatus != 'Departed' && moment(vm.ScheduledDepartureDate) > porter.DATETIME_NOW;
            });
        if (!data.UpcomingFlightViewModel && data.UpcomingFlightViewModels.length > 0) {
            data.UpcomingFlightViewModel = _.first(data.UpcomingFlightViewModels);
        }

        // Initialize IROP variables
        for (var x = 0; x < data.UpcomingFlightViewModels.length; x++) {
            var _upcomingFlightVM = data.UpcomingFlightViewModels[x];
            
            if (_upcomingFlightVM.IsIROP) {
                bookings.isIROP(true);
            }
            if (_upcomingFlightVM.IsPotentialIROP) {
                bookings.isPotentialIROP(true);
            }
            if (_upcomingFlightVM.IsRebooked) {
                bookings.isRebooked(true);
            }
            if (_upcomingFlightVM.IsEligibleToRebookOnline) {
                bookings.isEligibleToRebookOnline(true);
            }
            if (_upcomingFlightVM.IsWaiveSDC) {
                bookings.isWaiveSDC(true);
            }
            if (_upcomingFlightVM.hasBlockedSSRs) {
                bookings.hasBlockedSSRs(true);
            }
            if (_upcomingFlightVM.isClosed) {
                bookings.isClosed(true);
            }
        }

        iropModel = bookings.iropViewModel;
        iropModel.loadIrop(data);

        checkListModel = bookings.checkListViewModel;
        checkListModel.loadCheckList(data);

        flightOverviewModel = bookings.flightOverviewViewModel;
        flightOverviewModel.loadFlightOverview(data);

        flightStatusModel = bookings.flightStatusViewModel;
        flightStatusModel.loadFlightStatus(data.Booking.Journeys, stations, data.UpcomingFlightViewModels, data.StandbyRanks);

        paxSummaryModel = bookings.paxSummaryViewModel;
        paxSummaryModel.loadPaxSummary(data.Booking);

        bookingContactModel = bookings.bookingContactViewModel;
        bookingContactModel.loadBookingContact(data.Booking, provinces, countries);

        insuranceModel = bookings.insuranceViewModel;
        var insuranceUrl = insuranceUrl;
        insuranceModel.loadInsurance(data, insuranceUrl, provinces);

        bookings.loadInformation(data.Booking, data);
        bookings.loadUserDetails(data.UserDetails);

        paymentModel = bookings.paymentViewModel;
        paymentModel.loadPayment(data.Booking, data.Account);


        //rentalConfirmationModel = bookings.rentalConfirmationViewModel;
        //rentalConfirmationModel.loadRentalConfirmation(data.Booking);
        //rentals.importOptions(rentalsOptions);
        //if (data.Booking.PriceBreakdown.HasCar) {
        //    // Confirmation
        //    bookings.carRental().BookedCarRental(new rentals.BookedCarRental(data.Booking));
        //} else if (data.HertzAvailability && data.HertzAvailability.rates) {
        //    // No car rental booked
        //    bookings.carRental().VehicleVM(new rentals.VehicleVM(data));
        //}
        if (typeof (rentalsOptions) !== 'undefined') {
            rentals.activate(data, false);
            bookings.carRental(rentals);
        }

        //scroll to        
        var scrollTo = getURLParameter('scrollTo');
        if (typeof scrollTo != 'undefined') {
            if (scrollTo == 'rentals') {
                if (typeof bookings.carRental() != 'undefined') {
                    bookings.carRental().vehicleVM().collapse(false);
                    porter.scrollTo($('#rental').filter(':last'), 800);
                }
            }
        }

        //bookings.loadInformation(data.Booking, data);
        //bookings.loadUserDetails(data.UserDetails);


        bookings.allDeparted(_.every(data.Booking.Journeys, function (j) { return (j.Status == "Departed" || j.Status == "Arrived" || j.Status == "Cancelled" || j.Status == "Closed") }));
        bookings.anyDeparted(_.some(data.Booking.Journeys, function (j) { return (j.Status == "Departed" || j.Status == "Arrived" || j.Status == "Cancelled" || j.Status == "Closed") }));
        //bookings.allCancelled(_.every(data.Booking.Journeys, function (j) { return j.Status == "Cancelled" }));

        bookings.fareRulesDetails(new porter.FareRulesDetails());
        bookings.fareRulesDetails().injectData(data.Booking, stations);


        if (data != null &&
            data.Booking != null &&
            data.Booking.Payments != null &&
            data.Booking.Payments.items != null &&
            (data.Booking.Journeys == null || data.Booking.Journeys.length == 0)
        ) {
            var giftPayment = _.find(data.Booking.Payments.items, function (s) {
                return s.AccountTransactionCode == "GIFT";
            });

            if (giftPayment != null) {
                bookings.isGiftCertificate(true)
            }
        }
        
        bookings.isCancelled(flightOverviewModel.flightOverview().ScheduledDepartureDateString().slice(-4) == "0001" ? true : false);
        
        //bookings.isPartialCancelled((_.any(data.Booking.Journeys, function (j) { return (j.Status == "Cancelled") }) && bookings.isCancelled() == false) ? true : false);
        bookings.isPartialCancelled(((_.any(data.Booking.Journeys, function (j) { return (j.Status == "Cancelled") }) || data.IsPartialFlightCancelled) && bookings.isCancelled() == false) ? true : false);

        //bookings.isIROP(flightOverviewModel.flightOverview().isIROP());
        //bookings.isRebooked(flightOverviewModel.flightOverview().isRebooked());
        //bookings.isEligibleToRebookOnline(flightOverviewModel.flightOverview().isEligibleToRebookOnline());

        this.goBackLink = ko.observable(dirPath + 'manage-flights/my-bookings/booking-details?token=' + data.Booking.BookingDetail.Token + (window.name && window.name.startsWith("pnrmod") ? "&tabid=" + window.name : ""));

        // load rules
        bookings.setRules(bookings);
        bookings.loadWarningMessages(); // load warnings after user details and rules has been fully loaded
        bookings.loadSeatWarningMessages();

        // If IROP'd then check if any of the journeys can be changed or cancelled
        // Meant to disable the submit button
        if (bookings.isIROP()) {
            // Set to true if any journey can be changed or cancelled
            var _canChangeFlight = false;
            var _canCancelFlight = false;
            for (var x = 0; x < checkListModel.checkList().journeys().length; x++) {
                var _journey = checkListModel.checkList().journeys()[x];
                if (_journey.canChangeFlight()) {
                    _canChangeFlight = true;
                }
                if (_journey.canCancelFlight()) {
                    _canCancelFlight = true;
                }
            }
            if (bookings.rules.canChangeFlight()) {
                bookings.rules.canChangeFlight(_canChangeFlight);
            }
            if (bookings.rules.canCancelFlight()) {
                bookings.rules.canCancelFlight(_canCancelFlight);
            }
        }

        if (bookings.isModifyPage()) {
            if (data.Booking.Journeys.length > 0) {
                var departBookingWidgetVM = new porter.PnrModBookingWidgetVM();
                var departJourney = _.first(data.Booking.Journeys);
                var adults = _.filter(data.Booking.Passengers, function (p) { return p.TypeInfo[0].PaxType === 'ADT'; }).length;
                var children = _.filter(data.Booking.Passengers, function (p) { return p.TypeInfo[0].PaxType === 'CHD'; }).length;
                var infants = _.filter(data.Booking.Passengers, function (p) { return p.HasInfant; }).length;
                departBookingWidgetVM.activate({
                    containerId: 'booking-widget-0',
                    departStationId: 'booking-widget-from-0',
                    departStation: _.first(departJourney.Segments).DepartureStation,
                    arrivalStationId: 'booking-widget-to-0',
                    arrivalStation: _.last(departJourney.Segments).ArrivalStation,
                    pickStartId: 'booking-widget-pickstart-0',
                    pickStartBaseId: 'booking-widget-pickstartbase-0',
                    pickEndId: 'booking-widget-pickend-0',
                    pickEndBaseId: 'booking-widget-pickendbase-0',
                    nameDateStart: 'daterangepicker_start_0',
                    nameDateStartBase: 'daterangepicker_start_base_0',
                    nameDateEnd: 'daterangepicker_end_0',
                    nameDateEndBase: 'daterangepicker_end_base_0',
                    selectedDateStart: moment(_.first(departJourney.Segments).STD),
                    adults: adults,
                    children: children,
                    infants: infants
                });
                bookings.departureBookingWidget(departBookingWidgetVM);
                if (data.Booking.Journeys.length > 1) {
                    var returnBookingWidgetVM = new porter.PnrModBookingWidgetVM();
                    var returnJourney = _.last(data.Booking.Journeys);
                    returnBookingWidgetVM.activate({
                        containerId: 'booking-widget-1',
                        departStationId: 'booking-widget-from-1',
                        departStation: _.first(returnJourney.Segments).DepartureStation,
                        arrivalStationId: 'booking-widget-to-1',
                        arrivalStation: _.last(returnJourney.Segments).ArrivalStation,
                        pickStartId: 'booking-widget-pickstart-1',
                        pickStartBaseId: 'booking-widget-pickstartbase-1',
                        pickEndId: 'booking-widget-pickend-1',
                        pickEndBaseId: 'booking-widget-pickendbase-1',
                        nameDateStart: 'daterangepicker_start_1',
                        nameDateStartBase: 'daterangepicker_start_base_1',
                        nameDateEnd: 'daterangepicker_end_1',
                        nameDateEndBase: 'daterangepicker_end_base_1',
                        selectedDateStart: moment(_.first(returnJourney.Segments).STD),
                        adults: adults,
                        children: children,
                        infants: infants
                    });
                    bookings.returnBookingWidget(returnBookingWidgetVM);
                }
            }
        }

        if (data.BookingSummary && porter.FareSummaryVM) {
            var fareSummary = new porter.FareSummaryVM();
            fareSummary.activate(data.BookingSummary);
            for (var x = 0; x < fareSummary.passengers().length; x++) {
                if (bookings.rules.canUpdatePaxInfo() && 
                   !bookings.anyDeparted() && 
                   !bookings.checkListViewModel.isAnyJourneyCheckedIn() && 
                   bookings.checkListViewModel.checkList().liftStatus() != 1 && 
                   bookings.checkListViewModel.checkList().liftStatus() != 2) {
                    fareSummary.passengers()[x].showEditBtn(true);
                } else {
                    fareSummary.passengers()[x].showEditBtn(false);
                }
            }            
            bookings.fareSummary(fareSummary);
        }
    };

    // for receipt only
    bookings.booking = function () {
        information = new information();
        information.injectData(bookings);
    };
    var information = function () {
        confirmationNumber = ko.observable();
        boardingDate = ko.observable();
        bookingStatus = ko.observable();
        bookingIsPending = ko.observable(false);
        bookingDate = ko.observable();
        recordLocators = ko.observableArray();
        interlinePNR = ko.observable();
        bookingBalanceDue = ko.observable(0);
        emailModal = ko.observable(new porter.EmailModalVM());

        this.injectData = function (data) {
        }
    };
    //end of receipt only

    // irop message view model
    bookings.iropModel = function () {
        this.isIROP = ko.observable(false);
        this.isPotentialIROP = ko.observable(false);
        this.isRebooked = ko.observable(false);
        this.isEligibleToRebookOnline = ko.observable(false);
        // Waived SDC for one flight
        this.isWaiveSDC = ko.observable(false);
        // Waived SDC for round trip
        this.isWaiveSDCRoundTrip = ko.observable(false);
        this.isPorterEscapes = ko.observable(false);
        this.canChangeFlight = ko.observable(false);
        this.canDoComplimentarySameDayChange = ko.observable(false);
        this.canDoComplimentarySameDayChangeElsewhere = ko.observable(false);
        this.arrivalStationName = ko.observable('');
        this.originalFlightDesignator = ko.observable({
            CarrierCode: '',
            FlightNumber: ''
        });
        // Extra line and link on MyBooking_IROPMessage.ascx
        this.showIROPLink = ko.observable(true);
        this.collapseIROPReasonCode = ko.observable(false);
        this.eventReasonCode = ko.observable('');
        this.eventReasonCategory = ko.observable('');
        this.isDelayed = ko.observable(false);
        this.hasSeatCredit = ko.observable(false);

        this.forceIROPRebookURL = ko.computed(function ()
        {
            if (this.isEligibleToRebookOnline() &&
                
                typeof bookings.userDetails != "undefined" &&

                ( typeof bookings.messages == "undefined" || !bookings.messages || !bookings.messages.showWarningMessage())
                &&

                bookings.userDetails &&
                bookings.userDetails.isPorterEscapes()
                )
            {
                return true;
            }
            else
            {
                return false;
            }

        }, this);

        // arrivalStationName returns station name and station code e.g. "Toronto (YTZ)"
        // Trim to return only the station name
        this.arrivalCityName = ko.computed(function () {
            if (this.arrivalStationName() && this.arrivalStationName().lastIndexOf('(') >= 0) {
                return this.arrivalStationName().substring(0, this.arrivalStationName().lastIndexOf('(')).trim();
            }
            return this.arrivalStationName();
        }, this);
    };
    bookings.iropViewModel = function () {
        var irop = ko.observable(),

        loadIrop = function (data) {
            var iropModel = new bookings.iropModel();
            var waivedSDCCount = 0;
            for (var x = 0; x < data.UpcomingFlightViewModels.length; x++) {
                var _upcomingFlightVM = data.UpcomingFlightViewModels[x];
                

                //iropModel.isDelayed(_upcomingFlightVM.FlightStatus.DepartureStatus == 'Delayed');
                //if (iropModel.isDelayed()) {
                if (_upcomingFlightVM.FlightStatus.DepartureStatus == 'Delayed') {
                    iropModel.isDelayed(true);
                    iropModel.arrivalStationName(_upcomingFlightVM.ArrivalStationName);
                    iropModel.eventReasonCategory(_upcomingFlightVM.FlightStatus.EventReasonCategory);
                    iropModel.eventReasonCode(_upcomingFlightVM.FlightStatus.EventReasonCode);
                }
                if ((_upcomingFlightVM.IsIROP || _upcomingFlightVM.IsPotentialIROP) &&
                    moment(_upcomingFlightVM.ScheduledDepartureDate) > porter.DATETIME_NOW) {
                    iropModel.isIROP(_upcomingFlightVM.IsIROP);
                    iropModel.isPotentialIROP(_upcomingFlightVM.IsPotentialIROP);
                    iropModel.isRebooked(_upcomingFlightVM.IsRebooked);
                    iropModel.isEligibleToRebookOnline(_upcomingFlightVM.IsEligibleToRebookOnline);
                    iropModel.arrivalStationName(_upcomingFlightVM.ArrivalStationName);
                    iropModel.originalFlightDesignator(_upcomingFlightVM.OriginalFlightDesignator);
                    iropModel.hasSeatCredit(_upcomingFlightVM.HasSeatCredit);
                    if (_upcomingFlightVM.IsIROP) {
                        iropModel.eventReasonCategory(_upcomingFlightVM.FlightStatus.EventReasonCategory);
                        iropModel.eventReasonCode(_upcomingFlightVM.FlightStatus.EventReasonCode);
                        break;
                    }
                } else if (_upcomingFlightVM.IsWaiveSDC) {
                    var accessJourney = _.find(data.Rules.AccessRuleJourneys, function (a) { return a.SellKey === _upcomingFlightVM.SellKey; });
                    if (!_.isEmpty(accessJourney)) {
                        if ((data.Rules.CanChangeFlight && accessJourney.CanChangeFlight) ||
                            (!data.Rules.CanChangeFlight && !data.Rules.CanCancelFlight && (data.Rules.CanDoComplimentarySameDayChange || data.Rules.CanDoComplimentarySameDayChangeElsewhere))) {
                            iropModel.arrivalStationName(_upcomingFlightVM.ArrivalStationName);
                            iropModel.isWaiveSDC(_upcomingFlightVM.IsWaiveSDC);
                            waivedSDCCount++;
                            if (waivedSDCCount > 1) {
                                iropModel.isWaiveSDCRoundTrip(_upcomingFlightVM.IsWaiveSDC);
                            }
                        }
                    }
                }                
            }
            iropModel.canChangeFlight(data.Rules.CanChangeFlight);            
            iropModel.canDoComplimentarySameDayChange(data.Rules.CanDoComplimentarySameDayChange);
            iropModel.canDoComplimentarySameDayChangeElsewhere(data.Rules.CanDoComplimentarySameDayChangeElsewhere);
            iropModel.isPorterEscapes(data.UserDetails.IsPorterEscapes);
            
            irop(iropModel);
        };
        return {
            irop: irop,
            loadIrop: loadIrop
        };
    }();
    // end of irop message

    // flightOverview view model
    bookings.flightOverviewModel = function () {
        this.departureStationCode = ko.observable();
        this.departureStationName = ko.observable();
        this.arrivalStationCode = ko.observable();
        this.arrivalStationName = ko.observable();
        this.recordLocator = ko.observable();

        this.interlinePNR = ko.observable();

        this.arrivalTemp = ko.observable();
        this.arrivalTempIcon = ko.observable();
        this.arrivalIconDescription = ko.observable();
        this.arrivalTempScale = ko.observable();
        this.flightStatus = ko.observable();
        this.flightStatusTranslated = ko.observable();
        this.scheduledDepartureAMPM = ko.observable();
        this.scheduledDepartureDate = ko.observable();
        this.ScheduledDepartureDateString = ko.observable();
        this.scheduledDepartureDay = ko.observable();
        this.scheduledDepartureMessage = ko.observable();
        this.scheduledDepartureMonth = ko.observable();
        this.scheduledDepartureTime = ko.observable();
        this.estimatedDepartureDate = ko.observable();
        this.estimatedDepartureTime = ko.observable();
        this.statusURL = ko.observable();
        this.rebookUrl = ko.observable();
        this.isEligibleForInsurance = ko.observable();
        // additional for flight status
        this.scheduledArrivalTime = ko.observable();
        this.actualArrivalTime = ko.observable();
        this.actualDepartureTime = ko.observable();
        this.carrierCode = ko.observable();
        this.flightNumber = ko.observable();
        this.arrivalAirportName = ko.observable();
        this.departureAirportName = ko.observable();

        // IROP
        this.isIROP = ko.observable();
        this.isPotentialIROP = ko.observable();
        this.isRebooked = ko.observable();
        this.isEligibleToRebookOnline = ko.observable();
        this.isWaiveSDC = ko.observable();
        this.originalSTD = ko.observable();

        // Porter Pass booklet expiration date
        this.ppExpirationDate = ko.observable();

        // Show confirmation message after changes have been made (flight change, seats, bags, etc.)
        this.showConfirmationMsg = ko.observable(false);
        // Flight cancellation, no journeys left
        //this.showCancellationMsg = ko.observable(false);
        // Flight change/cancellation email sent
        this.showEmailSentMsg = ko.observable(false);
        // Email address for the sent to message
        this.emailSentTo = ko.observable('');

        this.setRedirectToDetails = function () {
            this.targetLocation('details');
        };

        this.setRedirectToMyBookings = function () {
            this.targetLocation('myBookings');
            $("#RedirectUrl").val("myBookings");
        };
        this.setRedirectToCheckIn = function () {
            this.targetLocation('checkIn');
            $("#RedirectUrl").val("myBookings");
        };

        this.confirmCancel = function () {

        }

        // IROP
        this.isSameIROPDepartureDate = ko.computed(function () {
            return moment(this.scheduledDepartureDate()).isSame(this.originalSTD(), 'day');
        }, this);

        this.isSameIROPDepartureTime = ko.computed(function () {
            // Checks same day and time
            //return moment(this.scheduledDepartureDate()).isSame(this.originalSTD());
            // Checks same hour and minute, ignoring day
            var _STD = moment(this.scheduledDepartureDate());
            var _origSTD = moment(this.originalSTD());
            return _STD.hour() === _origSTD.hour() && _STD.minute() === _origSTD.minute();
        }, this);

        // Determine if the rebooked flight is more than 48 hours after the original flight
        this.rebooked48Hours = ko.computed(function () {
            var _STD = moment(this.scheduledDepartureDate());
            var _origSTD = moment(this.originalSTD());
            return _STD.diff(_origSTD, 'hours', true) > 48;
        }, this);
    };

    bookings.flightOverviewViewModel = function () {
        var flightOverview = ko.observable(),

        loadFlightOverview = function (data) {
            var booking = data.UpcomingFlightViewModel;
            var foModel = new bookings.flightOverviewModel();
            foModel.departureStationCode(booking.DepartureStationCode);

            foModel.departureStationName(booking.DepartureStationName);
            foModel.arrivalStationCode(booking.ArrivalStationCode);
            foModel.arrivalStationName(booking.ArrivalStationName);
            foModel.recordLocator(booking.RecordLocator);
            foModel.interlinePNR(booking.InterlinePNR);

            foModel.arrivalTemp(booking.ArrivalTemp);
            foModel.arrivalTempIcon(booking.ArrivalTempIcon);
            foModel.arrivalTempScale(booking.ArrivalTempScale);

            foModel.arrivalIconDescription(booking.ArrivalIconDescription);
            foModel.flightStatus(booking.FlightStatus);
            foModel.flightStatusTranslated(booking.FlightStatusTranslated);
            foModel.scheduledDepartureAMPM(booking.ScheduledDepartureAMPM);
            foModel.scheduledDepartureDate(moment(booking.ScheduledDepartureDate));

            foModel.ScheduledDepartureDateString(booking.ScheduledDepartureDateString);

            foModel.scheduledDepartureDay(booking.ScheduledDepartureDay);
            foModel.scheduledDepartureMessage(booking.ScheduledDepartureMessage);
            foModel.scheduledDepartureMonth(booking.ScheduledDepartureMonth);
            foModel.scheduledDepartureTime(booking.ScheduledDepartureTime);
            var etd = moment(booking.EstimatedDepartureDate);
            if (etd.year() > 1 && !etd.isSame(foModel.scheduledDepartureDate())) {
                foModel.estimatedDepartureDate(moment(booking.EstimatedDepartureDate));
            }
            foModel.isEligibleForInsurance(booking.isEligibleForInsurance);

            foModel.statusURL("../" + booking.StatusUrl);
            foModel.rebookUrl("../" + booking.RebookUrl);

            // status
            foModel.scheduledArrivalTime("6:25");
            foModel.actualArrivalTime("6:25");

            foModel.actualDepartureTime("4:44");
            foModel.carrierCode(booking.StatusURL);
            foModel.flightNumber("257");
            foModel.arrivalAirportName(booking.StatusURL);
            foModel.departureAirportName(booking.StatusURL);

            // IROP
            foModel.isIROP(booking.IsIROP);
            foModel.isPotentialIROP(booking.IsPotentialIROP);
            foModel.isRebooked(booking.IsRebooked);
            foModel.isEligibleToRebookOnline(booking.IsEligibleToRebookOnline);
            foModel.isWaiveSDC(booking.IsWaiveSDC);
            foModel.originalSTD(moment(booking.OriginalSTD));

            // Porter Pass
            if (data.ReceiptDetails) {
                foModel.ppExpirationDate(moment(data.ReceiptDetails.PorterPassExpirationDate));
            }

            // Confirmation msg
            foModel.showConfirmationMsg(data.ShowConfirmationMsg);
            foModel.showEmailSentMsg(data.ShowEmailSentMsg);
            foModel.emailSentTo(booking.Booking.Contact.EmailAddress);

            flightOverview(foModel);
        };
        return {
            flightOverview: flightOverview,
            loadFlightOverview: loadFlightOverview
        };
    }();

    // end of flightOverview

    // insurance product model
    var InsuranceProduct = function () {
        this.ProductCode = ko.observable();
        this.Name = ko.observable();
        this.Description = ko.observable();
        this.Premium = ko.observable();
        this.Tax = ko.observable();
        this.InsuranceTotal = ko.observable();
        this.days = ko.observable();
        this.selectedProvince = ko.observable();
    };

    p = InsuranceProduct.prototype;
    p.Constructor = InsuranceProduct;

    $.extend(p, {
        // Set insurance prices
        injectData: function (product, days) {
            this.ProductCode = product.ProductCode;
            this.Name = product.Name;
            this.Description = product.Description;
            this.Premium = product.Premium.toFixed(2);
            this.Tax = product.Tax;
            this.Total = product.Premium + product.Tax
            this.InsuranceTotal = (this.Total) * days;
            this.InsuranceAverage = (this.Total) / days;
            this.days = days;
        }
    });

    // end of insurance product model


    bookings.modifyBookingSubmit = function () {
        $('#flightOptionError1').hide();
        $('#flightOptionError2').hide();
        $('#flightDateChangeError').hide();
        
        if ((bookings.departureSection() && bookings.checkListViewModel.checkList().journeys()[0].isAnySegmentCheckedIn())
            || (bookings.arrivalSection() && bookings.checkListViewModel.checkList().journeys()[1].isAnySegmentCheckedIn()))
        {
            if (bookings.checkListViewModel.checkList().journeys().length > 1 && (bookings.arrivalSection() == null || typeof (bookings.arrivalSection()) == 'undefined')) { //WEB-11935
                //bookings.isSubmitDisabled(true);
                //return true;
            }
            else{
                $('#checkout-confirmation').modal('show');
                bookings.isSubmitDisabled(false);
                return false;
            }
        }

        var _isValid = true;
        var depart = bookings.departureSection();
        var arrival = bookings.arrivalSection();
        // validValues: 0 = no change, 1 = change, 2 = cancel
        var validValues = [0, 1, 2];

        var filteredJourneys = _.filter(bookings.flightStatusViewModel.flightInfoJourneys(),
            function (j) { return !j.isIROP(); });

        var isRoundTrip = filteredJourneys.length > 1;

        var departJourney = filteredJourneys[0];
        var arrivalJourney;
        var departDate = $('#booking-widget-pickstartbase-0').val();
        var returnDate;
        if (isRoundTrip) {
            arrivalJourney = filteredJourneys[1];
            returnDate = $('#booking-widget-pickstartbase-1').val();
        }

        var depIsPastCutOff = departJourney.isPastCutOff();
        
        if (!depIsPastCutOff &&
            (departJourney.canChangeFlight() || departJourney.canCancelFlight() || departJourney.canDoComplimentarySameDayChangeRestricted())) {
            
            if (!_.contains(validValues, depart) ||
                (!isRoundTrip && depart === 0) ||
                (isRoundTrip && depart === 0 && arrival === 0)
                //(isRoundTrip && arrivalJourney.checkListJourney().isBasicFare() && !arrivalJourney.canDoSameDayChangeRestricted() && depart === 0)
            )
            {
                $('#flightOptionError1').show();
                _isValid = false;
            }
        }
        if (isRoundTrip &&
            (arrivalJourney.canChangeFlight() || arrivalJourney.canCancelFlight() || arrivalJourney.canDoComplimentarySameDayChangeRestricted())) {
            if (!_.contains(validValues, arrival) ||
                (depart === 0 && arrival === 0) ||
                (depIsPastCutOff && arrival === 0)
                //(departJourney.checkListJourney().isBasicFare() && !departJourney.canDoSameDayChangeRestricted() && arrival === 0)
            )
            {
                $('#flightOptionError2').show();
                _isValid = false;
            }
            if (Date.parse(returnDate) - Date.parse(departDate) < 0) {
                $('#flightDateChangeError').show();
                _isValid = false;
            }
        }

        if (depart === 1) {
            var isBookingWidgetValid = bookings.departureBookingWidget().validate();
            if (!isBookingWidgetValid) {
                _isValid = false;
            }
        }
        if (arrival === 1) {
            var isBookingWidgetValid = bookings.returnBookingWidget().validate();
            if (!isBookingWidgetValid) {
                _isValid = false;
            }
        }

        if (_isValid) {
            console.log("isValid")
            bookings.isSubmitDisabled(true);
            return true;
        }

        if (($('#flightOptionError1').is(":visible") && $('#flightOptionError1').is(":visible"))
            || $('#flightOptionError1').is(":visible")) {
            porter.scrollToError($('#flightOptionError1').prev()[0]);
            $('#flightOptionError1').prev()[0].focus();
        } else if ($('#flightOptionError1').is(":visible")) {
            porter.scrollToError($('#flightOptionError2').prev()[0]);
            $('#flightOptionError2').prev()[0].focus();
        } 

        return false;
    };

    bookings.cancelModalCheckedIn = function () {
        
        if (bookings.checkListViewModel.checkList().journeys()[0].isAnySegmentCheckedIn() || 
            (bookings.checkListViewModel.checkList().journeys().length > 1 && bookings.checkListViewModel.checkList().journeys()[1].isAnySegmentCheckedIn()))
        {
            $('#checkout-confirmation').modal('show');
            bookings.isSubmitDisabled(false);
            return false;
        }

        return true;
    };

    bookings.flightStatusViewModel = function () {
        var _this = this;
        this.startsOrStopInUS = ko.observable(false),
        this.DaysOut = ko.observable(0),
        this.flightInfoJourneys = ko.observableArray(),
        this.iropJourneys = ko.observableArray(),
        this.standbyJourneys = ko.observableArray(),
        this.allJourneysPastCutOff = ko.computed(function () {
            var _journeys = _.filter(_this.flightInfoJourneys(), function (jour) {
                return jour.isPastCutOff();
            });
            return _journeys.length == _this.flightInfoJourneys().length;
        }),
        this.isLastJourneyBasicAndSameDay = ko.computed(function () {
            var last = _.last(_this.flightInfoJourneys());
            return last && last.checkListJourney().isSameDay() && last.checkListJourney().isBasicFare();
        }),
        this.nonIropJourneys = ko.computed(function () {
            return _.filter(this.flightInfoJourneys(), function (j) { return !j.isIROP(); });
        }),

        this.isBasicFareIROP = ko.computed(function() {
            var isBasicIROP = _.some(this.flightInfoJourneys(), function(j) {
                return j.productClass() === "BS" && (j.lowerCaseStatus() === 're-accommodated' || j.lowerCaseStatus() === 'rebooked');
            })
            return isBasicIROP;
        }),
        this.isBasicFare = ko.computed(function () {
            var isBasic = _.some(this.flightInfoJourneys(), function (j) {
                return j.productClass() === "BS";
            })
            return isBasic;
        }),

        // data is an array of Journeys
        loadFlightStatus = function (data, stations, upcomingFlights, standbyRanks) {
            var _self = this;
            //var flightInfo = new porter.FlightInfo();
            //flightInfo.injectPassengerJourney(data, stations, false, false, false);
            //_self.flightInfoJourneys(flightInfo.flightInfoJourneys());
            
            var journeyCount = 0;
            for (var x = 0; x < data.length; x++) {
                var flightInfo = new porter.FlightInfo();

                var isJourneyIROP = _.find(data[x].Segments, function (s) { return s.ChangeReasonCode && s.ChangeReasonCode == "IROP"; });
                var isJourneyStandby = bookings.isStandbyRankActive() &&
                    !_.isEmpty(_.find(data[x].Segments, function (s) { return s.ActionStatusCode === 'HL'; }));

                if (bookings.isIROP() &&
                    isJourneyIROP &&
                    _.find(data[x].Segments, function (s) { return s.SegmentVersions && s.SegmentVersions.length > 1; }))
                {
                    flightInfo.injectSegmentVersion(data[x], stations);
                }

                var expand = false, showDetails = false;
                if (bookings.isModifyPage()) {
                    expand = true;
                    showDetails = true;
                }

                flightInfo.injectPassengerJourney([data[x]], stations, false, expand, showDetails, upcomingFlights);
                for (var y = 0; y < flightInfo.flightInfoJourneys().length; y++) {
                    var _fiJourney = flightInfo.flightInfoJourneys()[y];
                    // For IROP cancelled journeys
                    if (_fiJourney.status().toLowerCase() == 'cancelled') {
                        _fiJourney.collapse(true);
                        _fiJourney.departureMessage = '';
                        _fiJourney.isIROP(true);
                        _fiJourney.showDetails(false);                                                
                    }
                    
                    //check if past cut off                                            
                    // 'status is closed or past cutoff'
                    _fiJourney.isPastCutOff = ko.observable(false);
                    if(data[x].Segments[0].CheckInStatus == 2 || data[x].Segments[0].CheckInStatus == 4) {                         
                        _fiJourney.isPastCutOff(true);
                    }                     

                    // journeyNumber is used to determine if the journey is departing or returning                                    
                    _fiJourney.journeyNumber = ko.observable(journeyCount);

                    // checkListJourney is used to find the matching journey in checkListViewModel
                    // Easier to access canChangeFlight and canCancelFlight for the journey
                    _fiJourney.checkListJourney = ko.computed(function () {
                        if (bookings.checkListViewModel) {
                            return bookings.checkListViewModel.findJourneyBySellKey(this.journeySellKey());
                        }
                    }, _fiJourney);

                    _fiJourney.canChangeFlight = ko.computed(function () {
                        if (bookings.rules.canChangeFlight() && this.checkListJourney().canChangeFlight()) {
                            return true;
                        }
                        return false;
                    }, _fiJourney);

                    _fiJourney.canCancelFlight = ko.computed(function () {
                        if (bookings.rules.canCancelFlight() && this.checkListJourney().canCancelFlight()) {
                            return true;
                        }
                        return false;
                    }, _fiJourney);

                    _fiJourney.canDoComplimentarySameDayChange = ko.computed(function () {
                        if (bookings.rules.canDoComplimentarySameDayChange() && this.checkListJourney().isWaiveSDC()) {
                            return true;
                        }
                        return false;
                    }, _fiJourney);

                    _fiJourney.canDoComplimentarySameDayChangeRestricted = ko.computed(function () {
                        if (!bookings.rules.canChangeFlight() && !bookings.rules.canCancelFlight() && this.canDoComplimentarySameDayChange()) {
                            return true;
                        }
                        return false;
                    }, _fiJourney);

                    _fiJourney.canDoSameDayChangeRestricted = ko.computed(function () {                                                
                        
                        var isUpcomingFlight = this.journeySellKey() == upcomingFlights[0].SellKey                        

                        if (bookings.rules.canDoSameDayChangeRestricted()
                            && (isUpcomingFlight || (!isUpcomingFlight && !upcomingFlights[0].IsIROP))
                            )
                        {
                            return true;
                        }
                        return false;

                        //return true;
                        //if (!bookings.rules.canChangeFlight() && !bookings.rules.canCancelFlight() && this.canDoComplimentarySameDayChange()) {
                        //    return true;
                        //}
                        //return false;
                    }, _fiJourney);

                    // WEB-14141 - if more than one upcoming journey, hide 'No Change' button
                    _fiJourney.hideNoChangeButton = ko.computed(function () {                        

                        var OB_isSameDayConstrained = upcomingFlights[0].isBasicFare && upcomingFlights[0].isSameDay;
                        var IB_isSameDayConstrained = data.length > 1 ? upcomingFlights[1].isBasicFare && upcomingFlights[1].isSameDay : false;

                        if (data.length == 1) {
                            return true;
                        }
                        else if (data.length == 2) {                            
                            if (x == 0) {                                                                
                                    if (upcomingFlights[1].isPastCutOff || upcomingFlights[1].isIROP) {
                                    //if (upcomingFlights[1].isPastCutOff || upcomingFlights[1].isIROP || (IB_isSameDayConstrained && !OB_isSameDayConstrained)) {
                                    return true;
                                }
                            }
                            else if (x == 1) {
                                if (upcomingFlights[0].isPastCutOff || upcomingFlights[0].isIROP) {
                                //if (upcomingFlights[0].isPastCutOff || upcomingFlights[0].isIROP || (OB_isSameDayConstrained && !IB_isSameDayConstrained && !upcomingFlights[0].isWithinGracePeriod)) {
                                    return true;
                                }
                            }
                        }
                        return false;
                    }, _fiJourney);
                    
                    _fiJourney.isStandby = ko.observable(isJourneyStandby);

                    _fiJourney.matchingIropJourneys = ko.computed(function () {
                        var _thisJourney = this;
                        return _.filter(_self.iropJourneys(), function (j) { return j.journeyNumber() === _thisJourney.journeyNumber(); });
                    }, _fiJourney);

                    _fiJourney.matchingStandbyJourneys = ko.computed(function () {
                        var _thisJourney = this;
                        if (this.isStandby()) {
                            return null;
                        }
                        return _.filter(_self.standbyJourneys(), function (j) { return j.departureStationCode() === _thisJourney.departureStationCode(); });
                    }, _fiJourney);

                    // Standby journeys that leave before the confirmed journey
                    _fiJourney.matchingStandbyJourneysBefore = ko.computed(function () {
                        var _thisJourney = this;
                        if (this.isStandby()) {
                            return null;
                        }
                        return _.filter(_thisJourney.matchingStandbyJourneys(), function (j) { return (j.firstLeg().hasETD() ? j.firstLeg().ETD() : j.firstLeg().STD()).isBefore(_thisJourney.firstLeg().hasETD() ? _thisJourney.firstLeg().ETD() : _thisJourney.firstLeg().STD()); });
                    }, _fiJourney);

                    // Standby journeys that leave after the confirmed journey
                    _fiJourney.matchingStandbyJourneysAfter = ko.computed(function () {
                        var _thisJourney = this;
                        if (this.isStandby()) {
                            return null;
                        }
                        return _.filter(_thisJourney.matchingStandbyJourneys(), function (j) { return (j.firstLeg().hasETD() ? j.firstLeg().ETD() : j.firstLeg().STD()).isAfter(_thisJourney.firstLeg().hasETD() ? _thisJourney.firstLeg().ETD() : _thisJourney.firstLeg().STD()); });
                    }, _fiJourney);

                    if (isJourneyStandby) {
                        if (standbyRanks) {
                            _fiJourney.standbyViewModels = ko.observableArray();
                            for (var a = 0; a < data[x].Segments.length; a++) {
                                var standbyRank = _.find(standbyRanks, function (s) { return s.SegmentSellKey === data[x].Segments[a].SellKey; });
                                if (!_.isEmpty(standbyRank)) {
                                    var newStandbyRankVM = new bookings.standbyJourneyViewModel();
                                    newStandbyRankVM.injectData(standbyRank);
                                    _fiJourney.standbyViewModels.push(newStandbyRankVM);
                                }
                            }
                        }
                        _self.standbyJourneys.push(_fiJourney);
                    } else {
                        if (bookings.isStandbyRankActive()) {
                            if (_fiJourney.status().toLowerCase() == 'cancelled') {
                                _self.iropJourneys.push(_fiJourney);
                            } else {
                                _self.flightInfoJourneys.push(_fiJourney);
                            }
                        } else {
                            _self.flightInfoJourneys.push(_fiJourney);
                        }
                    }

                    //var insertInfoJourney = _.filter(self.flightInfoJourneys(), function (journey) { return journey.journeySellKey() == _fiJourney.journeySellKey() }).length == 0;
                    //if (insertInfoJourney) {
                    //    _self.flightInfoJourneys.push(_fiJourney);
                    //}
                }
                if (!isJourneyStandby) {
                    journeyCount++;
                }
            }
            // All stand by journeys with no confirmed journeys
            if (_self.standbyJourneys().length > 0 && _self.flightInfoJourneys().length === 0) {
                _self.flightInfoJourneys(_self.standbyJourneys());
            }
            // add additional info for booking details page
            for (var i = 0; i < _self.flightInfoJourneys().length; i++) {
                var _journey = _self.flightInfoJourneys()[i];
                _journey.alterFlightOption = ko.observable();
          
                // isRebooked is used to show/hide the rebook change/cancel rules
                //_journey.isRebooked = ko.observable(_journey.status().toLowerCase() == 'rebooked');
                // collapseRebookInfo is used to collapse the rebooking info
                _journey.collapseRebookInfo = ko.observable(_journey.status().toLowerCase() != 'rebooked');
                //add blocked SSRs
                _journey.hasBlockedSSRs = ko.observable(bookings.hasBlockedSSRs());
                //closed
                _journey.isClosed = ko.observable(bookings.isClosed());                
            }
            if (_self.flightInfoJourneys().length > 0) {
                var now = moment(new Date()); //todays date
                var duration = moment.duration(_self.flightInfoJourneys()[0].flightDate().diff(now));
                DaysOut(duration.asDays());
            }

            if (typeof hasUSJourney != 'undefined' && hasUSJourney) {
                this.startsOrStopInUS(true);
            }
        };
        return {  // module design
            flightInfoJourneys: this.flightInfoJourneys,
            iropJourneys: this.iropJourneys,
            standbyJourneys: this.standbyJourneys,
            nonIropJourneys: this.nonIropJourneys,
            loadFlightStatus: loadFlightStatus,
            startsOrStopInUS: startsOrStopInUS,
            DaysOut: DaysOut,
            isLastJourneyBasicAndSameDay: this.isLastJourneyBasicAndSameDay
        };
    }();

    bookings.standbyJourneyViewModel = function () {
        var _self = this;
        this.availableSeats = ko.observable(0);
        this.rank = ko.observable(0);
        this.numberOfStandby = ko.observable(0);
        this.segmentSellKey = ko.observable('');
        this.isLoading = ko.observable(false);
        this.refreshRank = function () {
            this.isLoading(true);
            var submitData = {
                pnr: bookings.information.confirmationNumber()
            };
            $.ajax({
                url: porter.getUrlWithCulture('manage-flights/my-bookings/getupdatedstandbyrank'),
                data: JSON.stringify(submitData),
                contentType: 'application/json',
                type: 'POST'
            })
            .done(function (result) {
                var flightStatusViewModel = bookings.flightStatusViewModel;
                if (!_.isEmpty(result)) {
                    if (result.result) {
                        for (var x = 0; x < result.result.length; x++) {
                            var newStandbyData = result.result[x];
                            for (var y = 0; y < flightStatusViewModel.standbyJourneys().length; y++) {
                                var journey = flightStatusViewModel.standbyJourneys()[y];
                                for (var z = 0; z < journey.standbyViewModels().length; z++) {
                                    var standbyViewModel = journey.standbyViewModels()[z];
                                    if (standbyViewModel.segmentSellKey() === newStandbyData.SegmentSellKey) {
                                        standbyViewModel.injectData(newStandbyData);
                                    }
                                }
                            }
                        }
                    }
                }
                _self.isLoading(false);
            })
            .fail(function () {
                _self.isLoading(false);
            });
        };
        this.injectData = function (standbyRank) {
            if (!_.isEmpty(standbyRank)) {
                this.availableSeats(standbyRank.AvailableSeats);
                this.rank(standbyRank.Rank);
                this.numberOfStandby(standbyRank.NumberOfStandbyPassengers);
                this.segmentSellKey(standbyRank.SegmentSellKey);
            }
        };
    };

    //bookings.flightStatusViewModel = function () {
    //    var flightInfo = ko.observable(),

    //      loadFlightStatus = function (data, stations) {
    //          var fsModel = new bookings.flightStatusModel();
    //          var flightInfo = new porter.FlightInfo();

    //         // for (var x = 0; x < data.length; x++) {
    //          flightInfo.injectPassengerJourney(data, stations, false);
    //          fsModel.flightInfoJourneys(flightInfo.flightInfoJourneys());

    //          flightInfo.flightInfoJourneys(fsModel.flightInfoJourneys);
    //          this.flightInfo(flightInfo);
    //      };

    //    return {
    //        flightInfo: flightInfo,
    //        loadFlightStatus: loadFlightStatus
    //    };
    //} ();

    // end of flightStatus


    // start of insurance view model
    bookings.insuranceModel = function () {
        var _self = this;
        this.displayInsurance = ko.observable(true);
        this.selectedQuote = ko.observable(null);
        this.oldSelectedQuote = ko.observable(null);
        this.displayAllProducts = ko.observable(false);
        this.products = ko.observableArray();
        this.insurancePassengers = ko.observableArray();
        this.errorSelectInsurance = ko.observable(false);
        this.provincesData = ko.observable();
        this.selectedProvince = ko.observable();
        this.ProvinceReq = ko.observable(false);
        this.InsuranceAllowed = ko.observable(true);
        this.ShowSoloInsurancePage = ko.observable(false);
        this.OnSoloInsurancePage = ko.observable(false);
        this.insuranceDOBUpdated = ko.observable(false);
        this.lastFlightDate = ko.observable();
        this.culture = $('input[name="culture"]').val();

        this.insurancePremium = ko.observable();
        this.insuranceTax = ko.observable();

        this.isVIPorter = ko.observable(false);

        this.selectedQuote.subscribe(function (value) {
            if (this.selectedQuote() != -1 && this.selectedQuote() != 'decline') {
                this.insurancePremium(Number(bagsVM.products()[this.selectedQuote()].Premium));
                this.insuranceTax(bagsVM.products()[this.selectedQuote()].Tax);
                //this.isSubmitDisabled(false);
            }
            else if (this.selectedQuote() != -1 || this.selectedQuote() == 'decline') {
                // this.isSubmitDisabled(false);
            }
            else {
                this.insurancePremium(0);
                this.insuranceTax(0);
                //this.updateSummaryCart();
            }

            //update summary cart
            //remove old insurance charges
            if (this.oldSelectedQuote() != null) {
                var serviceCharges = [];

                var sc = new Object();
                sc.TicketCode = "AZIIN";
                sc.Amount = this.products()[this.oldSelectedQuote()].Premium * -1; //this.oldSelectedQuote().Premium * -1;
                serviceCharges.push(sc);

                var sc = new Object();
                sc.TicketCode = "AZITX";
                sc.Amount = this.products()[this.oldSelectedQuote()].Tax * -1; //this.oldSelectedQuote().Tax * -1;
                serviceCharges.push(sc);

                bookingCommon.seatsVMUpdateSeats.notifySubscribers(serviceCharges, "messageToPublish");
            }

            //add new insurance charges
            if (this.selectedQuote() != null && this.selectedQuote() != -1 && this.selectedQuote() != "decline") {
                var serviceCharges = [];

                var sc = new Object();
                sc.TicketCode = "AZIIN";
                sc.Amount = Number(this.products()[this.selectedQuote()].Premium); //this.selectedQuote().Premium;
                serviceCharges.push(sc);

                var sc = new Object();
                sc.TicketCode = "AZITX";
                sc.Amount = this.products()[this.selectedQuote()].Tax; // this.selectedQuote().Tax;
                serviceCharges.push(sc);

                bookingCommon.seatsVMUpdateSeats.notifySubscribers(serviceCharges, "messageToPublish");

                //update oldQuote
                this.oldSelectedQuote(this.selectedQuote());
            }

            if (this.selectedQuote() == -1 || this.selectedQuote() == "decline") {
                //update oldQuote
                this.oldSelectedQuote(null);
            }
        }, this);

        this.currencyCode = ko.observable('CAD');
        this.isSubmitDisabled = ko.observable(false);
        this.errors = {};

        this.CONST = {};
        // this.CONST.SUBMIT_URL = '/FlyPorter/Book/Bags'; // '~/Book/Bags';
        this.CONST.GENERIC_ERROR = 'There was a problem processing your request, please try again';

        this.resetErrors = function () {
            for (var err in _self.errors) {
                _self.errors[err](false);
            }
        };
        this.clearSelectedQuote = function (val) {
            this.selectedQuote(-1);
            this.insuranceDOBUpdated(false);
        },
        this.toggleInsurance = function (data, event) {
            var x = this.displayAllProducts();
            this.displayAllProducts(!x);
        };

        this.updateInsuranceQuote = function (jsonData, url) {
            var _self = this;

            //cleanup some data that is not being serialized correctly

            for (var paxID = 0, numPax = jsonData.Booking.Passengers.length; paxID < numPax; paxID++) {
                jsonData.Booking.Passengers[paxID].Info.Gender = jsonData.Booking.Passengers[paxID].Info.Gender.toString();
                try {
                    if (jsonData.Booking.Passengers[paxID].Infant) {
                        jsonData.Booking.Passengers[paxID].Infant.Gender = jsonData.Booking.Passengers[paxID].Infant.Gender.toString();
                    }
                } catch (e) {
                    //console.log(e);
                }
            }; // passengers

            for (var journeyID = 0, numJourney = jsonData.Booking.Journeys.length; journeyID < numJourney; journeyID++) {
                for (var segID = 0, numSeg = jsonData.Booking.Journeys[journeyID].Segments; segID < numSeg; segID++) {
                    jsonData.Booking.Journeys[journeyID].Segments[numSeg].STD = jsonData.Booking.Passengers[paxID].Infant.Gender.toString();
                }
            };

            //update province
            // this.jsonData.Booking.Contact.ProvinceState = this.selectedProvince().Value;

            //update
            var submitData = JSON.parse(JSON.stringify(jsonData.Booking));

            $.ajax({
                url: url,
                data: JSON.stringify(submitData),
                contentType: 'application/json',
                tryCount: 0,
                retryLimit: 3,
                type: 'POST',
                success: function(result) {
                    var errorMessage = '';
                    if (!_.isEmpty(result)) {
                        if (result.result) { //&& !result.errors
                            //refresh insurance Quotes
                            if (result != null) {
                                _self.refreshInsuranceQuote(result);
                            }

                            $('#dob-province-modal').modal('hide');

                            // reset updateFlags
                            for (var y = 0; y < _self.insurancePassengers().length; y++) {
                                _self.insurancePassengers()[y].insuranceForUpdate(false);
                            }

                            // show all products
                            _self.displayAllProducts(true);

                            return;
                        }
                    }
                },
                error: function (xhr, textStatus, errorThrown) {
                    this.tryCount++;
                    if (this.tryCount <= this.retryLimit) {
                        //try again
                        $.ajax(this);
                        return;
                    }
                },
                fail: function (xhr, textStatus, errorThrown) {
                    //var errorMessage = _self.CONST.GENERIC_ERROR;
                    //_self.isSubmitDisabled(false);
                    //porter.showModalError(errorMessage);
                }
            })                        
        };

        this.refreshInsuranceQuote = function (result) {
            this.products([]);
            data.Booking.InsuranceQuote = result.result;

            for (var x = 0; x < data.Booking.InsuranceQuote.ProductList.length; x++) {
                var insuranceDepartureDate = moment(data.Booking.InsuranceQuote.DepartureDate);
                var insuranceReturnDate = moment(data.Booking.InsuranceQuote.ReturnDate);
                var insuranceDays = Math.abs(insuranceDepartureDate.diff(insuranceReturnDate, 'days'));
                var insuranceProduct = new InsuranceProduct();
                insuranceProduct.injectData(data.Booking.InsuranceQuote.ProductList[x], insuranceDays);
                this.products.push(insuranceProduct);
                return false; // just include the first insurance for now
            }

            // bookingCommon.localizeModuleCurrency('#insurance'); TODO
        };

        this.provinceTrigger = function (selected) {
            this.selectedProvince(selected);
            //this.insuranceForUpdate(true);
            this.insuranceDOBUpdated(true);
            //this.errors.ProvinceReq(false);
        };
    };

    bookings.insuranceViewModel = function () {
        var insurance = ko.observable(),
        loadInsurance = function (booking, url, provinces) {
            var model = new bookings.insuranceModel();
            model.provincesData(provinces);
            model.updateInsuranceQuote(booking, url);
            insurance(model);
        };
        return {
            insurance: insurance,
            loadInsurance: loadInsurance
        };
    }();
    // end of insurance view model

    // booking contact
    // start of booking contanct view model
    bookings.bookingContactModel = function () {
        var _self = this;
        _self.collapse = ko.observable(true);
        _self.firstName = ko.observable();
        _self.middleName = ko.observable();
        _self.lastName = ko.observable();
        _self.streetAddress = ko.observable();
        _self.suiteNumber = ko.observable();
        _self.city = ko.observable();
        _self.country = ko.observable();
        _self.province = ko.observable();
        _self.postalCode = ko.observable();
        _self.homePhone = ko.observable();
        _self.businessPhone = ko.observable();
        _self.mobilePhone = ko.observable();
        _self.email = ko.observable();
        _self.editable = ko.observable(false);
        _self.countriesArray = ko.observableArray();
        _self.provincesStatesData = ko.observable();
        _self.showProvinceStates = ko.observableArray();

        _self.errors = {};
        _self.errors.FirstNameReq = ko.observable(false);
        _self.errors.LastNameReq = ko.observable(false);
        _self.errors.StreetAddressReq = ko.observable(false);
        _self.errors.CityReq = ko.observable(false);
        _self.errors.CountryReq = ko.observable(false);
        _self.errors.ProvinceStateReq = ko.observable(false);
        _self.errors.PostalZipCodeReq = ko.observable(false);
        _self.errors.PostalZipCodeCAInvalid = ko.observable(false);
        _self.errors.PostalZipCodeUSInvalid = ko.observable(false);
        _self.errors.PostalZipCodeInvalid = ko.observable(false);

        _self.errors.HomePhoneReq = ko.observable(false);
        _self.errors.HomePhoneInvalid = ko.observable(false);
        _self.errors.MobilePhoneReq = ko.observable(false);
        _self.errors.MobilePhoneInvalid = ko.observable(false);
        _self.errors.OtherPhoneReq = ko.observable(false);
        _self.errors.OtherPhoneInvalid = ko.observable(false);

        _self.collapse.subscribe(function (newValue)
        {
            setTimeout(function ()
            {
                document.accessibility.readText($('#btn-more-info-contact').find('span:visible').text());
            }, 300);

        });

        _self.countryTrigger = function (selected, root, event) {
            console.log('country trigger');
            var _country = $(event.target).val();
            // root.errors.BillingCountryReq(false);

            if (!_self.provincesStatesData()[_country] ||
                $.inArray(_self.province(), _self.provincesStatesData()[_country]) === -1) {
                // Clear province/state if currently selected province/state does not belong to currently selected country

                _self.province(null);
                _self.provincesStatesToShow(_country);
            }
        }


        _self.provincesStatesToShow = function (country) {
            //

            if (!country) {
                _self.showProvinceStates(_self.allProvincesStates());
            } else if (_self.provincesStatesData()) {
                _self.showProvinceStates(_self.provincesStatesData()[country]);
            } else {
                _self.showProvinceStates([]);
            }
        };

        _self.showProvincesStates = function (country) {
            if (!country || this.provincesStatesData()[country]) {
                return true;
            }
        };
        _self.allProvincesStates = ko.computed(function () {
            var newArray = [];
            for (var country in _self.provincesStatesData()) {
                newArray = newArray.concat(this.provincesStatesData()[country]);
            }
            return newArray;
        }, this);

        _self.provinceStateTrigger = function (selected, event) {
            
            //selected.billingAddress().provinceState(_province);

        };

        _self.submitContact = function () {

            data.Booking.Contact = ConvertBookingContactViewModelToBooking(data.Booking.Contact, bookingContactModel.bookingContact());
            $.ajax({
                url: dirPath + 'manage-flights/My-Bookings/ChangeContactSubmit',
                data: JSON.stringify(data.Booking),
                contentType: 'application/json; charset=utf-8',
                type: 'POST',
                dataType: 'json'
            })
                    .done(function (result) {
                        var errorMessage = '';
                        // _self.isLoading(false);
                        if (!_.isEmpty(result)) {
                            //  if (result && !result.errors) {
                            if (result) {
                                bookingContactModel.bookingContact().editable(false);
                            }
                            else {
                                if (errorMessage === '') {
                                    errorMessage = porter.CONST.GENERIC_ERROR;
                                }
                                porter.showModalError(errorMessage);
                            }
                        }

                    })
                    .fail(function () {
                        porter.showModalError(porter.CONST.GENERIC_ERROR);
                    });
        };

    };

    // end of booking contact
    bookings.bookingContactViewModel = function () {
        var bookingContact = ko.observable(),
        loadBookingContact = function (booking, provincesState, countries) {
            var contact = booking.Contact;
            var model = new bookings.bookingContactModel();
            if (contact) {
                model.firstName(contact.Name.First);
                model.middleName(contact.Name.Middle);
                model.lastName(contact.Name.Last);
                model.streetAddress(contact.AddressLine1);
                model.suiteNumber(contact.AddressLine2);
                model.city(contact.City);
                
                model.country(contact.CountryCode); // might have to change this to full name
                model.province(contact.ProvinceState); // might have to change this to full name
                model.postalCode(contact.PostalCode);
                model.homePhone(contact.HomePhone);
                model.businessPhone(contact.WorkPhone);
                model.mobilePhone(contact.OtherPhone);
                model.email(contact.EmailAddress);

                model.countriesArray = countries;

                model.provincesStatesData = ko.observable(provincesState);
                if (!_.isEmpty(model.provincesStatesData())) {
                    model.showProvinceStates(model.provincesStatesData()[model.country()]);
                }
            }
            bookingContact(model);

        };
        return {
            bookingContact: bookingContact,
            loadBookingContact: loadBookingContact
        };
    }();
    // end booking contact

    // checklist View Model
    bookings.checkListModel = function () {
        this.checkInStatus = ko.observable();
        this.paxCount = ko.observable(11);
        this.amountOfSelectedSeats = ko.observable();
        this.amountOfCheckedBags = ko.observable();
        this.hasInsurance = ko.observable();
        this.isEligibleForInsurance = ko.observable();
        this.hasCarRental = ko.observable();
        this.hoursUntilTakeOff = ko.observable();
        this.buttonState = ko.observable();
        this.liftStatus = ko.observable();
        this.allowBoardingPassDownload = ko.observable(true);
        this.hasCheckedInPassenger = ko.observable(true);
        this.bookingDate = ko.observable();
        this.carRentalEligible = ko.observable();
        this.isInterline = ko.observable();
        this.isInternational = ko.observable();
        this.isBookingPending = ko.observable();
        this.isAmoutOwing = ko.observable();
        this.isGroupBooking = ko.observable();
        this.gotoSeats = ko.observable();
        
        this.gotoSeatsUrl = ko.observable();
        this.canViewSeats = ko.observable();
        this.canViewBags = ko.observable();
        this.canDoComplimentarySameDayChange = ko.observable(false);
        this.canDoSameDayChangeRestricted = ko.observable(false);

        this.canViewChecklist = ko.observable(true);
        this.insuranceFailed = ko.observable(false);
        this.journeys = ko.observableArray();
        this.showChangeCancelTooltip = ko.observable(false);
        this.showSeatsTooltip = ko.observable(false);
        this.showBagCheckedInWarning = ko.observable(false);

        this.tabID = ko.observable(porter.util.getTabID());
        var _self = this;
        this.toggleToolTipChangeCancel = function ()
        {
            this.showChangeCancelTooltip(!this.showChangeCancelTooltip());
            //$('#toolTipUnavailable').focus();
        };

        this.toolTipKeyDownEventChangeCancel = function (data, event)
        {
            var self = this;
            if (event.which == 27)
            {
                event.preventDefault();
                self.showChangeCancelTooltip(false);
            }
            return true;
        };


        targetLocation: ko.observable('');

        this.gotoItin = function () {
            var url = baseUrl + 'manage-flights/My-Bookings/Booking-Details' + (_self.tabID().length > 0 ? "?tabid=" + _self.tabID() : '');
            window.location.href = url;
        };

        this.cancelLink = function () {
            return porter.getUrlWithCulture('manage-flights/my-bookings/cancelbooking') + (_self.tabID().length > 0 ? "?tabid=" + _self.tabID() : '');
        };

        this.gotoSeats = function () {            
            var url = porter.getUrlWithCulture('manage-flights/my-bookings/add-seats') + (_self.tabID().length > 0 ? "?tabid=" + _self.tabID() : '');
            window.location.href = url;
        };

        this.gotoSeatsUrl = function () {            
            var tabID = porter.util.getPnrmodTabIDForBookingChecklist();            
            var url = porter.getUrlWithCulture('manage-flights/my-bookings/add-seats') + (tabID.length > 0 ? "?tabid=" + tabID : '');
           
            return url;
        };

        this.gotoBags = function () {
            var url = baseUrl + 'My-Bookings/Bags' + (_self.tabID().length > 0 ? "?tabid=" + _self.tabID() : '');
            window.location.href = url;
        };

        this.gotoModify = function (data, event) {
            if (this.showBagCheckedInWarning()) {
                var target = $(event.currentTarget);
                var errorMsg = target.nextAll('.hide').html();

                // Show warning
                if (!_.isEmpty(errorMsg)) {
                    porter.showModalError(errorMsg);
                }

                // Redirect
                setTimeout(function () { window.location.href = event.currentTarget.href; }, 2000);
                return;
            }
            // Return true so the link continues to redirect
            return true;
        };

        // for non-login
        this.setBagsLocation = function () {
            this.targetLocation('bags');
        };
        this.setSeatsLocation = function () {
            this.targetLocation('seats');
        };
        this.setDetails = function () {
            this.targetLocation('details');
        };
        this.setNotificationLocation = function () {
            this.targetLocation('notifications');
        };
    };

    bookings.checkListViewModel = function () {        
        var checkList = ko.observable(),
        loadCheckList = function (data) {
            var booking = data.CheckList;
            var clModel = new bookings.checkListModel();
            clModel.checkInStatus(booking.checkInStatus);
            clModel.paxCount(booking.paxCount);
            clModel.amountOfCheckedBags(booking.AmountOfSelectedBags);
            clModel.amountOfSelectedSeats(booking.AmountOfSelectedSeats);

            clModel.canViewSeats(booking.userDetails.CanChangeSeats);
            clModel.canViewBags(booking.userDetails.CanChangeBags);
            
            if (typeof data.Rules != "undefined"){
                //clModel.canViewChecklist(data.Rules.isCheckListVisible);
                clModel.canViewChecklist(data.Rules.CheckListVisible);
                //clModel.canViewChecklist(true) // tmp fix;
            }


            clModel.hasInsurance(booking.HasInsurance);
            clModel.isEligibleForInsurance(data.UpcomingFlightViewModel.isEligibleForInsurance);
            clModel.isInterline(data.UpcomingFlightViewModel.SellKey.indexOf('B6~') >= 0);
            clModel.isInternational(booking.userDetails.isInternational);
            clModel.hasCarRental(booking.HasCarRental);
            clModel.isBookingPending(booking.userDetails.isBookingPending);
            clModel.isAmoutOwing(booking.userDetails.isAmoutOwing);
            clModel.isGroupBooking(booking.isGroupBooking);
            clModel.carRentalEligible(data.HertzAvailability != null); // porter.
            clModel.liftStatus(booking.LiftStatus);
            clModel.canChangeOrCancelFlight = ko.observable(false);
            clModel.canChangeFlight = ko.observable(false);
            clModel.canCancelFlight = ko.observable(false);
            clModel.allowBoardingPassDownload(booking.AllowBoardingPassDownload);
            clModel.hasCheckedInPassenger(booking.HasCheckedInPassenger);
            clModel.canDoComplimentarySameDayChange(data.Rules.CanDoComplimentarySameDayChange);
            clModel.canDoSameDayChangeRestricted(data.Rules.CanDoSameDayChangeRestricted); 

            /*
            clModel.canChangeOrCancelFlight = ko.computed(function () {
                var _j = _.filter(clModel.journeys(), function (jour) {
                    return !bookings.isIROP() && !jour.isPastCutOffTime() && (jour.canCancelFlight() || jour.canChangeFlight());
                });
                return _j.length > 0;
            });
            */


            clModel.parkingAtYTZ = ko.observable(false);
            if ((typeof data.Booking.Journeys != "undefined" && data.Booking.Journeys.length > 0))
            {
                var statusLower = data.Booking.Journeys[0].Status ? data.Booking.Journeys[0].Status.toLowerCase() : '';

                var parkingIsVisible = statusLower != 'departed' && statusLower != 'arrived' && data.Booking.Journeys[0].Segments[0].DepartureStation == "YTZ"

                clModel.parkingAtYTZ(parkingIsVisible);
            }
                            

            var journeyRule = function () {
                var _self = this;
                this.journeySellKey = ko.observable();
                this.canCancelFlight = ko.observable(true);
                this.canChangeFlight = ko.observable(true);
                this.isPastCutOffTime = ko.observable(false);
                this.isAnySegmentCheckedIn = ko.observable(false);
                this.isInterlineSegment = ko.observable(false);
                this.departureStation = ko.observable();
                this.arrivalStation = ko.observable();  
                this.isSameDay = ko.observable(false);
                this.isMixedFare = ko.observable(false);
                this.isBasicFare = ko.observable(false);    
                this.allowChangeCancelSelection = ko.observable(true);
                this.isWaiveSDC = ko.observable(false);
                
                var setJourneyRules = function (journey, upcomingFlight) {
                    _self.journeySellKey(journey.SellKey);             
                    
                    // Grab from bookings instead of UpcomingFlightViewModel because we need to enable/disable change flight
                    if ((typeof bookings.isIROP != "undefined" && bookings.isIROP()) ||
                        bookings.isPotentialIROP()) {
                        if (bookings.isRebooked()) {
                            if (bookings.isEligibleToRebookOnline()) {
                                // In case of IROP and round trip, don't show the change option for the flight that was not IROP'd
                                var _hasIROP = false;
                                for (var x = 0; x < journey.Segments.length; x++) {
                                    var _segment = journey.Segments[x];
                                    if (_segment.SegmentVersions && _segment.SegmentVersions.length >= 1) {
                                        for (var y = 0; y < _segment.SegmentVersions.length; y++) {
                                            if (_segment.SegmentVersions[y].ChangeReasonCode.toUpperCase() === 'IROP') {
                                                _hasIROP = true;
                                            }
                                        }
                                    }
                                }
                                if (!_hasIROP) {
                                    _self.canChangeFlight(false);
                                }
                            } else {
                                // Booking is not eligible to rebook online
                                for (var x = 0; x < journey.Segments.length; x++) {
                                    var _segment = journey.Segments[x];
                                    if (_segment.SegmentVersions && _segment.SegmentVersions.length > 1) {
                                        _self.canCancelFlight(false);
                                        _self.canChangeFlight(false);
                                    }
                                }
                            }
                        }
                    }
                    for (var i = 0; i < journey.Segments.length; ++i)
                    {
                        var segment = journey.Segments[i];
                        if (segment.FlightDesignator.CarrierCode != "PD")
                            _self.isInterlineSegment(true);
                        for (var ii = 0; ii < segment.PassengerSegments.length; ++ii) {
                            var paxSegment = segment.PassengerSegments[ii];
                            _self.departureStation(segment.DepartureStation);
                            _self.arrivalStation(segment.ArrivalStation);
                            if (paxSegment.LiftStatus === 1) {
                                _self.isAnySegmentCheckedIn(true);
                                break;
                            }
                        }
                    }

                    if (typeof (pastCheckInJourneySellKeys) != 'undefined' && pastCheckInJourneySellKeys !== null &&
                 (pastCheckInJourneySellKeys.indexOf(journey.SellKey) != -1 || journey.Status == "Cancelled" || journey.Status == "Closed" || _self.isInterlineSegment())) {
                        _self.canCancelFlight(false);
                        _self.canChangeFlight(false);
                        _self.isPastCutOffTime(true);
                    }

                    if (typeof (upcomingFlight) != 'undefined') {
                        _self.isWaiveSDC(upcomingFlight.IsWaiveSDC);
                        if (upcomingFlight.preventChanges){
                            _self.canCancelFlight(false);
                            _self.canChangeFlight(false);      
                        }
                    }
                }
         
                return {
                    setJourneyRules: setJourneyRules,
                    journeySellKey: _self.journeySellKey,
                    isPastCutOffTime: _self.isPastCutOffTime,
                    canCancelFlight: _self.canCancelFlight,
                    canChangeFlight: _self.canChangeFlight,
                    departureStation: _self.departureStation,
                    isAnySegmentCheckedIn: _self.isAnySegmentCheckedIn,
                    arrivalStation: _self.arrivalStation,
                    isInterlineSegment: _self.isInterlineSegment,
                    isSameDay: _self.isSameDay,
                    isMixedFare: _self.isMixedFare,
                    isBasicFare: _self.isBasicFare,
                    allowChangeCancelSelection: _self.allowChangeCancelSelection,
                    isWaiveSDC: _self.isWaiveSDC
                }
            }

            for (i = 0; i < data.Booking.Journeys.length ; i++) {
                var journey = data.Booking.Journeys[i];
                var jRule = new journeyRule();
                var upcomingFlight = null;
                if (data.UpcomingFlightViewModels != null && data.UpcomingFlightViewModels.length > 0){
                    upcomingFlight = data.UpcomingFlightViewModels.length == data.Booking.Journeys.length ? data.UpcomingFlightViewModels[i] : data.UpcomingFlightViewModels[0]
                }
                jRule.setJourneyRules(journey, upcomingFlight);
                clModel.journeys.push(jRule);
            }
            checkList(clModel);




            //$(document).click(function (event) {
            //    if ($(event.currentTarget.activeElement).attr('id') != 'toolTipUnavailableToggler' &&
            //        $(event.currentTarget.activeElement).attr('id') != 'toolTipUnavailable')
            //    {
            //        //clModel.showChangeCancelTooltip(false);
            //    }
            //});

            // Close tooltip on click outside of tooltip
            $(document).on('click', function (event)
            {
                if (!$(event.target).closest('#toolTipUnavailableToggler').length)
                {
                    clModel.showChangeCancelTooltip(false);
                }
                if (!$(event.target).closest('#toolTipSeatUnavailableToggler, #toolTipSeatUnavailable').length) {
                    clModel.showSeatsTooltip(false);
                }
            });


            //$(document).on('keydown', function (event) {
            //    if (event.which == 27)
            //        clModel.showChangeCancelTooltip(false);
            //});
        };

        var findJourneyBySellKey = function (journeySellKey) {
            var journey = _.filter(checkList().journeys(), function (journey) { 
                return journey.journeySellKey() == journeySellKey;
            })[0];
            return journey;
        }

        var isAnyJourneyInTheFuture = function () {
            var journeys = _.filter(checkList().journeys(), function (journey) {
                if (typeof (pastCheckInJourneySellKeys) != 'undefined' && pastCheckInJourneySellKeys !== null &&
                        (pastCheckInJourneySellKeys.indexOf(journey.journeySellKey()) != -1)) {
                    return true;
                }
            });
            return checkList().journeys().length > journeys.length;
        };

        var isAnyJourneyCheckedIn = function () {
            var journeys = _.filter(checkList().journeys(), function (journey) {
                if (journey.isAnySegmentCheckedIn()) {
                    return true;
                }
            });
            return journeys.length > 0;
        };

        var allJourneysArePastCutOffTime = function () {
            var journeys = _.filter(checkList().journeys(), function (journey) {
                if (journey.isPastCutOffTime()) {
                    return true;
                }
            });
            return journeys.length == data.Booking.Journeys.length;
        };


        return {
            checkList: checkList,
            loadCheckList: loadCheckList,
            findJourneyBySellKey: findJourneyBySellKey,
            isAnyJourneyInTheFuture: isAnyJourneyInTheFuture,
            isAnyJourneyCheckedIn: isAnyJourneyCheckedIn,
            allJourneysArePastCutOffTime: allJourneysArePastCutOffTime
        };
    }();

    // end of checklist
    bookings.messages = {
        showWarningMessage: ko.observable(false)
        , showContactPorterEscapes: ko.observable(false)
        , showContactTravelAgency: ko.observable(false)
        , showContactGroups: ko.observable(false)
        , showInsuranceIneligible: ko.observable(false)
        , showMustSignIn: ko.observable(false)
        , showBagCheckedIn: ko.observable(false)
        , showContactCallCenter: ko.observable(false)
        , showBasicFareMesssage: ko.observable(false)
    };

    bookings.loadWarningMessages = function () {
        var msg = this.messages;
        
        var rules = data.Rules;
        if (rules && rules.ShowWarningMessage){
            
            msg.showWarningMessage(rules.ShowWarningMessage);
            msg.showContactTravelAgency(rules.ShowContactTravelAgency);
            msg.showContactPorterEscapes(rules.ShowContactPorterEscapes);            
            msg.showContactGroups(rules.ShowContactGroups);
            // don't want two msgs
            if (!msg.showContactGroups() || !msg.showContactPorterEscapes())
            { 
                 msg.showInsuranceIneligible(rules.ShowInsuranceIneligible);
            }
            msg.showMustSignIn(rules.ShowMustSignIn);
            msg.showBagCheckedIn(rules.ShowBagCheckedIn);
            msg.showBasicFareMesssage(rules.ShowBasicFareMesssage);

            this.messages.showContactCallCenter(rules.ShowContactCallCenter);
            
        }
        else{
            
            msg.showWarningMessage((!bookings.rules.canCancelFlight() && !bookings.rules.canChangeFlight())
                                    || bookings.information.bookingStatus() == bookings.CONST.BOOKING_STATUS_PENDING
                                    || bookings.hasBlockedSSRs());

            if (msg.showWarningMessage()) {  // warning message will be shown, check which one
                msg.showContactPorterEscapes(bookings.userDetails.isPorterEscapes());

                msg.showContactTravelAgency(!bookings.userDetails.isB2CBooking() && (bookings.userDetails.isAgencyBookingWithPassenger() || bookings.userDetails.isAgencyBookingAndGDS()));

                msg.showContactGroups(bookings.userDetails.isGroup() && (!bookings.userDetails.isAgencyBooking() || (bookings.userDetails.isAgencyBooking() && bookings.userDetails.isTravelAgent())));

                if (!msg.showContactGroups() || !msg.showContactPorterEscapes()) // don't want two msgs
                    msg.showInsuranceIneligible(bookings.userDetails.hasInsurance() && !(bookings.isIROP() && bookings.isRebooked()));

                //msg.showMustSignIn(((bookings.userDetails.isPorterPassRedemption() || bookings.userDetails.isVIPorterRedemption()) && !bookings.userDetails.isVIPorter())
                msg.showMustSignIn(
                    ((bookings.userDetails.isPorterPassRedemption() || (bookings.isIROP() && bookings.userDetails.isVIPorterRedemption())) && !bookings.userDetails.isVIPorter())
                    || (bookings.userDetails.isCorporate() && !bookings.userDetails.isCorporateUser())
                    || ((bookings.userDetails.isVIPorterRedemption() || bookings.userDetails.isStaffTravelStandby()) && !bookings.userDetails.isVIPorter()));

                // if the other specific messages are false, show generic message
                this.messages.showContactCallCenter(msg.showWarningMessage() && !msg.showContactPorterEscapes() && !msg.showContactTravelAgency()
                    && !msg.showContactGroups() && !msg.showInsuranceIneligible() && !msg.showMustSignIn())
            }
        }
    }

    bookings.seatMessages = {
        showWarningMessage: ko.observable(false)
    };

    bookings.loadSeatWarningMessages = function () {
        var msg = this.seatMessages;
        var rules = data.Rules;
        
        if (rules && rules.ShowSeatWarningMessage) {
            msg.showWarningMessage(rules.ShowSeatWarningMessage);
        }
    };

    // user detail section
    bookings.userDetails = {
        isStaffTravelConfirmed: ko.observable()
            , isStaffTravelStandby: ko.observable()
            , isStaffTravelStandbyZC: ko.observable()
            , isBoardMember: ko.observable()
            , isEmployeePass: ko.observable()
            , isInterline: ko.observable()
            , isInternational: ko.observable()
            , isPassiveSegment: ko.observable()
            , isTravelAgent: ko.observable()
            , isStaffOnBusiness: ko.observable()
            , isPorterEscapes: ko.observable()
            , isGroup: ko.observable()
            , isEmployeePass: ko.observable()
            , isETicket: ko.observable()
            , isETicketedFromRegisteredAgency: ko.observable()
            , isCharter: ko.observable()
            , isAgencyBooking: ko.observable()
            , isAgencyBookingAndGDS: ko.observable()
            , isAgencyBookingWithPassenger: ko.observable()
            , isPromo: ko.observable()
            , isStaffTravelDiscount: ko.observable()
            , isRegularFare: ko.observable()
            , isHRGBooking: ko.observable()
            , isB2CBooking: ko.observable()
            , isB2CUser: ko.observable()
            , isCorporate: ko.observable()
            , isCorporateUser: ko.observable()
            , isVIPorterRedemption: ko.observable()
            , isVIPorterRedemptionLegacy: ko.observable()
            , isPorterPassRedemption: ko.observable()
            , isPorterPassBooklet: ko.observable()
            , isFlightPassRedemption: ko.observable()
            , isMediaFam: ko.observable()
            , isVoucherWaiver: ko.observable()
            , isVIPorter: ko.observable()
            , isB6Booking: ko.observable()
            , anyModifiers: ko.observable()
            , hasValidBooking: ko.observable()
            , hasInsurance: ko.observable()
            , isBookingPending: ko.observable()
            , isAmoutOwing: ko.observable()
            , hasPetWithin12Hour: ko.observable()
            , isOpenJaw: ko.observable()
            ,hasMixedFareClasses: ko.observable()
            , isInfantPassenger: ko.observable()
            , isCCAgent : ko.observable()
    };

    bookings.loadUserDetails = function (data) {
        this.userDetails.isB6Booking(data.isB6Booking);
        this.userDetails.isStaffTravelStandby(data.isStaffTravelStandby);
        this.userDetails.isStaffTravelStandbyZC(data.isStaffTravelStandbyZC);
        this.userDetails.isStaffTravelConfirmed(data.isStaffTravelConfirmed);
        this.userDetails.isRegularFare(data.isRegularFare);
        this.userDetails.isBoardMember(data.isBoardMember);
        this.userDetails.isEmployeePass(data.isEmployeePass);
        this.userDetails.isInterline(data.isInterline);
        this.userDetails.isInternational(data.isInternational);
        this.userDetails.isPassiveSegment(data.isPassiveSegment);
        this.userDetails.isStaffTravelDiscount(data.isStaffTravelDiscount);
        this.userDetails.isTravelAgent(data.isTravelAgent);
        this.userDetails.isStaffOnBusiness(data.isStaffOnBusiness);
        this.userDetails.isPorterEscapes(data.isPorterEscapes);
        this.userDetails.isGroup(data.boolGroup);
        this.userDetails.isEmployeePass(data.isEmployeePass);
        this.userDetails.isETicket(data.isETicket);
        this.userDetails.isETicketedFromRegisteredAgency(data.isETicketedFromRegisteredAgency);
        this.userDetails.isCharter(data.isCharter);
        this.userDetails.isAgencyBooking(data.isAgencyBooking);
        this.userDetails.isAgencyBookingAndGDS(data.isAgencyBookingAndGDS);
        this.userDetails.isAgencyBookingWithPassenger(data.isAgencyBookingWithPassenger);
        this.userDetails.isPromo(data.isPromo);
        this.userDetails.isHRGBooking(data.isHRGBooking); 
        this.userDetails.isB2CBooking(data.isB2CBooking);
        this.userDetails.isB2CUser(data.isB2CUser);
        this.userDetails.isVIPorterRedemption(data.isVIPorterRedemption);
        this.userDetails.isVIPorterRedemptionLegacy(data.isVIPorterRedemptionLegacy);
        this.userDetails.isPorterPassRedemption(data.isPorterPassRedemption);
        this.userDetails.isPorterPassBooklet(data.isPorterPassBooklet);
        this.userDetails.isFlightPassRedemption(data.isFlightPassRedemption);
        this.userDetails.isCorporate(data.isCorporate);
        this.userDetails.isCorporateUser(data.isCorporateUser);
        this.userDetails.isMediaFam(data.isMediaFam);
        this.userDetails.isVoucherWaiver(data.isVoucherWaiver);
        this.userDetails.isVIPorter(data.isVIPorter);
        this.userDetails.anyModifiers(data.anyModifiers);
        this.userDetails.hasValidBooking(data.hasValidBooking); // checks to make sure the booking falls under one of the above conditions
        this.userDetails.hasInsurance(data.hasInsurance);
        this.userDetails.hasPetWithin12Hour(data.hasPetWithin12Hour);
        this.userDetails.isOpenJaw(data.isOpenJaw);
        this.userDetails.hasMixedFareClasses(data.hasMixedFareClasses);
        this.userDetails.isInfantPassenger(data.isInfantPassenger);
        this.userDetails.isBookingPending(data.isBookingPending);
        this.userDetails.isAmoutOwing(data.isAmoutOwing);
        this.userDetails.isCCAgent(data.isCCAgent);
    }
    // end of user detail section

    // information section (for modals mostly)
    // Data for Information Module
    bookings.information = {
        confirmationNumber: ko.observable()
            , boardingDate: ko.observable()
            , bookingStatus: ko.observable()
            , bookingStatusText: ko.observable()
            , bookingIsPending: ko.observable(false)
            , bookingDate: ko.observable()
            , bookingDateFormatted: ko.observable()
            , recordLocators: ko.observableArray()
            , interlinePNR: ko.observable()
            , bookingBalanceDue: ko.observable(0)
            , emailModal: ko.observable(new porter.EmailModalVM())
    };

    bookings.getBookingStatusToOverwrite = function (data)
    {
        if (!data)
        {
            return null;
        }

        var pastFlight = _.every(data.Journeys, function (j) { return (j.Status == "Departed" || j.Status == "Arrived") });
        var isCancelled = flightOverviewModel.flightOverview().ScheduledDepartureDateString().slice(-4) == "0001" ? true : false

        if (data.Journeys != null && data.Journeys != undefined && data.Journeys.length == 0 && isCancelled && !bookings.userDetails.isPorterPassBooklet())
            return 4;
        else if (pastFlight)
            return 3;
        else if (data.BookingDetail.BookingIsStandby && this.information.bookingStatus() == 2)
            return 9; //Confirmed Standby

        return null;
    };

    bookings.loadInformation = function (data, root) {        
        this.information.confirmationNumber(data.BookingDetail.RecordLocator);
        if (data.Journeys.length > 0) {
            this.information.boardingDate(data.Journeys[0].Segments[0].STD);
        }
        this.information.bookingStatus(data.BookingDetail.Status);
        var pastFlight = _.every(data.Journeys, function (j) { return (j.Status == "Departed" || j.Status == "Arrived" ) });
        this.information.bookingIsPending(data.BookingDetail.BookingIsPending);
        this.information.bookingDate(data.BookingDetail.BookingDate);

        if (data.BookingDetail.BookingDate != null && data.BookingDetail.BookingDate != undefined && data.BookingDetail.BookingDate != "")
        {
            this.information.bookingDateFormatted(moment(data.BookingDetail.BookingDate).format("MMM D, YYYY"));
        }
        
        this.information.recordLocators(data.BookingDetail.RecordLocators);

        this.information.bookingBalanceDue(data.PriceBreakdown.BalanceDueNotRounded);

        var emailModal = this.information.emailModal();
        emailModal.pnr(data.BookingDetail.RecordLocator);
        emailModal.injectBookingPassenger(data.Passengers);
        if (root.IsEmailItineraryReadOnly) {
            emailModal.readOnly(true);
        }
        var firstEmailPax = _.first(emailModal.passengers());
        //var firstEmailPax = _.first(emailModal.emails());
        // Set email for first passenger
        if (firstEmailPax && _.isEmpty(firstEmailPax.contactEmail()) && data.Contact != null && emailModal.emails().length === 0) {
            firstEmailPax.contactEmail(data.Contact.EmailAddress);
            firstEmailPax.checked(true);
            var emailArray = [firstEmailPax]
            emailModal.emails(emailArray)
            //emailModal.emails(emailModal.emails().slice(0, 1))
        }

        var isCancelled = flightOverviewModel.flightOverview().ScheduledDepartureDateString().slice(-4) == "0001" ? true : false
        
        var newBookingStatus = this.getBookingStatusToOverwrite(data);
        if (newBookingStatus != null)
        {
            this.information.bookingStatus(newBookingStatus);
        }

        this.information.bookingStatusText(infoDetails.localizations.bookingStatus[this.information.bookingStatus()]);

        if (!_.isEmpty(data.Journeys)) {
            var departJourney = data.Journeys[0];
            var departFare = _.first(_.first(departJourney.Segments).Fares);
            this.departureFare(departFare);
            if (data.Journeys.length > 1) {
                var returnJourney = data.Journeys[1];
                var returnFare = _.first(_.first(returnJourney.Segments).Fares);
                this.returnFare(returnFare);
            }
        }
    }

    // end of information section

    // rules
    bookings.rules = {
        checkListVisible: ko.observable()
        , canCancelFlight: ko.observable()
        , canChangeFlight: ko.observable()
        , canDoComplimentarySameDayChange: ko.observable()
        , canDoComplimentarySameDayChangeElsewhere: ko.observable()
        , canUpdatePaxInfo: ko.observable()
        , canViewPaxInfo: ko.observable()
        , canChangeSeatBag: ko.observable()
        , canChangeSeat: ko.observable()
        , canChangeBag: ko.observable()
        , canViewBookingContact: ko.observable()
        , canChangeBookingContact: ko.observable()
        , canViewTravelInsurance: ko.observable(false)
        , canViewYTZParking: ko.observable(false)
        , canViewCarRental: ko.observable()   
        , canViewSSRLink: ko.observable()   
        , canViewPayment: ko.observable()
        , canViewFareSummary: ko.observable()
        , canViewReceipt: ko.observable()
        , canAddSeats: ko.observable()
        , canDoSameDayChangeRestricted: ko.observable(false)
        , journeys: ko.observableArray()
        , canDoVoluntaryChange: ko.observable()
    };


    bookings.setRules = function (booking)
    {
        this.rules.checkListVisible(data.Rules.CheckListVisible);
        
        // WEB-10814 - if the flights haven't departed, we still need to show checklist if you can't edit bags and seats, this means booking is invalid 
        // but we still need to show the disabled link                
        if (!booking.checkListViewModel.checkList().canViewBags() && !booking.checkListViewModel.checkList().canViewSeats() && !booking.allDeparted()){
            this.rules.checkListVisible(true);
            booking.checkListViewModel.checkList().canViewChecklist(true);
        }
    
        // Flight Info Cancel:  only VIPorter, staff travel, greater than 24 hours         
        this.rules.canCancelFlight(data.Rules.CanCancelFlight);
        
        // Flight Info Change:  only VIPorter, greater than 24 hours 
        this.rules.canChangeFlight(data.Rules.CanChangeFlight);
        this.rules.canDoComplimentarySameDayChange(data.Rules.CanDoComplimentarySameDayChange);
        if (((this.rules.canCancelFlight() || this.rules.canChangeFlight() || (!this.rules.canChangeFlight() && this.rules.canDoComplimentarySameDayChange())) && !booking.allDeparted()))
        {
            booking.checkListViewModel.checkList().canChangeOrCancelFlight(true);
            booking.checkListViewModel.checkList().canChangeFlight(this.rules.canChangeFlight());
            booking.checkListViewModel.checkList().canCancelFlight(this.rules.canCancelFlight());
                        
            var accessRuleJourneys = data.Rules.AccessRuleJourneys;
            if (accessRuleJourneys != null && accessRuleJourneys.length > 1) {


                // TODO: add the same day/ mixed fare filters as a quick fix, but long term this should link up with
                // this part of the script: var "journeyRule = function () {...."

                // Add journey rules
                //if (accessRuleJourneys[0].IsSameDay && accessRuleJourneys[0].IsMixedFare) {
                //    booking.checkListViewModel.checkList().journeys()[0].canCancelFlight(accessRuleJourneys[0].CanCancelFlight);
                //    booking.checkListViewModel.checkList().journeys()[0].canChangeFlight(accessRuleJourneys[0].CanChangeFlight);
                //}
                //if (accessRuleJourneys[1].IsSameDay && accessRuleJourneys[1].IsMixedFare) {
                //    booking.checkListViewModel.checkList().journeys()[1].canCancelFlight(accessRuleJourneys[1].CanCancelFlight);
                //    booking.checkListViewModel.checkList().journeys()[1].canChangeFlight(accessRuleJourneys[1].CanChangeFlight);
                //}
                
                booking.checkListViewModel.checkList().journeys()[0].canCancelFlight(accessRuleJourneys[0].CanCancelFlight);
                booking.checkListViewModel.checkList().journeys()[0].canChangeFlight(accessRuleJourneys[0].CanChangeFlight);
                
                
                booking.checkListViewModel.checkList().journeys()[1].canCancelFlight(accessRuleJourneys[1].CanCancelFlight);
                booking.checkListViewModel.checkList().journeys()[1].canChangeFlight(accessRuleJourneys[1].CanChangeFlight);
                                
                // Add journey info
                booking.checkListViewModel.checkList().journeys()[0].isSameDay(accessRuleJourneys[0].IsSameDay);
                booking.checkListViewModel.checkList().journeys()[1].isSameDay(accessRuleJourneys[1].IsSameDay);
                
                booking.checkListViewModel.checkList().journeys()[0].isMixedFare(accessRuleJourneys[0].IsMixedFare);
                booking.checkListViewModel.checkList().journeys()[1].isMixedFare(accessRuleJourneys[1].IsMixedFare);

                booking.checkListViewModel.checkList().journeys()[0].isBasicFare(accessRuleJourneys[0].IsBasicFare);
                booking.checkListViewModel.checkList().journeys()[1].isBasicFare(accessRuleJourneys[1].IsBasicFare);

                booking.checkListViewModel.checkList().journeys()[0].allowChangeCancelSelection(accessRuleJourneys[0].AllowChangeCancelSelection);
                booking.checkListViewModel.checkList().journeys()[1].allowChangeCancelSelection(accessRuleJourneys[1].AllowChangeCancelSelection);
                
                if (accessRuleJourneys[0].CanCancelFlight || accessRuleJourneys[0].CanChangeFlight ||
                    accessRuleJourneys[1].CanCancelFlight || accessRuleJourneys[1].CanChangeFlight) {
                    booking.checkListViewModel.checkList().canChangeOrCancelFlight(true);
                    //this.rules.canChangeFlight(true);
                    //this.rules.canCancelFlight(true);
                } else if (this.rules.canDoComplimentarySameDayChange()) {
                    booking.checkListViewModel.checkList().canChangeOrCancelFlight(true);
                } else {
                    booking.checkListViewModel.checkList().canChangeOrCancelFlight(false);
                }
                if (this.rules.canDoComplimentarySameDayChange() && !this.rules.canChangeFlight() && !this.rules.canCancelFlight()) {
                    if (booking.checkListViewModel.checkList().journeys()[0].isWaiveSDC()) {
                        booking.checkListViewModel.checkList().journeys()[0].allowChangeCancelSelection(true);
                    }
                    if (booking.checkListViewModel.checkList().journeys()[1].isWaiveSDC()) {
                        booking.checkListViewModel.checkList().journeys()[1].allowChangeCancelSelection(true);
                    }
                }
            }
            if (accessRuleJourneys != null && accessRuleJourneys.length > 0) {
                if (booking.checkListViewModel.checkList().canChangeOrCancelFlight()) {
                    // Set rules for journeys that have checked in bags
                    var canChangeOrCancelFlight = false;
                    for (var x = 0; x < accessRuleJourneys.length; x++) {
                        var accessRuleJourney = accessRuleJourneys[x];
                        if (accessRuleJourney.IsBagCheckedIn && !booking.checkListViewModel.checkList().journeys()[x].isPastCutOffTime()) {
                            booking.checkListViewModel.checkList().journeys()[x].canCancelFlight(accessRuleJourney.CanCancelFlight);
                            booking.checkListViewModel.checkList().journeys()[x].canChangeFlight(accessRuleJourney.CanChangeFlight);
                            booking.checkListViewModel.checkList().showBagCheckedInWarning(true);
                        }
                        if (accessRuleJourney.CanCancelFlight || accessRuleJourney.CanChangeFlight) {
                            canChangeOrCancelFlight = true;
                        } else if (!accessRuleJourney.CanChangeFlight && this.rules.canDoComplimentarySameDayChange()) {
                            canChangeOrCancelFlight = true;
                        }
                    }
                    booking.checkListViewModel.checkList().canChangeOrCancelFlight(canChangeOrCancelFlight);
                }
            }

            //else {
            //    booking.checkListViewModel.checkList().canChangeOrCancelFlight(true);
            //    //bookings.checkListViewModel.checkList().canViewChecklist(true);
            //}  

        }else{
            booking.checkListViewModel.checkList().canChangeOrCancelFlight(false);            
            //bookings.checkListViewModel.checkList().canViewChecklist(false);
        }

        this.rules.canDoComplimentarySameDayChangeElsewhere(data.Rules.CanDoComplimentarySameDayChangeElsewhere);
        this.rules.canDoSameDayChangeRestricted(data.Rules.CanDoSameDayChangeRestricted);

        // Update Passenger info: don't show if travel agency booking (save web), less than 24 hours        
        this.rules.canUpdatePaxInfo(data.Rules.CanUpdatePaxInfo);
        this.rules.canViewPaxInfo(data.Rules.CanViewPaxInfo);

        // Update Seats/Bag: don't show if interline, standby, escapes, travel agency booking (save web), less than 24 hours 
        //this.rules.canChangeSeatBag(data.Rules.CanChangeSeatBag);
        this.rules.canChangeSeatBag(data.Rules.CanChangeBag || data.Rules.CanChangeSeat);
        this.rules.canChangeSeat(data.Rules.CanChangeSeat);
        this.rules.canChangeBag(data.Rules.CanChangeBag);
            
        // View booking contact:  Don't show if travel agency booking through GDS or  user with travel agency booking anon
        this.rules.canViewBookingContact(data.Rules.CanViewBookingContact);

        // Edit booking contact:  Don't show if travel agency booking through GDS or  user with travel agency booking anon
        this.rules.canChangeBookingContact(data.Rules.CanChangeBookingContact);


        // View Payment:   don't show for media, porter escapes, agency booking (save web/call center), porter pass redemption
        this.rules.canViewPayment(data.Rules.CanViewPayment);//

        // View fare summary: don't show for media, porter escapes, vouchers/waivers,Groups or staff travel - WEB-8420 phase 1
        this.rules.canViewFareSummary(!booking.isCancelled() && data.Rules.CanViewFareSummary);
                    
        // View Receipt: don't show for escapes, staff travel (non-viporter login), agency booking (passenger view), porter pass
        this.rules.canViewReceipt(data.Rules.CanViewReceipt);//

        // View Add Travel Insurance
        this.rules.canViewTravelInsurance(data.Rules.CanViewTravelInsurance);

        // YTZ PArking        
        this.rules.canViewYTZParking(data.Rules.YTZParkingVisible);
        
        // Car Rental
        this.rules.canViewCarRental(data.Rules.CanViewCarRental);
        
        this.rules.canViewSSRLink(data.Rules.UpdateSSRVisible);

        this.rules.canDoVoluntaryChange(data.Rules.CanDoVoluntaryChange);

        if (booking.isIROP()) {
            if (booking.isRebooked()) {
                if (booking.isEligibleToRebookOnline()) {
                    // Allow bookings to be modified in IROP that would normally be blocked in voluntary pnr mod
                    if (booking.userDetails.hasInsurance() ||
                        (booking.userDetails.isVIPorterRedemption() && booking.userDetails.isVIPorter()) ||
                        //booking.userDetails.isPorterEscapes()
                        booking.userDetails.isPromo() ||
                        booking.userDetails.isVoucherWaiver() ||
                        booking.userDetails.isB2CBooking()) {
                        this.rules.canCancelFlight(true);
                        this.rules.canChangeFlight(true);
                        booking.checkListViewModel.checkList().canChangeOrCancelFlight(true);
                    }
                    
                    // Block rebook online
                    // Meant to show the call centre message
                    if (booking.userDetails.isMediaFam() ||
                        booking.userDetails.isStaffTravelDiscount()// ||
                        // Block VIPorter redemption until shopping cart shows points separately
                        //booking.userDetails.isVIPorterRedemption() ||
                        /*booking.userDetails.isB2CBooking()*/) {
                        booking.isEligibleToRebookOnline(false);
                        // IROP message at the top of the page
                        booking.iropViewModel.irop().isEligibleToRebookOnline(false);
                    }
                }
            }
        }
    }
    //end of rules

    // payment View Model
    bookings.paymentModel = function () {
        this.totalPaymentAmount = ko.observable();
        this.totalPaymentCurrency = ko.observable();
        this.ccPayments = ko.observableArray(); // Credit Card (1)
        this.certPayments = ko.observableArray(); // Gift Certificate (5)
        this.creditPayments = ko.observableArray(); // Reservation Credit (5)
        this.loyaltyPayments = ko.observableArray(); // Loyalty (6)
        this.voucherPayments = ko.observableArray(); // Voucher (7)
        this.writeOffPayments = ko.observableArray(); // WO and (0) 
        this.cashPayments = ko.observableArray(); // CA and (0) 
        this.rbcPayments = ko.observableArray(); // RBC (0)
        this.ppPayments = ko.observableArray(); // Porter Pass (7)
        this.collapse = ko.observable(true);
        this.isReceiptVisible = ko.observable(true);
        // hasPayment is for determining if there is any payments
        this.hasPayment = ko.observable(true);
        // hasCreditShell is for determining if the user has any credit on this pnr from cancelling a booking, fee, etc.
        this.hasCreditShell = ko.observable(false);
        this.totalCreditAmount = ko.observable();
        this.creditCurrencyCode = ko.observable();
        this.creditExpirationDate = ko.observable();
        this.noCreditExpiry = ko.observable(false);
        this.hasRefund = ko.observable(false); // if there's a refund
        this.totalRefundAmount = ko.observable();
        this.refundCurrencyCode = ko.observable();
        this.accountNumber = ko.observable(); // if viporter


         //Refundable Fares
        //Temp flag for testing multiple payments
        this.multiplePayments = ko.observable(true);
        //Temp flag for valid CC payments
        this.validCCPayment = ko.observable(true);

        this.booking = function () {
            // Data for Information Module
        };


        this.collapse.subscribe(function (newValue)
        {
            setTimeout(function ()
            {
                document.accessibility.readText($('#btn-more-info-payment').find('span:visible').text());
            }, 300);

        });

        this.toggleCollapse = function () {
            this.collapse(!this.collapse());
        };
    };

    var BookingPayment = function () {
        this.accountName = ko.observable('');
        this.accountNumber = ko.observable();
        this.accountNumberID = ko.observable(); // for Credit Cards
        this.paymentMethodType = ko.observable();
        this.paymentMethodCode = ko.observable();
        this.collectedAmount = ko.observable();
        this.collectedCurrencyCode = ko.observable();
        this.expiration = ko.observable();
        this.paymentID = ko.observable();
        this.authorizationStatus = ko.observable(0);
        this.authorizationStatusText = ko.observable('');
        // Financing via Uplift
        this.isFinanced = ko.observable(false);

        // Billing
        this.billingAddress1 = ko.observable();
        this.billingAddress2 = ko.observable();
        this.billingCity = ko.observable();
        this.billingProvince = ko.observable();
        this.billingCountry = ko.observable();
        this.billingPostal = ko.observable();

        // KO Computed
        this.ccNumber = ko.computed(function () {
            if (this.accountNumber() != undefined)
                return porter.util.formatCC(this.accountNumber());
            return 0;
        }, this);

        this.authorizationStatusText = ko.computed(function () {
            //2 is pending
            try {
                return paymentDetails.localizations.authorizedPaymentStatus[this.authorizationStatus()];
            } catch (e) {
                console.log(this.authorizationStatus());
                return paymentDetails.localizations.authorizedPaymentStatus[0];
            }
        }, this);

        this.loyaltyAccount = ko.computed(function () {
            if (this.paymentMethodType() === 6 &&
                porter.itinerary.data.LoyaltyAccounts &&
                porter.itinerary.data.LoyaltyAccounts[this.accountNumber()]) {
                return porter.itinerary.data.LoyaltyAccounts[this.accountNumber()];
            }
            return null;
        }, this);

        this.viporterMemberName = ko.computed(function () {
            if (this.loyaltyAccount() !== null) {
                return this.loyaltyAccount().FirstName + ' ' + this.loyaltyAccount().LastName;
            }
            return '';
        }, this);

        this.viporterBalance = ko.computed(function () {
            if (this.loyaltyAccount() !== null) {
                return porter.getNumberWithCommas(this.loyaltyAccount().PointsBalance);
            }
            return '';
        }, this);

        // this.accountLastName = ko.computed(function () {
        //  var lastName;
        //  var names = this.accountName().split(' ');
        //  lastName = names.pop();
        //  return lastName;
        // }, this);

        this.expirationDate = ko.computed(function () {
            return moment(this.expiration()).utc().format('MM/YYYY');
        }, this);

        this.injectData = function (data, root) {
            this.accountName(data.AccountName);
            this.accountNumber(data.AccountNumber);
            this.accountNumberID(data.AccountNumberID);
            this.paymentMethodType(data.PaymentMethodType);
            this.paymentMethodCode(data.PaymentMethodCode);
            this.collectedAmount(data.QuotedAmount);
            this.collectedCurrencyCode(data.QuotedCurrencyCode);
            this.expiration(data.Expiration);
            this.authorizationStatus(data.AuthorizationStatus);
            this.paymentID(data.PaymentID);
            if (data.PaymentText === 'Financing') {
                this.isFinanced(true);
            }

            // Billing
            // TODO: Retrieve Billing Address info once it has been added to object.
            // this.billingAddress1();
            // this.billingAddress2();
            // this.billingCity();
            // this.billingProvince();
            // this.billingCountry();
            // this.billingPostal();
        }
    }
    bookings.paymentViewModel = function () {
        var payment = ko.observable(),

        getCreditExpiryDate = function (payment) {
            var creditExpirationDate = null;
            if (data.Account) {
                $(data.Account.AccountCredits).each(function(index, credit) {
                    if (payment.AccountTransactionCode  === credit.AccountTransactionCode && 
                        payment.CreatedDate.substring(0,10) === credit.CreatedDate.substring(0,10)/* &&
                        Math.abs(payment.PaymentAmount) === credit.Amount*/) {
                        creditExpirationDate = moment(credit.Expiration).format("MMMM D, YYYY");
                    }
                    //WEB-19683 covering the case when users book the same journey more than one -> refund amount will be added to 
                    //previous existing amount
                    if (payment.AccountTransactionCode === credit.AccountTransactionCode &&
                        payment.CreatedDate.substring(0, 16) === credit.ModifiedDate.substring(0, 16)) {
                        creditExpirationDate = moment(credit.Expiration).format("MMMM D, YYYY");
                    }
                })
            }
            return creditExpirationDate;
        }

        loadPayment = function (data, account) {
            var model = new bookings.paymentModel();
            // TODO: get data for this
            model.totalPaymentAmount(data.Payments.TotalPaymentAmount);
            model.totalPaymentCurrency(data.Payments.items[0].CurrencyCode);
            var hasPayment = false;
            var hasCreditShell = false;
            var hasRefund = false;
            var totalCreditAmount = 0;
            var totalRefundAmount = 0;
            var refundCurrencyCode = "";
            var creditCurrencyCode = "";
            var accountNumber = "";
            var creditExpirationDate = "";

            $(data.Payments.items).each(function (index, payment)
            {
                var newPayment = new BookingPayment();
                var paymentType = payment.PaymentMethodType;
                var paymentMethodCode = payment.PaymentMethodCode;
                var currentDate = porter.DATETIME_NOW;

                newPayment.injectData(payment);
                
                if (paymentType == 0 && paymentMethodCode == "CA")
                {
                    model.cashPayments.push(newPayment);
                }
                else if (paymentType == 0 && paymentMethodCode == "WO")
                {
                    model.writeOffPayments.push(newPayment);
                }
                else if (paymentType == 0 && paymentMethodCode == "AZ")
                {
                    model.rbcPayments.push(newPayment);
                }
                else if (paymentType == 0 && paymentMethodCode == "OT") {
                    // Option Town payment
                    if (bookings.userDetails.isFlightPassRedemption()) {
                        model.totalPaymentAmount(model.totalPaymentAmount() - newPayment.collectedAmount());
                    }
                }
                else if (paymentType == 0 && paymentMethodCode == "XX") {
                    //credit extension
                    totalCreditAmount += newPayment.collectedAmount();

                }
                else if (paymentType == 1)
                {
                    model.ccPayments.push(newPayment);
                    if (newPayment.collectedAmount() < 0) {
                        hasRefund = true;

                        // WEB-25117 Constant\BookingPaymentStatus
                        if (payment.PaymentMethodCode !== "PP" || 
                            (payment.PaymentMethodCode === "PP" && payment.Status === 3))
                            totalRefundAmount += newPayment.collectedAmount();
                            
                        refundCurrencyCode = newPayment.collectedCurrencyCode();
                    }
                }
                else if (paymentType == 3 || paymentType == 4)
                {
                    if (payment.QuotedAmount < 0) {
                        hasCreditShell = true;
                    }
                }
                else if (paymentType == 5) {
                    if (payment.AccountTransactionCode === "GIFT") { // gift certificate
                        model.certPayments.push(newPayment); 
                    } else { // credit
                        model.creditPayments.push(newPayment);
                        if (payment.QuotedAmount < 0) {

                            //Check to see if account has credit shell first
                            if (account != null) {
                                $(account.AccountCredits).each(function (index, credit) {
                                    var creditsAvailable = account.AccountCredits[index].Available
                                    if (creditsAvailable > 0) {
                                        totalCreditAmount = creditsAvailable;
                                    }
                                    else
                                    // There is no credit for this account so maybe its a refund
                                    {
                                        totalCreditAmount += newPayment.collectedAmount();
                                    }
                                });
                            }
                            else {
                                totalCreditAmount += newPayment.collectedAmount();
                            }

                            creditCurrencyCode = newPayment.collectedCurrencyCode();
                            accountNumber = newPayment.accountNumber(); // this is 6-digit Reserv. or 10-digit acct credit
                            creditExpirationDate = getCreditExpiryDate(payment);

                            // Check to see if creditExpirationDate is null
                            if (creditExpirationDate !== null) {
                                //Final check to see if credit date is expired
                                isCreditExpired = (currentDate.toDate() > new Date(creditExpirationDate))
                                if (!isCreditExpired) {
                                    hasCreditShell = true;
                                }
                            }
                        } else {
                            if (paymentMethodCode === 'CF' &&
                                (newPayment.accountNumber().toUpperCase() === data.BookingDetail.RecordLocator || newPayment.accountNumber() === accountNumber)) {
                                // Reversed credit shells
                                totalCreditAmount += newPayment.collectedAmount();
                            }
                        }
                    }

                }
                else if (paymentType == 6) {
                    model.loyaltyPayments.push(newPayment);
                }
                else if (paymentType == 7) {
                    //Porter pass payment
                    if (bookings.userDetails.isPorterPassRedemption()) {
                        // If porter pass redemption then subtract voucher amounts from total
                        model.ppPayments.push(newPayment);
                        model.totalPaymentAmount(model.totalPaymentAmount() - newPayment.collectedAmount());
                    } else {
                        // Add voucher if not porter pass redemption
                        model.voucherPayments.push(newPayment);
                        
                    }
                }
                else
                {
                    console.error("UNKNOWN PAYMENT TYPE:" + paymentType);
                }
                if (payment.PaymentAmount > 0) {
                    hasPayment = true;
                }
            });

            var bookingStatus = bookings.getBookingStatusToOverwrite(data);

            if (bookingStatus === null)
            {
                bookingStatus = data.BookingDetail.Status;
            }
            
            var showPaymentReceipt = (bookingStatus == 2 || bookingStatus == 3) &&  // Confirmed || Closed
                                     data.PriceBreakdown.BalanceDueNotRounded == 0;

            // This is when the credit amount is a total of multiple credits and the expiration is not set above
            if (hasCreditShell && totalCreditAmount !== 0) {
                if (_.isEmpty(creditExpirationDate)) {
                    if (!_.isEmpty(account)) {
                        var totalCredit = Number(totalCreditAmount.toFixed(2));
                        $(account.AccountCredits).each(function (index, credit) {
                            if (Math.abs(totalCredit) === credit.Amount) {
                                for (var x = 0; x < data.Payments.items.length; x++) {
                                    var p = data.Payments.items[x];
                                    if (p.AccountTransactionCode === credit.AccountTransactionCode &&
                                        p.CreatedDate.substring(0, 10) === credit.CreatedDate.substring(0, 10)) {
                                        creditExpirationDate = moment(credit.Expiration).format("MMMM D, YYYY");
                                    }
                                }
                            }
                        })
                    }
                }
            }

            // There's a refund and no credit
            if (hasRefund && totalCreditAmount === 0) {
                hasCreditShell = false;
            }

            // No expiry
            if (!_.isEmpty(creditExpirationDate) && creditExpirationDate.indexOf('9999') > -1) {
                model.noCreditExpiry(true);
            }

            model.isReceiptVisible(showPaymentReceipt);
            model.hasPayment(hasPayment);
            model.hasCreditShell(hasCreditShell);
            model.hasRefund(hasRefund);
            model.totalCreditAmount(Math.abs(totalCreditAmount));
            model.totalRefundAmount(Math.abs(totalRefundAmount));
            model.refundCurrencyCode(refundCurrencyCode);
            model.creditCurrencyCode(creditCurrencyCode);
            model.accountNumber(accountNumber);
            model.creditExpirationDate(creditExpirationDate);

            // add index num for displaying on page
            var allPayments = [model.certPayments(), model.ccPayments(), model.creditPayments(), model.loyaltyPayments(), model.voucherPayments(), model.cashPayments(), model.writeOffPayments(), model.rbcPayments()];
            var count = 1;
            for (var i = 0; i < allPayments.length; i++) {
                var paymentItem = allPayments[i];
                for (var j = 0; j < paymentItem.length; j++) {
                    paymentItem[j].index = count;
                    count++;
                }
            }

            payment(model);
        };
        return {
            payment: payment,
            loadPayment: loadPayment
        };
    }();

    // end of payment

    // rental confirmation
    bookings.carRental = ko.observable();
    /*bookings.rentalConfirmationModel = function () {
        this.CarRentalConfirmation = ko.observable();
        this.CarRentalCurrency = ko.observable();
        this.CarTotalToCollect = ko.observable();
        this.HasCar = ko.observable(false);
        this.CarAllowed = ko.observable(false);
        this.collapse = ko.observable(true);
    };

    bookings.rentalConfirmationViewModel = function () {
        var rentalConfirmation = ko.observable(),

        loadRentalConfirmation = function (booking) {
            var model = new bookings.rentalConfirmationModel();

            model.CarRentalConfirmation(booking.PriceBreakdown.CarRentalConfirmation);
            model.CarRentalCurrency(booking.PriceBreakdown.CarRentalCurrency);
            model.CarTotalToCollect(booking.PriceBreakdown.CarTotalToCollect);
            model.HasCar(booking.PriceBreakdown.HasCar);
            model.CarAllowed(booking.ItineraryNavigation.CarAllowed);
            model.collapse(true);

            rentalConfirmation(model);
        };
        return {
            rentalConfirmation: rentalConfirmation,
            loadRentalConfirmation: loadRentalConfirmation
        };
    }();*/
    // end of rental confirmation

    // pax details
    // paxSummary View Model
    bookings.paxSummaryModel = function () { // used in Passenger Details
        this.passengers = ko.observableArray();
        this.collapse = ko.observable(true);
        this.insuranceCollapse = ko.observable(true);


        this.collapse.subscribe(function (newValue)
        {
            setTimeout(function ()
            {
                document.accessibility.readText($('#btn-more-info-pax-details').find('span:visible').text());
            }, 300);

        });

        this.insuranceCollapse.subscribe(function (newValue)
        {
            setTimeout(function ()
            {
                document.accessibility.readText($('.btn-more-info-insurance:visible').find('span:visible').text());
            }, 300);

        });

        this.allBookingsFlew = ko.computed(function ()
        {
            if (typeof bookings != "undefined" && bookings.flightStatusViewModel != null)
            {
                var journeysThatFlew = _.filter(bookings.flightStatusViewModel.flightInfoJourneys(), function (journey)
                {
                    return journey.lowerCaseStatus() == "arrived" || journey.lowerCaseStatus() == "departed"                    
                });
                
                // all journeys
                return journeysThatFlew.length == bookings.flightStatusViewModel.flightInfoJourneys().length;
            }

            return false;
        }, this);



    }

    var JourneyModel = function () {
        this.Segments = ko.observableArray();
        this.passengerNumber = ko.observable();
        this.isWithin24HoursOfDepartureOrPast = ko.computed(function () {
            if (this.Segments && this.Segments().length > 0) {
                var firstSegment = this.Segments()[0];
                return firstSegment.STD_UTC().diff(porter.DATETIME_NOW, 'hours') < 24;
            }
            return false;
        }, this);

        var self = this;
        this.injectData = function (data, passengerNumber) {
            this.passengerNumber(passengerNumber);

            $(data.Segments).each(function (index, Segment) {
                var newSegment = new SegmentModel();

                newSegment.injectData(Segment, passengerNumber);

                self.Segments.push(newSegment);
            });
        }
    };

    var SegmentModel = function () {
        this.ArrivalStation = ko.observable();
        this.DepartureStation = ko.observable();
        this.seatNumber = ko.observable();
        this.passengerNumber = ko.observable();
        this.STD_UTC = ko.observable();
        this.paxSeats = ko.observableArray();
        this.SSRs = ko.observableArray();
        this.hasBags = ko.observable();

        this.tabID = ko.observable(porter.util.getTabID());

        var self = this;

        this.selectedSeat = function (n) {
            //  var res = '&nbsp;&nbsp;--';
            var res = '--';
            if (self.paxSeats()) {
                var paxSeat = _.filter(self.paxSeats(), function (item) { return item.PassengerNumber == n });
                if (paxSeat.length > 0)
                    res = paxSeat[0].UnitDesignator;
            }

            return res;
        }

        this.gotoSeats = function () {
            var url = porter.getUrlWithCulture('manage-flights/my-bookings/add-seats') + (self.tabID().length > 0 ? "?tabid=" + self.tabID() : '');
            window.location.href = url;
        };

        this.SegmentName = ko.computed(function () {
            return this.DepartureStation() + '-' + this.ArrivalStation();
        }, this);

        this.ArrivalStationName = ko.computed(function () {
            return porter.lookups.stations.Names[this.ArrivalStation()];
        }, this);

        this.DepartureStationName = ko.computed(function () {
            return porter.lookups.stations.Names[this.DepartureStation()];
        }, this);

        var self = this;

        this.injectData = function (data, passengerNumber) {
            this.ArrivalStation(data.ArrivalStation);
            this.DepartureStation(data.DepartureStation);
            this.paxSeats(data.PaxSeats);
            this.passengerNumber(passengerNumber);
            this.STD_UTC(moment.utc(data.STD_UTC));
            this.hasBags(_.filter(data.PaxSSRs, function (d) { return (d.SSRCode == "1BAG" || d.SSRCode == "2BAG" || d.SSRCode == "3BAG") && d.PassengerNumber == passengerNumber }).length > 0);
        }
    }

    var SSRtestSort = function (paxCount, paxSSRs) {
        var passengerArray = Array(paxCount);
        var ssrs = false;
        var ps = paxSSRs;
        if (ps) {
            ssrs = passengerArray;

            $.each(ps, function (i, ssr) {
                if (typeof ssrs[ssr.PassengerNumber] == 'undefined') {
                    ssrs[ssr.PassengerNumber] = [];
                }
                ssr.journeyCode = ssr.DepartureStation + '-' + ssr.ArrivalStation;
                ssrs[ssr.PassengerNumber].push(ssr);
            });
            $.each(ssrs, function (i, ssrList) {
                //$.each(ssrList, function (ssri, ssr) {
                //    this.journeyCode = ssr.DepartureStation + '-' + ssr.ArrivalStation;
                //})
                ssrs[i] = _.groupBy(ssrList, function (ssr) { return ssr.journeyCode; });
            });
        }

        return ssrs;
    };

    var summarizeSSRs = function (SSRs) {
        // console.log(SSRs);
        var sortedSSRs = [];
        var numBags = 0; // default if no bags
        var notesArray = [];
        var notes = '';

        $.each(SSRs, function (index, SSR) {
            // console.log(SSR);
            sortedSSRs[SSR.SSRCode] = SSR.Note;
        });

        if (typeof sortedSSRs['3BAG'] != 'undefined') {
            numBags = 3;
        } else if (typeof sortedSSRs['2BAG'] != 'undefined') {
            numBags = 2;
        } else if (typeof sortedSSRs['1BAG'] != 'undefined') {
            numBags = 1;
        };

        // Summarize additional SSRs:
        // Only need to display ones with additional fee: BIKE, PETC, WEAP

        if (typeof sortedSSRs['BIKE'] != 'undefined') {
            notesArray.push(bookings.lookupSSR('BIKE', bookingCommon.culture));
        };

        if (typeof sortedSSRs['PETC'] != 'undefined') {
            notesArray.push(bookings.lookupSSR('PETC', bookingCommon.culture));
        };

        if (typeof sortedSSRs['WEAP'] != 'undefined') {
            notesArray.push(bookings.lookupSSR('WEAP', bookingCommon.culture));
        };

        // Check if there are additional notes to display
        if (notesArray.length > 0) {
            notes = notesArray.join(', ');
        };

        return { 'bags': numBags, 'notes': notes, 'numOfSpecialitems': 0 };
    };

    var summarizeSSRs2 = function (SSRs) {
        // console.log(SSRs);
        var sortedSSRs = [];
        var numBags = 0; // default if no bags
        var notesArray = [];
        var notes = '';
        var DepartureStation = '';
        var ArrivalStation = '';
        var SegmentName = '';
        var paxNumber = 0;
        // bagSSRs is an array of translated SSR text
        var bagSSRs = [];
        // var DepartureStationName    = '';
        // var ArrivalStationName      = '';
        // bagSSRCodes is SSRs that will show in the bags section instead of the SSR section
        var bagSSRCodes = ['SPEQ', 'WEAP', 'BIKE'];

        $.each(SSRs, function (index, SSR) {
            // console.log(SSR);
            sortedSSRs[SSR.SSRCode] = SSR.Note;
            DepartureStation = SSR.DepartureStation;
            ArrivalStation = SSR.ArrivalStation;
            SegmentName = DepartureStation + '-' + ArrivalStation;
            paxNumber = SSR.PassengerNumber;

            // Summarize additional SSRs:
            if (SSR.SSRCode.indexOf("BAG") < 0)  // SSRs are on a per journey basis, only add it the first time
                var ssr = bookings.lookupSSR(SSR.SSRCode, bookingCommon.culture);
            if (ssr != undefined && ssr != "") {
                if (bagSSRCodes.indexOf(SSR.SSRCode) > -1) {
                    bagSSRs.push(ssr);
                } else {
                    notesArray.push(ssr);
                }
            }
        });

        if (typeof sortedSSRs['3BAG'] != 'undefined') {
            numBags = 3;
        } else if (typeof sortedSSRs['2BAG'] != 'undefined') {
            numBags = 2;
        } else if (typeof sortedSSRs['1BAG'] != 'undefined') {
            numBags = 1;
        };

        if (notesArray.length > 0) {
            notes = notesArray.join(', ');
        };

        return {
            'bags': numBags, 'notes': notes, 'numOfSpecialitems': notesArray.length,
            'DepartureStation': DepartureStation, 'ArrivalStation': ArrivalStation, 'SegmentName': SegmentName, 'PaxNumber': paxNumber,
            'bagSSRs': bagSSRs
        };
    };

    var Passenger = function () {
        this.firstName = ko.observable('');
        this.lastName = ko.observable('');
        this.viporterNumber = ko.observable('');
        this.insurancePolicy = ko.observable('');
        this.insurancePolicyName = ko.observable('');
        this.insurancePrice = ko.observable('');
        this.passengerNumber = ko.observable(0);
        this.hasInfant = ko.observable(false);
        this.program = ko.observable();
        this.infant = ko.observable({
            name: ko.observable({
                first: ko.observable(''),
                middle: ko.observable(''),
                last: ko.observable('')
            })
        });
        this.SSRs = ko.observableArray();
        this.journeys = ko.observableArray();

        this.SSRSummaries = ko.observableArray();
        this.trigger = ko.observable(0);

        // Show collapse button - mobile
        this.showCollapse = ko.observable(true);
        this.collapse = ko.observable(true);

        this.toggleCollapse = function () {
            this.collapse(!this.collapse());
        };

        // Computed
        this.fullName = ko.computed(function () {
            return this.firstName() + ' ' + this.lastName();
        }, this);

        this.firstInitialAndLastName = ko.computed(function () {
            var firstInitial = '';
            if (this.firstName().length > 0) {
                firstInitial = this.firstName().substring(0, 1);
            }
            firstInitial = firstInitial.toUpperCase();
            var lastName = '';
            if (this.lastName().length > 0) {
                lastName = this.lastName().charAt(0).toUpperCase() + this.lastName().substring(1);
            }
            if (firstInitial !== '' && lastName !== '') {
                // F. Lastname
                return firstInitial + '. ' + lastName;
            }
            return '';
        }, this);

        this.bagSummary = ko.computed(function () {
            this.trigger();
            return summarizeSSRs(this.SSRs());
        }, this);

        this.viporterNumberFormatted = ko.computed(function () {
            var n = this.viporterNumber();
            return n.substring(0, 3) + ' ' + n.substring(3, 6) + ' ' + n.substring(6, 10);
        }, this);
    }

    bookings.paxSummaryViewModel = function () {
        var paxSummary = ko.observable(),

        loadPaxSummary = function (booking) {
            
            var passengers = booking.Passengers;
            var journeys = booking.Journeys;
            var ssrs = booking.PassengerSSRs;

            var paxSummaryModel = new bookings.paxSummaryModel();
            var model = {};

            for (var x = 0; x < passengers.length; x++) {
                model = new Passenger();
                var pax = passengers[x];
                var paxSSRs = [];

                // Find all SSRs that belong to the current passenger
                if (!_.isEmpty(ssrs)) {
                    paxSSRs = _.where(ssrs, { PassengerNumber: pax.PassengerNumber });
                }

                model.firstName(pax.Name.First);
                model.lastName(pax.Name.Last);
                model.viporterNumber(pax.CustomerNumber);
                model.passengerNumber(pax.PassengerNumber);
                model.insurancePolicy(booking.PriceBreakdown.InsurancePolicy);

                //model.insurancePolicy(true);//force to show

                model.insurancePolicyName(booking.PriceBreakdown.InsurancePolicyName);

                model.insurancePrice(Number(booking.PriceBreakdown.InsurancePrice) + Number(booking.PriceBreakdown.InsuranceFeesTaxes));

                if(pax.Program != null && pax.Program != undefined)
                {
                    model.program(pax.Program);                    
                }   

                if (pax.HasInfant) {
                    // Check if the passenger has an INFT SSR in any segment
                    if (!_.isEmpty(paxSSRs)) {
                        if (_.find(paxSSRs, function (p) { return p.SSRCode === 'INFT'; })) {
                            model.hasInfant(true);
                            model.infant().name().first(pax.Infant.Name.First);
                            model.infant().name().middle(pax.Infant.Name.Middle);
                            model.infant().name().last(pax.Infant.Name.Last);
                        }
                    }
                }

                $(ssrs).each(function (index, ssr) {
                    model.SSRs().push(ssr);
                });

                model.trigger(model.trigger() + 1);

                $(journeys).each(function (index, Journey) {
                    var newJourney = new JourneyModel();

                    newJourney.injectData(Journey, pax.PassengerNumber);
                    model.journeys.push(newJourney);
                });

                // Build SSR Summaries
                var SSRSort = SSRtestSort(passengers.length, ssrs);
                $.each(SSRSort, function (i, s) {
                    $.each(s, function (index, ssr) {
                        model.SSRSummaries.push(summarizeSSRs2(ssr));
                    });
                });

                paxSummaryModel.passengers.push(model);
            }
            paxSummary(paxSummaryModel);
        };
        return {
            paxSummary: paxSummary,
            loadPaxSummary: loadPaxSummary
        };
    }();

    // end of pax details
    
    // canModifyRoundTrip means more than one journey can be changed or cancelled
    bookings.canModifyRoundTrip = ko.computed(function () {
        var _self = this;
        if (this.rules.canChangeFlight() || this.rules.canCancelFlight()) {
            if (this.checkListViewModel.checkList()) {
                if (this.checkListViewModel.checkList().journeys().length > 1) {
                    return _.filter(this.checkListViewModel.checkList().journeys(), function (j) {
                        return !j.isPastCutOffTime() &&
                            ((_self.rules.canChangeFlight() && j.canChangeFlight()) || (_self.rules.canCancelFlight() && j.canCancelFlight()));
                    }).length > 1;
                }
            }
        }
        return false;
    }, bookings);

    bookings.hasStandbyJourney = ko.computed(function () {
        return this.isStandbyRankActive() && this.flightStatusViewModel.standbyJourneys().length > 0;
    }, bookings);

    // Passenger details section
    bookings.prepaySeatsUrl = ko.computed(function () {
        if (this.checkListViewModel.checkList()) {
            return this.checkListViewModel.checkList().gotoSeatsUrl();
        }
        return porter.getUrlWithCulture('manage-flights/my-bookings/add-seats');
    }, bookings);

    bookings.prepayBagsUrl = ko.computed(function () {
        return porter.getUrlWithCulture('manage-flights/my-bookings/addbags');
    }, bookings);

    //Apply KO bindings
    ko.applyBindings(bookings, document.getElementById("booking-details-wrapper"));
});

// Get station name from stations object or default to station code
function getStationName(stationCode, stations) {
    return !_.isEmpty(stations.Names[stationCode]) ? stations.Names[stationCode] : stationCode;
}

// Get airport name from stations object or default to station code
function getAirportName(stationCode, stations) {
    return !_.isEmpty(stations.Airports[stationCode]) ? stations.Airports[stationCode] : stationCode;
}

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null
}


var convertToSlug = function (Text) {
    return Text ?
            Text.replace(new RegExp(/\u0301|\u00e9/g), 'e')
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '') :
            '';
};

var ConvertBookingContactViewModelToBooking = function (dataContact, viewModelContact) {

    dataContact.Name.First = viewModelContact.firstName();
    dataContact.Name.Middle = viewModelContact.middleName();
    dataContact.Name.last = viewModelContact.lastName();
    dataContact.AddressLine1 = viewModelContact.streetAddress();
    dataContact.AddressLine2 = viewModelContact.suiteNumber();
    dataContact.City = viewModelContact.city();
    dataContact.CountryCode = viewModelContact.country();
    dataContact.ProvinceState = viewModelContact.province();
    dataContact.PostalCode = viewModelContact.postalCode();
    dataContact.HomePhone = viewModelContact.homePhone();
    dataContact.WorkPhone = viewModelContact.businessPhone();
    dataContact.OtherPhone = viewModelContact.mobilePhone();
    dataContact.EmailAddress = viewModelContact.email();
    return dataContact;
}

var getCultureFromUrl = function () {
    var sParam = "culture";
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
};

// AA
$('.email-modal').one('hidden.bs.modal', function () {
    $('#email-itinerary a').focus();
});

$('#removal-warning').one('hidden.bs.modal', function () {
    $('.removal:visible').focus();
});

//$('#interline-warning').one('hidden.bs.modal', function (e) {
//    $('.modify:visible').focus();
//});

//$(window).resize(function () {
//    if (porter.isMobile())
//        $('.flightStatus').insertAfter('#upcomingFlight');
//    else
//        $('.flightStatus').insertAfter('#flightChecklist')
//});

var openMyBookings = function () {
    var url = dirPath + 'manage-flights/My-Bookings/My-Bookings';
    window.location.href = url;
}

var printItinerary = function () {
    //bookings.paymentViewModel.payment().collapse(true);
    //bookings.collapseFare(true);
    $('html,body').css('cursor', 'wait');
    var fareRule1 = $('#fareRule1');
    var fareRule2 = $('#fareRule2');
    if ($('.fare-rules-details-wrapper').length > 0) {
        var fareRuleDetails1 = $('.fare-rules-details-wrapper').find('.panel-body').find('#fareRule1').find('span');
        var fareRuleDetails2 = $('.fare-rules-details-wrapper').find('.panel-body').find('#fareRule2').find('span');
    }
    bookings.collapseFareDetails(false);
    bookings.collapseFare(false);
    bookings.paxSummaryViewModel.paxSummary().collapse(false);
    bookings.bookingContactViewModel.bookingContact().collapse(false);
    bookings.paxSummaryViewModel.paxSummary().insuranceCollapse(false);
    bookings.paymentViewModel.payment().collapse(false);
    if (rentals.vehicleVM()) rentals.vehicleVM().collapse(false);
    if (!porter.itinerary.data.Booking.PriceBreakdown.HasCar) {
        $('.carRental').addClass('no-print');
    }
    if (!porter.itinerary.data.Booking.PriceBreakdown.HasInsurance) {
        $('#passengerInsurance').addClass('no-print');
    }
    $('html,body').css('cursor', 'wait');
    window.setTimeout(print, 1000);
    $('html,body').css('cursor', 'auto');
    //if (fareRule1.length > 0 && fareRule2.length > 0) {
    //    window.setTimeout(print, 100);
    //    $('html,body').css('cursor', 'auto');
    //} else {
    //    setTimeout(printItinerary, 100);
    //}

    //TO DO: Need to review
    //switch (true) {
    //    case fareRule1.length == 1 && fareRule2.length == 0 && fareRuleDetails1.length >= 2:
    //        $('html,body').css('cursor', 'auto');
    //        window.setTimeout(print, 100);
    //        break;
    //    case fareRule1.length == 1 && fareRule2.length !== 0 && fareRuleDetails1.length >= 2 && fareRuleDetails1.length < 2:
    //        setTimeout(printItinerary, 100);
    //        break;
    //    case fareRule1.length == 1 && fareRule2.length !== 0 && fareRuleDetails1.length >= 2 && fareRuleDetails2.length >= 2:
    //        $('html,body').css('cursor', 'auto');
    //        window.setTimeout(print, 100);
    //        break;
    //    default:
    //        console.log('ab');
    //        setTimeout(printItinerary, 100);
    //        break;
    //}

}

// payment & receipt / email modal anchoring
$('#payment-receipt-modal').on('show.bs.modal', function () {
    $('body').attr("style","overflow: hidden;");
});

$('#payment-receipt-modal').on('hidden.bs.modal', function () {
    $('body').attr("style","overflow: visible;");
});

$('#email-itinerary-modal').on('hidden.bs.modal', function () {
    if ($('#flight-options-heading').is(':visible')) {
        porter.scrollTo($('#flight-options-heading'));
    } else if ($('#options-heading').is(':visible')) {
        porter.scrollTo($('#options-heading'));
    }
});

$('#displayAncillaryOption').click(function () {
    $('#toolTipAncillaryOption').toggle();
})

$('.tooltipOption_closeText').click(function () {
    $('#toolTipAncillaryOption').hide();
})

function toggleTooltip(id) {
    $(id).toggle();
}var rentals = {
    moduleName: 'rentals'
    	, base: '.carRental'          // jQuery base
    	, debug: false               // controls logging
        , ACRISS: {                 // ACRISS special preferences codes
            'special': {
                '0': { 'enum': 'unset' }
                , '4': { 'enum': 'ski_rack', 'max': 1 }
                , '7': { 'enum': 'infant_child_seat', 'max': 4, 'slug': 'infantSeat' }
                , '8': { 'enum': 'child_toddler_seat', 'max': 4, 'slug': 'toddlerSeat' }
                , '9': { 'enum': 'booster_seat', 'max': 4, 'slug': 'boosterSeat' }
                , '11': { 'enum': 'hand_controls_right', 'max': 1 }
                , '12': { 'enum': 'hand_controls_left', 'max': 1 }
                , '13': { 'enum': 'neverlost_system', 'max': 1, 'slug': 'nav' }
                , '14': { 'enum': 'snow_tires', 'max': 1 }
                , '18': { 'enum': 'spinner_knob', 'max': 1 }
                , '27': { 'enum': 'satellite_radio', 'max': 1 }
                , '29': { 'enum': 'seat_beat_extender', 'max': 1 }
                , '41': { 'enum': 'multi_media_system', 'max': 1 }
                , 'maxSeats': 4    // used to constain seats selected
            }
        }
        , validDriver: null
        , vehicleData: {} // TEMP - use 'vehicles' after testing 
        , vehicleVM: ko.observable()
        , compareDate: null
        , submissionURL: dirPath + 'Common/ReserveCarRental'
        , collapse: ko.observable(false)
        , showCarRental: ko.observable(false)
        , errors: {
            DriverReq: ko.observable(false)
        }

        , alert: function (val) {
            if (this.debug) {
                window.alert(val);
            }
        }

    	, log: function (val) {
    	    if (this.debug && !porter.util.isIE8) {
    	        console.log(val);
    	    }
    	}

        , importOptions: function (options) {

            if (typeof options == "object") {
                rentals = $.extend({}, this, options || {});
                //$(window).trigger(this.moduleName + '-imported');
            }
        }

        , validate: function (target) {
            var selectDriver = rentals.vehicleVM().selectedDriver();
            if (_.isEmpty(selectDriver)) {
                rentals.errors.DriverReq(true);
                porter.scrollToError();
                porter.accessInlineErrors();
                return false;
            } else {
                return selectDriver.validate(target);
            }
        }

        , confirmRental: function (data/*, event*/) {
            var showConfirmation = false;
            var formattedSpecials = false;
            //var specials = $(event.target).parents('.full-details').find('.specials');
            //var details = ko.dataFor(event.target);
            var rentalData = rentals.vehicleData.Response;
            var reservationResponse = '';
            var _self = rentals;
            var vehicleVM = rentals.vehicleVM();
            var listingEl = $(data);
            var selectedDriver = vehicleVM.selectedDriver();

            if (vehicleVM.isSubmitDisabled() || !rentals.validate(listingEl) || !this.validate()) {
                return;
            }

            formattedSpecials = this.buildSpecialSubmitData();

            // Set selected vehicle
            rentals.vehicleData.Response.selected = rentals.vehicleData.Response.rates[vehicleVM.rentals().indexOf(this)];

            // Update Hertz data with updated details
            rentalData.customer.firstName = selectedDriver.firstName();
            rentalData.customer.lastName = selectedDriver.lastName();

            if (!_.isEmpty(selectedDriver.DOB().getDate())) {
                rentalData.customer.birthDate = selectedDriver.DOB().getDate().toString();
                rentalData.customer.strBirthDate = selectedDriver.DOB().getDate().format("YYYY-MM-DD hh:mm A");
            } else {
                // No DOB provided
                rentalData.customer.birthDate = null;
                rentalData.customer.strBirthDate = null;
            }
            rentalData.selectedEquipment = JSON.stringify(formattedSpecials);
            rentalData.state = 4;
            vehicleVM.isSubmitDisabled(true);

            $.ajax({
                async: false,
                url: _self.submissionURL,
                data: JSON.stringify(rentalData),
                contentType: 'application/json',
                type: 'POST'
            })
            .done(function (result) {
                reservationResponse = result;

                if (reservationResponse.state == 5) {
                    showConfirmation = true;
                    try {
                        trackSuccessfulCarRental(result);
                    } catch (err) { }
                }
            })
            .fail(function (xhr, textStatus, errorThrown) {
                window.alert(textStatus);
                window.alert(errorThrown);
            });

            if (showConfirmation) {
                vehicleVM.rentalConfirmation().injectData(reservationResponse, this);
                $("#rental-confirmation-modal").modal('show');
                bookingCommon.localizeModuleCurrency("#rental-confirmation-modal");
            } else {
                // show error messages
                $('#rentals-error-modal').modal();
                vehicleVM.isSubmitDisabled(false);
            }

        }

        , printConfirmationReceipt: function () {
            var beforeContent = '<div class="booking"><div class="rentals"><div id="rental-confirmation-modal">';
            var content = $('#rental-confirmation-modal').find('.modal-body');
            var afterContent = '</div></div><div>';

            porter.util.printContent(content, beforeContent, afterContent, rentals.localization['printTitle']);
        }

        , ValidDrivers: function () {

            var self = this;

            self.driverList = ko.observableArray();
            self.selectedDriver = ko.observable();

            self.injectDriverData = function (hertzData, paxData, root) {
                var maxDate = moment.utc('9999-12-31');

                $.each(hertzData.validDrivers, function (index, driver) {
                    var newDriver = new rentals.Driver();
                    //var DOB = paxData[driver].TypeInfo.length > 0 ? moment.utc(paxData[driver].TypeInfo[0].DateOfBirth) : null;
                    if (paxData[driver].TypeInfo.length > 0) {
                        newDriver.DOB().setDate(paxData[driver].TypeInfo[0].DateOfBirth);
                    }

                    if (newDriver.DOB().getDate() !== null && newDriver.DOB().getDate() < maxDate) {
                        var age = rentals.compareDate.diff(newDriver.DOB().getDate(), 'years');
                        // Valid drivers are 20 years old and up
                        if (age < 20) {
                            return;
                        }
                        newDriver.DOB().editable(false);
                    }
                    newDriver.firstName(paxData[driver].Name.First);
                    //newDriver.middleName(paxData[driver].Name.Middle);
                    newDriver.lastName(paxData[driver].Name.Last);

                    newDriver.id(paxData[driver].PassengerNumber);

                    self.driverList.push(newDriver);
                });
                if (self.driverList().length > 0) {
                    self.selectedDriver(_.first(self.driverList()));
                }
            }

            self.hasDriverDOB = ko.computed(function () {
                for (x = 0; x < self.driverList().length; x++) {
                    if (!_.isEmpty(self.driverList()[x].DOB().getDate())) {
                        return true;
                    }
                }
                return false;
            }, this);
        }

        , Driver: function () {
            var _self = this;
            this.firstName = ko.observable('');
            //this.middleName = ko.observable('');
            this.lastName = ko.observable('');
            this.email = ko.observable('');
            this.id = ko.observable();

            this.DOB = ko.observable(new porter.Date({
                startYear: porter.DATETIME_NOW.year(),
                endYear: porter.DATETIME_NOW.year() - 150,
                yearAfterSelect: function () {
                    _self.errors.DOBYearReq(false);
                    _self.resetDOBErrors();
                },
                monthAfterSelect: function () {
                    _self.errors.DOBMonthReq(false);
                    _self.resetDOBErrors();
                },
                dayAfterSelect: function () {
                    _self.errors.DOBDayReq(false);
                    _self.resetDOBErrors();
                }
            }));

            this.fullName = ko.computed(function () {
                return this.firstName() + ' ' + /*(this.middleName() ? this.middleName() + ' ' : '') +*/this.lastName();
            }, this);

            this.errors = {};

            this.errors.DOBYearReq = ko.observable(false);
            this.errors.DOBMonthReq = ko.observable(false);
            this.errors.DOBDayReq = ko.observable(false);
            this.errors.DOBUnderAge = ko.observable(false);

            this.resetDOBErrors = function () {
                _self.errors.DOBUnderAge(false);
            };

            this.validate = function (target) {
                //var DOB = moment([_self.DOB().year(), _self.DOB().month(), _self.DOB().day()]);

                // Check for required
                if (!_self.DOB().year()) {
                    _self.errors.DOBYearReq(true);
                }
                if (!_self.DOB().month()) {
                    _self.errors.DOBMonthReq(true);
                }
                if (!_self.DOB().day()) {
                    _self.errors.DOBDayReq(true);
                }

                // Check if underage
                if (!_.isEmpty(_self.DOB().getDate())) {
                    var age = rentals.compareDate.diff(_self.DOB().getDate(), 'years');
                    if (age < 20) {
                        _self.errors.DOBUnderAge(true);
                    }
                }

                for (var err in _self.errors) {
                    if (_self.errors[err]()) {
                        // Error
                        porter.scrollToError(target);
                        porter.accessInlineErrors();
                        return false;
                    }
                }
                // No errors
                return true;
            };
        }

        , Tax: function () {
            this.price = ko.observable('');
            this.description = ko.observable('');
            this.id = ko.observable(0);
        }

        , Fee: function () {
            this.price = ko.observable('');
            this.description = ko.observable('');
            this.id = ko.observable(0);
        }

        , Special: function () {
            var _self = this;
            this.price = ko.observable(0);
            this.description = ko.observable('');
            this.maxValue = ko.observable(0);
            this.name = ko.observable('');
            this.numSelected = ko.observable(0);

            this.id = ko.observable(0);

            this.optionsText = function (item) {
                var _key = '';
                if (_self.id() == 7) {
                    _key = 'infantCarSeat';
                } else if (_self.id() == 8) {
                    _key = 'toddlerCarSeat';
                } else if (_self.id() == 9) {
                    _key = 'boosterCarSeat';
                }
                return item + ' ' + ((parseInt(item) == 1 || (porter.isFr && parseInt(item) == 0)) ?
                    rentals.localization[_key] : rentals.localization[_key + 's'])
            };

            //
            // Computed
            //
            this.displayPrice = ko.computed(function () {
                return porter.getAmountWithCommasAndDollarSign(this.price());
            }, this);

            this.totalPrice = ko.computed(function () {
                return this.numSelected() * this.price();
            }, this);

            // Update maxValue above to change the number options
            this.options = ko.computed(function () {
                var _arr = [];
                for (var x = 0; x <= this.maxValue(); x++) {
                    _arr.push(x);
                }
                return _arr;
            }, this);
        }

        , RentalConfirmation: function () {
            var self = this;

            this.confirmationNumber = ko.observable();
            this.pickupTime = ko.observable();
            // this.pickupLocation     = ko.observable();
            this.rentalStart = ko.observable();
            this.rentalEnd = ko.observable();
            // this.DriverName         = ko.observable();
            this.vehicleName = ko.observable();
            this.features = ko.observableArray();
            this.selectedSpecials = ko.observableArray();
            this.fees = ko.observableArray();
            this.taxes = ko.observableArray();
            this.rateTotal = ko.observable();
            this.totalCharge = ko.observable();
            this.currency = ko.observable();
            this.driver = {
                firstName: ko.observable()
                , lastName: ko.observable()
            }

            this.pickupLocation = ko.observable();

            this.pickup = {
                location: {
                    addressLines: ko.observable('')
                    , city: ko.observable('')
                    , postalCode: ko.observable('')
                    , stateProv: ko.observable('')
                    , country: ko.observable('')
                }
            };

            this.vehicle = new rentals.Vehicle();

            this.collapseFees = ko.observable(true);
            this.collapseTaxes = ko.observable(true);

            this.toggleFees = function (data, event) {
                event.preventDefault();
                var feeList = $(event.currentTarget).parents('table').find('tr.fees');
                // feeList.slideToggle('slow');
                feeList.toggle();
                self.collapseFees(!self.collapseFees());
            };

            this.toggleTaxes = function (data, event) {
                event.preventDefault();
                var taxList = $(event.currentTarget).parents('table').find('tr.taxes');
                // taxList.slideToggle('slow');
                taxList.toggle();
                self.collapseTaxes(!self.collapseTaxes());
            };

            //
            // Computed
            //

            this.feeTotal = ko.computed(function (data, event) {
                var total = 0;

                ko.utils.arrayForEach(this.fees(), function (fee) {
                    var amount = parseFloat(fee.price());
                    if (!isNaN(amount)) {
                        total += amount;
                    }
                });

                return Number(total).toFixed(2);
            }, this);

            this.taxTotal = ko.computed(function (data, event) {
                var total = 0;

                ko.utils.arrayForEach(this.taxes(), function (tax) {
                    var amount = parseFloat(tax.price());
                    if (!isNaN(amount)) {
                        total += amount;
                    }
                });

                return Number(total).toFixed(2);
            }, this);

            this.driver.fullName = ko.computed(function () {
                return porter.util.capitalizeWords(this.driver.firstName() + " " + this.driver.lastName());
            }, this);

            this.pickup.formattedLocation = ko.computed(function () {
                // var base = this.pickup.location;
                // var a = base.addressLines(); // .join('<br />');
                var a = this.pickupLocation();
                // a = _.map(a, function(x){ return x.trim(); });
                // a = porter.util.capitalize(a.join('<br />'));

                return a;
            }, this);

            this.pickupTimeFormatted = ko.computed(function () {
                return moment(this.rentalStart()).format('h:mm');
            }, this);

            this.pickupTimeAMPM = ko.computed(function () {
                return moment(this.rentalStart()).format('A');
            }, this);

            this.rentalStartFormatted = ko.computed(function () {
                return moment(this.rentalStart()).format('MMM D'); // Jul 31 - Aug 6, 2014 (7 days)
            }, this);

            this.rentalEndFormatted = ko.computed(function () {
                return moment(this.rentalEnd()).format('MMM D'); // Jul 31 - Aug 6, 2014 (7 days)
            }, this);

            this.rentalEndYear = ko.computed(function () {
                return moment(this.rentalEnd()).format('YYYY');
            }, this);

            this.numDays = ko.computed(function () {

                var a = moment(this.rentalStart());
                var b = moment(this.rentalEnd());
                // var d = b.diff(a, 'days');
                var d = Math.ceil(b.diff(a, 'hours') / 24); // Round up to nearest day

                return d; // 1
            }, this)

            this.injectData = function (data, root) {

                // this.confirmationNumber(data.core.confirmationNo.trim());
                this.confirmationNumber(data.confirmationNumber.trim());
                // this.pickupTime(data.pickup.dateTime);

                // this.pickupLocation     = ko.observable();
                // this.rentalStart(data.core.pickup.dateTime);
                this.rentalStart(data.pickup);

                // this.rentalEnd(data.core.dropoff.dateTime);
                this.rentalEnd(data.dropoff);

                this.totalCharge(data.selected.totalCharge);
                this.currency(data.selected.currency);
                this.rateTotal(data.selected.totalRate);

                this.pickupLocation(data.locationFullAddress);
                // this.pickup.location.addressLines(data.core.locationInfo.addressLines);
                // this.pickup.location.city(porter.util.capitalize(data.core.locationInfo.city));
                // this.pickup.location.stateProv(data.core.locationInfo.stateProv);
                // this.pickup.location.postalCode(data.core.locationInfo.postalCode);
                // this.pickup.location.country(data.core.locationInfo.country);

                this.driver.firstName(data.customer.firstName);
                this.driver.lastName(data.customer.lastName);

                this.vehicle.imageID(data.selected.imageUrl);
                this.vehicle.title(data.selected.description);
                // this.vehicle.className(data.details.vehicle.class);
                this.vehicle.className(rentals.localization[data.selected['class']]);
                this.vehicle.features.passengers(data.selected.passengersQty);
                this.vehicle.features.airConditioning(data.selected.airConditioning);
                this.vehicle.features.transmission(data.selected.transmission);
                this.vehicle.features.baggageQty(data.selected.baggageQty);
                this.vehicle.features.baggageLargeQty(data.selected.baggageLargeQty);
                this.vehicle.features.baggageSmallQty(data.selected.baggageSmallQty);

                var self = this;

                $(data.selected.equips).each(function (index, special) {
                    var newSpecial = new rentals.Special();

                    newSpecial.price(special.charge);
                    newSpecial.id(special.description);
                    newSpecial.description(rentals.localization[rentals.ACRISS.special[newSpecial.id()].slug]);
                    // newSpecial.name(rentals.ACRISS.special[newSpecial.id()].enum);
                    newSpecial.name(rentals.ACRISS.special[newSpecial.id()]['enum']);
                    newSpecial.numSelected(special.qty);

                    self.selectedSpecials.push(newSpecial);
                });


                $(data.selected.fees).each(function (index, fee) {
                    var newFee = new rentals.Fee();

                    newFee.price(fee.charge);
                    newFee.id(index);
                    newFee.description(porter.util.capitalize(rentals.localization[fee.description] ? rentals.localization[fee.description] : fee.description));

                    self.fees.push(newFee);
                });

                $(data.selected.taxes).each(function (index, tax) {
                    var newTax = new rentals.Tax();

                    newTax.price(tax.charge);
                    newTax.id(index);
                    newTax.description(porter.util.capitalize(tax.description));

                    self.taxes.push(newTax);
                });
            }
        }

        , Vehicle: function () { // create Vehicle model
            this.recommended = ko.observable(false);
            this.title = ko.observable('');
            this.imageID = ko.observable('');

            this.collapse = ko.observable(true);
            this.show = ko.observable(false);

            this.imageURL = ko.computed(function () {
                var id = this.imageID();

                if (id)
                    return rentals.vehicleImageLocation + id;
                else
                    return id;
            }, this);

            // Drivers
            //this.selectedDriver = ko.observable();
            //this.DOB = ko.observable('');
            //this.firstName = ko.observable('');
            //this.lastName = ko.observable('');

            this.basePrice = ko.observable('');
            this.currency = ko.observable('');
            this.className = ko.observable('');
            this.special = ko.observableArray();
            //this.numSpecialSeats = ko.observable(0);
            this.maxSpecialSeats = ko.observable(4);
            this.rentalRate = ko.observable();

            this.errors = {
                MaxSpecialSeats: ko.observable(false)
            };

            this.features = {
                passengers: ko.observable(0),
                baggageQty: ko.observable(0),
                baggageLargeQty: ko.observable(0),
                baggageSmallQty: ko.observable(0),
                transmission: ko.observable(''),
                airConditioning: ko.observable(''),
                fuelEconomy: ko.observable(''),
                infoURL: ko.observable(''),
                doors: ko.observable(0)
            };

            this.pickup = {
                pickupTime: ko.observable(''),
                rentalStart: ko.observable(),
                rentalEnd: ko.observable(),
                location: {
                    locationFullAddress: ko.observable('')
                    , addressLines: ko.observable('')
                    , city: ko.observable('')
                    , postalCode: ko.observable('')
                    , stateProv: ko.observable('')
                    , country: ko.observable('')
                }
            };

            this.pickup.numDays = ko.computed(function () {

                var a = moment(this.pickup.rentalStart());
                var b = moment(this.pickup.rentalEnd());
                // var d = b.diff(a, 'days');
                var d = Math.ceil(b.diff(a, 'hours') / 24); // Round up to nearest day

                return d; // 1
            }, this)

            this.pickup.formattedLocation = ko.computed(function () {
                // var base = this.pickup.location;
                // var a = base.addressLines(); // .join('<br />');
                // a = _.map(a, function(x){ return x.trim(); });
                var a = this.pickup.location.locationFullAddress();
                // console.log(a);
                // if (a) {
                //     // a = porter.util.capitalize(a.join('<br />'));
                //     a = porter.util.capitalize(a);
                // }
                // console.log(a);

                return a;

            }, this);

            this.features.passengersLabel = ko.computed(function () {
                return this.features.passengers() + ' ' + rentals.localization.passengers;
            }, this);

            this.features.doorsLabel = ko.computed(function () {
                return this.features.doors() + ' ' + rentals.localization.doors;
            }, this);

            this.features.transmissionType = ko.computed(function () {
                if (this.features.transmission() == 1) { //0
                    return 'automatic';
                } else {
                    return 'manual';
                }
            }, this);

            this.features.transmissionLabel = ko.computed(function () {
                if (this.features.transmission() == 1) { //0
                    return rentals.localization.automaticTransmission;
                } else {
                    return rentals.localization.manualTransmission;
                }
            }, this);


            this.features.suitcasesConfirmed = ko.computed(function () {
                var base = this.features;
                var s = base.baggageQty() + ' ' + rentals.localization.suitcases;

                return s;

            }, this);

            this.features.suitcases = ko.computed(function () {
                var base = this.features;
                var s = '';

                if (base.baggageLargeQty() > 0) {
                    s = base.baggageLargeQty() + ' ' + rentals.localization.large;

                    if (base.baggageSmallQty() > 0) {
                        s += ', ' + base.baggageSmallQty() + ' ' + rentals.localization.small;
                    }

                    s += ' ' + rentals.localization.suitcases;
                } else if (base.baggageSmallQty() > 0) {
                    s = base.baggageSmallQty() + ' ' + rentals.localization.small + ' ' + rentals.localization.suitcases;
                }

                return s;

            }, this);

            this.selectedSpecials = ko.computed(function () {
                return _.filter(this.special(), function (s) {
                    return s.numSelected() > 0;
                });
            }, this);

            this.basePriceDisplay = ko.computed(function () {
                return porter.getAmountWithCommasAndDollarSign(this.basePrice()) + ' ' + this.currency();
            }, this);

            this.basePriceDisplayAA = ko.computed(function ()
            {
                return porter.getAmountWithCommasAndDollarSign(this.basePrice()) + " " + porter.util.getCurrencyName(this.currency());
            }, this);

            this.grandTotal = ko.computed(function () {
                var total = this.rentalRate();

                ko.utils.arrayForEach(this.special(), function (special) {
                    var amount = parseFloat(special.totalPrice());
                    if (!isNaN(amount)) {
                        total += amount;
                    }
                });

                return total;
            }, this);

            this.numSpecialSeats = ko.computed(function (data, event) {
                var total = 0;

                ko.utils.arrayForEach(this.special(), function (special) {
                    // console.log(special);

                    if (special.id != '13') { // ignore Nav system for running total
                        var amount = parseFloat(special.numSelected());
                        if (!isNaN(amount)) {
                            total += amount;
                        }
                    }
                });

                return total;
            }, this);

            this.numSpecialSeats.subscribe(function (val) {
                if (val > this.maxSpecialSeats()) {
                    this.errors.MaxSpecialSeats(true);
                } else {
                    this.errors.MaxSpecialSeats(false);
                }
            }, this);

            this.checkSpecialSeats = ko.computed(function (data, event) {
                var result = this.numSpecialSeats() >= this.maxSpecialSeats();
                return result;
            }, this);

            this.setDriver = function (data, event) {
                rentals.validDrivers.selectedDriver(data);
            };

            this.validate = function () {
                porter.resetKOErrors(this);
                var _err = [];

                if (this.numSpecialSeats() > this.maxSpecialSeats()) {
                    _err.push('MaxSpecialSeats');
                }

                return porter.checkKOErrors(this, _err);
            };

            this.injectData = function (data, root) {
                // console.log('injectData');
                //console.log(data);

                var core = rentals.vehicleData.Response; //.core;
                // var location    = core.locationInfo;
                var equipment = data.equips; // data.equipments;

                // this.recommended(data.vehicle.isUpsell);
                // this.title(rentals.localization[data.vehicle.class]);

                this.title(rentals.localization[data['class']]);

                // if ((typeof data.vehicle != 'undefined') && (typeof data.vehicle['class'] != 'undefined')) {
                //     this.title(rentals.localization[data.vehicle['class']]);
                // };

                this.imageID(data.imageUrl);
                this.maxSpecialSeats(rentals.ACRISS.special.maxSeats);
                this.basePrice(data.averageDailyRate);
                this.currency(data.currency);

                // this.rentalRate(data.totalRate);
                this.rentalRate(data.totalCharge); // WEB-5749

                // Features
                this.features.passengers(data.passengersQty);
                this.features.baggageLargeQty(data.baggageLargeQty);
                this.features.baggageSmallQty(data.baggageSmallQty);
                this.features.transmission(data.transmission);
                this.features.airConditioning(data.airConditioning);
                // this.features.fuelEconomy(data.features.fuelEconomy); // Not provided by API
                // this.features.infoURL(data.features.infoURL); // Not provided by API
                this.features.doors(data.doorsQty);

                // Pickup
                this.pickup.pickupTime(moment(core.pickup).format('LT'));
                this.pickup.rentalStart(core.pickup);
                this.pickup.rentalEnd(core.dropoff);

                this.pickup.location.locationFullAddress(core.locationFullAddress);
                this.pickup.location.addressLines(core.locationInfo.addressLines);
                this.pickup.location.city(porter.util.capitalize(core.locationInfo.city));
                this.pickup.location.stateProv(core.locationInfo.stateProv);
                this.pickup.location.postalCode(core.locationInfo.postalCode);
                this.pickup.location.country(core.locationInfo.country);


                // SPECIALS
                // --------
                var newSpecial;
                var infant = _.findWhere(equipment, { "description": "7" }); // ACRISS code
                var toddler = _.findWhere(equipment, { "description": "8" });
                var booster = _.findWhere(equipment, { "description": "9" });
                var nav = _.findWhere(equipment, { "description": "13" });

                // infant
                if (infant) {
                    newSpecial = new rentals.Special();
                    newSpecial.price(infant.charge); // .amount;
                    newSpecial.id(infant.description);
                    newSpecial.description(rentals.localization.infantSeat);
                    newSpecial.maxValue(rentals.ACRISS.special[7].max);
                    newSpecial.name(rentals.ACRISS.special[7]['enum']);

                    this.special.push(newSpecial);
                }

                // toddler
                if (toddler) {
                    newSpecial = new rentals.Special();
                    newSpecial.price(toddler.charge); // .amount;
                    newSpecial.id(toddler.description);
                    newSpecial.description(rentals.localization.toddlerSeat);
                    newSpecial.maxValue(rentals.ACRISS.special[8].max);
                    newSpecial.name(rentals.ACRISS.special[8]['enum']);

                    this.special.push(newSpecial);
                }

                // booster
                if (booster) {
                    newSpecial = new rentals.Special();
                    newSpecial.price(booster.charge); // .amount;
                    newSpecial.id(booster.description);
                    newSpecial.description(rentals.localization.boosterSeat);
                    newSpecial.maxValue(rentals.ACRISS.special[9].max);
                    newSpecial.name(rentals.ACRISS.special[9]['enum']);

                    this.special.push(newSpecial);
                }

                // nav
                if (nav) {
                    newSpecial = new rentals.Special();
                    newSpecial.price(nav.charge); // .amount;
                    newSpecial.id(nav.description);
                    newSpecial.description(rentals.localization.nav);
                    newSpecial.maxValue(rentals.ACRISS.special[13].max);
                    newSpecial.name(rentals.ACRISS.special[13]['enum']);

                    this.special.push(newSpecial);
                }/* else {
                    // testing
                    newSpecial = new rentals.Special();
                    newSpecial.price(50); // .amount;
                    newSpecial.id('13');
                    newSpecial.description(rentals.localization.nav);
                    newSpecial.maxValue(rentals.ACRISS.special[13].max);
                    newSpecial.name(rentals.ACRISS.special[13]['enum']);

                    this.special.push(newSpecial);
                }*/
            };

            this.buildSpecialSubmitData = function () {
                var dataToSend = [];

                for (var x = 0; x < this.special().length; x++) {
                    var _special = this.special()[x];
                    if (_special.numSelected() > 0) {
                        dataToSend.push({
                            code: _special.id(),
                            quantity: _special.numSelected() === true ? 1 : _special.numSelected()
                        });
                    }
                }

                return dataToSend;
            };
        }

        , sortByPrice: function (data) {

            // convert to array
            var dataArray = [];
            var orderedData = [];
            var dataKeys = [];

            $.each(data, function (key, value) {
                // dataArray[_.findWhere(value.rate.calculations, {"unitName": "Day"}).unitCharge] = value;
                dataArray[value.averageDailyRate] = value;
            });

            for (k in dataArray) {
                dataKeys.push(k);
            };

            dataKeys.sort();

            for (var i = 0; i < dataKeys.length; ++i) {
                orderedData.push(dataArray[dataKeys[i]]);
            }

            return orderedData;
        }

    // data is a class Porter.Core.Reservations.ViewModels.BookingViewModel
    , BookedCarRental: function (data) {
        var _self = this;
        this.CarRentalConfirmation = ko.observable('');
        this.CarRentalCurrency = ko.observable('');
        this.CarTotalToCollect = ko.observable('');
        this.HasCar = ko.observable(false);
        this.CarAllowed = ko.observable(false);
        this.collapse = ko.observable(true);



        if (!_.isEmpty(data)) {
            this.CarRentalConfirmation(data.PriceBreakdown.CarRentalConfirmation);
            this.CarRentalCurrency(data.PriceBreakdown.CarRentalCurrency);
            this.CarTotalToCollect(data.PriceBreakdown.CarTotalToCollect);
            this.HasCar(data.PriceBreakdown.HasCar);
            this.CarAllowed(data.ItineraryNavigation.CarAllowed);
        }
    }

    // Main VM
    // data is an object like { Booking: object, HertzAvailability: object }
    // Booking of class Porter.Core.Reservations.ViewModels.BookingViewModel
    // HertzAvailability of class FlyPorter.Core.CarRental.Reservation
    , VehicleVM: function (data) {
        var self = this;
        var hertzAvailability;
        var booking;
        if (arguments.length > 0) {
            if (data.HertzAvailability) {
                hertzAvailability = data.HertzAvailability;
                rentals.vehicleData.Response = hertzAvailability;
            }
            if (data.Booking) {
                booking = data.Booking;
            }
        }
        if (!hertzAvailability) {
            hertzAvailability = porter.itinerary.data.HertzAvailability;
        }
        if (!booking) {
            booking = porter.itinerary.data.Booking;
        }

        // sort by Price
        // dataSource = rentals.sortByPrice(dataSource);

        // Booked car rental info
        self.bookedCarRental = ko.observable();
        // Car rental confirmation modal
        self.rentalConfirmation = ko.observable(new rentals.RentalConfirmation());

        //this.maxSpecialSeats = ko.observable(4);
        self.rentals = ko.observableArray();
        self.showAllOptions = ko.observable(false);
        self.isSubmitDisabled = ko.observable(false);
        self.collapse = ko.observable(false);

        self.collapse.subscribe(function (newValue)
        {
            setTimeout(function ()
            {
                document.accessibility.readText($('#btn-more-info-car-rental').find('span:visible').text());
            }, 300);
        });

        if (data.Booking.PriceBreakdown.HasCar) {
            // Confirmation
            this.bookedCarRental(new rentals.BookedCarRental(data.Booking));
            this.collapse(true);
            rentals.showCarRental(true);
        } else if (data.Booking.ItineraryNavigation.CarAllowed &&
            data.HertzAvailability &&
            data.HertzAvailability.rates &&
            data.HertzAvailability.state != 2) {
            // No car rental booked
            $.each(hertzAvailability.rates, function (key, value) {
                if (typeof value == 'object') {
                    var newVehicle = new rentals.Vehicle();
                    newVehicle.injectData(value, this);
                    self.rentals.push(newVehicle);
                }
            });

            // Show first rental
            if (self.rentals().length > 0) {
                _.first(self.rentals()).show(true);
            }
            rentals.validDrivers = new rentals.ValidDrivers();
            rentals.validDrivers.injectDriverData(hertzAvailability, booking.Passengers, this);
            this.collapse(false);
            rentals.showCarRental(true);
        }

        this.selectedDriver = ko.computed(function () {
            return rentals.validDrivers && rentals.validDrivers.selectedDriver ? rentals.validDrivers.selectedDriver() : null;
            //return this.validDrivers.selectedDriver();
        }, this);

        this.showAllOptions.subscribe(function (val) {
            for (var x = 1; x < self.rentals().length; x++) {
                self.rentals()[x].show(val);
            }
        });
    }
    // data is an object like { Booking: object, HertzAvailability: object }
    // Booking of class Porter.Core.Reservations.ViewModels.BookingViewModel
    // HertzAvailability of class FlyPorter.Core.CarRental.Reservation
    // apply is a boolean for ko.applyBindings
    , activate: function (data, apply) {
        if (arguments.length > 0) {
            if (data.Booking.Journeys.length > 0)
                this.compareDate = moment(_.first(_.first(data.Booking.Journeys).Segments).STD);
            this.importOptions(rentalsOptions);
            this.vehicleVM(new this.VehicleVM(data));
            if (arguments.length < 2) {
                apply = true;
            }
            if (apply) {
                ko.applyBindings(this, $(this.base).get(0));
            }
            this.compositionComplete();
        }
    }
    , compositionComplete: function () {
        var _self = this;
        // Modals
        $(document)
            .on('show.bs.modal', '#email-confirmation-modal', function (event) { //.modal
                $(".modal-backdrop.fade.in:last-child").css("z-index", 1055);
            })
            .on('hidden.bs.modal', '.modal', function (event) {
                $(".modal-backdrop.fade.in:last-child").css("z-index", 1040);
            })
            .on('hide.bs.modal', '#rental-confirmation-modal', function (event) {
                window.location.reload(true); // no-cache, WEB-5750
            });
        // Expand the car rental section when click on car rental anchors in checklist
        $('#mybooking_checkList').find('.car-rental').find('a').on('click', function (e) {
            _self.vehicleVM().collapse(false);
        });
        if (!_self.showCarRental()) {
            $("#rental, #mybooking_checkList .car-rental").addClass('hide');
        }
    }
};

 function trackSuccessfulCarRental(result) {
     ;
     var dataLayer = {
         'carRental': true,
         'carRentalAmount': result.selected.totalCharge,
         'carRentalCategory': result.selected.obj['class'].toLowerCase()
     }
 }(function () {
    var FareRulesDetails = function () {
        this.journey1Dep = ko.observable();
        this.journey1Arr = ko.observable();
        this.journey2Dep = ko.observable();
        this.journey2Arr = ko.observable();
        this.stations = ko.observable();

        this.journey1DepName = ko.computed(function () {
            if (this.stations()) {
                return this.getStationName(this.journey1Dep(), this.stations());
            }
        }, this);

        this.journey1ArrName = ko.computed(function () {
            if (this.stations()) {
                return this.getStationName(this.journey1Arr(), this.stations());
            }
        }, this);

        this.journey2DepName = ko.computed(function () {
            if (this.stations()) {
                return this.getStationName(this.journey2Dep(), this.stations());
            }
        }, this);

        this.journey2ArrName = ko.computed(function () {
            if (this.stations()) {
                return this.getStationName(this.journey2Arr(), this.stations());
            }
        }, this);
    };

    $.extend(FareRulesDetails.prototype, {
        updateFareRuleText: function (fare) {
            var _self = this;
            $.getJSON(porter.getUrlWithCulture("common/getfareruletext"),
                fare,
                function (result) {
                    var el = $("#" + result[1]);
                    el.html(result[0]);

                    // Hide extra fare class text
                    el.find('.bold').hide();

                    // Remove extra line break
                    var br = el.find('.bold').next();
                    if (br.is('br') && br.next().is('br')) {
                        br.hide();
                    }
                }
            );
        },
        injectData: function (booking, stations) {
            if (stations) {
                this.stations(stations);
            }
            if (booking && stations) {
                if (booking.Journeys) {
                    var _journey1 = _.first(booking.Journeys);
                    if (_journey1 && _journey1.Segments) {
                        var _depStn = _.first(_journey1.Segments).DepartureStation;
                        var _arrStn = _.last(_journey1.Segments).ArrivalStation;
                        this.journey1Dep(_depStn, stations);
                        this.journey1Arr(_arrStn, stations);
                    }
                    if (booking.Journeys.length > 1) {
                        var _journey2 = _.last(booking.Journeys);
                        var _depStn = _.first(_journey2.Segments).DepartureStation;
                        var _arrStn = _.last(_journey2.Segments).ArrivalStation;
                        this.journey2Dep(_depStn, stations);
                        this.journey2Arr(_arrStn, stations);
                    }
                }
            }
        },
        injectDataShared: function (booking, stations)
        {
            if (stations)
            {
                this.stations(stations);
            }
            if (booking && stations)
            {
                if (booking.Journeys)
                {
                    var _journey1 = _.first(booking.Journeys);
                    if (_journey1 && _journey1.Segments)
                    {
                        var _depStn = _.first(_journey1.Segments).DepartureStation;
                        var _arrStn = _.last(_journey1.Segments).ArrivalStation;
                        this.journey1Dep(_depStn, stations);
                        this.journey1Arr(_arrStn, stations);
                    }
                    if (booking.Journeys.length > 1)
                    {
                        var _journey2 = _.last(booking.Journeys);
                        var _depStn = _.first(_journey2.Segments).DepartureStation;
                        var _arrStn = _.last(_journey2.Segments).ArrivalStation;
                        this.journey2Dep(_depStn, stations);
                        this.journey2Arr(_arrStn, stations);
                    }
                }
            }
        },
        injectDataBookingSearchViewModel: function (bookingSearchViewModel, stations)
        {
            if (stations)
            {
                this.stations(stations);
            }
            if (bookingSearchViewModel && stations)
            {
                if (bookingSearchViewModel.Journeys)
                {
                    var _journey1 = _.first(bookingSearchViewModel.Journeys);
                    if (_journey1 )
                    {
                        var _depStn = _journey1.DepartureStation;
                        var _arrStn = _journey1.ArrivalStation;
                        this.journey1Dep(_depStn, stations);
                        this.journey1Arr(_arrStn, stations);
                    }
                    if (bookingSearchViewModel.Journeys.length > 1)
                    {
                        var _journey2 = _.last(bookingSearchViewModel.Journeys);
                        var _depStn = _journey2.DepartureStation;
                        var _arrStn = _journey2.ArrivalStation;
                        this.journey2Dep(_depStn, stations);
                        this.journey2Arr(_arrStn, stations);
                    }
                }
            }
        },
        getStationName: function(stationCode, stations) {
            return !_.isEmpty(stations.Names[stationCode]) ? stations.Names[stationCode] : stationCode;
        }
    });

    porter.FareRulesDetails = FareRulesDetails;
}());
// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
	var _ = require('underscore');
	var Origin = require('core/origin');
	var SweetAlert = require('sweetalert2');

	function getSettings(data) {
		var defaults = {
			title: '',
			html: data.html || data.text
		};

		switch(data.type) {
			case 'confirm':
				data.type = null;
				defaults.title = Origin.l10n.t('app.confirmdefaulttitle');
				data.icon = 'info';
				break;
			case 'warning':
				data.type = null;
				defaults.title = Origin.l10n.t('app.warningdefaulttitle');
				data.icon = 'warning';
				break;
			case 'input':
				data.type = null;
				data.input = data.inputType;
				break;
			case 'success':
				data.type = null;
				defaults.title = Origin.l10n.t('app.successdefaulttitle');
				data.icon = 'success';
        break;
			case 'info':
				data.type = null;
				defaults.title = Origin.l10n.t('app.infodefaulttitle');
				data.icon = 'info';
        break;
			case 'error':
				data.type = null;
				defaults.title = Origin.l10n.t('app.errordefaulttitle');
				data.icon = 'error';
				break;
			default:
				if (data.type) {
					Origin.Notify.console({
						type: 'error',
						text: '"' + data.type + '" is not a valid alert type'
					});
				}
				data.type = null;
		}
		delete data.type;
		delete data.closeOnConfirm;
		delete data.closeOnCancel;
		delete data.animation;
		delete data.inputType;
		delete data.text;
		// combine settings, overwriting defaults with param
		return _.defaults(data, defaults);
	};

	function openPopup(data) {
		if(data.callback) var cb = data.callback;
		delete data.callback;
		SweetAlert.fire(getSettings(data)).then((result) => {
			  if(cb) cb.apply(null, [result.value || false]);
		  })
		//SweetAlert(getSettings(data), data.callback);
	}

	var Alert = function(data) {
		// allow for string input
		if(_.isString(data)) {
			data = {
				title: data
			};
		}
		var defaults = {
			inputType: 'text'
		};

		openPopup(_.extend(defaults, data));
	};

	/**
	* NOTE if callback isn't an annonymous function, it won't be called on cancel
	* See: https://github.com/t4t5/sweetalert/issues/431
	*/
	var DISABLE_TIME_SECS = 5;
	var interval;

	var Confirm = function(data) {
		// allow for string input
		var defaults = {
			showCancelButton: true,
			confirmButtonText: Origin.l10n.t('app.confirmdefaultyes'),
			cancelButtonText: Origin.l10n.t('app.no'),
			inputType: 'text'
		};

		openPopup(_.extend(defaults, data));

		$('.sweet-alert > .sa-button-container button').blur();

		clearInterval(interval);

		// forces the user to wait before the confirm button can be clicked
		if(data.destructive === true) {
			var setWaitText = function(n) {
				$('.swal2-popup button.swal2-confirm').html(`<span class="wait-text">${Origin.l10n.t('app.confirmwait')} (${n})</span>`);
			};

			var count = DISABLE_TIME_SECS;
			var oldLabel = $('.swal2-popup button.swal2-confirm').text();

			$('.sweet-alert').addClass('destructive');
			$('.swal2-popup button.swal2-confirm').attr('disabled', true);

			setWaitText(count);

			interval = setInterval(function() {
				if(--count > 0) {
					$('.swal2-popup button.swal2-confirm').html(`<span class="wait-text">${Origin.l10n.t('app.confirmwait')} (${count})</span>`);
				} else {
					clearInterval(interval);
					$('.swal2-popup button.swal2-confirm').text(oldLabel);
					$('.swal2-popup button.swal2-confirm').attr('disabled', false);
					$('.sweet-alert').removeClass('destructive');
				}
			}, 1000);
		}
	};

	var Auto = function(data) {
		// allow for string input
		if (_.isString(data)) {
      data = {
        text: data
			};
		}

		// some defaults, in the case of an additional type being passed
		var defaults = {
			type: data.type || 'confirm',
			showCancelButton: true,
			confirmButtonText: Origin.l10n.t('app.confirmdefaultyes'),
			cancelButtonText: Origin.l10n.t('app.no')
		};

		openPopup(_.extend(defaults, data));

		clearInterval(interval);

		// forces the confirm button after timer has elapsed
		if(data.autoConfirm === true) {
			var setWaitText = function(n) {
				$('.swal2-popup button.swal2-confirm')[0].innerText = `${data.confirmButtonText} (${n})`;
			};

			var count = (data.autoTimer / 1000);

			setWaitText(count);

			interval = setInterval(function() {
				if(--count > 0) {
					setWaitText(count);
				} else {
					clearInterval(interval);
					setWaitText(count);
					data.callback.apply(null, [true]);
				}
			}, 1000);

			$('.swal2-popup button.swal2-cancel').on('click', function(){
				clearInterval(interval);
			})
		}
	};

	var init = function() {
		Origin.Notify.register('alert', Alert);
		Origin.Notify.register('confirm', Confirm);
		Origin.Notify.register('auto', Auto);
		// shortcuts to override window methods
		window.alert = alert = Alert;
		window.confirm = confirm = Confirm;
	};

	return init;
});

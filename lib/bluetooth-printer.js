
(function() {
	'use strict';

	class BluetoothPrinter {
		constructor() {
			this._EVENTS = {};
            this._CHARACTERISTIC = null;

			this._QUEUE = [];
			this._WORKING = false;
		}
		
		connect() {
            console.log('Requesting Bluetooth Device...');
            
            return new Promise((resolve, reject) => {
            
	            navigator.bluetooth.requestDevice({
		            filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }]
				})
		            .then(device => {
		                console.log('Connecting to GATT Server...');

		                device.addEventListener('gattserverdisconnected', this._disconnect.bind(this));
		                return device.gatt.connect();
		            })
                    .then(server => server.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb"))
                    .then(service => service.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb"))
                    .then(characteristic => {
                        this._CHARACTERISTIC = characteristic;
                        resolve();
		            })
		            .catch(error => {
		                console.log('Could not connect! ' + error);
						reject();
		            });			
			});
			
        }
        
        print(command) {
            const maxLength = 100;
            let chunks = Math.ceil(command.length / maxLength);

            if (chunks === 1) {
                this._queue(command);
            } else {
                for (let i = 0; i < chunks; i++) {
                    let byteOffset = i * maxLength;
                    let length = Math.min(command.length, byteOffset + maxLength);
                    this._queue(command.slice(byteOffset, length));
                }
            }
        }

		_queue(f) {
			var that = this;
			
			function run() {
				if (!that._QUEUE.length) {
					that._WORKING = false; 
					return;
				}
				
				that._WORKING = true;
                that._CHARACTERISTIC.writeValue(that._QUEUE.shift()).then(() => run() );
			}
			
			that._QUEUE.push(f);
			
			if (!that._WORKING) run();	
		}
		
		addEventListener(e, f) {
			this._EVENTS[e] = f;
		}

		isConnected() {
			return !! this._CHARACTERISTIC;
		}
			
		_disconnect() {
            console.log('Disconnected from GATT Server...');

			this._CHARACTERISTIC = null;
			
			if (this._EVENTS['disconnected']) {
				this._EVENTS['disconnected']();
			}
		}
	}

	window.BluetoothPrinter = new BluetoothPrinter();
})();


# BluetoothRocks! TweetPrinter
Create a physical stream of tweets using a WebBluetooth receipt printer


## What do you need?

A browser that support WebBluetooth and a receipt printer that supports Bluetooth LE, like:

- [ZJ-5805](https://nl.aliexpress.com/item/New-Arrival-ZJ-5805-58mm-Bluetooth-4-0-Android-4-0-POS-Receipt-Thermal-Printer-Bill/32793315554.html)
- [AGPtek SC28-AGP](https://www.amazon.com/Version-AGPtek®-Portable-Bluetooth-Wireless/dp/B00XL3DY2E)



## How does this work?

The browser can connect to a Bluetooth LE device like the receipt printer using the WebBluetooth API. Each Bluetooth device has a number of services and characteristics. Think of them like objects with properties. Once connected to the device, the API then exposes these services and characteristics and you can read from and write to those characteristics.

Receipt printers usually support a printer language like ESC/POS which is mostly plain text with a number of additional commands for things like changing text size, printing images and barcodes. And due to the technology used by receipt printers, they can only print pure black and white images – not even grayscale. So any images we need to print need to be dithered to make sure they look natural. 

The code I wrote for ESC/POS encoding and image dithering can be found on NPM:
- [canvas-flatten](https://www.npmjs.com/package/canvas-flatten)
- [canvas-dither](https://www.npmjs.com/package/canvas-dither)
- [esc-pos-encoder](https://www.npmjs.com/package/esc-pos-encoder)


## And where do the tweets come from?

This repository includes a small WebSocket server that opens a connection to the Twitter servers using an API key and sends the tweets to the browser without any further processing. The server is little more than some boilerplate code that pipes data from the `twitter-stream-api` npm package to the `ws` npm package.


## Why??

What do you mean? Because it's fun, of course!
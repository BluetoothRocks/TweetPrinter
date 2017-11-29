let emulateState = false;


/* Create a dithered version of the Twitter logo */

let logo = new Image();
logo.src = 'assets/twitter.png';
logo.onload = function() {
	let canvas = document.getElementById('logo');
	let ctx = canvas.getContext('2d');
	
	ctx.drawImage(logo, 0, 0, 300, 300);
    let imagedata = ctx.getImageData(0, 0, 300, 300);
    imagedata = CanvasDither.atkinson(imagedata, 128);
    ctx.putImageData(imagedata, 0, 0);
}


/* Start streaming tweets from the server */

function startTweets() {
	const socket = new WebSocket('wss://bluetooth.rocks/tweet-printer/server/');
	
	socket.addEventListener('message', function (event) {
	    let data = JSON.parse(event.data);
        processTweet(data);
	});
}


/* Process individual tweets and download images if needed */

function processTweet(data) {
    if (data.entities.media && data.entities.media.length) {
        let images = data.entities.media.filter((item) => item.type == 'photo');

        if (images.length) {
            let image = images[0];
            
            let url = 'https://cors-anywhere.herokuapp.com/' + image.media_url;
            // let url = 'https://crossorigin.me/' + image.media_url;

            let width = image.sizes.large.w;
            let height = image.sizes.large.h;

            fetch(url)
            .then((response) => response.blob())
            .then((blob) => {
                let objectUrl = URL.createObjectURL(blob);
                                
                let i = new Image();
                i.width = width;
                i.height = height;
                i.onload = function() {
                    w = 360;
                    h = Math.floor(((360 / width) * height) / 8) * 8;
    
                    let c = document.createElement('canvas');
                    c.width = w;
                    c.height = h;
                    
                    let ctx = c.getContext('2d');
                    ctx.drawImage(i, 0, 0, w, h);
    
                    let imagedata = ctx.getImageData(0, 0, w, h);
                    imagedata = CanvasFlatten.flatten(imagedata, [ 0xff, 0xff, 0xff ]);
                    imagedata = CanvasDither.atkinson(imagedata, 128);
                    ctx.putImageData(imagedata, 0, 0);
                
                    printTweet(data, c, w, h);
                }
    
                i.src = objectUrl;
            });

            return;
        }
    }

    printTweet(data);
}


/* Encode the tweet to send to the printer */

function printTweet(data, image, width, height) {
    let encoder = new EscPosEncoder();
    
    let text = data.text;

    if (data.display_text_range) {
        text = text.substring(data.display_text_range[0], data.display_text_range[1]);
    }

    encoder
        .initialize()
        .codepage('cp437')
        .bold()
        .text(data.user.name)
        .bold()
        .text(' (@' + data.user.screen_name + ')')
        .newline()
        .size('small')
        .text(text, 40)
        .newline()
        .size('normal');
        
    if (image) {
        encoder
            .newline()
            .image(image, width, height)
            .newline();
    }

    if (data.entities.urls && data.entities.urls.length) {
        encoder
            .newline()
            .qrcode(data.entities.urls[0].url);
    }
        
    encoder
        .newline()
        .line('----------------------------------------')
        .newline();
    
    
    let command = encoder.encode();

    console.hex(command);

    if (!emulateState) {
	    BluetoothPrinter.print(command);
	}

	showTweet(data, image, width, height);
}


/* Show the tweet on the screen */

function showTweet(data, image, width, height) {
    let encoder = (new EscPosEncoder()).codepage('windows1251');
	let decoder = new TextDecoder('windows-1251');    


    let text = data.text;

    if (data.display_text_range) {
        text = text.substring(data.display_text_range[0], data.display_text_range[1]);
    }

    text = decoder.decode(encoder._encode(text));
    
    let name = decoder.decode(encoder._encode(data.user.name));
       
	let tweet = document.createElement('div');
	tweet.classList.add('tweet');
	
	tweet.innerHTML = `
		<h3>${name} <span>(@${data.user.screen_name})</span></h3>
		<p>${text}</p>
	`;
	
    if (image) {
	    tweet.appendChild(image);
	}
	
    if (data.entities.urls && data.entities.urls.length) {
	    let box = document.createElement('div');
	    box.classList.add('qrcode');
	    tweet.appendChild(box);
	    
	    let qr = new Image();
	    qr.src = 'https://chart.googleapis.com/chart?chs=150x150&cht=qr&choe=UTF-8&margin=0&chl=' + encodeURIComponent(data.entities.urls[0].url);
	    box.appendChild(qr);
	}
		
	let parent = document.getElementById('tweets');
	parent.appendChild(tweet);
	
	tweet.scrollIntoView({ behavior: 'smooth', block: 'end' });
}


/* Connect to device */

document.getElementById('connect')
	.addEventListener('click', () => {
		BluetoothPrinter.connect()
			.then(() => {
				document.body.classList.add('connected');
				
				startTweets();
				
				BluetoothPrinter.addEventListener('disconnected', () => {
					document.body.classList.remove('connected');
                });
			});
	});

document.getElementById('emulate')
	.addEventListener('click', () => {
	    emulateState = true;
		document.body.classList.add('connected');
		
		startTweets();
	});


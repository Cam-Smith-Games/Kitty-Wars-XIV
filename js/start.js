//images
bgIMG = new Image();
bgIMG.src = "img/bg.jpg";
overlay = new Image();
overlay.src = "img/startoverlay.png";
//audio
thrustsequence = new Audio("audio/thrustsequence.mp3");
evolutius = new Audio("audio/evolutius.ogg");
evolutius.volume = 0.2;
evolutius.play();

//timer for advancing phase
var timer = 0;
//timer for making 'press enter to continue' flash
var textTimer = 0;

//background class (2 backgrounds at all times, moving left)
var backgroundList = [];
function Background(x, y) {
	this.img = bgIMG;
	this.x = x;
	this.y = y;
	this.width = 1920;
	this.height = 1080;
	//to tell if theres a bg to the right of this one
	this.rightNeighbor = false;
}

//text object, moving up after phase == 2
var text = {
	string: 
		['ONE CAT.',
		'WELL, HALF MAN HALF CAT...',
		'ONE SPACE SHIP.',
		'ACTUALLY...', 
		'NO SPACE SHIP.',
		'BUZZ CATYEAR CRASHED...',
		'AND HES LEFT TO DEFEND HIMSELF',
		'AGAINST THE ENTIRE GALAXY.',
		'ALSO, THERES A BLACK HOLE IN THE DISTANCE',
		'EVERY SECOND FOR HIM IS 500 YEARS ON HIS HOME PLANET, CATURN.',
		'EVERYONE BUZZ CATYEAR EVER KNEW IS DEAD.',
		'WILL HE MAKE IT IN TIME?',
		'ABSOLUTELY NOT.',
		'ONE LASER GUN,',
		'ZERO HOPE.',
		'WILL HE SURVIVE?',
		'NOPE.',
		'THAT RHYMED...',
		'INTENTIONALLY.',
		'GET THE HIGH SCORE.',
		'BUZZ CATYEARS FATE IS IN YOUR HANDS.',
		'GIVE BUZZ CATYEARS LIFE MEANING...'],
	x: 960,
	y: 840
}

//phase 1 is before enter pressed, show overlay
//phase 2 is after enter pressed, show into story
var phase = 1;

function init() {
	//scene perameters: pixelWidth, pixelHeight, %width, %height, left, top
    scene = new Scene(1920, 1080, 100, 100, 0, 0);
    scene.context.fillStyle = 'red';
    scene.context.font = '30px prstart';
    scene.context.textAlign = 'center';
    scene.start();
    //create initial background
    var background1 = new Background(0, 0);
    backgroundList.push(background1);
}



function update() {
	//--------------------------------------
	//making 'press enter to continue' flash
	//--------------------------------------
	textTimer++;
	if(textTimer == 20)
		textTimer = 0;

	//--------------------------------------
	// press enter, advance to phase 2
	//--------------------------------------
	if(phase == 1 && keysDown[K_ENTER]) {
		phase = 2;
		evolutius.pause();
		thrustsequence.play();
		//create canvas for drawing text
		scene2 = new Scene(1920, 800, 100, 80, 0, 0);
		scene2.context.fillStyle = 'red';
    	scene2.context.font = '30px prstart';
    	scene2.context.textAlign = 'center';
    	scene2.setBG('transparent');
    	
	}
	if(phase == 2) {
		//timer for pressing enter again (for starting game)
		timer++;
		//moving text
		text.y-=2;
	}

	//--------------------------------------
	// press enter again, start game
	//--------------------------------------
	if (phase == 2 && keysDown[K_ENTER] && timer >= 100) {
		//start game
		window.location.href = 'SimpleGame.html';
	}

	//--------------------------------------
	//moving and creating backgrounds
	//--------------------------------------
	for(var i=0; i<backgroundList.length; i++) {
		var bg = backgroundList[i];
		bg.x-=1;
		//if backgrounds left side going off screen and it doesnt have a right neighbor
		if(bg.x < 0 && !bg.rightNeighbor) {
			//create a right neighbor for it
			var backgroundNeighbor = new Background(bg.x+bg.width, bg.y);
			backgroundList.push(backgroundNeighbor);
			bg.rightNeighbor = true;
		}
		//when background has left screen, remove it
		if(bg.x + bg.width < 0) {
			backgroundList.splice(i, 1);
		}
	}
	
	render();
}

function render() {
	//--------------------------------------
	// drawing backgrounds
	//--------------------------------------
	for(i=0; i<backgroundList.length; i++) {
		var bg = backgroundList[i];
		scene.context.drawImage(bg.img, bg.x, bg.y, bg.width, bg.height);
	}
	//--------------------------------------
	// phase 1 drawing
	//--------------------------------------
	if(phase == 1)
		scene.context.drawImage(overlay, 0, 0, scene.width, scene.height);
	
	//--------------------------------------
	// phase 2 drawing
	//--------------------------------------
	if(phase == 2) {
		scene2.context.clearRect(0, 0, scene2.width, scene2.height);
		for(var i=0; i<text.string.length; i++) {
			scene2.context.fillText(text.string[i], text.x, text.y+100*i);
		}
	}
	//make 'press enter to continue' flash at bottom of screen
	if(textTimer <= 10 && (phase == 1 || (phase == 2 && timer >= 100))) 
			scene.context.fillText('press enter to continue', scene.width/2, scene.height - 30);
}
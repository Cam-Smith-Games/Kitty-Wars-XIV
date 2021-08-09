var scene;
var playerSprite;
var gameover = false;
var soundEnabled = true;
var colorArray = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"];
//variables for stopping and starting jetpackSound
var jetpackPlaying = false;
var jetpackPaused = true;
// father asteroid - rather than generating animation each time
// asteroid is created, just copy father asteroids animation
var FatherAsteroid;
var FatherSmallAsteroid;

//lists to store things
var asteroidList = [];
var laserList = [];
var explosionList = [];
var powerupList = [];
var textList = [];

// ---------- LOADING IMAGES ---------- //
var backgroundImage = new Image();
backgroundImage.src = "img/bg.png";
var shieldImage = new Image();
shieldImage.src = "img/shield.png";
var catIcon = new Image();
catIcon.src = "img/cat.png";

// ---------- LOADING AUDIO ---------- //
var laserSound = new Sound("audio/laser.wav");
var explosionSound = new Sound("audio/explosion.wav");
var bgmusic = new Sound("audio/evolutius.ogg");
var jetpackSound = new Sound("audio/jetpack.ogg");
if(soundEnabled)
    bgmusic.play(0.1);

// ---------- MUTE/UNMUTE BUTTONS ---------- //
var muteButton = document.getElementById("mute");
var unmuteButton = document.getElementById("unmute");

function mute() {
    soundEnabled = false;
    muteButton.style.visibility = 'hidden';
    unmuteButton.style.visibility = 'visible';
    bgmusic.pause();
}
function unmute() {
    soundEnabled = true;
    muteButton.style.visibility = 'visible';
    unmuteButton.style.visibility = 'hidden';
    bgmusic.play(0.1);
}
// ----------------------------------------- //

//player object stores stats for player
var player = {
    maxHP: 1000,
    hp: 1000,
    lives: 3,
    shielded: false,
    shieldTimer: 0,
    shieldShootTimer: 0,
    shieldHP: 500,
    shootTimer: 0,
    shotsfired: 0,
    score: 0,
    previousLevel: 0,
    currentLevel: 0,
    facing: "right",
    weapon: "thruster gun",
    powerupTimer: 0,
    rapidfire: false,
    dead: false
}

//-------------------------------------
// Text: used to write stuff to canvas
//-------------------------------------
function Text(string, x, y, time, textAlign, font) {
    this.string = string;
    this.x = x;
    this.y = y;
    this.timer = 0;
    this.maxTime = time;
    this.textAlign = textAlign;
    this.font = font;
}

//-------------------------
// init: starts game
//-------------------------
function init() {
    //scene perameters: pixelWidth, pixelHeight, %width, %height, left, top
    scene = new Scene(1920, 1080, 100, 100, 0, 0);
    scene.start();
    //added type perameter to sprite (for seperating their checkbounds functions)
    playerSprite = new Sprite(scene, "img/spacecatright.png", 56, 80, "player");
    playerSprite.x = scene.width/2;
    playerSprite.y = scene.height/2;
    playerSprite.setAngle(0);
    playerSprite.setSpeed(0);

    // creating father asteroids, instead of generating animations
    // each time asteroid is created, they will just copy these animations
    FatherAsteroid = new Sprite(scene, "img/asteroids/bigasteroidsheet.png", 128, 128, "asteroid");
    FatherAsteroid.loadAnimation(7680, 128, 128, 128);
    FatherAsteroid.generateAnimationCycles();

    FatherSmallAsteroid = new Sprite(scene, "img/asteroids/asteroidsheet.png", 64, 64, "asteroid");
    FatherSmallAsteroid.loadAnimation(3840, 64, 64, 64);
    FatherSmallAsteroid.generateAnimationCycles();

    //create level
    createLevel();
} // end init

//--------------------------------------
// update: updates and draws everything
//--------------------------------------    
function update(){
    //clear scene before redrawing
    scene.clear();
    //draw background
    scene.context.drawImage(backgroundImage, 0, 0, scene.canvas.width, scene.canvas.height);

    //updating if player is alive
    if(!player.dead) {
        //check for key presses
        keyPresser();
        //randomly have chance to spawn powerups
        powerupSpawner();
        //function to write text
        textWriter();
        //update hud
        hudUpdater();
        
        //--------------------------------
        // update all asteroids
        //--------------------------------
        for(i=0; i<asteroidList.length; i++) {
            asteroidList[i].update();
            //-----------------------------------
            //when player collides with asteroid
            //-----------------------------------
            if(asteroidList[i].collidesWith(playerSprite)) {
                //if normal asteroid, split it into smaller asteroids
                if(asteroidList[i].type == 'asteroid') {
                    splitAsteroid(asteroidList[i], i);
                    playerDamager(100);
                    break; 
                }
                //if small asteroid, remove it and create explosion
                if(asteroidList[i].type == 'small asteroid') {
                    playerDamager(10);
                    var x = asteroidList[i].x;
                    var y = asteroidList[i].y;
                    //remove small asteroid
                    asteroidList.splice(i, 1);
                    //create explosion at asteroid with random color
                    var color = colorArray[Math.floor(Math.random()*colorArray.length)]
                    var explosion = new Sprite(scene, "img/explosions/"+color+".png", 222, 222, "explosion");
                    explosion.x = x;
                    explosion.y = y;
                    explosion.setSpeed(0);
                    explosion.loadAnimation(5328, 222, 222, 222);
                    explosion.generateAnimationCycles();
                    explosion.setAnimationSpeed(500);
                    explosionList.push(explosion);
                    //play explosion sound
                    if(soundEnabled)
                        explosionSound.play(0.2);
                    break;
                }
            }
            //----------------------------------
            //when laser collides with asteroid
            //----------------------------------
            for(j=0; j<laserList.length; j++) {
                if(asteroidList[i].collidesWith(laserList[j])) {
                    //normal asteroid
                    if(asteroidList[i].type == 'asteroid') {
                        //add to players score and create text
                        player.score += 100;
                        var x = asteroidList[i].x - asteroidList[i].width/2;
                        var text = new Text('+100', x, asteroidList[i].y, 10, 'center', '30px prstart');
                        textList.push(text);
                        //remove laser if not a flower laser or scatter laser
                        if(!laserList[j].flowerLaser && !laserList[j].scatterLaser)
                            laserList.splice(j, 1);
                        //split asteroid into smaller asteroids
                        splitAsteroid(asteroidList[i], i);
                        break;
                    }
                    //small asteroid
                    if(asteroidList[i].type == 'small asteroid') {
                        //add to players score and create text
                        player.score += 25;
                        var x = asteroidList[i].x - asteroidList[i].width/2;
                        var text = new Text('+25', x, asteroidList[i].y, 10, 'center', '30px prstart');
                        textList.push(text);
                        //remove laser if not flower laser or scatter laser
                        if(!laserList[j].flowerLaser && !laserList[j].scatterLaser)
                            laserList.splice(j, 1);
                        var x = asteroidList[i].x;
                        var y = asteroidList[i].y;
                        //remove small asteroid
                        asteroidList.splice(i, 1);
                        //create explosion at asteroid with random color
                        var color = colorArray[Math.floor(Math.random()*colorArray.length)]
                        var explosion = new Sprite(scene, "img/explosions/"+color+".png", 222, 222, "explosion");
                        explosion.x = x;
                        explosion.y = y;
                        explosion.setSpeed(0);
                        explosion.loadAnimation(5328, 222, 222, 222);
                        explosion.generateAnimationCycles();
                        explosion.setAnimationSpeed(500);
                        explosionList.push(explosion);
                        //play explosion sound
                        if(soundEnabled)
                            explosionSound.play(0.2);
                        break;
                    }
                }
            }
        } // end asteroid updating
        
        //--------------------------------
        // update all lasers
        //--------------------------------
        for(i=0; i<laserList.length; i++) {
            laserList[i].update();
            //---------------------------------
            // flower laser: spin around player
            //---------------------------------
            if(laserList[i].flowerLaser == true) {
                laserList[i].changeAngleBy(-15);
                var timer = laserList[i].timer.getTotalTime();
                if(timer >= 1050) {
                    laserList.splice(i, 1);
                }
            }
            //----------------------------------------------
            // scatter laser: spin image, remove at 50 ticks
            //----------------------------------------------
            else if(laserList[i].scatterLaser == true) {
                laserList[i].timer++;
                laserList[i].changeImgAngleBy(40);
                if(laserList[i].timer >= 50)
                    laserList.splice(i,1);
            }
            //------------------------------------------------------------
            // laser leaves boundary: remove it (not flower/scatter laser)
            //------------------------------------------------------------
            else if(!(laserList[i].flowerLaser || laserList[i].scatterLaser)) {
                if(laserList[i].outOfBounds)
                    laserList.splice(i, 1);
            }     
        } // end laser updating

        //--------------------------------
        // update all explosions
        //--------------------------------
        for(i=0; i<explosionList.length; i++) {
            var explosion = explosionList[i];
            if(explosion.animation.totalCycleTime < 400)
                explosion.update();
            else
                explosionList.splice(i, 1);
        } // end explosion updating

        //--------------------------------
        // update all powerups
        //--------------------------------
        for(i=0; i<powerupList.length; i++) {
            powerupList[i].update();
            //--------------------------------
            // POWERUP COLLISIONS
            //--------------------------------
            if(powerupList[i].collidesWith(playerSprite)){
                var type = powerupList[i].powerupType;
                //-----------------------------
                // health: increase players hp
                //-----------------------------
                if(type == "health" && player.hp <= player.maxHP) {
                    //dont want to overheal player
                    if(player.hp <= player.maxHP - 250)
                        player.hp += 250;
                    else {
                        var healthMissing = player.maxHP - player.hp;
                        player.hp += healthMissing;
                    }
                    powerupList.splice(i,1);
                    //break;
                }
                //----------------------------------------------
                // gatling/scatter gun: set players weapon type
                //----------------------------------------------
                if(type == "gatling gun" || type == "scatter gun") {
                    player.weapon = type;
                    player.powerupTimer = 100;
                    powerupList.splice(i,1);
                    //break;
                }
                //--------------------------------------------
                // rapid fire: set player's rapidfire to true 
                //--------------------------------------------
                if(type == "rapid fire") {
                    player.rapidfire = true;
                    player.powerupTimer = 100;
                    powerupList.splice(i, 1);
                    //break;
                }
                //--------------------------------
                // shield: give player shield
                //--------------------------------
                if(type == "shield") {
                    player.shielded = true;
                    player.shieldShootTimer = 0;
                    player.shieldTimer = 100;
                    powerupList.splice(i, 1);
                    //break;
                }
            } // end powerup collisions
            //--------------------------------
            // make powerups grow/shrink
            //--------------------------------
            if(powerupList[i].growing && powerupList[i].width < 80) {
                powerupList[i].width++;
                powerupList[i].height++;
            }
            else if (powerupList[i].width >= 80) {
                powerupList[i].growing = false;
                powerupList[i].shrinking = true;
            }
            if(powerupList[i].shrinking && powerupList[i].width > 60) {
                powerupList[i].width--;
                powerupList[i].height--;
            }
            else if (powerupList[i].width <= 60) {
                powerupList[i].shrinking = false;
                powerupList[i].growing = true;
            }
        } // end power up updating

        //--------------------------------
        // update player
        //--------------------------------
        //setting appropriate image
        if(player.facing == "left")
            playerSprite.image.src = "img/spacecatleft.png";
        if(player.facing == "right")
            playerSprite.image.src = "img/spacecatright.png";
        //if holding up, set to jetpack image
        if(keysDown[K_UP] && player.weapon != 'gatling gun') {
            playerSprite.image.src = "img/spacecatjetpack.png";
            playerSprite.width = 88;
        }
        else 
            playerSprite.width = 56;

        playerSprite.update();
        //if player has shield, draw shield surrounding him
        if(player.shielded) {
            var radius = playerSprite.width/2 + player.shieldHP/5;
            scene.context.drawImage(shieldImage, playerSprite.x-radius, playerSprite.y-radius, radius*2, radius*2);
        }
        //decrement player powerup timer
        if(player.powerupTimer > 0)
            player.powerupTimer--;
        // powerup timer reaches 0: remove powerup(s)
        if(player.powerupTimer == 0) {
            if(player.weapon == "gatling gun" || player.weapon == "scatter gun") {
                player.facing = "right";
                player.weapon = "thruster gun";
            }
            if(player.rapidfire)
                player.rapidfire = false;
        }
        //reduce players speed
        if (playerSprite.speed < 0)
            playerSprite.changeSpeedBy(2);
        else if (playerSprite.speed > 0)
            playerSprite.changeSpeedBy(-2);
        //when player has shot 3 burst rounds, start shoot timer
        if (player.shotsfired == 3) {
            player.shootTimer = 10;
            player.shotsfired = 0;
        }
        //decrement shoottimer
        if(player.shootTimer > 0)
            player.shootTimer--;

        //make lasers shoot from player if shielded
        if(player.shielded && player.shieldShootTimer == 0) {
            //create 7 lasers flowering from player
            for(i=0; i<7; i++) {
                var color = colorArray[i];
                var laser = new Sprite(scene, "img/lasers/laser1/"+color+".png", 70, 100, "flower laser");
                laser.x = playerSprite.x;
                laser.y = playerSprite.y;
                var angle = i * 2*Math.PI/7 * 180/Math.PI;
                laser.setAngle(angle+90);
                laser.setImgAngle(angle);
                laser.setSpeed(50);
                //give laser a timer
                laser.timer = new Timer();
                laser.timer.start();
                //set laser to flower laser
                laser.flowerLaser = true;
                laserList.push(laser);
            }
            player.shieldShootTimer = 25;
        }
        //decrement shieldShootTimer
        if(player.shieldShootTimer > 0)
            player.shieldShootTimer--;
        //decrement shieldTimer
        if(player.shieldTimer > 0)
            player.shieldTimer--;
        if(player.shieldTimer == 0) {
            player.shielded = false;
        }
        //--------------------------------
        // end player updating
        //--------------------------------

        //no asteroids left: advance level
        if(asteroidList.length == 0) {
            player.currentLevel++;
            createLevel();        
        }

    } // end updating (when player alive)

    //if player is dead, show text in the middle of the screen    
    if(player.dead) {
        var x = scene.canvas.width/2;
        var y = scene.canvas.height/2;
        //if player dies but has life left
        if(!gameover) {
            var text1 = new Text('you died!', x, y, 2, 'center', '100px prstart');
            var text2 = new Text('press enter to continue', x, y+100, 2, 'center', '30px prstart');
            if(keysDown[K_ENTER]) //press enter to continue
                player.dead = false;
        }
        //if player has no lives left, game over
        else {
            var text1 = new Text('GAME OVER', x, y, 2, 'center', '100px prstart');
            var text2 = new Text('score: ' + player.score, x, y+100, 2, 'center', '30px prstart');       
        }
        textList.push(text1, text2);
        textWriter();
    } // end updating (when player is dead)
} // end update

//function to check key presses
function keyPresser() {
    //--------------------------------
    // press left/right: change angle
    //--------------------------------
    if (keysDown[K_LEFT])
        playerSprite.changeAngleBy(-10);
    if (keysDown[K_RIGHT])
        playerSprite.changeAngleBy(10);
    //-------------------------------------------------------------------------
    // press up: move forward, play jetpack sound (cant move with gatling gun)
    //-------------------------------------------------------------------------
    if (keysDown[K_UP] && player.weapon != 'gatling gun') {
        var speed = playerSprite.speed;
        if(speed < 20)
            speed+=5;
        playerSprite.setSpeed(speed);
        //make sure jetpack sound is playing
        jetpackPlaying = true;
    }
    //if not pressing up, pause jetpack sound
    else {
        jetpackSound.pause();
        jetpackPaused = true;
        jetpackPlaying = false;
    }
    //if sound paused but playing true, start playing sound
    if(jetpackPaused && jetpackPlaying) {
        if(soundEnabled)
            jetpackSound.play(0.1);
        jetpackPaused = false;
    }
    //---------------------------------------------------------------
    // press space: create laser with random color and players angle
    //    (automatically shoot if player has gatling gun powerup)
    //---------------------------------------------------------------
    if(keysDown[K_SPACE] || player.weapon == "gatling gun") {
        var index = Math.floor(Math.random()*colorArray.length);
        var color = colorArray[index];
        //-------------------------------------------------------------------------
        // thruster gun: pushes player back opposite direction of laser
        // only shoot when shotsfired<3 and shoottimer = 0 (for triple burst fire)
        // if player has rapid fire powerup, ignore shotsfired and shoottimer
        //-------------------------------------------------------------------------
        if(player.weapon == "thruster gun" && ((player.shotsfired<3 && player.shootTimer == 0) || player.rapidfire)) {
            laser = new Sprite(scene, "img/lasers/"+color+".png", 100, 100, "laser");
            laser.x = playerSprite.x;
            laser.y = playerSprite.y;
            var angle = playerSprite.imgAngle * 180/Math.PI;
            laser.setAngle(angle+90);
            laser.setImgAngle(angle);
            laser.setSpeed(100);
            laserList.push(laser);
            //play laser sound
            if(soundEnabled)
                laserSound.play(0.3);
            //increment shotsfired if not rapid firing
            if(!player.rapidfire)
                player.shotsfired++;

            //move player back
            playerSprite.moveAngle = laser.moveAngle;
            if(Math.abs(playerSprite.speed) < 30)
                playerSprite.changeSpeedBy(-10);
        }

        //-----------------------------------------------------------------------
        // gatling gun: rapid fires automatically and switches players direction
        //-----------------------------------------------------------------------
        if(player.weapon == "gatling gun") {
            if (player.facing == "right")  
                player.facing = "left";
            else 
                player.facing = "right";

            laser = new Sprite(scene, "img/lasers/"+color+".png", 100, 100, "laser");
            laser.x = playerSprite.x;
            laser.y = playerSprite.y;
            if(player.facing == 'right')
                var angle = playerSprite.imgAngle * 180/Math.PI;
            if(player.facing == 'left')
                var angle = (playerSprite.imgAngle * 180/Math.PI) + (110 * 180/Math.PI);
            laser.setAngle(angle+90);
            laser.setImgAngle(angle);
            laser.setSpeed(100);
            laserList.push(laser);
            //play laser sound
            if(soundEnabled)
                laserSound.play(0.5);
        }
        //-----------------------------------------------------
        // scatter gun: create 7 lasers scattering from player
        //-----------------------------------------------------
        if(player.weapon == "scatter gun" && player.shootTimer == 0) {
            var initialAngle = playerSprite.imgAngle * 180/Math.PI;
            var directionArray = [-15, -10, -5, 0, 5, 10, 15];
            //creating 7 layers
            for(i=0; i<7; i++) {
                var index = Math.floor(Math.random()*colorArray.length);
                var color = colorArray[index];
                var laser = new Sprite(scene, "img/lasers/"+color+".png", 64, 64, "flower laser");
                laser.x = playerSprite.x;
                laser.y = playerSprite.y;

                var angle = initialAngle + directionArray[i];
                laser.setAngle(angle+90);
                laser.setImgAngle(angle);
                laser.setSpeed(50);
                laser.timer = 0;
                //set laser to scatter laser
                laser.scatterLaser = true;
                player.shootTimer = 10;

                laserList.push(laser);
            }
            //moving player back
            playerSprite.moveAngle = initialAngle * Math.PI/180;
            if(Math.abs(playerSprite.speed) < 30)
                playerSprite.changeSpeedBy(-40);
            //play laser sound
            if(soundEnabled)
                laserSound.play(0.5);
        }
    }
} // end keyPresser

//--------------------------------------------------------
// splitAsteroid: splits large asteroid into random# of 
// smaller asteroids, creates explosion, removes asteroid
//--------------------------------------------------------
function splitAsteroid(asteroid, index) {
    var x = asteroid.x;
    var y = asteroid.y;
    
    //create explosion at asteroid with random color
    var color = colorArray[Math.floor(Math.random()*colorArray.length)]
    var explosion = new Sprite(scene, "img/explosions/"+color+".png", 222, 222, "explosion");
    explosion.x = x;
    explosion.y = y;
    explosion.setSpeed(0);
    explosion.loadAnimation(5328, 222, 222, 222);
    explosion.generateAnimationCycles();
    explosion.setAnimationSpeed(500);
    explosionList.push(explosion);
    //play explosion sound
    if(soundEnabled)
        explosionSound.play(0.2);

    //create between 0 and 4 asteroids
    var numberToCreate = Math.floor(Math.random()*5)+1;
    for(var i=0; i < numberToCreate; i++) {
        var newAsteroid = new Sprite(scene, "img/asteroids/asteroidsheet.png", 64, 64, "small asteroid");
        newAsteroid.x = x;
        newAsteroid.y = y;
        var randomSpeed = (Math.random()*10)+1;
        newAsteroid.setSpeed(randomSpeed);
        var angle = i * Math.PI/numberToCreate * 180;
        newAsteroid.setAngle(angle);
        newAsteroid.animation = FatherSmallAsteroid.animation;
        //random spin speed
        var animationSpeed = (Math.random() * 1000) + 500;
        newAsteroid.setAnimationSpeed(animationSpeed);
        newAsteroid.playAnimation();
            
        asteroidList.push(newAsteroid);
        i++;
    }

    //remove initial asteroid
    asteroidList.splice(index, 1); 
} // end splitAsteroid

//-----------------------------------------------------------
// createLevel: spawn # asteroids according to current level
//-----------------------------------------------------------
function createLevel() {
    //make text appear in center of screen
    //(only if player not dead because createLevel called when player dies)
    if(!player.dead) {
        var x = scene.canvas.width/2;
        var y = scene.canvas.height/2;
        var text = new Text('LEVEL ' + (player.currentLevel+1), x, y, 30, 'center', '100px prstart');
        textList.push(text);
    }
    
    //create 5 asteroids per level (1=5, 2=10, 3=15 etc)
    var numberToCreate = 5 + player.currentLevel*5;
    for(var i=0; i<numberToCreate; i++) {
        //random coordinates for asteroid
        var randomX = Math.random()*scene.width;
        var randomY = Math.random()*scene.height;
        var asteroid = new Sprite(scene, "img/asteroids/bigasteroidsheet.png", 128, 128, "asteroid");
        asteroid.x = randomX;
        asteroid.y = randomY;
        var randomSpeed = (Math.random()*10)+1
        asteroid.setSpeed(randomSpeed);
        var randomAngle = Math.random()*360;
        asteroid.setAngle(randomAngle);
        asteroidList.push(asteroid);
        asteroid.animation = FatherAsteroid.animation;
        //random spin speed
        var animationSpeed = (Math.random() * 4000) + 1000;
        asteroid.setAnimationSpeed(animationSpeed);
        loopTimer = 0;
        i++;
    }
} // end createlevel

//------------------------------------------------------------------------
// playerDamager: damages player, kills if health<0, ends game if lives=0
//------------------------------------------------------------------------
function playerDamager(damage) {
    //only damage if not shielded
    if(!player.shielded) {
        player.hp -= damage;
        //when player dies
        if(player.hp <= 0) {
            player.lives--;
            player.dead = true;
            //clear keypresses
            keysDown = [];
            //clear textlist
            textList = [];
            //clear all asteroids
            asteroidList = [];
            createLevel();
            player.hp = player.maxHP;
        }
        if(player.lives == 0) {
            player.dead = true;
            gameover = true;
        }
        //if player dead and jetpack sound is playing, pause it
        if(player.dead && jetpackPlaying) {
            jetpackSound.pause();
            jetpackPaused = true;
            jetpackPlaying = false;
        }

    }
} // end playerDamager

//-----------------------------------------------------------
// powerupSpawner: 0.3% chance to spawn powerup every update
//-----------------------------------------------------------
function powerupSpawner() {
    if(powerupList.length < 5) {
        var spawnRandomizer = Math.random() * 100;
        //0.3% chance to spawn
        if(spawnRandomizer <= 0.3) {
            var powerupArray = ["health", "gatling gun", "rapid fire", "shield", "scatter gun"];
            //pick random powerup
            var index = Math.floor(Math.random()*powerupArray.length);
            var currentPowerUp = powerupArray[index];
            var image = "img/powerups/" + currentPowerUp + ".png";
            var powerup = new Sprite(scene, image, 64, 64, "powerup");
            powerup.x = Math.random() * scene.canvas.width;
            powerup.y = Math.random() * scene.canvas.height;
            powerup.setSpeed(0);
            powerup.powerupType = currentPowerUp;
            //make powerup grow
            powerup.growing = true;
            powerup.shrinking = false;
            powerupList.push(powerup);
        }
    }
} // end powerupSpawner

//----------------------------------------------------
// textWriter: writes all texts in textList on canvas
//----------------------------------------------------
function textWriter() {
    //loop through all texts and draw them
    for(i=0; i<textList.length; i++) {
        textList[i].timer++;
        var text = textList[i].string;
        var x = textList[i].x;
        var y = textList[i].y;
        var color = colorArray[Math.floor(Math.random()*colorArray.length)];
        scene.context.fillStyle = color;
        scene.context.font = textList[i].font;
        scene.context.textAlign = textList[i].textAlign;
        scene.context.fillText(text, x, y);
        //remove after time is up
        if(textList[i].timer >= textList[i].maxTime) {
            textList.splice(i);
            break;
        }
    }
} // end textWriter

//--------------------------------------------------------
// hudUpdater: draws hud (healthbar, lives, level, score)
//--------------------------------------------------------
function hudUpdater() {
    //PLAYER HEALTH BAR
    var bgWidth = scene.canvas.width;
    var width = player.hp/player.maxHP * bgWidth;
    var bgcolor = colorArray[Math.floor(Math.random()*colorArray.length)];
    scene.context.fillStyle = bgcolor;
    scene.context.fillRect(0, scene.canvas.height-30, bgWidth, 30);
    scene.context.fillStyle = "rgb(250, 0, 100)";
    scene.context.fillRect(0, scene.canvas.height-30, width, 30);

    scene.context.font = "30px prstart";
    scene.context.fillStyle = "white";
    scene.context.textAlign = "left";
    //PLAYER LIVES
    scene.context.drawImage(catIcon, 0, 0, 64, 64);
    scene.context.fillText(" x "+player.lives, 64, 48);  
    //CURRENT LEVEL
    scene.context.textAlign = "right";
    scene.context.fillText("Lvl: "+player.currentLevel, scene.canvas.width, 50);
    //PLAYER SCORE
    scene.context.fillStyle = colorArray[Math.floor(Math.random()*colorArray.length)];
    scene.context.fillText("Score: "+player.score, scene.canvas.width, 100);
} // end hudUpdater
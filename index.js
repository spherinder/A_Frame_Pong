const FPS = 50
const DIFFICULTY = 1;
const BALL_CONTROL = 3;

const PADDLE_WIDTH = 10;
const PADDLE_DEPTH = 1;
const TABLE_WIDTH = 30;
const TABLE_DEPTH = 20;
const CAM_HEIGHT = 10;
const CAM_SPEED = 300;
const BALL_RADIUS = 0.5;
const BALL_SPEED = 0.1;

let p1;
let p2;
let cam;
let ball;
let table;
window.onload = function () {
    p1 = document.getElementById("paddle1");
    p2 = document.getElementById("paddle2");
    cam = document.getElementById("camera");
    ball = document.getElementById("ball");
    table = document.getElementById("table");

    p1.setAttribute("scale", {x: PADDLE_WIDTH, z: PADDLE_DEPTH});
    p1.setAttribute("position", {x: TABLE_WIDTH / 2, z: 0});
    p2.setAttribute("scale", {x: PADDLE_WIDTH, z: PADDLE_DEPTH});
    p2.setAttribute("position", {x: TABLE_WIDTH / 2, z: TABLE_DEPTH});

    cam.setAttribute("wasd-controls", {acceleration: CAM_SPEED});
    cam.setAttribute("position", {x: TABLE_WIDTH / 2, y: CAM_HEIGHT, z: -5});
    cam.setAttribute("rotation", {x: -30})

    ball.setAttribute("radius", BALL_RADIUS);
    ball.setAttribute("position", {x: TABLE_WIDTH / 2, z: TABLE_DEPTH / 2});

    table.setAttribute("position", {x: TABLE_WIDTH / 2, y: -BALL_RADIUS, z: TABLE_DEPTH / 2});
    table.setAttribute("width", TABLE_WIDTH);
    table.setAttribute("height", TABLE_DEPTH);
    
    setInterval(gameLoop, 1000/FPS);
};

let p1Pos;
let p2Pos;
let camPos;
let ballPos;
let ballSpeed = {x: 0,z: BALL_SPEED};
let isPaused = false;
function gameLoop() {
    camPos = cam.getAttribute("position");
    p1Pos = p1.getAttribute("position");
    p2Pos = p2.getAttribute("position");
    ballPos = ball.getAttribute("position");
    
    // Move paddle1
    if (camPos.x - PADDLE_WIDTH / 2 > 0 && camPos.x + PADDLE_WIDTH / 2 < TABLE_WIDTH) {
        p1.setAttribute("position", {x: camPos.x});
    }

    // Move paddle2 automatically
    if (ballPos.x > p2Pos.x + DIFFICULTY) {
        p2.setAttribute("position", {
            x: p2Pos.x + DIFFICULTY
        });
    } else if (ballPos.x < p2Pos.x - DIFFICULTY) {
        p2.setAttribute("position", {
            x: p2Pos.x - DIFFICULTY
        });
    } else {
        p2.setAttribute("position", {
            x: ballPos.x
        });
    }
        
    // Move the ball if the game isn't paused
    if (!isPaused) {
        // Bounce logic for z-axis
        if (ballPos.z - BALL_RADIUS < p1Pos.z + PADDLE_DEPTH / 2) {
            ballSpeed.z = Math.abs(ballSpeed.z);
            if (
                p1Pos.x + PADDLE_WIDTH / 2 > ballPos.x &&
                ballPos.x > p1Pos.x - PADDLE_WIDTH / 2
            ) {
                ballSpeed.x = (ballPos.x - p1Pos.x) / (BALL_CONTROL * PADDLE_WIDTH / 2)
            } else {
                // Player 2 has won
                ballPos = {x: TABLE_WIDTH / 2, z: (TABLE_DEPTH / 2) - 5};
                ballSpeed.x = (Math.random() * 2) - 1;
                isPaused = true;
                setTimeout(() => {
                    isPaused = false;
                }, 1000);
            }
        }
        if (ballPos.z + BALL_RADIUS > p2Pos.z - PADDLE_DEPTH / 2) {
            ballSpeed.z = -Math.abs(ballSpeed.z);
            if (
                p2Pos.x + PADDLE_WIDTH / 2 > ballPos.x &&
                ballPos.x > p2Pos.x - PADDLE_WIDTH / 2
            ) {
                ballSpeed.x = (ballPos.x - p2Pos.x) / (BALL_CONTROL * PADDLE_WIDTH / 2)
            } else {
                // Player 1 has won
                ballPos = {x: TABLE_WIDTH / 2, z: (TABLE_DEPTH / 2) + 5};
                ballSpeed.x = (Math.random() * 2) - 1;
                isPaused = true;
                setTimeout(() => {
                    isPaused = false;
                }, 1000);
            }
        }
        // Bounce logic for x-axis
        if (TABLE_WIDTH < ballPos.x + BALL_RADIUS) {
            ballSpeed.x = -Math.abs(ballSpeed.x);
        } else if (ballPos.x - BALL_RADIUS < 0) {
            ballSpeed.x = Math.abs(ballSpeed.x);
        }

        ball.setAttribute("position", {
            x: ballPos.x + ballSpeed.x,
            z: ballPos.z + ballSpeed.z
        });
    }
}
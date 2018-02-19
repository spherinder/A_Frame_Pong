const FPS = 60;
const DIFFICULTY = 0.4;
const PADDLE_WIDTH = 6;
const TABLE_WIDTH = 30;
const TABLE_DEPTH = 40;
const CAM_HEIGHT = 10;
const CAM_SPEED = 600;
const BALL_RADIUS = 0.5;
const BALL_SPEED = 0.6;
const BALL_CONTROL = 2;

let p1;
let p2;
let cam;
let ball;
let table;
window.onload = () => {
    p1 = document.getElementById("paddle1");
    p2 = document.getElementById("paddle2");
    cam = document.getElementById("camera");
    ball = document.getElementById("ball");
    table = document.getElementById("table");
    ground = document.getElementById("ground");

    p1.setAttribute("scale", {x: PADDLE_WIDTH});
    p1.setAttribute("position", {
        x: TABLE_WIDTH / 2,
        z: 0 + 1 / 2 // half of paddle depth
    });
    p2.setAttribute("scale", {x: PADDLE_WIDTH});
    p2.setAttribute("position", {
        x: TABLE_WIDTH / 2,
        z: TABLE_DEPTH - 1 / 2
    });
    cam.setAttribute("rotation", {x: -30})
    cam.setAttribute("wasd-controls", {acceleration: CAM_SPEED});
    cam.setAttribute("position", {
        x: TABLE_WIDTH / 2,
        y: CAM_HEIGHT, z: -5
    });
    ball.setAttribute("radius", BALL_RADIUS);
    ball.setAttribute("position", {
        x: TABLE_WIDTH / 2,
        z: TABLE_DEPTH / 2
    });
    table.setAttribute("width", TABLE_WIDTH);
    table.setAttribute("height", TABLE_DEPTH);
    table.setAttribute("position", {
        x: TABLE_WIDTH / 2,
        y: -BALL_RADIUS, 
        z: TABLE_DEPTH / 2
    });
    ground.setAttribute("position", {
        x: TABLE_WIDTH / 2,
        y: table.getAttribute("position").y - 0.1,
        z: TABLE_DEPTH / 2
    });
    
    setInterval(gameLoop, 1000/FPS);
};

let p1Pos;
let p2Pos;
let camPos;
let ballPos;
let bounceAngle;
let ballSpeed = {x: 0,z: BALL_SPEED};
let isPaused = false;
function gameLoop() {
    camPos = cam.getAttribute("position");
    p1Pos = p1.getAttribute("position");
    p2Pos = p2.getAttribute("position");
    ballPos = ball.getAttribute("position");
    
    // Move paddle1
    if (
        TABLE_WIDTH > camPos.x + PADDLE_WIDTH / 2 &&
        camPos.x - PADDLE_WIDTH / 2 > 0
    ) {
        p1.setAttribute("position", {x: camPos.x});
    }

    // Move paddle2 automagically using "ai"
    if (
        TABLE_WIDTH > p2Pos.x + PADDLE_WIDTH / 2 &&
        ballPos.x > p2Pos.x
    ) {
        if (ballPos.x > p2Pos.x + DIFFICULTY) {
            p2.setAttribute("position", {
                x: p2Pos.x + DIFFICULTY
            });
        } else {
            p2.setAttribute("position", {
                x: ballPos.x
            });
        }
    } else if (
        p2Pos.x - PADDLE_WIDTH / 2 > 0 &&
        p2Pos.x > ballPos.x
    ) {
        if (p2Pos.x - DIFFICULTY > ballPos.x) {
            p2.setAttribute("position", {
                x: p2Pos.x - DIFFICULTY
            });
        } else {
            p2.setAttribute("position", {
                x: ballPos.x
            });
        }
    }
        
    // Move the ball if the game isn't paused
    if (!isPaused) {
        // Bounce logic for z-axis
        if (ballPos.z - BALL_RADIUS < p1Pos.z + 1 / 2) {
            ballSpeed.z = Math.abs(ballSpeed.z);
            if (
                p1Pos.x + PADDLE_WIDTH / 2 > ballPos.x &&
                ballPos.x > p1Pos.x - PADDLE_WIDTH / 2
            ) {
                bounceAngle = (((p1Pos.x - ballPos.x) / PADDLE_WIDTH) + 1/2) * Math.PI;
                ballSpeed = {
                    x: Math.cos(bounceAngle) * BALL_SPEED,
                    z: Math.sin(bounceAngle) * BALL_SPEED
                };
            } else {
                // Player 2 has won
                isPaused = true;
                ballPos = {x: TABLE_WIDTH / 2, z: 3 * TABLE_DEPTH / 4};
                ballSpeed = {x: 0, z: -BALL_SPEED};
                setTimeout(() => {
                    isPaused = false;
                }, 1000);
            }
        } else if (ballPos.z + BALL_RADIUS > p2Pos.z - 1 / 2) {
            ballSpeed.z = -Math.abs(ballSpeed.z);
            if (
                p2Pos.x + PADDLE_WIDTH / 2 > ballPos.x - BALL_RADIUS &&
                ballPos.x + BALL_RADIUS > p2Pos.x - PADDLE_WIDTH / 2
            ) {
                bounceAngle = (((p2Pos.x - ballPos.x) / PADDLE_WIDTH) + 1/2) * Math.PI;
                ballSpeed = {
                    x: Math.cos(bounceAngle) * BALL_SPEED,
                    z: -Math.sin(bounceAngle) * BALL_SPEED
                };
            } else {
                // Player 1 has won
                ballPos = {x: TABLE_WIDTH / 2, z: TABLE_DEPTH / 4};
                ballSpeed = {x: 0, z: BALL_SPEED};
                isPaused = true;
                setTimeout(() => {
                    isPaused = false;
                }, 1000);
            }
        }
        // Bounce logic for x-axis
        if (ballPos.x + BALL_RADIUS > TABLE_WIDTH) {
            ballSpeed.x = -Math.abs(ballSpeed.x);
        } else if (0 > ballPos.x - BALL_RADIUS) {
            ballSpeed.x = Math.abs(ballSpeed.x);
        }

        ball.setAttribute("position", {
            x: ballPos.x + ballSpeed.x,
            z: ballPos.z + ballSpeed.z
        });
    }
}

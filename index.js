const DIFFICULTY = 0.7;
const PADDLE_WIDTH = 6;
const TABLE_WIDTH = 30;
const TABLE_DEPTH = 40;
const CAM_HEIGHT = 10;
const CAM_SPEED = 500;
const BALL_RADIUS = 0.5;
const BALL_SPEED = 0.4;
const BALL_CONTROL = 0.5;

function stringInArray(str, strArray) {
    for (var j=0; j<strArray.length; j++) {
        if (strArray[j].match(str)) return true;
    }
    return false;
}
AFRAME.registerComponent("attach", {
    schema: {
        otherEl: {type: "selector"},
        axes: {type: "array"}
    },
    init: function () {
        let newPos = {};
        let data = this.data;
        let el = this.el;
        data.otherEl.addEventListener("componentchanged", e => {
            if (e.detail.name === "position") {
                data.axes.forEach(axis => newPos[axis] = data.otherEl.getAttribute("position")[axis]);
                el.setAttribute("position", newPos);
            }
        });
    } 
});
AFRAME.registerComponent("collisionbox", {
    schema: {
        boxType: {default: "custom"},
        contain: {default: false},
        physical: {type: "boolean", default: false},
        x: {type: "array"},
        y: {type: "array"},
        z: {type: "array"},
        otherEl: {type: "selector"},
        entityScale: {type: "vec3"},
        reset: {type: "array"}
    },
    multiple: true,
    init: function () {
        let el = this.el;
        let pos;
        let data = this.data;
        let axesToBound;
        let resetPos = {};
        if (data.boxType === "entity") {
            axesToBound = ["x", "y", "z"];
        } else {
            axesToBound = [];
            ["x", "y", "z"].forEach(axis => {
                if (data[axis].length > 1) {
                    axesToBound.push(axis);
                }
            });
            if (data.reset.length > 0) {
                axesToBound.forEach(axis =>
                    resetPos[axis] = (data[axis][0] + data[axis][1]) / 2);
            }
        }
        let isInside = {x: false, y: false, z: false};
        let wasInside;
        el.addEventListener("componentchanged", function (e) {
            if (e.detail.name === "position") {
                if (data.boxType === "entity") {
                    let otherPos = data.otherEl.getAttribute("position");
                    ["x", "y", "z"].forEach(axis => 
                        data[axis] = [
                            otherPos[axis] - data.entityScale[axis], 
                            otherPos[axis] + data.entityScale[axis]
                        ]
                    );
                }
                pos = el.getAttribute("position");
                wasInside = Object.assign({}, isInside);
                axesToBound.forEach(axis => {
                    if (pos[axis] < data[axis][0]
                        || pos[axis] > data[axis][1]
                    ) {
                        isInside[axis] = false;
                        if (data.contain) {
                            if (stringInArray(axis,
                                data.reset.slice(1))
                            ) {
                                el.setAttribute("position", resetPos);
                                // Why doesn't el.setAttribute("move"... work?
                                let move = el.getAttribute("move");
                                move.speedVector.x = 0;
                                move.speedVector.y = 0;
                                move.speedVector.z = Math.sign(move.speedVector.z) * move.speed;
                                el.pause();
                                window.setTimeout(() => el.play(), data.reset[0]);
                            } else {
                                el.emit("collision", {
                                    otherType: "custom",
                                    axis: axis,
                                    position: (
                                        pos[axis] < data[axis][0]
                                    ) ? data[axis][0] : data[axis][1]
                                });
                            }
                            return;
                        }
                    } else {
                        isInside[axis] = true;
                    }
                });
                let hitAxis;
                let someWereOutside = 
                    Object.keys(wasInside).some(axis => {
                        if (wasInside[axis] === false) {hitAxis = axis;}
                        return wasInside[axis] === false;
                    });
                let oneWasOutside = 
                    Object.keys(wasInside).every(axis => {
                        if (hitAxis !== axis) return wasInside[axis];
                        return true;
                    });
                if (!data.contain
                    && Object.values(isInside).every(bool => bool)
                    && someWereOutside
                    && oneWasOutside
                ) {
                    el.emit("collision", {
                        collisionType: "entity",
                        axis: hitAxis,
                        position: (
                            pos[hitAxis] - data[hitAxis][0]
                            < data[hitAxis][1] - pos[hitAxis]
                        ) ? data[hitAxis][0] : data[hitAxis][1],
                        collidedWith: data.otherEl
                    });
                }
            }
        });
        if (data.physical) {
            el.addEventListener("collision", function (e) {
                el.setAttribute("position", e.detail.axis,
                    e.detail.position);
            });
        }
    }
});
AFRAME.registerComponent("follow", {
    schema: {
        otherEl: {type: "selector"},
        speed: {type: "number"},
        axes: {type: "array"}
    },
    init: function () {
        this.directionVec3 = new THREE.Vector3();
        this.axesToFlatten = [];
        ["x", "y", "z"].forEach((axis, index) => {
            if (!stringInArray(axis, this.data.axes)) {
                this.axesToFlatten.push(axis);
            }
        });
    },
    tick: function () {
        let directionVec3 = this.directionVec3;
        let targetPosition = this.data.otherEl.object3D.position;
        let currentPosition = this.el.object3D.position;
        
        directionVec3.copy(targetPosition).sub(currentPosition);
        this.axesToFlatten.forEach(axis => {
            directionVec3[axis] = 0;
        });
        let distance = directionVec3.length();
        if (distance < this.data.speed) {
            this.data.axes.forEach(axis => {
                this.el.setAttribute("position", axis,
                    currentPosition[axis] + directionVec3[axis]);
            });
        }
        else {
            let factor = this.data.speed / distance;
            this.data.axes.forEach(axis => {
                directionVec3[axis] *= factor;
                this.el.setAttribute("position", axis, currentPosition[axis] + directionVec3[axis]);
            });
        }
    }
});
AFRAME.registerComponent("move", {
    schema: {
        bounce: {type: "boolean"},
        startSpeed: {default: 0.1},
        acceleration: {default: 0.001},
        control: {type: "array"},
        steadiness: {default: 0.5}
    },
    init: function () {
        if (this.data.bounce) {
            let data = this.data;
            let el = this.el;
            this.speed = data.speed;
            data.steadiness += 1; // range from 0 to inf
            data.speedVector = {x: 0, y: 0, z: -data.speed};
            this.el.addEventListener("collision", function (e) {
                if (data.control.length === 2
                    && e.detail.collisionType === "entity"
                    && e.detail.axis === data.control[0]
                ) {
                    data.speed += data.acceleration
                    let bounceAngle = Math.PI*(
                        (el.getAttribute(
                            "position")[data.control[1]]
                        - e.detail.collidedWith.getAttribute(
                            "position")[data.control[1]]
                        )
                        / (e.detail.collidedWith.getAttribute(
                            "scale")[data.control[1]] * data.steadiness)
                    );

                    data.speedVector[data.control[1]] = Math.sin(bounceAngle)*data.speed;
                    data.speedVector[data.control[0]] = (
                        data.speedVector[data.control[0]] > 0
                        ? -Math.abs(Math.cos(bounceAngle))
                        : Math.abs(Math.cos(bounceAngle))
                    )*data.speed;
                } else {
                    data.speedVector[e.detail.axis] = -data.speedVector[e.detail.axis];
                }
            });
        }
    },
    tick: function () {
        let newPos = this.el.getAttribute("position");
        Object.keys(newPos).forEach(axis => {
            newPos[axis] += this.data.speedVector[axis];
        });
        this.el.setAttribute("position", newPos);
    }
});
AFRAME.registerComponent("pong", {
    schema: {},
    init: function () {
        let p1 = document.getElementById("paddle1");
        let p2 = document.getElementById("paddle2");
        let cam = document.getElementById("camera");
        let ball = document.getElementById("ball");
        let table = document.getElementById("table");
        let ground = document.getElementById("ground");
        
        p1.setAttribute("attach", {
            otherEl: "#camera",
            axes: ["x"]
        });
        p1.setAttribute("scale", "x", PADDLE_WIDTH);
        p1.setAttribute("position", {
            x: TABLE_WIDTH / 2,
            z: 0.5 // half of paddle depth
        });
        p2.setAttribute("scale", "x", PADDLE_WIDTH);
        p2.setAttribute("follow", {
            otherEl: "#ball",
            axes: ["x"],
            speed: DIFFICULTY
        });
        p2.setAttribute("collisionbox", {
            x: [PADDLE_WIDTH/2, TABLE_WIDTH - PADDLE_WIDTH/2],
            contain: true,
            physical: true
        });
        p2.setAttribute("position", {
            x: TABLE_WIDTH / 2,
            z: TABLE_DEPTH - 0.5
        });
        cam.setAttribute("collisionbox", {
            boxType: "custom",
            x: [PADDLE_WIDTH/2, TABLE_WIDTH - PADDLE_WIDTH/2],
            contain: true,
            physical: true
        });
        cam.setAttribute("rotation", "x", -30);
        cam.setAttribute("wasd-controls", "acceleration", CAM_SPEED);
        cam.setAttribute("position", {
            x: TABLE_WIDTH/2, y: CAM_HEIGHT, z: -5});
        ball.setAttribute("radius", BALL_RADIUS);
        ball.setAttribute("collisionbox__1", {
            boxType: "entity",
            otherEl: "#paddle2",
            entityScale: {x: PADDLE_WIDTH/2 + BALL_RADIUS, y: 1, z: 1},
            physical: true,
            contain: false,
        });
        ball.setAttribute("collisionbox__2", {
            boxType: "entity",
            otherEl: "#paddle1",
            entityScale: {x: PADDLE_WIDTH/2 + BALL_RADIUS, y: 1, z: 1},
            physical: true,
            contain: false,
        });
        ball.setAttribute("collisionbox__3", {
            boxType: "custom",
            x: [BALL_RADIUS, TABLE_WIDTH - BALL_RADIUS],
            z: [0, TABLE_DEPTH],
            physical: true,
            contain: true,
            reset: [2000, "z"]
        });
        ball.setAttribute("move", {
            bounce: true,
            speed: BALL_SPEED,
            control: ["z", "x"],
            steadiness: BALL_CONTROL
        });
        ball.setAttribute("position", {
            x: TABLE_WIDTH/2,
            z: TABLE_DEPTH/2
        });
        table.setAttribute("width", TABLE_WIDTH);
        table.setAttribute("height", TABLE_DEPTH);
        table.setAttribute("position", {
            x: TABLE_WIDTH/2,
            y: -BALL_RADIUS, 
            z: TABLE_DEPTH/2
        });
        ground.setAttribute("position", {
            x: TABLE_WIDTH/2,
            y: table.getAttribute("position").y - 0.1, //epsilon 
            z: TABLE_DEPTH/2
        });
    }
});

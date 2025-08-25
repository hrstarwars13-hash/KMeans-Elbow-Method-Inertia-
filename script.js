// Simple KMeans clustering demo
const canvas = document.getElementById('clusterCanvas');
const ctx = canvas.getContext('2d');
const elbowCanvas = document.getElementById('elbowCanvas');
const elbowCtx = elbowCanvas.getContext('2d');

const numPointsInput = document.getElementById('numPoints');
const kValueInput = document.getElementById('kValue');
const assignBtn = document.getElementById('assignBtn');
const moveBtn = document.getElementById('moveBtn');
const resetBtn = document.getElementById('resetBtn');

let points = [];
let centroids = [];
let assignments = [];
let elbowInertias = [];
let elbowPoints = [];
let elbowTooltip = null;

function randomColor(i) {
    const colors = ['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33'];
    return colors[i % colors.length];
}

function randomPoints(n) {
    let arr = [];
    for (let i = 0; i < n; i++) {
        arr.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        });
    }
    return arr;
}

function randomCentroids(k) {
    let arr = [];
    for (let i = 0; i < k; i++) {
        arr.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        });
    }
    return arr;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw lines from points to centroids
    for (let i = 0; i < points.length; i++) {
        if (assignments[i] !== undefined) {
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(centroids[assignments[i]].x, centroids[assignments[i]].y);
            ctx.strokeStyle = randomColor(assignments[i]);
            ctx.globalAlpha = 0.3;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
    }
    // Draw points
    for (let i = 0; i < points.length; i++) {
        ctx.beginPath();
        ctx.arc(points[i].x, points[i].y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = assignments[i] !== undefined ? randomColor(assignments[i]) : '#888';
        ctx.fill();
    }
    // Draw centroids
    for (let i = 0; i < centroids.length; i++) {
        ctx.beginPath();
        ctx.arc(centroids[i].x, centroids[i].y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = randomColor(i);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();
    }
}

function assignPoints() {
    assignments = points.map(p => {
        let minDist = Infinity, idx = 0;
        for (let i = 0; i < centroids.length; i++) {
            let dx = p.x - centroids[i].x;
            let dy = p.y - centroids[i].y;
            let dist = dx*dx + dy*dy;
            if (dist < minDist) {
                minDist = dist;
                idx = i;
            }
        }
        return idx;
    });
    draw();
}

function moveCentroids() {
    let k = centroids.length;
    let sums = Array(k).fill(0).map(() => ({x:0, y:0, count:0}));
    for (let i = 0; i < points.length; i++) {
        let c = assignments[i];
        if (c !== undefined) {
            sums[c].x += points[i].x;
            sums[c].y += points[i].y;
            sums[c].count++;
        }
    }
    for (let i = 0; i < k; i++) {
        if (sums[i].count > 0) {
            centroids[i].x = sums[i].x / sums[i].count;
            centroids[i].y = sums[i].y / sums[i].count;
        }
    }
    draw();
}

function reset() {
    let n = parseInt(numPointsInput.value);
    let k = parseInt(kValueInput.value);
    points = randomPoints(n);
    centroids = randomCentroids(k);
    assignments = Array(n).fill(undefined);
    draw();
    drawElbow();
}

function inertia(pts, cents, assigns) {
    let sum = 0;
    for (let i = 0; i < pts.length; i++) {
        let c = assigns[i];
        let dx = pts[i].x - cents[c].x;
        let dy = pts[i].y - cents[c].y;
        sum += dx*dx + dy*dy;
    }
    return sum;
}

function drawElbow(currentPoints = points, currentCentroids = centroids, currentAssignments = assignments) {
    // For k=1..12, run a few kmeans steps and plot inertia
    let n = parseInt(numPointsInput.value);
    let inertias = [];
    let elbowPts = [];
    let origPoints = currentPoints && currentPoints.length === n ? currentPoints : randomPoints(n);
    let kMax = 12;
    let graphLeft = 60, graphRight = 760, graphTop = 30, graphBottom = 320;
    let graphWidth = graphRight - graphLeft;
    let graphHeight = graphBottom - graphTop;
    for (let k = 1; k <= kMax; k++) {
        let cents, assigns;
        if (k === centroids.length && currentCentroids.length === k && currentAssignments.length === n && currentAssignments.every(a => a !== undefined)) {
            // Use current state for current k
            cents = currentCentroids.map(c => ({x: c.x, y: c.y}));
            assigns = currentAssignments.slice();
        } else {
            cents = randomCentroids(k);
            assigns = Array(n);
            // 5 kmeans steps
            for (let step = 0; step < 5; step++) {
                assigns = origPoints.map(p => {
                    let minDist = Infinity, idx = 0;
                    for (let i = 0; i < k; i++) {
                        let dx = p.x - cents[i].x;
                        let dy = p.y - cents[i].y;
                        let dist = dx*dx + dy*dy;
                        if (dist < minDist) {
                            minDist = dist;
                            idx = i;
                        }
                    }
                    return idx;
                });
                // Move centroids
                let sums = Array(k).fill(0).map(() => ({x:0, y:0, count:0}));
                for (let i = 0; i < n; i++) {
                    let c = assigns[i];
                    sums[c].x += origPoints[i].x;
                    sums[c].y += origPoints[i].y;
                    sums[c].count++;
                }
                for (let i = 0; i < k; i++) {
                    if (sums[i].count > 0) {
                        cents[i].x = sums[i].x / sums[i].count;
                        cents[i].y = sums[i].y / sums[i].count;
                    }
                }
            }
        }
        let inert = inertia(origPoints, cents, assigns);
        inertias.push(inert);
    }
    // Normalize and plot
    let maxInertia = inertias[0];
    let minInertia = inertias[inertias.length-1];
    for (let k = 1; k <= kMax; k++) {
        let x = graphLeft + (k-1) * (graphWidth/(kMax-1));
        let y = graphBottom - ((inertias[k-1]-minInertia)/(maxInertia-minInertia+1e-6)) * graphHeight;
        elbowPts.push({x, y, k, inertia: inertias[k-1]});
    }
    elbowInertias = inertias;
    elbowPoints = elbowPts;
    // Draw graph
    elbowCtx.clearRect(0,0,elbowCanvas.width,elbowCanvas.height);
    elbowCtx.beginPath();
    elbowCtx.moveTo(elbowPts[0].x, elbowPts[0].y);
    for (let k = 0; k < kMax; k++) {
        elbowCtx.lineTo(elbowPts[k].x, elbowPts[k].y);
    }
    elbowCtx.strokeStyle = '#377eb8';
    elbowCtx.lineWidth = 2;
    elbowCtx.stroke();
    // Draw points
    for (let k = 0; k < kMax; k++) {
        elbowCtx.beginPath();
        elbowCtx.arc(elbowPts[k].x, elbowPts[k].y, 5, 0, 2*Math.PI);
        elbowCtx.fillStyle = '#e41a1c';
        elbowCtx.fill();
        elbowCtx.strokeStyle = '#fff';
        elbowCtx.stroke();
    }
    // Axes
    elbowCtx.beginPath();
    elbowCtx.moveTo(graphLeft, graphTop);
    elbowCtx.lineTo(graphLeft, graphBottom);
    elbowCtx.lineTo(graphRight, graphBottom);
    elbowCtx.strokeStyle = '#000';
    elbowCtx.lineWidth = 1;
    elbowCtx.stroke();
    // Labels
    elbowCtx.fillStyle = '#000';
    elbowCtx.font = '14px Arial';
    for (let k = 0; k < kMax; k++) {
        let label = (k+1).toString();
        elbowCtx.fillText(label, elbowPts[k].x-5, graphBottom+20);
    }
    elbowCtx.fillText('K', graphRight+10, graphBottom+20);
    elbowCtx.save();
    elbowCtx.translate(graphLeft-40, graphTop+20);
    elbowCtx.rotate(-Math.PI/2);
    elbowCtx.fillText('Inertia', 0, 0);
    elbowCtx.restore();
    // Tooltip
    if (elbowTooltip) {
        elbowCtx.save();
        elbowCtx.font = '14px Arial';
        elbowCtx.fillStyle = '#fff';
        elbowCtx.strokeStyle = '#333';
        let tw = elbowCtx.measureText(elbowTooltip.text).width + 14;
        let th = 28;
        elbowCtx.globalAlpha = 0.92;
        elbowCtx.fillRect(elbowTooltip.x, elbowTooltip.y-th, tw, th);
        elbowCtx.globalAlpha = 1.0;
        elbowCtx.strokeRect(elbowTooltip.x, elbowTooltip.y-th, tw, th);
        elbowCtx.fillStyle = '#000';
        elbowCtx.fillText(elbowTooltip.text, elbowTooltip.x+7, elbowTooltip.y-10);
        elbowCtx.restore();
    }
}

assignBtn.onclick = function() {
    assignPoints();
    drawElbow(points, centroids, assignments);
};
moveBtn.onclick = function() {
    moveCentroids();
    drawElbow(points, centroids, assignments);
};
resetBtn.onclick = reset;
numPointsInput.onchange = reset;
kValueInput.onchange = reset;

elbowCanvas.addEventListener('mousemove', function(e) {
    let rect = elbowCanvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;
    let found = null;
    for (let pt of elbowPoints) {
        let dx = pt.x - mx, dy = pt.y - my;
        if (dx*dx + dy*dy < 100) {
            found = pt;
            break;
        }
    }
    if (found) {
        elbowTooltip = {
            x: found.x+12,
            y: found.y,
            text: `K=${found.k}, Inertia=${Math.round(found.inertia)}`
        };
    } else {
        elbowTooltip = null;
    }
    drawElbow(points, centroids, assignments);
});
elbowCanvas.addEventListener('mouseleave', function() {
    elbowTooltip = null;
    drawElbow(points, centroids, assignments);
});

reset();

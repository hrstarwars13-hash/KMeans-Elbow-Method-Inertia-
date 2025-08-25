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

function drawElbow() {
    // For k=1..6, run a few kmeans steps and plot inertia
    let n = parseInt(numPointsInput.value);
    let inertias = [];
    let origPoints = randomPoints(n);
    for (let k = 1; k <= 6; k++) {
        let cents = randomCentroids(k);
        let assigns = Array(n);
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
        inertias.push(inertia(origPoints, cents, assigns));
    }
    // Draw graph
    elbowCtx.clearRect(0,0,elbowCanvas.width,elbowCanvas.height);
    elbowCtx.beginPath();
    elbowCtx.moveTo(50, 180);
    for (let k = 0; k < 6; k++) {
        let x = 50 + k*70;
        let y = 180 - inertias[k]/inertias[0]*150;
        elbowCtx.lineTo(x, y);
        elbowCtx.arc(x, y, 3, 0, 2*Math.PI);
    }
    elbowCtx.strokeStyle = '#377eb8';
    elbowCtx.stroke();
    // Axes
    elbowCtx.beginPath();
    elbowCtx.moveTo(50, 10);
    elbowCtx.lineTo(50, 180);
    elbowCtx.lineTo(450, 180);
    elbowCtx.strokeStyle = '#000';
    elbowCtx.stroke();
    // Labels
    elbowCtx.fillStyle = '#000';
    for (let k = 0; k < 6; k++) {
        let x = 50 + k*70;
        elbowCtx.fillText((k+1).toString(), x-3, 195);
    }
    elbowCtx.fillText('K', 450, 195);
    elbowCtx.fillText('Inertia', 5, 20);
}

assignBtn.onclick = assignPoints;
moveBtn.onclick = moveCentroids;
resetBtn.onclick = reset;
numPointsInput.onchange = reset;
kValueInput.onchange = reset;

reset();

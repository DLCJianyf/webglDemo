(function (win) {

    var minR = 1;
    var maxR = 3;
    var v = [-1, 1];

    var nodes = [];
    var edges = [];
    var nodeNum = 300;

    var easingFactor = 5.0;
    var mousePos = [0, 0];

    var w = win.innerWidth;
    var h = win.innerHeight;

    var edgeColor = "#FFFFFF";
    var colors = ["#F8E400", "#F26378", "#13DBAD", "#FF7D48", "#A2EF54"];

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    function lengthOfEdge(edge) {
        return Math.sqrt(Math.pow((edge.from.x - edge.to.x), 2) + Math.pow((edge.from.y - edge.to.y), 2));
    }

    function adjustNodeDrivenByMouse() {
        if(!nodes.length) return;
        nodes[0].x += (mousePos[0] - nodes[0].x) / easingFactor;
        nodes[0].y += (mousePos[1] - nodes[0].y) / easingFactor;
    }

    function Node() {};
    Node.prototype = {
        init: function () {
            this.x = random(0, win.innerWidth);
            this.y = random(0, win.innerWidth);
            this.r = random(minR, maxR);
            this.color = colors[parseInt(random(0, colors.length))];

            this.speed = random(0, 0.5);

            this.vx = random(-1, 1);
            this.vy = random(-1, 1);
        },

        draw: function () {
            animate.ctx.beginPath();
            animate.ctx.fillStyle = this.color;
            animate.ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            animate.ctx.fill();
        },

        move: function () {
            this.x += this.vx * this.speed;
            this.y += this.vy * this.speed;

            if (this.x + this.r <= 0 || this.x + this.r >= win.innerWidth) this.vx = -this.vx;
            if (this.y + this.r <= 0 || this.y + this.r >= win.innerHeight) this.vy = -this.vy;

            this.draw();
        }
    };

    function Edge() {};
    Edge.prototype = {
        init: function(from, to) {
            this.from = from;
            this.to = to;
        },

        draw: function() {
            var l = lengthOfEdge(this);
            var threshold = win.innerWidth / 20;
            if(l > threshold) {
                return;
            }

            animate.ctx.strokeStyle = edgeColor;
            animate.ctx.lineWidth = (1.0 - l / threshold) * 2.5;
            animate.ctx.globalAlpha = 1.0 - l / threshold;
            animate.ctx.beginPath();
            animate.ctx.moveTo(this.from.x, this.from.y);
            animate.ctx.lineTo(this.to.x, this.to.y);
            animate.ctx.stroke();
        }
    };

    var animate = {

        ctx: null,

        canvas: null,

        initCanvas: function () {
            if (!this.canvas) {
                this.canvas = document.querySelector("#canvas");

                this.canvas.width = w;
                this.canvas.height = h;

                this.ctx = this.canvas.getContext("2d");
            }
        },

        addNodes: function (num) {
            nodes = [];
            for (var i = 0; i < num; i++) {
                var node = new Node();
                node.init();
                nodes.push(node);
            }
        },

        addEdges: function(nodes) {
            var n1;
            var n2;
            edges = [];
            for(var i = 0; i < nodes.length; i ++) {
                n1 = nodes[i];
                for(var j = i + 1; j < nodes.length; j ++) {
                    n2 = nodes[j];

                    var edge = new Edge();
                    edge.init(n1, n2);
                    edges.push(edge);
                }
            }
        },

        clear: function () {
            this.ctx.clearRect(0, 0, win.innerWidth, win.innerHeight);
            this.ctx.globalAlpha = 1.0;
        },

        step: function() {
            animate.clear();
            adjustNodeDrivenByMouse();
            for (var node of nodes) {
                node.move();
            }
    
            for(var edge of edges) {
                edge.draw();
            }
    
            win.requestAnimationFrame(animate.step);
        }
    };

    animate.initCanvas();
    animate.step();

    win.onmousemove = function (e) {
        mousePos[0] = e.clientX;
        mousePos[1] = e.clientY;
    }

    win.onresize = function () {
        if (animate.canvas) {
            animate.canvas.width = win.innerWidth;
            animate.canvas.height = win.innerHeight;

            animate.addNodes(nodeNum);
            animate.addEdges(nodes);
        }
    }
    win.onresize();

})(window);
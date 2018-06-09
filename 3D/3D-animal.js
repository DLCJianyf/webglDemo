(function(win) {

    var minR = 1;
    var maxR = 5;
    var v = [-1, 1];

    var nodes = [];
    var edges = [];
    var nodePostions = [];
    var edgePositions = [];
    var maxNodeCount = 300;
    var cameraHeight = 500;

    var easingFactor = 5.0;
    var mousePos = [0, 0, cameraHeight];

    var windowHalfX = win.innerWidth / 2;
    var windowHalfY = win.innerHeight / 2;

    var edgeColor = 0xFFFFFF;
    var colors = [0xF8E400, 0xF26378, 0x13DBAD, 0xFF7D48, 0xA2EF54];

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    function adjustNodeDrivenByMouse() {
        if(!nodes.length) return;
        nodes[0].positions[0] += (mousePos[0] - nodes[0].positions[0]) / easingFactor;
        nodes[0].positions[1] += (mousePos[1] - nodes[0].positions[1]) / easingFactor;
        //nodes[0].positions[2] += (mousePos[2] - nodes[0].positions[2]) / easingFactor;
    }

    function Node() {};
    Node.prototype = {

        init: function () {
            this.x = random(-windowHalfX, windowHalfX);
            this.y = random(-windowHalfY, windowHalfY);
            this.z = random(-cameraHeight, cameraHeight);

            this.positions = new Float32Array(3);
            this.positions[0] = this.x;
            this.positions[1] = this.y;
            this.positions[2] = this.z;

            this.r = random(minR, maxR);
            var color = colors[parseInt(random(0, colors.length))];

            var geometry = new THREE.BufferGeometry();
            geometry.addAttribute( 'position', new THREE.BufferAttribute(this.positions, 3).setDynamic( true ));
            geometry.computeBoundingSphere();

            var pMaterial= this.createMaterial(color, this.r);
            this.pointCloud = new THREE.Points(geometry, pMaterial);

            this.speed = random(1, 2);

            this.vx = random(-1, 1);
            this.vy = random(-1, 1);
            this.vz = random(-1, 1);
        },

        createMaterial: function(color, r) {
            return new THREE.PointsMaterial( {
                color: color,
                size: r,
                blending: THREE.AdditiveBlending,
                transparent: true,
                sizeAttenuation: false
            } );
        },

        move: function () {
            this.x += this.vx * this.speed;
            this.y += this.vy * this.speed;
            this.z += this.vz * this.speed;

            if (this.x + this.r <= -windowHalfX || this.x + this.r >= windowHalfX) this.vx = -this.vx;
            if (this.y + this.r <= -windowHalfY || this.y + this.r >= windowHalfY) this.vy = -this.vy;
            if (this.z + this.r <= 0 || this.z + this.r >= cameraHeight) this.vz = -this.vz;

            this.positions[0] = this.x;
            this.positions[1] = this.y;
            this.positions[2] = this.z;

            this.pointCloud.geometry.attributes.position.needsUpdate = true;
        }
    };

    function Edge() {};
    Edge.prototype = {
        init: function(from, to) {
            this.from = from;
            this.to = to;
            this.colors = new Float32Array(6);
            this.positions = new Float32Array(6);
            this.positions[0] = this.from.x;
            this.positions[1] = this.from.y;
            this.positions[2] = this.from.z;
            this.positions[3] = this.to.x;
            this.positions[4] = this.to.y;
            this.positions[5] = this.to.z;

            var geometry = new THREE.BufferGeometry();
            geometry.addAttribute( 'position', new THREE.BufferAttribute(this.positions, 3).setDynamic(true));
            geometry.addAttribute( 'color', new THREE.BufferAttribute(this.colors, 3).setDynamic(true));
            geometry.computeBoundingSphere();

            var lineStyle = this.getLineStyle();
            var material = new THREE.LineBasicMaterial( {
                linewidth: lineStyle.lineWidth,
                vertexColors: THREE.VertexColors,
                blending: THREE.AdditiveBlending,
                transparent: true
            } );

            this.linesMesh = new THREE.LineSegments(geometry, material);
            this.linesMesh.visible = lineStyle.visible;

            for(var i = 0; i < this.colors.length; i ++) {
                this.colors[i] = lineStyle.opacity;
            }
        },

        move() {
            this.positions[0] = this.from.x;
            this.positions[1] = this.from.y;
            this.positions[2] = this.from.z;
            this.positions[3] = this.to.x;
            this.positions[4] = this.to.y;
            this.positions[5] = this.to.z;

            var lineStyle = this.getLineStyle();
            this.linesMesh.visible = lineStyle.visible;
            this.linesMesh.material.linewidth = lineStyle.lineWidth;

            for(var i = 0; i < this.colors.length; i ++) {
                this.colors[i] = lineStyle.opacity;
            }

            this.linesMesh.geometry.attributes.position.needsUpdate = true;
            this.linesMesh.geometry.attributes.color.needsUpdate = true;
        },

        getLineStyle: function() {
            var visible = true;
            
            var l = Math.sqrt(Math.pow((this.from.x - this.to.x), 2) + Math.pow((this.from.y - this.to.y), 2) + Math.pow((this.from.z - this.to.z), 2));
            var threshold = win.innerWidth / 10;
            var lineWidth = (1.0 - l / threshold) * 2.5;
            var opacity = 1.0 - l / threshold;

            if(lineWidth <= 0) lineWidth = 0;
            if(opacity <= 0) opacity = 0;
            if(l > threshold) visible = false;

            return {
                visible: visible,
                opacity: opacity,
                lineWidth: lineWidth
            }
        }
    };


    var ThreeJS = {

        renderer: null,

        camera: null,

        scene: null,

        group: null,

        init: function() {
            this.initThree();
            this.initCamera();
            this.initScence();
            this.initControl();
        },

        initThree: function() {

            // this.renderer = new THREE.WebGLRenderer({
            //     antialias: true
            // });
            this.renderer = new THREE.WebGLRenderer( { antialias: true } );
            this.renderer.setPixelRatio(win.devicePixelRatio);
            this.renderer.setSize(win.innerWidth, win.innerHeight);

            document.getElementById('3DCanvas').appendChild(this.renderer.domElement);
        },

        initCamera: function() {
            this.camera = new THREE.PerspectiveCamera(90, win.innerWidth / win.innerHeight, 1, 4000);
            this.camera.position.x = 0;
            this.camera.position.y = 0;
            this.camera.position.z = 1200;
            // this.camera.up.x =  win.innerWidth / 2;
            // this.camera.up.y = win.innerHeight / 2;
            // this.camera.up.z = 1000;
        },

        initScence: function() {
            this.group = new THREE.Group();
            this.scene = new THREE.Scene();
            this.scene.add(this.group);
        },

        initControl: function() {
            var controls = new THREE.OrbitControls(ThreeJS.camera, document.getElementById('3DCanvas'));
        },

        addNodes: function (num) {
            nodes = [];
            for (var i = 0; i < num; i++) {
                var node = new Node();
                node.init();
                nodes.push(node);
                this.group.add(node.pointCloud);
            }
        },

        addEdges: function() {
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
                    this.group.add(edge.linesMesh);
                }
            }
        },

        addCube: function() {
            var positions = new Float32Array([
                -windowHalfX, -windowHalfY, 0,
                -windowHalfX, windowHalfY, 0,
                windowHalfX, -windowHalfY, 0,
                windowHalfX, windowHalfY, 0,

                -windowHalfX, -windowHalfY, cameraHeight,
                -windowHalfX, windowHalfY, cameraHeight,
                windowHalfX, -windowHalfY, cameraHeight,
                windowHalfX, windowHalfY, cameraHeight,

                -windowHalfX, -windowHalfY, 0,
                windowHalfX, -windowHalfY, 0,
                -windowHalfX, windowHalfY, 0,
                windowHalfX, windowHalfY, 0,

                -windowHalfX, windowHalfY, cameraHeight,
                windowHalfX, windowHalfY, cameraHeight,
                -windowHalfX, -windowHalfY, cameraHeight,
                windowHalfX, -windowHalfY, cameraHeight
            ]);

            var pGeometry = new THREE.BufferGeometry();
            pGeometry.addAttribute( 'position', new THREE.BufferAttribute(positions, 3));
            pGeometry.computeBoundingSphere();

            var node = new Node();
            var pMaterial= node.createMaterial(0xFFFFFF, 3);
            var pointCloud = new THREE.Points(pGeometry, pMaterial);
            this.group.add(pointCloud);

            var lGeometry = new THREE.BufferGeometry();
            lGeometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
            lGeometry.computeBoundingSphere();

            var lMaterial = new THREE.LineBasicMaterial( {
                color: 0XFFFFFF,
                blending: THREE.AdditiveBlending,
                transparent: true
            } );

            linesMesh = new THREE.LineSegments(lGeometry, lMaterial);
            this.group.add(linesMesh);
        },

        step: function() {

            for(var node of nodes) {
                node.move();
            }

            for(var edge of edges) {
                edge.move();
            }

            adjustNodeDrivenByMouse();

            var point = new THREE.Vector3(0, 0, cameraHeight);
            ThreeJS.camera.lookAt(point);

            var time = Date.now() * 0.001;
            ThreeJS.group.rotation.y = time * 0.1;

            ThreeJS.renderer.render(ThreeJS.scene, ThreeJS.camera);

            win.requestAnimationFrame(ThreeJS.step);
        }
    };

    ThreeJS.init();
    ThreeJS.addNodes(maxNodeCount);
    ThreeJS.addEdges(nodes);
    //ThreeJS.addCube();
    ThreeJS.step();

    win.onmousemove = function (e) {
        mousePos[0] = e.clientX;
        mousePos[1] = e.clientY;
    }

    win.onresize = function() {
        ThreeJS.camera.aspect = window.innerWidth / window.innerHeight;
        ThreeJS.camera.updateProjectionMatrix();
        ThreeJS.renderer.setSize( window.innerWidth, window.innerHeight );
    }
    win.onresize();

})(window);
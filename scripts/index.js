// Code to read, load, compile, link, run and render
// (to an HTML5 canvas) a vertex and a fragment shader 

document.onreadystatechange = () => {
    if (document.readyState === 'complete') {
   
        // Get reference to canvas, set dimensions
        const canvas = document.getElementById(`canv`);
        let canvasSize = [document.body.clientWidth, document.body.clientHeight];
        let [w, h] = canvasSize;
        [canvas.width, canvas.height] = [w, h];
        let [mx, my] = [0.875, 0.5];  // Mouse position in canvas, normalised to range(-1, 1)
        
        // Link canvas to a WebGL context
        const gl = canvas.getContext(`webgl`) || canvas.getContext(`experimental-webgl`);

        // Initialise context
        gl.viewport(0, 0, w, h);
        gl.clearColor(0.0, 0, 0.0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Create some points to send to the vertex shader and set up a buffer for passing them to the GPU
        const triangleVertices = [
            //   x        y        
                -1.0,    -1.0,
                 1.0,    -1.0,
                -1.0,     1.0,
                 1.0,    -1.0,
                 1.0,     1.0,
                -1.0,     1.0,
        ];
        let triangleVertexBufferObject = gl.createBuffer();

        let vShaderCode, fShaderCode;   // strings read from user-specified files
        let vertexShader, fragmentShader;

        let t0;             // t0 will store the initial time, just before first render
        let pause_time;     // pause_time will store the time the user paused rendering
        let time_location;  // time_location will refer to where the GPU stores u_time
        let resolution_location;    // resolution_location will refer to where GPU stores u_resolution
        let mouse_location; // mouse_location will refer to where GPU stores u_mouse
        // 3 state booleans: Vertex shader loaded? / Fragment6 shader loaded? / User clicked "Pause"? 
        let [vs_loaded, fs_loaded, paused, euclidean, started] = [false, false, false, false, false];

        
            
        // Get the code text from the script elements.
        vShaderCode = document.scripts[1].text;
        fShaderCode = document.scripts[2].text;

        // Read & compile shaders; if no compile errors, then spring into action by initiating linking
        // which leads on to the shaders actually being run.

        console.log(`\n\n*** Vertex shader source code *** \n\n${vShaderCode}\n\n`);
        // Load and compile vertex shader code
        vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vShaderCode);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error(`\n\n*** ERROR compiling vertex shader ***`, gl.getShaderInfoLog(vertexShader));
            vs_loaded = false;
        }
        else {
            vs_loaded = true;
        }
                        
        console.log(`\n\n*** Fragment shader source code *** \n\n${fShaderCode}\n\n`);
        // Load and compile fragment shader code
        fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fShaderCode);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error(`\n\n*** ERROR compiling fragment shader ***`, gl.getShaderInfoLog(fragmentShader));
            fs_loaded = false;
        }
        else {
            fs_loaded = true;
        }

        if (vs_loaded && fs_loaded) {
            linkShaders();
        }
        else {
            console.error(`*** ERROR: Cannot run shaders - see log... ***\n\n`);
        }

        // Called from handleFileSelect(); both shaders are now compiled & loaded,
        // so link them into a `program` 
        function linkShaders() {
            console.log(`*** INFO:  Linking shaders... ***`);
            let program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error(`*** ERROR linking program ***`, gl.getProgramInfoLog(program));
                return;
            }
            console.log(`*** INFO:  Validating program... ***`);
            gl.validateProgram(program);
            if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
                console.error(`*** ERROR validating program ***`, gl.getProgramInfoLog(program));
                return;
            }
            setupBuffers();
            linkAttributes(program);
            gl.useProgram(program);

            time_location = gl.getUniformLocation(program, `u_time`);
            resolution_location = gl.getUniformLocation(program, `u_resolution`);
            mouse_location = gl.getUniformLocation(program, `u_mouse`); 
            if (!started) {
                t0 = Date.now();
            }
            started = true;
            render(program);  
        }

        function setupBuffers() {
            gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
        }

        function linkAttributes(program) {
            let positionAttribLocation = gl.getAttribLocation(program, `vertPosition`)
            gl.vertexAttribPointer(
                positionAttribLocation,  // Attribute location
                2,                                         // Number of elements per attribute
                gl.FLOAT,                                  // Type of elements
                gl.FALSE,                                  // Whether data is normalised
                2 * Float32Array.BYTES_PER_ELEMENT,        // Size of an individual vertex
                0,                                         // Offset from beginning of a single vertex to this attribute
            );
            gl.enableVertexAttribArray(positionAttribLocation);
        }

        function render(program) {
            if (!paused) {
                let u_time = 0.001 * (Date.now() - t0);
                gl.uniform1f(time_location, u_time);
                gl.uniform2f(resolution_location, w, h);
                gl.uniform2f(mouse_location, mx, my);         
                gl.drawArrays(
                    gl.TRIANGLES,   // WebGL drawing mode
                    0,              // How many vertices to skip
                    6,              // How many vertices to draw
                );
                requestAnimationFrame(render);
            }
        }

        function handleMouseMove(ev) {
            let bounds = canvas.getBoundingClientRect();
            [mx, my] = [2.0 * (ev.clientX - bounds.left) / bounds.width - 1.0,
                        2.0 * (ev.clientY - bounds.top) / bounds.height - 1.0];            
        }
            
        function reset() {
            t0 = Date.now();
        }    
    }
};
var socket  = io.connect();
var images = []

// Load canvas
document.addEventListener("DOMContentLoaded", function() {
    var mouse = {
      click: false,
      move: false,
      pos: {x:0, y:0},
      pos_prev: false
    };
    // get canvas element and create context
    var canvas  = document.getElementById('drawing');
    var context = canvas.getContext('2d');
    var width   = window.innerWidth;
    var height  = window.innerHeight;


    // set canvas to full browser width/height
    canvas.width = width - 5;
    canvas.height = height - 50;

    // register mouse event handlers
    canvas.onmousedown = function(e){ mouse.click = true; };
    canvas.onmouseup = function(e){ mouse.click = false; };

    canvas.onmousemove = function(e) {
      // normalize mouse position to range 0.0 - 1.0
      mouse.pos.x = e.clientX / width;
      mouse.pos.y = e.clientY / height;
      mouse.move = true;
    };

    function findPos(obj){

      var curleft = curtop = 0;
      if (obj.offsetParent) {
        do {
    			curleft += obj.offsetLeft;
    			curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
      }
      return [curleft, curtop]
    }

    var canvasOffset = findPos(canvas);
    var offsetX=canvasOffset[0];
    var offsetY=canvasOffset[1];
    var canvasWidth=canvas.width;
    var canvasHeight=canvas.height;
    var isDragging=false;

    // draw line received from server
    socket.on('draw_line', function (data) {
      var line = data.line;
      context.beginPath();
      context.moveTo(line[0].x * width, line[0].y * height);
      context.lineTo(line[1].x * width, line[1].y * height);
      context.stroke();
    });

    // Clear canvas
    socket.on('clearit', function(){
      context.clearRect(0, 0, width, height);
      console.log("client clearit");
    });

    // Upload image file
    socket.on('img', function(dataURL) {
      console.log("Image uploaded");
      var img = new Image();
      img.onload = function(){
        context.drawImage(img, width/2.5, height/15);
      };
      img.src = dataURL;
      images.push(dataURL);
    });

    // Drag image ie redraw it
    socket.on('drag', function(array) {
      console.log("Image moved");
      context.clearRect(0,0,canvasWidth,canvasHeight);
      context.drawImage(images[0],array[0]-128/2,array[1]-120/2,128,120);
    });



    // main loop, running every 25ms
    function mainLoop() {
      // check if the user is drawing
      if (mouse.click && mouse.move && mouse.pos_prev) {
        // send line to to the server
        socket.emit('draw_line', { line: [ mouse.pos, mouse.pos_prev ] });
        mouse.move = false;
      }
      mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
      setTimeout(mainLoop, 25);
    }
    mainLoop();

    document.getElementById('fileUpload').addEventListener('change', function () {

      // function mainImg() {

        if ( this.files && this.files[0] ) {
          var FR= new FileReader();
          FR.onload = function(e) {
            var img = new Image();
            img.onload = function() {
              console.log("sending: ");
              socket.emit('img', e.target.result);
            };
            img.src = e.target.result;
          };
          FR.readAsDataURL( this.files[0] );
        }
      // }
    });

    document.getElementById('drawing').addEventListener('click', function() {

      function handleMouseDown(e){
        canMouseX=parseInt(e.clientX-offsetX);
        canMouseY=parseInt(e.clientY-offsetY);
        // set the drag flag
        isDragging=true;
      }

      function handleMouseUp(e){
        canMouseX=parseInt(e.clientX-offsetX);
        canMouseY=parseInt(e.clientY-offsetY);
        // clear the drag flag
        isDragging=false;
      }

      function handleMouseOut(e){
        canMouseX=parseInt(e.clientX-offsetX);
        canMouseY=parseInt(e.clientY-offsetY);
        // user has left the canvas, so clear the drag flag
        //isDragging=false;
      }

      function handleMouseMove(e){

        if(!isDragging){return;}
        e.preventDefault();
        e.stopPropagation();
        canMouseX=parseInt(e.clientX-offsetX);
        canMouseY=parseInt(e.clientY-offsetY);
        // if the drag flag is set, clear the canvas and draw the image
        if(isDragging){
          socket.emit('drag', [canMouseX, canMouseY])
       }
      }
    });

});

function clearit(){
    socket.emit('clearit', true);
}

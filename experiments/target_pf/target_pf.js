


// On document ready
$(function() {
	var canvas = $("#canvas")[0]; // equivalent to document.getElementById
	var ctx = canvas.getContext('2d');
	ctx.fillStyle = "rgb(200,200,200)";
	ctx.fillRect(0,0,canvas.width, canvas.height);
});




/// @description Insert description here
// You can write your code in this editor
//var text = hot_reload(25);
var _x     = hot_reload(50);
var _y     = hot_reload(50);
var width  = hot_reload(200);
var height = hot_reload(200);
var first  = hot_reload(6  * 6);
var second = hot_reload(20 * 6);
var third  = hot_reload(22 * 6);
var fourth = hot_reload(18 * 6);
var mult1  = hot_reload(8);
var mult2  = hot_reload(8);
var mult3  = hot_reload(8);
var mult4  = hot_reload(8);

draw_rectangle(
_x + mult1 * cos(current_time / first), 
_y + mult2 * sin(current_time / second), 
_x + mult3 * sin(current_time / third) + width, 
_y + mult4 * cos(current_time / fourth) + height, 
false);
//game_end();
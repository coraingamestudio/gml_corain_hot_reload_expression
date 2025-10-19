/// @description Insert description here
// You can write your code in this editor
if (timer >= refresh_time)
{
	timer = 0;
	//show_debug_message("refr");
	//http_post_string(url + "/continuous_connection", "");
	//show_debug_message("Server refresh");
}

previous_calling_object = "";
	
if (initial_function_call)
{
	line_id                 = 0;
	initial_function_call   = false;
}
else
{
	//game_end();
}
/// @description Insert description here
// You can write your code in this editor
refresh_time = 60;
timer        = 0;
url          = "http://localhost:8080";

hot_reload_return_value_map = ds_map_create();

tracked_files_handles = [];
post_handles = [];


function post(str)
{
	if (timer >= refresh_time)
	{
		array_push(post_handles, http_post_string(url, str));
	}
}
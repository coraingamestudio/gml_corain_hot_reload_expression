/// @description Insert description here
// You can write your code in this editor
refresh_time = 60;
timer        = 0;
url          = "http://localhost:8080";

previous_calling_object = "";
initial_function_call   = true;
line_id                 = 0;

event_line_map = ds_map_create();
hot_reload_return_value_map = ds_map_create();

tracked_files_handles = [];
post_handles = [];

function post(str)
{
	array_push(post_handles, http_post_string(url, str));
}

function separate_calling_object(calling_object)
{
	var split_string     = string_split(calling_object, ":");
	var resulting_string = "";
	var len              = array_length(split_string);
	
	for (var i = 0, desired_len = len - 1; i < desired_len; i += 1)
	{
		resulting_string += split_string[i] + (i == desired_len - 1? "" : ":");
	}
	
	return {
		calling_object_no_line_id: resulting_string,
		line_id:                   split_string[len - 1]
	};
}
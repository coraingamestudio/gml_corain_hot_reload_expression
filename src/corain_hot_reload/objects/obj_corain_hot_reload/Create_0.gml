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

function separate_calling_object(calling_object)
{
	var splitted_string  = string_split(calling_object, ":");
	var resulting_string = "";
	var len = array_length(splitted_string);
	for (var i = 0, desired_len = len - 1; i < desired_len; i += 1)
	{
		resulting_string += splitted_string[i] + (i == desired_len - 1? "" : ":");
	}
	
	return {
		calling_object_no_line_id: resulting_string,
		line_id: splitted_string[len - 1]
	};
}
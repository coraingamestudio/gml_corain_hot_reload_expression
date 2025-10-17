// Script assets have changed for v2.3.0 see
// https://help.yoyogames.com/hc/en-us/articles/360005277377 for more information
function hot_reload_init()
{
	instance_create_depth(0, 0, 0, obj_corain_hot_reload);
}

function hot_reload(value)
{
	var backend        = obj_corain_hot_reload;
	var calling_object = string_copy(debug_get_callstack()[1], 12, 999);
	
	if (!ds_map_exists(backend.hot_reload_return_value_map, calling_object))
	{
		ds_map_add(backend.hot_reload_return_value_map, calling_object, {return_value: undefined, line_was_changed: false});
	}
	
	var body = {
		function_call : calling_object
	};
	
	var hot_reload_info = ds_map_find_value(backend.hot_reload_return_value_map, calling_object);
	var json            = json_stringify(body);
	
	if (!hot_reload_info.line_was_changed)
	{
		if (backend.timer >= backend.refresh_time)
		{
			array_push(backend.tracked_files_handles, http_post_string(backend.url + "/tracked_files", json));
		}
		return value;
	}

	backend.post(json);
	
	return hot_reload_info.return_value == undefined? value : hot_reload_info.return_value;
}
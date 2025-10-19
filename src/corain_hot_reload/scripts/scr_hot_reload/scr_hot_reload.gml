// Script assets have changed for v2.3.0 see
// https://help.yoyogames.com/hc/en-us/articles/360005277377 for more information
function hot_reload_init()
{
	instance_create_depth(0, 0, 0, obj_corain_hot_reload);
}

function hot_reload(value)
{
	//show_debug_message(value);
	static event_line_array        = [];
	var backend                 = obj_corain_hot_reload;
	
	var hot_reload_info           = undefined;
																	// [current procedure, calling procedure, ...]
	var calling_object_no_line_id = string_copy(debug_get_callstack()[1], 12, 999);
	var update_line_id            = backend.previous_calling_object == calling_object_no_line_id;
	
	if (backend.initial_function_call)	
	{
		if (!ds_map_exists(backend.event_line_map, calling_object_no_line_id))
		{
			backend.line_id = 0;
			ds_map_add(backend.event_line_map, calling_object_no_line_id, []);
			if (backend.previous_calling_object != "")
			{
				ds_map_set(backend.event_line_map, backend.previous_calling_object, event_line_array);
				//show_debug_message(event_line_array);
			}
		
			event_line_array = ds_map_find_value(backend.event_line_map, calling_object_no_line_id);
		}
			
	
		if (update_line_id)
		{
			backend.line_id += 1;
		}
	
		var calling_object = calling_object_no_line_id + ":" + string(backend.line_id);
	
		//TODO: Store the length, no the whole string;
		array_push(event_line_array, calling_object);
		hot_reload_info = { return_value : undefined };
		backend.previous_calling_object = calling_object_no_line_id;
		return value;
	}
	
	event_line_array = ds_map_find_value(backend.event_line_map, calling_object_no_line_id);
	var _ = event_line_array;
	var __ = backend.previous_calling_object;
	var len              = array_length(event_line_array);
	
	if (update_line_id)
	{
		backend.line_id += 1;	
	}
	else
	{
		backend.line_id = 0;		
	}
	
	var calling_object = event_line_array[(len - backend.line_id) - 1];
	
	if (!ds_map_exists(backend.hot_reload_return_value_map, calling_object))
	{
		hot_reload_info = {return_value: undefined, line_was_changed: false};
		ds_map_add(backend.hot_reload_return_value_map, calling_object, hot_reload_info);
	}
	else
	{
		hot_reload_info = ds_map_find_value(backend.hot_reload_return_value_map, calling_object);
	}
	
	if (backend.timer >= backend.refresh_time)
	{
		//show_debug_message($"Calling object: {calling_object}, LineID: {backend.line_id}");
		var body = {
			function_call : calling_object
		};

		var json        = json_stringify(body);

		backend.post(json);
	}
	
	backend.previous_calling_object = calling_object_no_line_id;
	return (hot_reload_info.return_value == undefined)? value : hot_reload_info.return_value;
}
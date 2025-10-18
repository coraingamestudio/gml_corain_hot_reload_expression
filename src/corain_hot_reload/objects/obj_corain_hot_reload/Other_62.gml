/// @description Insert description here
// You can write your code in this editor

for (var i = 0, len = array_length(post_handles); i < len; i += 1)
{
	var handle = post_handles[i];
	if (async_load[? "id"] != handle) continue;
	
	switch (async_load[? "status"])
	{
		case 0:
		{
			//show_debug_message("Iterating post_handles: handling id " + string(handle));
			var value = json_parse(async_load[? "result"]);
			show_debug_message(value);
			
			var old_value = ds_map_find_value(hot_reload_return_value_map, value.key);
			ds_map_set(hot_reload_return_value_map,
			value.key,
			{
				return_value: value.value,
				line_was_changed: old_value == undefined? false : old_value.line_was_changed
			});
			array_delete(post_handles, i, 1);
		} exit;
	}
}

for (var i = 0, len = array_length(tracked_files_handles); i < len; i += 1)
{
	var handle = tracked_files_handles[i];
	if (async_load[? "id"] != handle) continue;
	
	switch (async_load[? "status"])
	{
		case 0:
		{
			//show_debug_message("Iterating tracked_files_handles: handling id " + string(handle));
			var value = json_parse(async_load[? "result"]);
			show_debug_message(value);
			var line_info = ds_map_find_value(hot_reload_return_value_map, value.key);
			//show_debug_message(line_info);
			line_info.line_was_changed = value.line_was_changed;
			//show_debug_message("file_was_changed: " + string(_file_was_changed));
			array_delete(tracked_files_handles, i, 1);
		} exit;
	}
	
}
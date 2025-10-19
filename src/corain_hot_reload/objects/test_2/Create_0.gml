/// @description Insert description here
// You can write your code in this editor
member_test_hot_reload1 = function()
{
	return hot_reload(2);
}

member_test_hot_reload2 = function()
{
	return test_hot_reload();
}

function member_test_hot_reload3()
{
	var var1 = member_test_hot_reload2();
	return hot_reload(2);
}

# Hot Reload Expressions in GameMaker

This project provides a **hot reload expression system** for GameMaker projects using a local server.  
It allows you to update numeric values in the source code and see the changes without needing to recompile.

---

## 🚀 Getting Started

### 1. Run the Server
The server is located in the `datafiles` folder of your GameMaker project.

The server must be being executed for it to work.

### 2. Place the object in the room
The `obj_corain_hot_reload` object is also needed for it to work, if the `hot_reload` function is invoked but this object doesn't exist, the game will crash.

You can call `hot_reload_init()` and it will create the object for you.

You can also just place it in the room.

### 3. Use the `hot_reload` function
Now you can use the `hot_reload` function with numeric expressions.

Example: ```var rectangle_width = hot_reload(64)```

Everytime you change that argument in the `hot_reload` function, it will update in-game.

Warning: There can only be one `hot_reload` invocation per line of code.


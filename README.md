# ⚡ Hot Reload Expressions in GameMaker

This project provides a **hot reload expression system** for **GameMaker** using a local server.  

It's not uncommon that you just need to see the results of trivial numerical changes. But with big projects, recompiling can be really incovenient. 
This project allows you to update **numeric values directly in your source code** and see the results without recompiling.

---

## 🚀 Getting Started

### 1️⃣ Run the Server
##
The server is located in your GameMaker project’s **`datafiles`** folder.  
Make sure it’s **running** for hot reload to work properly.

`📁 YOUR_PROJECT > 📁 datafiles > 📄 corain_hot_reload_server.exe`



### 2️⃣ Place the Object in the Room
##
The object **`obj_corain_hot_reload`** is required for the system to function.

You can:
- Call `hot_reload_init()` — this automatically creates the object at runtime, **or**
- Place `obj_corain_hot_reload` manually in the room.

> ⚠️ **Warning**  
> If the `hot_reload()` function is called **without** this object existing, the game **will crash**.

### 3️⃣ Use the `hot_reload()` function
##
You can now wrap any **numeric or arithmetic expression** inside the `hot_reload()` function.

#### Example:
```js
var rectangle_width = hot_reload(64);
```
Every time you modify the argument inside hot_reload(), the value updates live in-game.

Arithmetic expressions also work.
#### Example:
```js
var rectangle_width = hot_reload(35 * 5 / 5);
```
---
## ⚙️ More costumizations
The server updates every second, but this can be changed by going in the `obj_corain_hot_reload` object and changing the `refresh_time` variable to the time you want (in steps: ```js 60``` fps -> ```js 1``` second at ```js 60``` fps).

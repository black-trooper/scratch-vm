/**
* This is the extension designed for Scratch3.0 by Seiji Matsushita in Japan
*  to have fan of programming to manipulate a Minecraft world.
*
* This requires "raspberryjammod" at least,
*  which is to be installed with Minecraft based on "Forge".
* Please see also "https://github.com/arpruss/raspberryjammod".
*
* This has the two mode to communicate with "raspberryjammod", which manipulates Minecraft.
*
* One mode sends commands directly to "raspberryjammod" by WebSocket,
*  but it enables only some basic blocks to work. 
*
* The other mode sends abstract commands to "scratchserver.py" as the helper http server,
*  so that Scratch can work easily and very fast.
*
* If the helper "scratchserver.py" is installed and running,
*  all of blocks in this extension can work for Minecraft.
* Otherwise, some blocks which can draw complex 2D/3D figures, for example "draw egg", "draw ellipse", etc,
*  cannot work and will issue error status.
*
* The helper is written in Python3 with "aiohttp" package and should be in "mcpipy" directory.
*  ("mcpipy" can be got with "raspberryjammod".)
* It receives each abstract command as http GET, formatted as below.
*  "http://hostname:12345/command[/param1][/param2]...[/paramN]
* And it analyzes to send series of basic commands to "raspberryjammod".
* So Scratch can work fast and have more complex command blocks.
*
*/

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');

const EXTENSION_NAME = {
    'ja': 'マイクラ',
    'ja-Hira': 'マイクラ',
    'en': 'Minecraft'
};

const blockIconURI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpCMzlGMEY4N0I2QzExMUU5QjA4RkIyRUUxRTA3NkFEMSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpCMzlGMEY4OEI2QzExMUU5QjA4RkIyRUUxRTA3NkFEMSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkIzOUYwRjg1QjZDMTExRTlCMDhGQjJFRTFFMDc2QUQxIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkIzOUYwRjg2QjZDMTExRTlCMDhGQjJFRTFFMDc2QUQxIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+n1Gi4wAAEAFJREFUeNqsWFms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';

const BLOCKS = {
    'ja': [
        [0, 0, '空気'],
        [1, 0, '石'],
        [2, 0, '草'],
        [3, 0, '土'],
        [4, 0, '丸石'],
        [5, 0, 'オークの木材'],
        [5, 1, '松の木材'],
        [5, 2, 'シラカバの木材'],
        [5, 3, 'ジャングルの木材'],
        [5, 4, 'アカシアの木材'],
        [5, 5, 'ダークオークの木材'],
        [6, 0, '苗木'],
        [7, 0, '岩ばん'],
        [8, 0, '流れる水'],
        [9, 0, '止まった水'],
        [10, 0, '流れる溶岩'],
        [11, 0, '止まった溶岩'],
        [12, 0, '砂'],
        [13, 0, '砂利'],
        [17, 0, '原木'],
        [20, 0, 'ガラス'],
        [22, 0, 'ラピスラズリブロック'],
        [24, 0, '砂岩'],
        [41, 0, '金ブロック'],
        [42, 0, '鉄ブロック'],
        [44, 0, '石ハーフ'],
        [45, 0, 'レンガ'],
        [49, 0, '黒よう石'],
        [57, 0, 'ダイヤモンドブロック'],
        [79, 0, '氷'],
        [80, 0, '雪ブロック'],
        [88, 0, 'ソウルサンド'],
        [133, 0, 'エメラルドブロック'],
        [152, 0, 'レッドストーンブロック'],
        [153, 0, 'ネザー水晶ブロック'],
        [165, 0, 'スライムブロック'],
        //REDs
        [23, 0, 'ディスペンサー'],
        [25, 0, '音符ブロック'],
        [27, 0, 'パワードレール'],
        [28, 0, 'ディテクターレール'],
        [33, 0, 'ピストン'],
        [46, 0, 'TNT'],
        [52, 0, 'モンスタースポナー'],
        [54, 0, 'チェスト'],
        [66, 0, 'レール'],
        [69, 0, 'レバー'],
        [72, 0, '木の感圧版'],
        [77, 0, '石のボタン'],
        [137, 0, 'コマンドブロック'],
        [138, 0, 'ビーコン'],
        [143, 0, '木のボタン'],
        [151, 0, '日照センサー'],
        //DECOs
        [26, 0, 'ベッド'],
        [30, 0, 'クモの巣'],
        [39, 0, '茶キノコ'],
        [40, 0, '赤キノコ'],
        [47, 0, '本だな'],
        [50, 0, 'たいまつ'],
        [51, 0, '炎'],
        [53, 0, 'オークの木の階段'],
        [64, 0, '木のドア'],
        [65, 0, 'はしご'],
        [71, 0, '鉄のドア'],
        [78, 0, '雪'],
        [81, 0, 'サボテン'],
        [89, 0, 'グロウストーン'],
        [91, 0, 'ジャック・オ・ランタン'],
        [113, 0, 'ネザーレンガのフェンス'],
        [175, 0, 'ひまわり'],
        //WOOLs
        [35, 0, '羊毛'],
        [35, 0, '白色の羊毛'],
        [35, 1, 'だいだい色の羊毛'],
        [35, 2, '赤むらさき色の羊毛'],
        [35, 3, '水色の羊毛'],
        [35, 4, '黄色の羊毛'],
        [35, 5, '黄緑色の羊毛'],
        [35, 6, 'もも色の羊毛'],
        [35, 7, '灰色の羊毛'],
        [35, 8, 'うすい灰色の羊毛'],
        [35, 9, '空色の羊毛'],
        [35, 10, 'むらさき色の羊毛'],
        [35, 11, '青色の羊毛'],
        [35, 12, '茶色の羊毛'],
        [35, 13, '緑色の羊毛'],
        [35, 14, '赤色の羊毛'],
        [35, 15, '黒色の羊毛'],
        //SGLASSs
        [95, 0, 'ステンドグラス'],
        [95, 0, '白色のステンドグラス'],
        [95, 1, 'だいだい色のステンドグラス'],
        [95, 2, '赤むらさき色のステンドグラス'],
        [95, 3, '水色のステンドグラス'],
        [95, 4, '黄色のステンドグラス'],
        [95, 5, '黄緑色のステンドグラス'],
        [95, 6, 'もも色のステンドグラス'],
        [95, 7, '灰色のステンドグラス'],
        [95, 8, 'うすい灰色のステンドグラス'],
        [95, 9, '空色のステンドグラス'],
        [95, 10, 'むらさき色のステンドグラス'],
        [95, 11, '青色のステンドグラス'],
        [95, 12, '茶色のステンドグラス'],
        [95, 13, '緑色のステンドグラス'],
        [95, 14, '赤色のステンドグラス'],
        [95, 15, '黒色のステンドグラス'],
        //CARPETs
        [171, 0, 'カーペット'],
        [171, 0, '白色のカーペット'],
        [171, 1, 'だいだい色のカーペット'],
        [171, 2, '赤むらさき色のカーペット'],
        [171, 3, '水色のカーペット'],
        [171, 4, '黄色のカーペット'],
        [171, 5, '黄緑色のカーペット'],
        [171, 6, 'もも色のカーペット'],
        [171, 7, '灰色のカーペット'],
        [171, 8, 'うすい灰色のカーペット'],
        [171, 9, '空色のカーペット'],
        [171, 10, 'むらさき色のカーペット'],
        [171, 11, '青色のカーペット'],
        [171, 12, '茶色のカーペット'],
        [171, 13, '緑色のカーペット'],
        [171, 14, '赤色のカーペット'],
        [171, 15, '黒色のカーペット']
    ],

    'ja-Hira': [
        [0, 0, 'くうき'],
        [1, 0, 'いし'],
        [2, 0, 'くさ'],
        [3, 0, 'つち'],
        [4, 0, 'まるいし'],
        [5, 0, 'オークのもくざい'],
        [5, 1, 'まつのもくざい'],
        [5, 2, 'シラカバのもくざい'],
        [5, 3, 'ジャングルのもくざい'],
        [5, 4, 'アカシアのもくざい'],
        [5, 5, 'ダークオークのもくざい'],
        [6, 0, 'なえぎ'],
        [7, 0, 'がんばん'],
        [8, 0, 'ながれるみず'],
        [9, 0, 'とまったみず'],
        [10, 0, 'ながれるようがん'],
        [11, 0, 'とまったようがん'],
        [12, 0, 'すな'],
        [13, 0, 'じゃり'],
        [17, 0, 'げんぼく'],
        [20, 0, 'ガラス'],
        [22, 0, 'ラピスラズリブロック'],
        [24, 0, 'さがん'],
        [41, 0, 'きんブロック'],
        [42, 0, 'てつブロック'],
        [44, 0, 'いしハーフ'],
        [45, 0, 'レンガ'],
        [49, 0, 'こくようせき'],
        [57, 0, 'ダイヤモンドブロック'],
        [79, 0, 'こおり'],
        [80, 0, 'ゆきブロック'],
        [88, 0, 'ソウルサンド'],
        [133, 0, 'エメラルドブロック'],
        [152, 0, 'レッドストーンブロック'],
        [153, 0, 'ネザーすいしょうブロック'],
        [165, 0, 'スライムブロック'],
        //REDs
        [23, 0, 'ディスペンサー'],
        [25, 0, 'おんぷブロック'],
        [27, 0, 'パワードレール'],
        [28, 0, 'ディテクターレール'],
        [33, 0, 'ピストン'],
        [46, 0, 'TNT'],
        [52, 0, 'モンスタースポナー'],
        [54, 0, 'チェスト'],
        [66, 0, 'レール'],
        [69, 0, 'レバー'],
        [72, 0, 'きのかんあつばん'],
        [77, 0, 'いしのボタン'],
        [137, 0, 'コマンドブロック'],
        [138, 0, 'ビーコン'],
        [143, 0, 'きのボタン'],
        [151, 0, 'にっしょうセンサー'],
        //DECOs
        [26, 0, 'ベッド'],
        [30, 0, 'クモのす'],
        [39, 0, 'ちゃキノコ'],
        [40, 0, 'あかキノコ'],
        [47, 0, 'ほんだな'],
        [50, 0, 'たいまつ'],
        [51, 0, 'ほのお'],
        [53, 0, 'オークのきのかいだん'],
        [64, 0, 'きのドア'],
        [65, 0, 'はしご'],
        [71, 0, 'てつのドア'],
        [78, 0, 'ゆき'],
        [81, 0, 'サボテン'],
        [89, 0, 'グロウストーン'],
        [91, 0, 'ジャック・オ・ランタン'],
        [113, 0, 'ネザーレンガのフェンス'],
        [175, 0, 'ひまわり'],
        //WOOLs
        [35, 0, 'ようもう'],
        [35, 0, 'しろいろのようもう'],
        [35, 1, 'だいだいいろのようもう'],
        [35, 2, 'あかむらさきいろのようもう'],
        [35, 3, 'みずいろのようもう'],
        [35, 4, 'きいろのようもう'],
        [35, 5, 'きみどりいろのようもう'],
        [35, 6, 'ももいろのようもう'],
        [35, 7, 'はいいろのようもう'],
        [35, 8, 'うすいはいいろのようもう'],
        [35, 9, 'そらいろのようもう'],
        [35, 10, 'むらさきいろのようもう'],
        [35, 11, 'あおいろのようもう'],
        [35, 12, 'ちゃいろのようもう'],
        [35, 13, 'みどりいろのようもう'],
        [35, 14, 'あかいろのようもう'],
        [35, 15, 'くろいろのようもう'],
        //SGLASSs
        [95, 0, 'ステンドグラス'],
        [95, 0, 'しろいろのステンドグラス'],
        [95, 1, 'だいだいいろのステンドグラス'],
        [95, 2, 'あかむらさきいろのステンドグラス'],
        [95, 3, 'みずいろのステンドグラス'],
        [95, 4, 'きいろのステンドグラス'],
        [95, 5, 'きみどりいろのステンドグラス'],
        [95, 6, 'ももいろのステンドグラス'],
        [95, 7, 'はいいろのステンドグラス'],
        [95, 8, 'うすいはいいろのステンドグラス'],
        [95, 9, 'そらいろのステンドグラス'],
        [95, 10, 'むらさきいろのステンドグラス'],
        [95, 11, 'あおいろのステンドグラス'],
        [95, 12, 'ちゃいろのステンドグラス'],
        [95, 13, 'みどりいろのステンドグラス'],
        [95, 14, 'あかいろのステンドグラス'],
        [95, 15, 'くろいろのステンドグラス'],
        //CARPETs
        [171, 0, 'カーペット'],
        [171, 0, 'しろいろのカーペット'],
        [171, 1, 'だいだいいろのカーペット'],
        [171, 2, 'あかむらさきいろのカーペット'],
        [171, 3, 'みずいろのカーペット'],
        [171, 4, 'きいろのカーペット'],
        [171, 5, 'きみどりのカーペット'],
        [171, 6, 'ももいろのカーペット'],
        [171, 7, 'はいいろのカーペット'],
        [171, 8, 'うすいはいいろのカーペット'],
        [171, 9, 'そらいろのカーペット'],
        [171, 10, 'むらさきいろのカーペット'],
        [171, 11, 'あおいろのカーペット'],
        [171, 12, 'ちゃいろのカーペット'],
        [171, 13, 'みどりいろのカーペット'],
        [171, 14, 'あかいろのカーペット'],
        [171, 15, 'くろいろのカーペット']
    ],

    'en': [
        [0, 0, 'Air'],
        [1, 0, 'Stone'],
        [2, 0, 'Grass'],
        [3, 0, 'Dirt'],
        [4, 0, 'Cobblestone'],
        [5, 0, 'Oak Wood Plank'],
        [5, 1, 'Spruce Wood Plank'],
        [5, 2, 'Birch Wood Plank'],
        [5, 3, 'Jungle Wood Plank'],
        [5, 4, 'Acacia Wood Plank'],
        [5, 5, 'Dark Oak Wood Plank'],
        [6, 0, 'Oak Sapling'],
        [7, 0, 'Bedrock'],
        [8, 0, 'Flowing Water'],
        [9, 0, 'Still Water'],
        [10, 0, 'Flowing Lava'],
        [11, 0, 'Still Lava'],
        [12, 0, 'Sand'],
        [13, 0, 'Gravel'],
        [17, 0, 'Oak Wood'],
        [20, 0, 'Glass'],
        [22, 0, 'Lapis Lazuli Block'],
        [24, 0, 'Sandstone'],
        [41, 0, 'Gold Block'],
        [42, 0, 'Iron Block'],
        [44, 0, 'Stone Slab'],
        [45, 0, 'Bricks'],
        [49, 0, 'Obsidian'],
        [57, 0, 'Diamond Block'],
        [79, 0, 'Ice'],
        [80, 0, 'Snow Block'],
        [88, 0, 'Soul Sand'],
        [133, 0, 'Emerald Block'],
        [152, 0, 'Redstone Block'],
        [153, 0, 'Nether Quartz Ore'],
        [165, 0, 'Slime Block'],
        //REDs
        [23, 0, 'Dispenser'],
        [25, 0, 'Note Block'],
        [27, 0, 'Powered Rail'],
        [28, 0, 'Detector Rail'],
        [33, 0, 'Piston'],
        [46, 0, 'TNT'],
        [52, 0, 'Monster Spawner'],
        [54, 0, 'Chest'],
        [66, 0, 'Rail'],
        [69, 0, 'Lever'],
        [72, 0, 'Wooden Pressure Plate'],
        [77, 0, 'Stone Button'],
        [137, 0, 'Command Block'],
        [138, 0, 'Beacon'],
        [143, 0, 'Wooden Button'],
        [151, 0, 'Daylight Sensor'],
        //DECOs
        [26, 0, 'Bed'],
        [30, 0, 'Cobweb'],
        [39, 0, 'Brown Mushroom'],
        [40, 0, 'Red Mushroom'],
        [47, 0, 'Bookshelf'],
        [50, 0, 'Torch'],
        [51, 0, 'Fire'],
        [53, 0, 'Oak Wood Stairs'],
        [64, 0, 'Oak Door Block'],
        [71, 0, 'Iron Door Block'],
        [78, 0, 'Snow'],
        [81, 0, 'Cactus'],
        [89, 0, 'Glowstone'],
        [91, 0, 'Jack o\'Lantern'],
        [113, 0, 'Nether Brick Fence'],
        [175, 0, 'Sunflower'],
        //WOOLs
        [35, 0, 'Wool'],
        [35, 0, 'White Wool'],
        [35, 1, 'Orange Wool'],
        [35, 2, 'Magenta Wool'],
        [35, 3, 'Light Blue Wool'],
        [35, 4, 'Yellow Wool'],
        [35, 5, 'Lime Wool'],
        [35, 6, 'Pink Wool'],
        [35, 7, 'Gray Wool'],
        [35, 8, 'Light Gray Wool'],
        [35, 9, 'Cyan Wool'],
        [35, 10, 'Purple Wool'],
        [35, 11, 'Blue Wool'],
        [35, 12, 'Brown Wool'],
        [35, 13, 'Green Wool'],
        [35, 14, 'Red Wool'],
        [35, 15, 'Black Wool'],
        //SGLASSs
        [95, 0, 'Stained Glass'],
        [95, 0, 'White Stained Glass'],
        [95, 1, 'Orange Stained Glass'],
        [95, 2, 'Magenta Stained Glass'],
        [95, 3, 'Light Blue Stained Glass'],
        [95, 4, 'Yellow Stained Glass'],
        [95, 5, 'Lime Stained Glass'],
        [95, 6, 'Pink Stained Glass'],
        [95, 7, 'Gray Stained Glass'],
        [95, 8, 'Light Gray Stained Glass'],
        [95, 9, 'Cyan Stained Glass'],
        [95, 10, 'Purple Stained Glass'],
        [95, 11, 'Blue Stained Glass'],
        [95, 12, 'Brown Stained Glass'],
        [95, 13, 'Green Stained Glass'],
        [95, 14, 'Red Stained Glass'],
        [95, 15, 'Black Stained Glass'],
        //CARPETs
        [171, 0, 'Carpet'],
        [171, 0, 'White Carpet'],
        [171, 1, 'Orange Carpet'],
        [171, 2, 'Magenta Carpet'],
        [171, 3, 'Light Blue Carpet'],
        [171, 4, 'Yellow Carpet'],
        [171, 5, 'Lime Carpet'],
        [171, 6, 'Pink Carpet'],
        [171, 7, 'Gray Carpet'],
        [171, 8, 'Light Gray Carpet'],
        [171, 9, 'Cyan Carpet'],
        [171, 10, 'Purple Carpet'],
        [171, 11, 'Blue Carpet'],
        [171, 12, 'Brown Carpet'],
        [171, 13, 'Green Carpet'],
        [171, 14, 'Red Carpet'],
        [171, 15, 'Black Carpet']
    ]
};

const MENU_BLOCKS = {
    'ja': ['空気', '石', '草', '土', '丸石', 'オークの木材', '松の木材', 'シラカバの木材', 'ジャングルの木材', 'アカシアの木材', 'ダークオークの木材', '苗木', '岩ばん', '流れる水', '止まった水', '流れる溶岩', '止まった溶岩', '砂', 'じゃり', '原木', 'ガラス', 'ラピスラズリブロック', '砂岩', '金ブロック', '鉄ブロック', '石ハーフ', 'レンガ', '黒よう石', 'ダイヤモンドブロック', '氷', '雪ブロック', 'ソウルサンド', 'エメラルドブロック', 'レッドストーンブロック', 'ネザー水晶ブロック', 'スライムブロック'],
    'ja-Hira': ['くうき', 'いし', 'くさ', 'つち', 'まるいし', 'オークのもくざい', 'まつのもくざい', 'シラカバのもくざい', 'ジャングルのもくざい', 'アカシアのもくざい', 'ダークオークのもくざい', 'なえぎ', 'がんばん', 'ながれるみず', 'とまったみ', 'ながれるようがん', 'とまったようがん', 'すな', 'じゃり', 'げんぼく', 'ガラス', 'ラピスラズリブロック', 'さがん', 'きんブロック', 'てつブロック', 'いしハーフ', 'レンガ', 'こくようせき', 'ダイヤモンドブロック', 'こおり', 'ゆきブロック', 'ソウルサンド', 'エメラルドブロック', 'レッドストーンブロック', 'ネザーすいしょうブロック', 'スライムブロック'],
    'en': ['Air', 'Stone', 'Grass', 'Dirt', 'Cobblestone', 'Oak Wood Plank', 'Spruce Wood Plank', 'Birch Wood Plank', 'Jungle Wood Plank', 'Acacia Wood Plank', 'Dark Oak Wood Plank', 'Oak Sapling', 'Bedrock', 'Flowing Water', 'Still Water', 'Flowing Lava', 'Still Lava', 'Sand', 'Gravel', 'Oak Wood', 'Glass', 'Lapis Lazuli Block', 'Sandstone', 'Gold Block', 'Iron Block', 'Stone Slab', 'Bricks', 'Obsidian', 'Diamond Block', 'Ice', 'Snow Block', 'Soul Sand', 'Emerald Block', 'Redstone Block', 'Nether Quartz Ore', 'Slime Block']
};

const MENU_REDS = {
    'ja': ['ディスペンサー', '音符ブロック', 'パワードレール', 'ディテクターレール', 'ピストン', 'TNT', 'モンスタースポナー', 'チェスト', 'レール', 'レバー', '木の感圧版', '石のボタン', 'コマンドブロック', 'ビーコン', '木のボタン', '日照センサー'],
    'ja-Hira': ['ディスペンサー', 'おんぷブロック', 'パワードレール', 'ディテクターレール', 'ピストン', 'TNT', 'モンスタースポナー', 'チェスト', 'レール', 'レバー', 'きのかんあつばん', 'いしのボタン', 'コマンドブロック', 'ビーコン', 'きのボタン', 'にっしょうセンサー'],
    'en': ['Dispenser', 'Note Block', 'Powered Rail', 'Detector Rail', 'Piston', 'TNT', 'Monster Spawner', 'Chest', 'Rail', 'Lever', 'Wooden Pressure Plate', 'Stone Button', 'Command Block', 'Beacon', 'Wooden Button', 'Daylight Sensor']
};

const MENU_DECOS = {
    'ja': ['ベッド', 'クモの巣', '茶キノコ', '赤キノコ', '本だな', 'たいまつ', '炎', 'オークの木の階段', '木のドア', 'はしご', '鉄のドア', '雪', 'サボテン', 'グロウストーン', 'ジャック・オ・ランタン', 'ネザーレンガのフェンス', 'ひまわり'],
    'ja-Hira': ['ベッド', 'クモのす', 'ちゃキノコ', 'あかキノコ', 'ほんだな', 'たいまつ', 'ほのお', 'オークのきのかいだん', 'きのドア', 'はしご', 'てつのドア', 'ゆき', 'サボテン', 'グロウストーン', 'ジャック・オ・ランタン', 'ネザーレンガのフェンス', 'ひまわり'],
    'en': ['Bed', 'Cobweb', 'Brown Mushroom', 'Red Mushroom', 'Bookshelf', 'Torch', 'Fire', 'Oak Wood Stairs', 'Oak Door Block', 'Ladder', 'Iron Door Block', 'Snow', 'Cactus', 'Glowstone', 'Jack o\'Lantern', 'Nether Brick Fence', 'Sunflower']
};

const MENU_WOOLS = {
    'ja': ['羊毛', '白色の羊毛', 'だいだい色の羊毛', '赤むらさき色の羊毛', '水色の羊毛', '黄色の羊毛', '黄緑色の羊毛', 'もも色の羊毛', '灰色の羊毛', 'うすい灰色の羊毛', '空色の羊毛', 'むらさき色の羊毛', '青色の羊毛', '茶色の羊毛', '緑色の羊毛', '赤色の羊毛', '黒色の羊毛'],
    'ja-Hira': ['ようもう', 'しろいろのようもう', 'だいだいいろのようもう', 'あかむらさきいろのようもう', 'みずいろのようもう', 'きいろのようもう', 'きみどりいろのようもう', 'ももいろのようもう', 'はいいろのようもう', 'うすいはいいろのようもう', 'そらいろのようもう', 'むらさきいろのようもう', 'あおいろのようもう', 'ちゃいろのようもう', 'みどりいろのようもう', 'あかいろのようもう', 'くろいろのようもう'],
    'en': ['Wool', 'White Wool', 'Orange Wool', 'Magenta Wool', 'Light Blue Wool', 'Yellow Wool', 'Lime Wool', 'Pink Wool', 'Gray Wool', 'Light Gray Wool', 'Cyan Wool', 'Purple Wool', 'Blue Wool', 'Brown Wool', 'Green Wool', 'Red Wool', 'Black Wool']
};

const MENU_SGLASSS = {
    'ja': ['ステンドグラス', '白色のステンドグラス', 'だいだい色のステンドグラス', '赤むらさき色のステンドグラス', '水色のステンドグラス', '黄色のステンドグラス', '黄緑色のステンドグラス', 'もも色のステンドグラス', '灰色のステンドグラス', 'うすい灰色のステンドグラス', '空色のステンドグラス', 'むらさき色のステンドグラス', '青色のステンドグラス', '茶色のステンドグラス', '緑色のステンドグラス', '赤色のステンドグラス', '黒色のステンドグラス'],
    'ja-Hira': ['ステンドグラス', 'しろいろのステンドグラス', 'だいだいいろのステンドグラス', 'あかむらさきいろのステンドグラス', 'みずいろのステンドグラス', 'きいろのステンドグラス', 'きみどりいろのステンドグラス', 'ももいろのステンドグラス', 'はいいろのステンドグラス', 'うすいはいいろのステンドグラス', 'そらいろのステンドグラス', 'むらさきいろのステンドグラス', 'あおいろのステンドグラス', 'ちゃいろのステンドグラス', 'みどりいろのステンドグラス', 'あかいろのステンドグラス', 'くろいろのステンドグラス'],
    'en': ['Stained Glass', 'White Stained Glass', 'Orange Stained Glass', 'Magenta Stained Glass', 'Light Blue Stained Glass', 'Yellow Stained Glass', 'Lime Stained Glass', 'Pink Stained Glass', 'Gray Stained Glass', 'Light Gray Stained Glass', 'Cyan Stained Glass', 'Purple Stained Glass', 'Blue Stained Glass', 'Brown Stained Glass', 'Green Stained Glass', 'Red Stained Glass', 'Black Stained Glass']
};

const MENU_CARPETS = {
    'ja': ['カーペット', '白色のカーペット', 'だいだい色のカーペット', '赤むらさき色のカーペット', '水色のカーペット', '黄色のカーペット', '黄緑色のカーペット', 'もも色のカーペット', '灰色のカーペット', 'うすい灰色のカーペット', '空色のカーペット', 'むらさき色のカーペット', '青色のカーペット', '茶色のカーペット', '緑色のカーペット', '赤色のカーペット', '黒色のカーペット'],
    'ja-Hira': ['カーペット', 'しろいろのカーペット', 'だいだいいろのカーペット', 'あかむらさきいろのカーペット', 'みずいろのカーペット', 'きいろのカーペット', 'きみどりいろのカーペット', 'ももいろのカーペット', 'はいいろのカーペット', 'うすいはいいろのカーペット', 'そらいろのカーペット', 'むらさきいろのカーペット', 'あおいろのカーペット', 'ちゃいろのカーペット', 'みどりいろのカーペット', 'あかいろのカーペット', 'くろいろのカーペット'],
    'en': ['Carpet', 'White Carpet', 'Orange Carpet', 'Magenta Carpet', 'Light Blue Carpet', 'Yellow Carpet', 'Lime Carpet', 'Pink Carpet', 'Gray Carpet', 'Light Gray Carpet', 'Cyan Carpet', 'Purple Carpet', 'Blue Carpet', 'Brown Carpet', 'Green Carpet', 'Red Carpet', 'Black Carpet']
};

const FormChat = {
    'ja': 'チャット[MSG]',
    'ja-Hira': 'チャット[MSG]',
    'en': 'chat[MSG]'
};

const FormChatMsgDefault = {
    'ja': 'こんにちは！',
    'ja-Hira': 'こんにちは！',
    'en': 'Hello!'
};

const FormPreSetBlockIdData = {
    'ja': '[BlockName]を置く 　x:[X] y:[Y] z:[Z]',
    'ja-Hira': '[BlockName]をおく 　x:[X] y:[Y] z:[Z]',
    'en': 'set a[BlockName] at x:[X] y:[Y] z:[Z]'
};

const FormPreDrawLine = {
    'ja': '[BlockName]の直線 　x:[X] y:[Y] z:[Z] 〜 　x:[X1] y:[Y1] z:[Z1]',
    'ja-Hira': '[BlockName]のちょくせん 　ざひょう 　x:[X] y:[Y] z:[Z] 〜 　x:[X1] y:[Y1] z:[Z1]',
    'en': 'draw a line of[BlockName] from  x:[X] y:[Y] z:[Z] to  x:[X1] y:[Y1] z:[Z1]|  helper'
};

const FormPreSetBlocks = {
    'ja': '[BlockName]で埋め尽くす 　x:[X] y:[Y] z:[Z] 〜 　x:[X1] y:[Y1] z:[Z1]',
    'ja-Hira': '[BlockName]でうめつくす 　x:[X] y:[Y] z:[Z] 〜 　x:[X1] y:[Y1] z:[Z1]',
    'en': 'fill with[BlockName] from  x:[X] y:[Y] z:[Z] to  x:[X1] y:[Y1] z:[Z1]'
};

const FormTeleport = {
    'ja': 'テレポートする　 x:[X] y:[Y] z:[Z]',
    'ja-Hira': 'テレポートする　 x:[X] y:[Y] z:[Z]',
    'en': 'teleport to  x:[X] y:[Y] z:[Z]'
};

const FormReset = {
    'ja': 'リセット',
    'ja-Hira': 'リセット',
    'en': 'reset'
};

const FormGetPlayerPos = {
    'ja': '自分の位置を調べる',
    'ja-Hira': 'じぶんのいちをしらべる',
    'en': "get player's position"
};

const FormGetBlockInfo = {
    'ja': 'ブロックを調べる  x:[X] y:[Y] z:[Z]',
    'ja-Hira': 'ブロックをしらべる  x:[X] y:[Y] z:[Z]',
    'en': "get block ID & Data at  x:[X] y:[Y] z:[Z]"
};

const FormConnectServer = {
    'ja': 'サーバーを変更  ホスト:[HOST]',
    'ja-Hira': 'サーバーをへんこう  ホスト:[HOST]',
    'en': "change the server to[HOST]"
};

const FormBlockIdText = {
    'ja': 'ブロックのID',
    'ja-Hira': 'ブロックのID',
    'en': "block ID"
};

const FormBlockDataText = {
    'ja': 'ブロックの値',
    'ja-Hira': 'ブロックのあたい',
    'en': "block Data"
};

const FormPos_XText = {
    'ja': '自分のＸ座標',
    'ja-Hira': 'じぶんのＸざひょう',
    'en': "x of the player"
};

const FormPos_YText = {
    'ja': '自分のＹ座標',
    'ja-Hira': 'じぶんのＹざひょう',
    'en': "y of the player"
};

const FormPos_ZText = {
    'ja': '自分のＺ座標',
    'ja-Hira': 'じぶんのＺざひょう',
    'en': "z of the player"
};

const HOST_DEFAULT = 'localhost'
const PORT_HELPER_OFF = '14711';
const RETRY_MAX = 10;

class MicraWorld {
    constructor(locale) {
		/**
		* Now locale, only 3 mode supported: "ja", "ja-Hira" and "en".
		*/
        this._locale = locale;

		/**
		* Statuses of the minecraft world connected.
		*/
        this.r_pos_x = 0;
        this.r_pos_y = 0;
        this.r_pos_z = 0;
        this.r_blockId = 0;
        this.r_blockData = 0;

		/**
		* The Direct Connecter to "raspberryjammod" which is installed as a mod of the minecraft
		*  so that this extension can works without the helper "scratchserver.py".
		*/
        this._McSocket = null;
        this._connected = false;
        this._SocketRetryCount = 0;
        this._McServerHost = HOST_DEFAULT;
        this._initSocket(this._McServerHost);
        this._FunctionQueue = [];

    }

	/**
	* Controler of WebSocket, which works without helper "scratchserver.py".
	*/

    _initSocket(host) {
        if (this._McSocket == null) {
            this._connected = false;
            this._SocketRetryCount++;
            if (RETRY_MAX < this._SocketRetryCount) {
                console.log("socket error: retry over");
                this._FunctionQueue = [];
                return;
            }
            let uri = "ws://" + host + ":" + PORT_HELPER_OFF;
            this._McSocket = new WebSocket(uri);
            this._McSocket.onopen = this._onOpen.bind(this);
            this._McSocket.onmessage = this._onMessage.bind(this);
            this._McSocket.onclose = this._onClose.bind(this);
            this._McSocket.onerror = this._onError.bind(this);
        }
        this._McServerHost = host;
    }

    _onOpen() {
        console.log("socket open");
        this._connected = true;
        this._FunctionQueue = [];
        this._SocketRetryCount = 0;
    }

    _onMessage(event) {
        if (event && event.data) {
            if (0 < this._FunctionQueue.length && typeof this._FunctionQueue[0] != "undefined" && this._FunctionQueue[0] != null) {
                this._FunctionQueue[0](this, event.data);
                this._FunctionQueue.shift();
            }
        }
    }

    _onClose(event) {
        this._McSocket = null;
        this._connected = false;
        this._FunctionQueue = [];
    }

    _onError(event) {
        if (RETRY_MAX < this._SocketRetryCount) {
            console.log("socket error: retry over");
        } else {
            console.log("socket error");
        }
        this._McSocket = null;
        this._connected = false;
        this._FunctionQueue = [];
    }

    _SocketSend(cmd) {
        if (RETRY_MAX < this._SocketRetryCount) {
            console.log("socket error: retry over");
            return;
        }
        if (!this._connected) {
            this._McSocket = null;
            this._initSocket(this._McServerHost);
            window.setTimeout(function (cmd) {
                if (!this._connected) {
                    console.log("_SocketSend: session error. Socket is not open.");
                } else {
                    this._McSocket.send(cmd);
                }
            }.bind(this, cmd), 500);
        } else {
            if (cmd) {
                this._McSocket.send(cmd);
            } else {
                console.log("_SocketSend: command format error");
            }
        }
    }

    _SocketSendReceive(cmd, callback) {
        if (RETRY_MAX < this._SocketRetryCount) {
            console.log("socket error: retry over");
            return;
        }
        if (!this._connected) {
            this._McSocket = null;
            this._initSocket(this._McServerHost);
            window.setTimeout(function (cmd) {
                if (!this._connected) {
                    console.log("_SocketSend: session error. Socket is not open.");
                } else {
                    this._FunctionQueue.push(callback);
                    this._McSocket.send(cmd);
                }
            }.bind(this, cmd), 500);
        } else {
            this._FunctionQueue.push(callback);
            this._McSocket.send(cmd);
        }
    }

    ConnectServer(host) {
        this._McServerHost = host;
        this._SocketRetryCount = 0;
        this._initSocket(this._McServerHost);
    }

    Chat(msg) {
        this._SocketSend("chat.post(" + msg + ")");
    }

	/**
	* get the coordinate of the player from the minecraft world .
	*/
    getPlayerPos() {
        // to socket direct
        this._SocketSendReceive("player.getTile()", function (that, msg) {
            var args = msg.trim().split(",");
            that.r_pos_x = Math.round(parseFloat(args[0]));
            that.r_pos_y = Math.round(parseFloat(args[1]));
            that.r_pos_z = Math.round(parseFloat(args[2]));
        });
    }

	/**
	* get the Block-ID and Block-Data at the coordinate (x,y,z) from the minecraft world.
	*/
    getBlockInfo(x, y, z) {
        // to socket direct
        var prm = [x, y, z].join();
        let cmd = "world.getBlockWithData(" + prm + ")";
        this._SocketSendReceive(cmd, function (that, msg) {
            var args = msg.trim().split(",");
            that.r_blockId = parseInt(args[0], 10);
            that.r_blockData = parseInt(args[1], 10);
        });
    }

	/**
	* set a Block at the coordinate (x,y,z) in the minecraft world.
	*/
    setBlockData(id, data, x, y, z) {
        // to socket direct
        var prm = [x, y, z, id, data].join();
        this._SocketSend("world.setBlock(" + prm + ")");
    }

    _MAX(a, b) {
        return a > b ? a : b
    }

    _ZSGN(a) {
        if (a < 0) return -1
        if (a > 0) return 1
        return 0
    }

    drawLine(id, data, x, y, z, x1, y1, z1) {
        const points = this._getPoints(x, y, z, x1, y1, z1)
        for (i in points) {
            const point = points[i]
            // to socket direct
            var prm = [point.x, point.y, point.z, id, data].join();
            this._SocketSend("world.setBlock(" + prm + ")");
        }
    }

    _getPoints(x1, y1, z1, x2, y2, z2) {
        x1 = parseInt(x1)
        y1 = parseInt(y1)
        z1 = parseInt(z1)
        x2 = parseInt(x2)
        y2 = parseInt(y2)
        z2 = parseInt(z2)

        // list for vertices
        var vertices = []

        // if the 2 points are the same, return single vertice
        if (x1 == x2 && y1 == y2 && z1 == z2) {
            vertices.push({ x: x1, y: y1, z: z1 })
            return
        }

        // else get all points in edge
        const dx = x2 - x1
        const dy = y2 - y1
        const dz = z2 - z1

        const ax = Math.abs(dx) << 1
        const ay = Math.abs(dy) << 1
        const az = Math.abs(dz) << 1

        const sx = this._ZSGN(dx)
        const sy = this._ZSGN(dy)
        const sz = this._ZSGN(dz)

        let x = x1
        let y = y1
        let z = z1

        // x dominant
        if (ax >= this._MAX(ay, az)) {
            const d = (ax >> 1)
            let yd = ay - d
            let zd = az - d
            let loop = true
            while (loop) {
                vertices.push({ x, y, z })
                if (x == x2)
                    loop = false
                if (yd >= 0)
                    y += sy
                yd -= ax
                if (zd >= 0)
                    z += sz
                zd -= ax
                x += sx
                yd += ay
                zd += az
            }
        }
        // y dominant
        else if (ay >= this._MAX(ax, az)) {
            const d = (ay >> 1)
            let xd = ax - d
            let zd = az - d
            let loop = true
            while (loop) {
                vertices.push({ x, y, z })
                if (y == y2)
                    loop = false
                if (xd >= 0)
                    x += sx
                xd -= ay
                if (zd >= 0)
                    z += sz
                zd -= ay
                y += sy
                xd += ax
                zd += az
            }
        }
        // z dominant
        else if (az >= this._MAX(ax, ay)) {
            const d = (az >> 1)
            let xd = ax - d
            let yd = ay - d
            let loop = true
            while (loop) {
                vertices.push({ x, y, z })
                if (z == z2)
                    loop = false
                if (xd >= 0)
                    x += sx
                xd -= az
                if (yd >= 0)
                    y += sy
                yd -= az
                z += sz
                xd += ax
                yd += ay
            }
        }
        return vertices
    }

    /**
    * set Blocks as a cuboid, which diagonal line is defined from (x,y,z) to (x1,y1,z1) in the minecraft world.
    */
    setBlocks(id, data, x, y, z, x1, y1, z1) {
        // to socket direct
        var prm = [x, y, z, x1, y1, z1, id, data].join();
        this._SocketSend("world.setBlocks(" + prm + ")");
    }

    /**
    * Teleport the player to (x,y,z) in the minecraft world.
    */
    Teleport(x, y, z) {
        // to socket direct
        var prm = [x, y, z].join();
        this._SocketSend("player.setPos(" + prm + ")");
    }

    /**
    * Reset around (0,0,0) and make the player teleport there in the minecraft world.
    */
    Reset() {
        // to socket direct
        this._SocketSend("world.setBlocks(" + [-100, 0, -100, 100, 63, 100, 0, 0].join() + ")");
        this._SocketSend("world.setBlocks(" + [-100, -63, -100, 100, -2, 100, 1, 0].join() + ")");
        this._SocketSend("world.setBlocks(" + [-100, -1, -100, 100, -1, 100, 2, 0].join() + ")");
    }
}

class Scratch3MinecraftBlocks {

    static get EXTENSION_ID() {
        return 'minecraft';
    }

    constructor(runtime) {
        this._locale = this._setLocale();
        this.runtime = runtime;
        this._my_rtn = "";
        this._world = new MicraWorld(this._locale);
    }

    getInfo() {
        this._locale = this._setLocale();
        this._world._locale = this._locale;

        return {
            id: Scratch3MinecraftBlocks.EXTENSION_ID,
            name: EXTENSION_NAME[this._locale],
            blockIconURI: blockIconURI,
            blocks: [
                {
                    opcode: 'Chat',
                    text: FormChat[this._locale],
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MSG: {
                            type: ArgumentType.STRING,
                            defaultValue: FormChatMsgDefault[this._locale],
                            description: 'Chat Message'
                        }
                    }
                },
                {
                    opcode: 'block_NameToID',
                    blockType: BlockType.REPORTER,
                    text: '[BlockName]',
                    arguments: {
                        BlockName: {
                            type: ArgumentType.STRING,
                            menu: 'blocks',
                            defaultValue: MENU_BLOCKS[this._locale][1],
                            description: 'Block Name'
                        }
                    }
                },
                {
                    opcode: 'red_NameToID',
                    blockType: BlockType.REPORTER,
                    text: '[BlockName]',
                    arguments: {
                        BlockName: {
                            type: ArgumentType.STRING,
                            menu: 'reds',
                            defaultValue: MENU_REDS[this._locale][5],
                            description: 'Block Name'
                        }
                    }
                },
                {
                    opcode: 'deco_NameToID',
                    blockType: BlockType.REPORTER,
                    text: '[BlockName]',
                    arguments: {
                        BlockName: {
                            type: ArgumentType.STRING,
                            menu: 'decos',
                            defaultValue: MENU_DECOS[this._locale][5],
                            description: 'Block Name'
                        }
                    }
                },
                {
                    opcode: 'wool_NameToID',
                    blockType: BlockType.REPORTER,
                    text: '[BlockName]',
                    arguments: {
                        BlockName: {
                            type: ArgumentType.STRING,
                            menu: 'wools',
                            defaultValue: MENU_WOOLS[this._locale][0],
                            description: 'Block Name'
                        }
                    }
                },
                {
                    opcode: 'sglass_NameToID',
                    blockType: BlockType.REPORTER,
                    text: '[BlockName]',
                    arguments: {
                        BlockName: {
                            type: ArgumentType.STRING,
                            menu: 'sglasss',
                            defaultValue: MENU_SGLASSS[this._locale][0],
                            description: 'Block Name'
                        }
                    }
                },
                {
                    opcode: 'carpet_NameToID',
                    blockType: BlockType.REPORTER,
                    text: '[BlockName]',
                    arguments: {
                        BlockName: {
                            type: ArgumentType.STRING,
                            menu: 'carpets',
                            defaultValue: MENU_CARPETS[this._locale][0],
                            description: 'Block Name'
                        }
                    }
                },
                {
                    opcode: 'setBlockData',
                    text: FormPreSetBlockIdData[this._locale],
                    blockType: BlockType.COMMAND,
                    arguments: {
                        BlockName: {
                            type: ArgumentType.STRING,
                            defaultValue: MENU_BLOCKS[this._locale][1],
                            description: 'Block Name'
                        },
                        X: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0,
                            description: 'Coordinate X'
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0,
                            description: 'Coordinate Y'
                        },
                        Z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0,
                            description: 'Coordinate Z'
                        }
                    }
                },
                {
                    opcode: 'drawLine',
                    text: FormPreDrawLine[this._locale],
                    blockType: BlockType.COMMAND,
                    arguments: {
                        BlockName: {
                            type: ArgumentType.STRING,
                            defaultValue: MENU_BLOCKS[this._locale][1],
                            description: 'Block Name'
                        },
                        X: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0,
                            description: 'Coordinate X'
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0,
                            description: 'Coordinate Y'
                        },
                        Z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0,
                            description: 'Coordinate Z'
                        },
                        X1: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0,
                            description: 'Coordinate X1'
                        },
                        Y1: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0,
                            description: 'Coordinate Y1'
                        },
                        Z1: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1,
                            description: 'Coordinate Z1'
                        }
                    }
                },
                {
                    opcode: 'setBlocks',
                    text: FormPreSetBlocks[this._locale],
                    blockType: BlockType.COMMAND,
                    arguments: {
                        BlockName: {
                            type: ArgumentType.STRING,
                            defaultValue: MENU_BLOCKS[this._locale][1],
                            description: 'Block Name'
                        },
                        X: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0,
                            description: 'Coordinate X'
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0,
                            description: 'Coordinate Y'
                        },
                        Z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0,
                            description: 'Coordinate Z'
                        },
                        X1: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0,
                            description: 'Coordinate X1'
                        },
                        Y1: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0,
                            description: 'Coordinate Y1'
                        },
                        Z1: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1,
                            description: 'Coordinate Z1'
                        }
                    }
                },
                {
                    opcode: 'Teleport',
                    text: FormTeleport[this._locale],
                    blockType: BlockType.COMMAND,
                    arguments: {
                        X: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0,
                            description: 'Coordinate X'
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0,
                            description: 'Coordinate Y'
                        },
                        Z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0,
                            description: 'Coordinate Z'
                        }
                    }
                },
                {
                    opcode: 'Reset',
                    blockType: BlockType.COMMAND,
                    text: FormReset[this._locale]
                },
                {
                    opcode: 'getBlockInfo',
                    blockType: BlockType.COMMAND,
                    text: FormGetBlockInfo[this._locale],
                    arguments: {
                        X: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0,
                            description: 'Coordinate X'
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0,
                            description: 'Coordinate Y'
                        },
                        Z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0,
                            description: 'Coordinate Z'
                        }
                    }
                },
                {
                    opcode: 'blockId',
                    blockType: BlockType.REPORTER,
                    text: FormBlockIdText[this._locale]
                },
                {
                    opcode: 'blockData',
                    blockType: BlockType.REPORTER,
                    text: FormBlockDataText[this._locale]
                },
                {
                    opcode: 'getPlayerPos',
                    blockType: BlockType.COMMAND,
                    text: FormGetPlayerPos[this._locale]
                },
                {
                    opcode: 'pos_x',
                    blockType: BlockType.REPORTER,
                    text: FormPos_XText[this._locale]
                },
                {
                    opcode: 'pos_y',
                    blockType: BlockType.REPORTER,
                    text: FormPos_YText[this._locale]
                },
                {
                    opcode: 'pos_z',
                    blockType: BlockType.REPORTER,
                    text: FormPos_ZText[this._locale]
                },
                {
                    opcode: 'ConnectServer',
                    text: FormConnectServer[this._locale],
                    blockType: BlockType.COMMAND,
                    arguments: {
                        HOST: {
                            type: ArgumentType.STRING,
                            defaultValue: HOST_DEFAULT,
                            description: 'host name'
                        }
                    }
                }
            ],
            menus: {
                blocks: MENU_BLOCKS[this._locale],
                reds: MENU_REDS[this._locale],
                decos: MENU_DECOS[this._locale],
                wools: MENU_WOOLS[this._locale],
                sglasss: MENU_SGLASSS[this._locale],
                carpets: MENU_CARPETS[this._locale]
            }

        }
    }


    _setLocale() {
        let now_locale = '';
        switch (formatMessage.setup().locale) {
            case 'ja':
                now_locale = 'ja';
                break;
            case 'ja-Hira':
                now_locale = 'ja-Hira';
                break;
            case 'en':
                now_locale = 'en';
                break;
            default:
                now_locale = 'en';
                break;
        }
        return now_locale;
    }

    _nameToId(str) {
        for (let j in BLOCKS) {
            for (let i = 0; i < BLOCKS[j].length; i++) {
                if (str == BLOCKS[j][i][2]) {
                    return [BLOCKS[j][i][0], BLOCKS[j][i][1]];
                }
            }
        }
        return [null, null];
    }

    block_NameToID(args) {
        return args.BlockName;
    }

    red_NameToID(args) {
        return args.BlockName;
    }

    deco_NameToID(args) {
        return args.BlockName;
    }

    wool_NameToID(args) {
        return args.BlockName;
    }

    sglass_NameToID(args) {
        return args.BlockName;
    }

    carpet_NameToID(args) {
        return args.BlockName;
    }

    Chat(args) {
        this._world.Chat(args.MSG);
    }

    setBlockData(args) {
        let data = this._nameToId(args.BlockName);
        this._world.setBlockData(data[0], data[1], args.X, args.Y, args.Z);
    }

    drawLine(args) {
        let data = this._nameToId(args.BlockName);
        this._world.drawLine(data[0], data[1], args.X, args.Y, args.Z, args.X1, args.Y1, args.Z1);
    }

    setBlocks(args) {
        let data = this._nameToId(args.BlockName);
        this._world.setBlocks(data[0], data[1], args.X, args.Y, args.Z, args.X1, args.Y1, args.Z1);
    }

    Teleport(args) {
        this._world.Teleport(args.X, args.Y, args.Z);
    }

    Reset() {
        this._world.Reset();
    }

    ConnectServer(args) {
        this._world.ConnectServer(args.HOST);
    }

    getPlayerPos() {
        this._world.getPlayerPos();
    }

    getBlockInfo(args) {
        this._world.getBlockInfo(args.X, args.Y, args.Z);
    }

    setPlayerRotPit(args) {
        this._world.setPlayerRotPit(args.Rot, args.Pit);
    }

    blockId() {
        return this._world.r_blockId;
    }

    blockData() {
        return this._world.r_blockData;
    }

    pos_x() {
        return this._world.r_pos_x;
    }

    pos_y() {
        return this._world.r_pos_y;
    }

    pos_z() {
        return this._world.r_pos_z;
    }

}

module.exports = Scratch3MinecraftBlocks;

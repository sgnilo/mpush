# CPUSH
本地与机器间同步代码/文件

## 使用方法

### 接收端

全局装包
```Bash
npm install cpush -g
```
直接启用
```Bash
cl
```
使用pm2等应用管理器启动更方便
```Bash
pm2 start cl
```

### 发送端

安装
```Bash
npm install cpush --save
```

编写发送端配置文件 example.js（参考下方api）

配置npm命令
```json
"scripts": {
    "sync": "cs --config=example.js",
}
```

## 基本配置

| 字段 | 类型 | 默认值 | 是否必选 | 说明 |
| :--- | :---: | :---: | :---: | :--- |
| receiver | string | - | 是 | 接收端的ip及端口号 |
| dir | string | - | 是 | 要同步的文件名或目录 |
| remotePath | string | - | 是 | 接收端同步的目的文件/目录路径 |
| watch | boolean | false | 否 | 是否需要监听文件或目录内容的改动并持续性的同步 |
| rules | rule[] | - | 否 | 规则组，可设置多组规则来区分文件，并同步到不同的目的目录 |

### rule

| 字段 | 类型 | 默认值 | 是否必选 | 说明 |
| :--- | :---: | :---: | :---: | :--- |
| test | RegExp | - | 是 | 用于匹配的规则 |
| path | string | - | 是 | 基于规则匹配出的文件的新的目的目录 |

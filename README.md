## 说明
本项目改进于： https://github.com/xiaoziguys/pikpakHelpr

具体修改和新增了如下特性：
1. 修复了原仓库中由于官方接口改变导致不可用的情况；
2. 改良了获取当前目录下文件列表的实现方式，原仓库是通过js获取dom元素，本项目则是采用调用官方接口实现
3. 支持了文件夹的下载

## 代理相关

pikpak的下载链接并没有被墙，所以并不需要走代理，这样可以大量节省机场的流量，分享一下我的clash配置如下，：

```
rules:
    - 'DOMAIN,mypikpak.com,[机场名]'
    - 'DOMAIN,mypikpak.net,[机场名]'
    - 'DOMAIN,user.mypikpak.com,[机场名]'
    - 'DOMAIN,access.mypikpak.com,[机场名]'
    - 'DOMAIN,api-drive.mypikpak.com,DIRECT'
    - 'DOMAIN-KEYWORD,dl-a10b-,DIRECT'
```



### 配置
安装后刷新在新建按钮旁边会出现一个aria2配置按钮，点击配置
- 服务器 `http(s)://host:port/jsonrpc`
- 路径 aria2的下载路径 `/downloads`
- 密钥 aria2的密钥


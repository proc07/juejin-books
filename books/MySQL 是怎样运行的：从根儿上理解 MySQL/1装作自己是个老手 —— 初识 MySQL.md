# 1装作自己是个老手 —— 初识 MySQL

## 🖥️ 客户端与服务端的连接

MySQL 采用了经典的 **C/S (Client/Server) 架构**。每当我们使用终端运行 `mysql -u root -p` 时，本质上是启动了一个客户端进程与后台的 `mysqld` 守护进程建立网络连接。

```bash
# 启动 MySQL 服务端
mysqld --default-storage-engine=InnoDB

# 客户端建立 TCP 连接
mysql -h 127.0.0.1 -P 3306 -u root -p
```

---

## 🧩 MySQL Server 架构分层

MySQL Server 内部可以清晰地分为三层：

1. **连接层 (Connection Layer)**：负责客户端连接管理、认证授权与安全验证。
2. **服务层 (Server Layer)**：
   - **SQL 接口**：接收 SQL 命令。
   - **解析器 (Parser)**：词法分析与语法分析，生成语法树。
   - **优化器 (Optimizer)**：核心大脑！将 SQL 转换成代价最低的执行计划。
   - **查询缓存 (Query Cache)**：8.0 中已彻底移除。
3. **存储引擎层 (Storage Engine Layer)**：真正与磁盘打交道，负责数据的存储与提取（InnoDB、MyISAM、Memory 等）。

```sql
-- 查看当前支持的所有存储引擎
SHOW ENGINES;
```

| 存储引擎 | 事务支持 | 外键支持 | 锁粒度 | 默认聚簇索引 |
| :--- | :--- | :--- | :--- | :--- |
| **InnoDB** | ✅ 支持 | ✅ 支持 | 行级锁 + 表锁 | ✅ 必需 |
| **MyISAM** | ❌ 不支持 | ❌ 不支持 | 表级锁 | ❌ 非聚簇 |
| **Memory** | ❌ 不支持 | ❌ 不支持 | 表级锁 | ❌ 内存哈希 |

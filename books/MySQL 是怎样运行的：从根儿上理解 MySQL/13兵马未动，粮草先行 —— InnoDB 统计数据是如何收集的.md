# 13兵马未动，粮草先行 —— InnoDB 统计数据是如何收集的

为了计算出准确的成本，优化器必须预先知道：表里大概有多少行数据？某个索引列的不同值基数（Cardinality）是多少？

---

## 📈 统计数据的存储方式

MySQL 支持两种统计数据持久化方式：
- **永久性统计数据 (innodb_stats_persistent = ON)**：保存在系统表 `mysql.innodb_table_stats` 和 `mysql.innodb_index_stats` 中。
- **非永久性统计数据 (Memory)**：服务器重启后重新采样计算。

```sql
-- 查看表的统计数据
SELECT * FROM mysql.innodb_table_stats WHERE table_name = 'single_table';
```

---

## 🎲 采样机制 (Sampling)

InnoDB 并不会遍历整张表来统计行数和区分度（这样对大表太慢），而是通过**随机采样叶子页面**并以此推算出整张表的统计指标。
